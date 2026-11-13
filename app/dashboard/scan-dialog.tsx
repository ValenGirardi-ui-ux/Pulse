"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useT } from "../i18n";
import { IconCheck, IconScan } from "./icons";
import { cleanUrl, isValidUrl } from "./monitors/data";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "./styles";

const RECENT_SITES = ["tivvo.com"];
const PAGES = 48;
const STEP_MS = 650;

const checks = [
  "Availability",
  "Performance",
  "SEO",
  "Tracking tools",
  "Marketing",
  "Forms",
  "Broken links",
  "Technical errors",
];

const result = { before: 81, after: 83, newIssues: 1, fixed: 2 };

export function ScanButton() {
  const [open, setOpen] = useState(false);
  const [run, setRun] = useState(0);
  const close = useCallback(() => setOpen(false), []);
  const t = useT();

  function start() {
    setRun((n) => n + 1);
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        aria-label={t("Scan now", "Escanear ahora")}
        onClick={start}
        className="inline-flex size-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#4c2882] text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(76,40,130,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] transition-colors hover:bg-[#5a3196] md:w-auto md:px-4"
      >
        <IconScan className="size-3.5" />
        <span className="hidden md:inline">{t("Scan now", "Escanear ahora")}</span>
      </button>
      {open && <ScanDialog key={run} onClose={close} />}
    </>
  );
}

