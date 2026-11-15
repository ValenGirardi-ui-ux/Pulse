"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useT } from "../i18n";
import { IconCheck, IconScan } from "./icons";
import { runScan, type ScanResult } from "./scan-actions";
import { primaryButtonClass, secondaryButtonClass } from "./styles";

const STEP_MS = 900;

const checks: [string, string][] = [
  ["Availability", "Disponibilidad"],
  ["HTTPS & security", "HTTPS y seguridad"],
  ["Mobile", "Celulares"],
  ["SEO", "SEO"],
  ["Broken links", "Links rotos"],
  ["Performance", "Rendimiento"],
  ["Social preview", "Vista previa en redes"],
  ["Analytics", "Analítica"],
];

/** The "Scan now" button. `site` is the address that will be scanned; undefined while it loads. */
export function ScanButton({ site, variant = "header" }: { site?: string | null; variant?: "header" | "large" }) {
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
        disabled={site === undefined}
        className={
          variant === "large"
            ? "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#4c2882] px-6 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(76,40,130,0.28)] transition-colors hover:bg-[#5a3196] disabled:opacity-60"
            : "inline-flex size-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#4c2882] text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(76,40,130,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] transition-colors hover:bg-[#5a3196] disabled:opacity-60 md:w-auto md:px-4"
        }
      >
        <IconScan className={variant === "large" ? "size-4" : "size-3.5"} />
        {variant === "large" ? (
          <span>{t("Scan my site", "Escanear mi sitio")}</span>
        ) : (
          <span className="hidden md:inline">{t("Scan now", "Escanear ahora")}</span>
        )}
      </button>
      {open && site !== undefined && <ScanDialog key={run} site={site} onClose={close} />}
    </>
  );
}

function ScanDialog({ site, onClose }: { site: string | null; onClose: () => void }) {
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [pending, startTransition] = useTransition();
  const t = useT();

  const finished = result !== null;
  const scanning = pending && !finished;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // While the server works, tick through the checks but wait on the last one until the real result arrives.
  useEffect(() => {
    if (!scanning || done >= checks.length - 1) return;
    const timer = setTimeout(() => setDone((n) => n + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [scanning, done]);

  function start() {
    setResult(null);
    setDone(0);
    startTransition(async () => {
      const outcome = await runScan();
      setDone(checks.length);
      setResult(outcome);
    });
  }

  const errorText =
    result && !result.ok
      ? {
          no_site: t("Add your site in Settings first.", "Primero agregá tu sitio en Configuración."),
          too_soon: t("You just scanned. Wait a few seconds and try again.", "Acabás de escanear. Esperá unos segundos y probá de nuevo."),
          blocked: t(
            "Pulse can only scan public websites, not local or private addresses.",
            "Pulse solo puede escanear sitios públicos, no direcciones locales o privadas.",
          ),
          setup: t(
            "Scans aren't set up yet. Run the scans SQL in Supabase.",
            "Los escaneos todavía no están configurados. Corré el SQL de escaneos en Supabase.",
          ),
          unknown: t("The scan couldn't finish. Try again.", "El escaneo no pudo terminar. Probá de nuevo."),
        }[result.error]
      : null;

  const progress = finished ? 100 : Math.round((done / checks.length) * 100);

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
              ? result.ok
                ? t("Scan complete", "Escaneo completo")
                : t("Scan didn't finish", "El escaneo no terminó")
              : scanning
                ? t("Scanning your site", "Escaneando tu sitio")
                : t("Scan your site", "Escaneá tu sitio")}
          </h2>
          <p className="mt-0.5 truncate font-mono text-xs text-[#8a91a3]">
            {site ?? t("No site yet", "Todavía no hay sitio")}
          </p>
        </div>

        <div className="px-5 py-5">
          {!site ? (
            <p className="text-[13px] leading-5 text-[#5b6478]">
              {t(
                "Add the website you want Pulse to check in Settings, then come back to scan it.",
                "Agregá en Configuración el sitio que querés que Pulse revise y volvé para escanearlo.",
              )}
            </p>
          ) : (
            <>
              {!scanning && !finished && (
                <p className="text-[13px] leading-5 text-[#5b6478]">
                  {t(
                    "Pulse will open your site like a visitor would and check it. It takes a few seconds.",
                    "Pulse va a abrir tu sitio como lo haría un visitante y revisarlo. Tarda unos segundos.",
                  )}
                </p>
              )}

              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t("Scan progress", "Progreso del escaneo")}
                className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#eee8f6]"
              >
                <div
                  className="h-full rounded-full bg-[#4c2882] transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2" aria-live="polite">
                {checks.map(([en, es], index) => {
                  const state = !scanning && !finished ? "waiting" : index < done ? "done" : index === done ? "running" : "waiting";
                  return (
                    <li
                      key={en}
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
                      {t(en, es)}
                    </li>
                  );
                })}
              </ul>

              {result?.ok && (
                <div className="mt-5 flex items-center gap-4 rounded-xl bg-[#f6f7fb] px-4 py-3.5">
                  <div className="shrink-0">
                    <p className="text-xs text-[#8a91a3]">{t("Pulse Score", "Puntaje Pulse")}</p>
                    <p className="mt-0.5 text-2xl font-semibold tracking-tight">
                      {result.score}
                      {result.delta !== null && result.delta !== 0 && (
                        <span className={`ml-1.5 text-xs font-medium ${result.delta > 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {result.delta > 0 ? `+${result.delta}` : result.delta}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="h-10 w-px bg-[#e3e6ef]" />
                  <ul className="space-y-1 text-[13px]">
                    {result.delta === null ? (
                      <li className="text-[#3c4558]">
                        {result.issues} {t(result.issues === 1 ? "issue found" : "issues found", result.issues === 1 ? "problema encontrado" : "problemas encontrados")}
                      </li>
                    ) : (
                      <>
                        <li className="text-emerald-700">
                          {result.fixedCount} {t(result.fixedCount === 1 ? "issue fixed" : "issues fixed", result.fixedCount === 1 ? "problema resuelto" : "problemas resueltos")}
                        </li>
                        <li className={result.newCount > 0 ? "text-red-600" : "text-[#5b6478]"}>
                          {result.newCount} {t(result.newCount === 1 ? "new issue" : "new issues", result.newCount === 1 ? "problema nuevo" : "problemas nuevos")}
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              )}

              {errorText && (
                <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-700">
                  {errorText}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#f1f2f6] px-5 py-3.5">
          {!site ? (
            <>
              <button type="button" onClick={onClose} className={secondaryButtonClass}>
                {t("Close", "Cerrar")}
              </button>
              <Link href="/dashboard/settings" onClick={onClose} className={primaryButtonClass}>
                {t("Go to Settings", "Ir a Configuración")}
              </Link>
            </>
          ) : finished && result.ok ? (
            <>
              <button type="button" onClick={onClose} className={secondaryButtonClass}>
                {t("Close", "Cerrar")}
              </button>
              <Link href="/dashboard/issues" onClick={onClose} className={primaryButtonClass}>
                {t("View issues", "Ver problemas")}
              </Link>
            </>
          ) : (
            <>
              <button type="button" onClick={onClose} className={secondaryButtonClass}>
                {scanning ? t("Run in background", "Seguir en segundo plano") : t("Cancel", "Cancelar")}
              </button>
              {!scanning && (
                <button type="button" onClick={start} className={primaryButtonClass}>
                  <IconScan className="size-3.5" />
                  {finished ? t("Try again", "Probar de nuevo") : t("Scan", "Escanear")}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
