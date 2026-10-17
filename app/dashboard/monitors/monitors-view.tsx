"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Segmented } from "../controls";
import { IconChevron } from "../icons";
import { primaryButtonClass, secondaryButtonClass } from "../styles";
import {
  initialMonitors,
  mockServerChecks,
  mockWebsiteChecks,
  portNames,
  statusOf,
  statusStyle,
  thresholds,
  type Monitor,
  type MonitorType,
  type ServerChecks,
  type WebsiteChecks,
} from "./data";
import { NewMonitorDialog, type NewMonitor } from "./new-monitor-dialog";

const CHECK_MS = 1500;
const filters = ["All", "Websites", "Servers"] as const;
const groups: { type: MonitorType; title: string; empty: string }[] = [
  { type: "website", title: "Websites", empty: "No websites yet." },
  { type: "server", title: "Servers", empty: "No servers yet." },
];

type Tone = "good" | "warn" | "bad" | "muted";
const toneDot: Record<Tone, string> = {
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-red-500",
  muted: "bg-[#c9cedd]",
};

export function MonitorsView() {
  const [monitors, setMonitors] = useState<Monitor[]>(initialMonitors);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  const closeDialog = useCallback(() => setDialogOpen(false), []);

  function runCheck(monitor: Monitor) {
    setMonitors((list) =>
      list.map((m) => (m.id === monitor.id ? ({ ...m, checks: null, lastChecked: "Checking…" } as Monitor) : m)),
    );
    const id = window.setTimeout(() => {
      setMonitors((list) =>
        list.map((m) => {
          if (m.id !== monitor.id) return m;
          const previous = initialMonitors.find((i) => i.id === m.id)?.checks ?? monitor.checks;
          const checks =
            previous ??
            (m.type === "website"
              ? mockWebsiteChecks(m.target)
              : mockServerChecks(m.target, (monitor.checks as ServerChecks | null)?.ports.map((p) => p.port) ?? []));
          return { ...m, checks, lastChecked: "Just now" } as Monitor;
        }),
      );
    }, CHECK_MS);
    timers.current.push(id);
  }

  function create(input: NewMonitor) {
    const id = `${input.type}-${Date.now()}`;
    const monitor: Monitor = { id, type: input.type, target: input.target, interval: input.interval, lastChecked: "Checking…", checks: null } as Monitor;

    setMonitors((list) => [monitor, ...list]);
    setDialogOpen(false);
    setFilter("All");
    setOpenId(id);

    const timer = window.setTimeout(() => {
      setMonitors((list) =>
        list.map((m) => {
          if (m.id !== id) return m;
          const checks =
            input.type === "website" ? mockWebsiteChecks(input.target) : mockServerChecks(input.target, input.ports);
          return { ...m, checks, lastChecked: "Just now" } as Monitor;
        }),
      );
    }, CHECK_MS);
    timers.current.push(timer);
  }

  function remove(id: string) {
    setMonitors((list) => list.filter((m) => m.id !== id));
    setOpenId(null);
  }

  const down = monitors.filter((m) => ["Down", "Offline"].includes(statusOf(m))).length;
  const warnings = monitors.filter((m) => statusOf(m) === "Warning").length;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Monitors</h1>
          <p className="mt-1 text-[13px] text-[#8a91a3]">
            {monitors.length} monitors
            {down > 0 && <span className="text-red-600"> · {down} down</span>}
            {warnings > 0 && <span className="text-amber-600"> · {warnings} warning</span>}
          </p>
        </div>
        <button type="button" onClick={() => setDialogOpen(true)} className={`${primaryButtonClass} h-9`}>
          <span aria-hidden="true" className="text-sm leading-none">
            +
          </span>
          New monitor
        </button>
      </div>

      <Segmented label="Filter monitors" options={filters} value={filter} onChange={setFilter} />

      {groups
        .filter((group) => filter === "All" || group.title === filter)
        .map((group) => {
          const items = monitors.filter((m) => m.type === group.type);
          return (
            <section key={group.type}>
              <h2 className="mb-2.5 flex items-center gap-2 text-xs font-medium text-[#5b6478]">
                {group.title}
                <span className="font-mono text-[11px] text-[#9aa1b2]">{items.length}</span>
              </h2>

              {items.length === 0 ? (
                <div className="flex items-center justify-between rounded-xl border border-dashed border-[#e3e6ef] px-4 py-5">
                  <p className="text-[13px] text-[#8a91a3]">{group.empty}</p>
                  <button type="button" onClick={() => setDialogOpen(true)} className={secondaryButtonClass}>
                    New monitor
                  </button>
                </div>
              ) : (
                <ul className="overflow-hidden rounded-xl border border-[#ececf1]">
                  {items.map((monitor) => (
                    <MonitorRow
                      key={monitor.id}
                      monitor={monitor}
                      open={openId === monitor.id}
                      onToggle={() => setOpenId(openId === monitor.id ? null : monitor.id)}
                      onCheck={() => runCheck(monitor)}
                      onRemove={() => remove(monitor.id)}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}

      <NewMonitorDialog open={dialogOpen} onClose={closeDialog} onCreate={create} />
    </main>
  );
}

function MonitorRow({
  monitor,
  open,
  onToggle,
  onCheck,
  onRemove,
}: {
  monitor: Monitor;
  open: boolean;
  onToggle: () => void;
  onCheck: () => void;
  onRemove: () => void;
}) {
  const status = statusOf(monitor);
  const style = statusStyle[status];
  const checking = status === "Checking";

  return (
    <li className="border-b border-[#f1f2f6] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#fafafb]"
      >
        <span className={`size-2 shrink-0 rounded-full ${style.dot}`} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-mono text-[13px]">{monitor.target}</span>
          <span className="mt-0.5 block truncate text-xs text-[#8a91a3]">{rowSummary(monitor)}</span>
        </span>
        <span className="hidden w-20 shrink-0 font-mono text-[11px] text-[#9aa1b2] sm:block">
          every {monitor.interval}
        </span>
        <span className="hidden w-20 shrink-0 text-right font-mono text-[11px] text-[#9aa1b2] md:block">
          {monitor.lastChecked}
        </span>
        <span className="w-20 shrink-0 text-right">
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${style.chip}`}>{status}</span>
        </span>
        <IconChevron
          className={`size-3.5 shrink-0 text-[#c9cedd] transition-transform duration-200 group-hover:text-[#5b6478] ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>

      <div
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
            <div className="rounded-lg bg-[#fafafb] p-4">
              {checking ? (
                <CheckingState type={monitor.type} />
              ) : monitor.type === "website" && monitor.checks ? (
                <WebsiteDetails checks={monitor.checks} />
              ) : monitor.type === "server" && monitor.checks ? (
                <ServerDetails checks={monitor.checks} />
              ) : null}

              <div className="mt-4 flex items-center gap-2 border-t border-[#ececf1] pt-4">
                <button type="button" onClick={onCheck} disabled={checking} className={`${secondaryButtonClass} disabled:opacity-50`}>
                  {checking ? "Checking…" : "Check now"}
                </button>
                <button
                  type="button"
                  onClick={onRemove}
                  className="ml-auto text-xs text-[#8a91a3] transition-colors hover:text-red-600"
                >
                  Remove monitor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function rowSummary(monitor: Monitor) {
  if (!monitor.checks) return "Running the first check…";

  if (monitor.type === "website") {
    const c = monitor.checks;
    if (!c.online) return `Not responding · HTTP ${c.httpStatus ?? "—"}`;
    return `HTTP ${c.httpStatus} · ${c.responseMs} ms`;
  }

  const c = monitor.checks;
  if (!c.reachable) return "No response to ping";
  const open = c.ports.filter((p) => p.open).length;
  return `${c.latencyMs} ms · ${open} of ${c.ports.length} ports open`;
}

function CheckingState({ type }: { type: MonitorType }) {
  const steps =
    type === "website"
      ? ["Online", "HTTP code", "Response time", "SSL certificate", "Pages with errors", "Broken links"]
      : ["Status", "Availability", "Ping", "Latency", "Ports"];
  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {steps.map((label) => (
        <div key={label} className="flex items-center justify-between gap-4">
          <dt className="text-[13px] text-[#5b6478]">{label}</dt>
          <dd className="h-3 w-16 animate-pulse rounded bg-[#ececf1]" />
        </div>
      ))}
    </dl>
  );
}

function CheckItem({ label, tone, children }: { label: string; tone: Tone; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[13px] text-[#5b6478]">{label}</dt>
      <dd className="flex items-center gap-2 font-mono text-xs">
        {children}
        <span className={`size-1.5 rounded-full ${toneDot[tone]}`} />
      </dd>
    </div>
  );
}

function WebsiteDetails({ checks }: { checks: WebsiteChecks }) {
  const http = checks.httpStatus ?? 0;
  const ms = checks.responseMs;
  const days = checks.ssl.daysLeft;

  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      <CheckItem label="Online" tone={checks.online ? "good" : "bad"}>
        {checks.online ? "Yes" : "No"}
      </CheckItem>
      <CheckItem label="HTTP code" tone={http >= 500 || http === 0 ? "bad" : http >= 400 ? "warn" : "good"}>
        {checks.httpStatus ?? "—"}
      </CheckItem>
      <CheckItem
        label="Response time"
        tone={
          ms === null ? "muted" : ms >= thresholds.verySlowResponseMs ? "bad" : ms >= thresholds.slowResponseMs ? "warn" : "good"
        }
      >
        {ms === null ? "—" : `${ms} ms`}
      </CheckItem>
      <CheckItem
        label="SSL certificate"
        tone={!checks.ssl.valid ? "bad" : (days ?? Infinity) < thresholds.sslWarningDays ? "warn" : "good"}
      >
        {!checks.ssl.valid ? "Invalid" : days === null ? "Valid" : `${days} days left`}
      </CheckItem>
      <CheckItem label="Pages with errors" tone={checks.errorPages > 0 ? (checks.online ? "warn" : "bad") : "good"}>
        {checks.errorPages}
      </CheckItem>
      <CheckItem label="Broken links" tone={checks.brokenLinks > 0 ? "warn" : "good"}>
        {checks.brokenLinks}
      </CheckItem>
    </dl>
  );
}

function ServerDetails({ checks }: { checks: ServerChecks }) {
  return (
    <div className="space-y-4">
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <CheckItem label="Status" tone={checks.reachable ? "good" : "bad"}>
          {checks.reachable ? "Online" : "Offline"}
        </CheckItem>
        <CheckItem label="Availability (30 days)" tone={parseFloat(checks.availability) >= 99.9 ? "good" : "warn"}>
          {checks.availability}
        </CheckItem>
        <CheckItem label="Ping" tone={checks.pingOk ? "good" : "bad"}>
          {checks.pingOk ? "Responding" : "No response"}
        </CheckItem>
        <CheckItem
          label="Latency"
          tone={checks.latencyMs === null ? "muted" : checks.latencyMs >= thresholds.highLatencyMs ? "warn" : "good"}
        >
          {checks.latencyMs === null ? "—" : `${checks.latencyMs} ms`}
        </CheckItem>
      </dl>

      <div>
        <p className="text-[13px] text-[#5b6478]">Ports</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {checks.ports.map(({ port, open }) => (
            <li
              key={port}
              className="inline-flex h-6 items-center gap-1.5 rounded-md border border-[#ececf1] bg-white px-2 font-mono text-[11px]"
            >
              <span className={`size-1.5 rounded-full ${open ? "bg-emerald-500" : "bg-red-500"}`} />
              {port}
              {portNames[port] && <span className="font-sans text-[#8a91a3]">{portNames[port]}</span>}
              <span className={open ? "text-emerald-700" : "text-red-600"}>{open ? "open" : "closed"}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