function ScanDialog({ onClose }: { onClose: () => void }) {
  const [shown, setShown] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [site, setSite] = useState<string | null>(null);
  const [done, setDone] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();

  const scanning = site !== null && done < checks.length;
  const finished = site !== null && done >= checks.length;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    inputRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (!scanning) return;
    const timer = setTimeout(() => setDone((n) => n + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [scanning, done]);

  function startScan(target: string) {
    if (!isValidUrl(target)) {
      setError(t("Enter a valid URL, like yoursite.com", "Ingresá una URL válida, como tusitio.com"));
      inputRef.current?.focus();
      return;
    }
    const clean = cleanUrl(target);
    setValue(clean);
    setError(null);
    setDone(0);
    setSite(clean);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    startScan(value);
  }

  const progress = site ? Math.round((done / checks.length) * 100) : 0;
  const pagesChecked = Math.round((done / checks.length) * PAGES);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0f1a2e]/20 px-4 py-[10vh] backdrop-blur-[2px] transition-opacity duration-200 ${
        shown ? "opacity-100" : "opacity-0"
      }`}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-title"
        className={`w-full max-w-md rounded-2xl border border-[#ececf1] bg-white shadow-[0_24px_60px_rgba(15,26,46,0.18)] transition-transform duration-200 ease-out ${
          shown ? "translate-y-0 scale-100" : "translate-y-2 scale-[0.98]"
        }`}
      >
        <div className="border-b border-[#f1f2f6] px-5 py-4">
          <h2 id="scan-title" className="text-sm font-semibold">
            {finished
              ? t("Scan complete", "Escaneo completo")
              : scanning
                ? t("Scanning your site", "Escaneando tu sitio")
                : t("Scan your site", "Escaneá tu sitio")}
          </h2>
          <p className="mt-0.5 truncate text-xs text-[#8a91a3]">
            {site ? (
              <span className="font-mono">
                {site} · {pagesChecked} {t("of", "de")} {PAGES} {t("pages", "páginas")}
              </span>
            ) : (
              t("Enter your page URL and Pulse will measure it.", "Ingresá la URL de tu página y Pulse la mide.")
            )}
          </p>
        </div>

        <div className="px-5 py-5">
          <form onSubmit={submit} noValidate className="flex gap-2">
            <label htmlFor="scan-url" className="sr-only">
              {t("Your page URL", "URL de tu página")}
            </label>
            <input
              ref={inputRef}
              id="scan-url"
              type="text"
              inputMode="url"
              autoComplete="url"
              placeholder={t("yoursite.com", "tusitio.com")}
              value={value}
              disabled={scanning}
              onChange={(event) => {
                setValue(event.target.value);
                setError(null);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "scan-url-error" : undefined}
              className={`${inputClass} min-w-0 flex-1 font-mono disabled:bg-[#f6f7fb] disabled:text-[#5b6478] ${
                error ? "border-red-400 focus:border-red-400 focus:ring-red-500/10" : ""
              }`}
            />
            <button type="submit" disabled={scanning} className={`${primaryButtonClass} h-9 shrink-0 px-4`}>
              <IconScan className="size-3.5" />
              {finished ? t("Scan again", "Escanear de nuevo") : t("Scan", "Escanear")}
            </button>
          </form>
          {error && (
            <p id="scan-url-error" className="mt-1.5 text-xs text-red-600">
              {error}
            </p>
          )}
          {!site && RECENT_SITES.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#8a91a3]">{t("Recent", "Recientes")}</span>
              {RECENT_SITES.map((recent) => (
                <button
                  key={recent}
                  type="button"
                  onClick={() => startScan(recent)}
                  className="rounded-full border border-black/[0.07] px-2.5 py-1 font-mono text-[11px] text-[#3c4558] transition-colors hover:border-[#4c2882]/35 hover:text-[#4c2882]"
                >
                  {recent}
                </button>
              ))}
            </div>
          )}

          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("Scan progress", "Progreso del escaneo")}
            className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#eee8f6]"
          >
            <div
              className="h-full rounded-full bg-[#4c2882] transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2" aria-live="polite">
            {checks.map((check, index) => {
              const state = !site ? "waiting" : index < done ? "done" : index === done ? "running" : "waiting";
              return (
                <li
                  key={check}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[13px] transition-colors ${
                    state === "running" ? "border-[#4c2882]/30 bg-[#4c2882]/[0.03]" : "border-[#f1f2f6]"
                  } ${state === "waiting" ? "text-[#9aa1b2]" : ""}`}
                >
                  {state === "done" && (
                    <span className="grid size-4 place-items-center rounded-full bg-emerald-500 text-white">
                      <IconCheck className="size-2.5" />
                    </span>
                  )}
                  {state === "running" && (
                    <span className="size-4 animate-spin rounded-full border-2 border-[#4c2882]/20 border-t-[#4c2882]" />
                  )}
                  {state === "waiting" && <span className="size-4 rounded-full border-2 border-[#ececf1]" />}
                  {t(check)}
                </li>
              );
            })}
          </ul>

          {finished && (
            <div className="mt-5 flex items-center gap-4 rounded-xl bg-[#f6f7fb] px-4 py-3.5">
              <div className="shrink-0">
                <p className="text-xs text-[#8a91a3]">{t("Pulse Score", "Puntaje Pulse")}</p>
                <p className="mt-0.5 text-2xl font-semibold tracking-tight">
                  {result.after}
                  <span className="ml-1.5 text-xs font-medium text-emerald-600">+{result.after - result.before}</span>
                </p>
              </div>
              <div className="h-10 w-px bg-[#e3e6ef]" />
              <ul className="space-y-1 text-[13px]">
                <li className="text-emerald-700">{result.fixed} {t("issues fixed", "problemas resueltos")}</li>
                <li className="text-red-600">{result.newIssues} {t("new issue", "problema nuevo")}</li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#f1f2f6] px-5 py-3.5">
          {finished ? (
            <>
              <button type="button" onClick={onClose} className={secondaryButtonClass}>
                {t("Close", "Cerrar")}
              </button>
              <Link href="/dashboard/issues" onClick={onClose} className={primaryButtonClass}>
                {t("View issues", "Ver problemas")}
              </Link>
            </>
          ) : (
            <button type="button" onClick={onClose} className={secondaryButtonClass}>
              {scanning ? t("Run in background", "Seguir en segundo plano") : t("Cancel", "Cancelar")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
