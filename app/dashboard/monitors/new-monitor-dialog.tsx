"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Segmented } from "../controls";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "../styles";
import {
  cleanUrl,
  defaultPorts,
  intervals,
  isValidHost,
  isValidUrl,
  portNames,
  type Interval,
  type MonitorType,
} from "./data";

export type NewMonitor =
  | { type: "website"; target: string; interval: Interval }
  | { type: "server"; target: string; interval: Interval; ports: number[] };

const types: { type: MonitorType; title: string; description: string; checks: string }[] = [
  {
    type: "website",
    title: "Website",
    description: "Check a URL from the outside, like a visitor would.",
    checks: "Online · HTTP code · Response time · SSL · Error pages · Broken links",
  },
  {
    type: "server",
    title: "Server",
    description: "Check an IP address or server domain directly.",
    checks: "Availability · Ping · Latency · Ports",
  },
];

const MAX_PORTS = 10;

export function NewMonitorDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (monitor: NewMonitor) => void;
}) {
  const [shown, setShown] = useState(false);
  const [type, setType] = useState<MonitorType>("website");
  const [target, setTarget] = useState("");
  const [interval, setCheckInterval] = useState<Interval>("5 min");
  const [ports, setPorts] = useState<number[]>(defaultPorts);
  const [portDraft, setPortDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [portError, setPortError] = useState<string | null>(null);
  const targetRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    const frame = requestAnimationFrame(() => setShown(true));
    targetRef.current?.focus();

    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  function reset() {
    setType("website");
    setTarget("");
    setCheckInterval("5 min");
    setPorts(defaultPorts);
    setPortDraft("");
    setError(null);
    setPortError(null);
  }

  function chooseType(next: MonitorType) {
    setType(next);
    setError(null);
    setCheckInterval(next === "server" ? "1 min" : "5 min");
    targetRef.current?.focus();
  }

  function withDraftPort(): number[] | null {
    if (!portDraft.trim()) return ports;
    const value = Number(portDraft.trim());
    if (!Number.isInteger(value) || value < 1 || value > 65535) {
      setPortError("Use a number between 1 and 65535.");
      return null;
    }
    if (ports.includes(value)) {
      setPortError(`Port ${value} is already in the list.`);
      return null;
    }
    if (ports.length >= MAX_PORTS) {
      setPortError(`You can check up to ${MAX_PORTS} ports.`);
      return null;
    }
    return [...ports, value].sort((a, b) => a - b);
  }

  function addPort() {
    const next = withDraftPort();
    if (!next) return;
    setPorts(next);
    setPortDraft("");
    setPortError(null);
  }

  function onPortKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addPort();
    } else if (event.key === "Backspace" && !portDraft && ports.length > 0) {
      setPorts(ports.slice(0, -1));
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();

    if (type === "website") {
      if (!isValidUrl(target)) {
        setError("Enter a valid URL, like yoursite.com");
        return;
      }
      onCreate({ type, target: cleanUrl(target), interval });
    } else {
      if (!isValidHost(target)) {
        setError("Enter a valid IP address or domain, like 192.168.0.10 or api.yoursite.com");
        return;
      }
      const finalPorts = withDraftPort();
      if (!finalPorts) return;
      if (finalPorts.length === 0) {
        setPortError("Add at least one port.");
        return;
      }
      onCreate({ type, target: target.trim().toLowerCase(), interval, ports: finalPorts });
    }
    reset();
  }

  function cancel() {
    reset();
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[#0f1a2e]/20 px-4 py-[10vh] backdrop-blur-[2px] transition-opacity duration-200 ${
        shown ? "opacity-100" : "opacity-0"
      }`}
      onMouseDown={(event) => event.target === event.currentTarget && cancel()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-monitor-title"
        onSubmit={submit}
        noValidate
        className={`w-full max-w-lg rounded-2xl border border-[#ececf1] bg-white shadow-[0_24px_60px_rgba(15,26,46,0.18)] transition-transform duration-200 ease-out ${
          shown ? "translate-y-0 scale-100" : "translate-y-2 scale-[0.98]"
        }`}
      >
        <div className="border-b border-[#f1f2f6] px-5 py-4">
          <h2 id="new-monitor-title" className="text-sm font-semibold">
            New monitor
          </h2>
          <p className="mt-0.5 text-xs text-[#8a91a3]">Choose what Pulse should watch.</p>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div role="radiogroup" aria-label="Monitor type" className="grid grid-cols-2 gap-2.5">
            {types.map((option) => {
              const active = option.type === type;
              return (
                <button
                  key={option.type}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => chooseType(option.type)}
                  className={`rounded-xl border p-3.5 text-left transition-colors ${
                    active
                      ? "border-[#4c2882] bg-[#4c2882]/[0.03] ring-4 ring-[#4c2882]/[0.08]"
                      : "border-[#ececf1] hover:border-[#d9dce6]"
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span className="text-[13px] font-medium">{option.title}</span>
                    <span
                      className={`flex size-3.5 items-center justify-center rounded-full border ${
                        active ? "border-[#4c2882]" : "border-[#c9cedd]"
                      }`}
                    >
                      {active && <span className="size-1.5 rounded-full bg-[#4c2882]" />}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#5b6478]">{option.description}</span>
                  <span className="mt-2 block font-mono text-[10px] leading-4 text-[#9aa1b2]">{option.checks}</span>
                </button>
              );
            })}
          </div>

          <div>
            <label htmlFor="monitor-target" className="mb-1.5 block text-xs font-medium text-[#3c4558]">
              {type === "website" ? "URL" : "IP address or domain"}
            </label>
            <input
              ref={targetRef}
              id="monitor-target"
              value={target}
              onChange={(event) => {
                setTarget(event.target.value);
                setError(null);
              }}
              placeholder={type === "website" ? "yoursite.com" : "192.168.0.10 or api.yoursite.com"}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "monitor-target-error" : undefined}
              autoComplete="off"
              spellCheck={false}
              className={`${inputClass} font-mono ${error ? "border-red-300 focus:border-red-400 focus:ring-red-500/10" : ""}`}
            />
            {error && (
              <p id="monitor-target-error" className="mt-1.5 text-xs text-red-600">
                {error}
              </p>
            )}
          </div>

          {type === "server" && (
            <div>
              <label htmlFor="monitor-port" className="mb-1.5 block text-xs font-medium text-[#3c4558]">
                Ports to check
              </label>
              <div
                className={`flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border bg-white px-2 py-1.5 transition-colors focus-within:border-[#4c2882]/50 focus-within:ring-4 focus-within:ring-[#4c2882]/[0.08] ${
                  portError ? "border-red-300" : "border-[#e3e6ef]"
                }`}
              >
                {ports.map((port) => (
                  <span
                    key={port}
                    className="inline-flex h-6 items-center gap-1 rounded-md bg-[#f4f5f8] pr-1 pl-2 font-mono text-[11px]"
                  >
                    {port}
                    {portNames[port] && <span className="font-sans text-[#8a91a3]">{portNames[port]}</span>}
                    <button
                      type="button"
                      onClick={() => setPorts(ports.filter((p) => p !== port))}
                      aria-label={`Remove port ${port}`}
                      className="flex size-4 items-center justify-center rounded text-[#8a91a3] transition-colors hover:bg-[#e3e6ef] hover:text-[#0f1a2e]"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  id="monitor-port"
                  value={portDraft}
                  onChange={(event) => {
                    setPortDraft(event.target.value.replace(/[^\d]/g, ""));
                    setPortError(null);
                  }}
                  onKeyDown={onPortKey}
                  onBlur={addPort}
                  inputMode="numeric"
                  placeholder={ports.length ? "Add port" : "22, 80, 443…"}
                  aria-describedby="monitor-port-hint"
                  className="h-6 min-w-20 flex-1 bg-transparent px-1 font-mono text-[12px] outline-none placeholder:font-sans placeholder:text-[#9aa1b2]"
                />
              </div>
              <p id="monitor-port-hint" className={`mt-1.5 text-xs ${portError ? "text-red-600" : "text-[#8a91a3]"}`}>
                {portError ?? "Press Enter to add a port. Pulse checks if each one is open."}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#3c4558]">Check every</p>
              <p className="mt-0.5 text-xs text-[#8a91a3]">
                {type === "website" ? "5 minutes works for most sites." : "1 minute catches outages fast."}
              </p>
            </div>
            <Segmented label="Check interval" options={intervals} value={interval} onChange={setCheckInterval} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#f1f2f6] px-5 py-3.5">
          <button type="button" onClick={cancel} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" className={primaryButtonClass}>
            Create monitor
          </button>
        </div>
      </form>
    </div>
  );
}
