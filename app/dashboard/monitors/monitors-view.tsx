"use client";

import { useCallback, useState, useTransition, type ReactNode } from "react";
import { useLang, useT } from "../../i18n";
import { Segmented } from "../controls";
import { IconChevron } from "../icons";
import { primaryButtonClass, secondaryButtonClass } from "../styles";
import { checkMonitorNow, createMonitor, deleteMonitor, type MonitorActionResult } from "./actions";
import { intervalMinutes, portNames, statusStyle, thresholds, type MonitorType, type MonitorView, type ServerChecks, type WebsiteChecks } from "./data";
import { NewMonitorDialog, type NewMonitor } from "./new-monitor-dialog";

const filters = ["All", "Websites", "Servers"] as const;
const groups: { type: MonitorType; title: string; empty: string; emptyEs: string }[] = [
  { type: "website", title: "Websites", empty: "No websites yet.", emptyEs: "Todavía no hay sitios web." },
  { type: "server", title: "Servers", empty: "No servers yet.", emptyEs: "Todavía no hay servidores." },
];

type Tone = "good" | "warn" | "bad" | "muted";
const toneDot: Record<Tone, string> = {
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-red-500",
  muted: "bg-[#c9cedd]",
};

export function MonitorsView({ monitors, setupNeeded }: { monitors: MonitorView[]; setupNeeded: boolean }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const t = useT();

  const closeDialog = useCallback(() => setDialogOpen(false), []);

  const errorText = (result: MonitorActionResult) =>
    result.ok
      ? null
      : {
          invalid: t("Check the address and the ports.", "Revisá la dirección y los puertos."),
          blocked: t(
            "Pulse can only monitor public addresses (not localhost or private networks) on ports 80 and 443 for websites.",
            "Pulse solo puede monitorear direcciones públicas (no localhost ni redes privadas), y los sitios web en los puertos 80 y 443.",
          ),
          too_soon: t("It was just checked. Try again in a few seconds.", "Se acaba de comprobar. Probá de nuevo en unos segundos."),
          setup: t("Monitors aren't set up yet. Run the monitors SQL in Supabase.", "Los monitores todavía no están configurados. Corré el SQL de monitores en Supabase."),
          unknown: t("Something went wrong. Try again.", "Algo salió mal. Probá de nuevo."),
        }[result.error];

  function run(id: string, action: () => Promise<MonitorActionResult>) {
    setBusy(id);
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      setMessage(errorText(result));
      setBusy(null);
    });
  }

  function create(input: NewMonitor) {
    setDialogOpen(false);
    setFilter("All");
    run("new", () =>
      createMonitor({
        type: input.type,
        target: input.target,
        intervalMinutes: intervalMinutes[input.interval],
        ports: input.type === "server" ? input.ports : [],
      }),
    );
  }

  const down = monitors.filter((m) => m.status === "Down" || m.status === "Offline").length;
  const warnings = monitors.filter((m) => m.status === "Warning").length;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("Monitors", "Monitores")}</h1>
          <p className="mt-1 text-[13px] text-[#8a91a3]">
            {monitors.length} {t("monitors", "monitores")}
            {down > 0 && (
              <span className="text-red-600">
                {" "}
                · {down} {t("down", down === 1 ? "caído" : "caídos")}
              </span>
            )}
            {warnings > 0 && (
              <span className="text-amber-600">
                {" "}
                · {warnings} {t("warning", warnings === 1 ? "advertencia" : "advertencias")}
              </span>
            )}
          </p>
        </div>
        <button type="button" onClick={() => setDialogOpen(true)} disabled={setupNeeded || busy === "new"} className={`${primaryButtonClass} h-9 disabled:opacity-60`}>
          <span aria-hidden="true" className="text-sm leading-none">
            +
          </span>
          {busy === "new" ? t("Adding…", "Agregando…") : t("New monitor", "Nuevo monitor")}
        </button>
      </div>

      {setupNeeded && (
        <p role="note" className="rounded-xl border border-dashed border-[#d9dce6] px-4 py-3 text-[13px] text-[#5b6478]">
          {t(
            "Monitors aren't set up yet. Run supabase/migrations/0008_monitors.sql in the Supabase SQL Editor, then reload this page.",
            "Los monitores todavía no están configurados. Corré supabase/migrations/0008_monitors.sql en el SQL Editor de Supabase y recargá esta página.",
          )}
        </p>
      )}
      {message && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {message}
        </p>
      )}

      <Segmented label="Filter monitors" options={filters} value={filter} onChange={setFilter} />

      {groups
        .filter((group) => filter === "All" || group.title === filter)
        .map((group) => {
          const items = monitors.filter((m) => m.type === group.type);
          return (
            <section key={group.type}>
              <h2 className="mb-2.5 flex items-center gap-2 text-xs font-medium text-[#5b6478]">
                {t(group.title)}
                <span className="font-mono text-[11px] text-[#9aa1b2]">{items.length}</span>
              </h2>

              {items.length === 0 ? (
                <div className="flex items-center justify-between rounded-xl border border-dashed border-[#e3e6ef] px-4 py-5">
                  <p className="text-[13px] text-[#8a91a3]">{t(group.empty, group.emptyEs)}</p>
                  <button type="button" onClick={() => setDialogOpen(true)} disabled={setupNeeded} className={`${secondaryButtonClass} disabled:opacity-60`}>
                    {t("New monitor", "Nuevo monitor")}
                  </button>
                </div>
              ) : (
                <ul className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_8px_24px_rgba(15,26,46,0.08)]">
                  {items.map((monitor) => (
                    <MonitorRow
                      key={monitor.id}
                      monitor={monitor}
                      checking={busy === monitor.id}
                      open={openId === monitor.id}
                      onToggle={() => setOpenId(openId === monitor.id ? null : monitor.id)}
                      onCheck={() => run(monitor.id, () => checkMonitorNow(monitor.id))}
                      onRemove={() => run(monitor.id, () => deleteMonitor(monitor.id))}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}

      <p className="text-xs leading-5 text-[#8a91a3]">
        {t(
          "Monitors check each address from the outside at the interval you choose. If one goes down or comes back, Pulse emails you (turn it off in Settings → Alerts → Site down).",
          "Los monitores revisan cada dirección desde afuera con el intervalo que elijas. Si uno se cae o vuelve, Pulse te avisa por mail (lo apagás en Configuración → Alertas → Sitio caído).",
        )}
      </p>

      <NewMonitorDialog open={dialogOpen} onClose={closeDialog} onCreate={create} />
    </main>
  );
}

function MonitorRow({
  monitor,
  checking,
  open,
  onToggle,
  onCheck,
  onRemove,
}: {
  monitor: MonitorView;
  checking: boolean;
  open: boolean;
  onToggle: () => void;
  onCheck: () => void;
  onRemove: () => void;
}) {
  const status = checking ? "Checking" : monitor.status;
  const style = statusStyle[status];
  const lang = useLang();
  const t = useT();

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
          <span className="mt-0.5 block truncate text-xs text-[#8a91a3]">{rowSummary(monitor, t)}</span>
        </span>
        <span className="hidden w-20 shrink-0 font-mono text-[11px] text-[#9aa1b2] sm:block">
          {t("every", "cada")} {monitor.interval}
        </span>
        <span className="hidden w-20 shrink-0 text-right font-mono text-[11px] text-[#9aa1b2] md:block">
          {monitor.lastChecked ? monitor.lastChecked[lang] : "—"}
        </span>
        <span className="w-20 shrink-0 text-right">
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${style.chip}`}>{t(status)}</span>
        </span>
        <IconChevron className={`size-3.5 shrink-0 text-[#c9cedd] transition-transform duration-200 group-hover:text-[#5b6478] ${open ? "rotate-90" : ""}`} />
      </button>

      <div
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
            <div className="rounded-lg bg-[#fafafb] p-4">
              {monitor.type === "website" && monitor.website ? (
                <WebsiteDetails checks={monitor.website} availability={monitor.availability} />
              ) : monitor.type === "server" && monitor.server ? (
                <ServerDetails checks={monitor.server} availability={monitor.availability} />
              ) : (
                <p className="text-[13px] text-[#8a91a3]">{t("No checks yet.", "Todavía no hay comprobaciones.")}</p>
              )}

              <div className="mt-4 flex items-center gap-2 border-t border-[#ececf1] pt-4">
                <button type="button" onClick={onCheck} disabled={checking} className={`${secondaryButtonClass} disabled:opacity-50`}>
                  {checking ? t("Checking…", "Comprobando…") : t("Check now", "Comprobar ahora")}
                </button>
                <button type="button" onClick={onRemove} disabled={checking} className="ml-auto text-xs text-[#8a91a3] transition-colors hover:text-red-600">
                  {t("Remove monitor", "Eliminar monitor")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function rowSummary(monitor: MonitorView, t: ReturnType<typeof useT>) {
  if (monitor.type === "website") {
    const c = monitor.website;
    if (!c) return t("Waiting for the first check…", "Esperando la primera comprobación…");
    if (!c.online) return `${t("Not responding", "No responde")}${c.httpStatus ? ` · HTTP ${c.httpStatus}` : ""}`;
    return `HTTP ${c.httpStatus} · ${c.responseMs} ms`;
  }
  const c = monitor.server;
  if (!c) return t("Waiting for the first check…", "Esperando la primera comprobación…");
  if (!c.reachable) return t("No open ports respond", "Ningún puerto responde");
  const open = c.ports.filter((p) => p.open).length;
  return t(`${c.latencyMs} ms · ${open} of ${c.ports.length} ports open`, `${c.latencyMs} ms · ${open} de ${c.ports.length} puertos abiertos`);
}

function CheckItem({ label, tone, children }: { label: string; tone: Tone; children: ReactNode }) {
  const t = useT();
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[13px] text-[#5b6478]">{t(label)}</dt>
      <dd className="flex items-center gap-2 font-mono text-xs">
        {children}
        <span className={`size-1.5 rounded-full ${toneDot[tone]}`} />
      </dd>
    </div>
  );
}

function availabilityTone(value: string | null): Tone {
  if (value === null) return "muted";
  const n = parseFloat(value);
  return n >= 99.9 ? "good" : n >= 99 ? "warn" : "bad";
}

function WebsiteDetails({ checks, availability }: { checks: WebsiteChecks; availability: string | null }) {
  const http = checks.httpStatus ?? 0;
  const ms = checks.responseMs;
  const days = checks.sslDaysLeft;
  const t = useT();

  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      <CheckItem label="Online" tone={checks.online ? "good" : "bad"}>
        {checks.online ? t("Yes", "Sí") : "No"}
      </CheckItem>
      <CheckItem label="HTTP code" tone={http >= 500 || http === 0 ? "bad" : http >= 400 ? "warn" : "good"}>
        {checks.httpStatus ?? "—"}
      </CheckItem>
      <CheckItem label="Response time" tone={ms === null ? "muted" : ms >= thresholds.verySlowResponseMs ? "bad" : ms >= thresholds.slowResponseMs ? "warn" : "good"}>
        {ms === null ? "—" : `${ms} ms`}
      </CheckItem>
      <CheckItem label="SSL certificate" tone={days === null ? "muted" : days <= 0 ? "bad" : days < thresholds.sslWarningDays ? "warn" : "good"}>
        {days === null ? "—" : days <= 0 ? t("Expired", "Vencido") : t(`${days} days left`, `quedan ${days} días`)}
      </CheckItem>
      <CheckItem label="Availability (30 days)" tone={availabilityTone(availability)}>
        {availability ?? "—"}
      </CheckItem>
    </dl>
  );
}

function ServerDetails({ checks, availability }: { checks: ServerChecks; availability: string | null }) {
  const t = useT();
  return (
    <div className="space-y-4">
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <CheckItem label="Status" tone={checks.reachable ? "good" : "bad"}>
          {checks.reachable ? t("Online") : t("Offline")}
        </CheckItem>
        <CheckItem label="Availability (30 days)" tone={availabilityTone(availability)}>
          {availability ?? "—"}
        </CheckItem>
        <CheckItem label="Latency" tone={checks.latencyMs === null ? "muted" : checks.latencyMs >= thresholds.highLatencyMs ? "warn" : "good"}>
          {checks.latencyMs === null ? "—" : `${checks.latencyMs} ms`}
        </CheckItem>
      </dl>

      <div>
        <p className="text-[13px] text-[#5b6478]">{t("Ports")}</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {checks.ports.map(({ port, open }) => (
            <li key={port} className="inline-flex h-6 items-center gap-1.5 rounded-md border border-[#ececf1] bg-white px-2 font-mono text-[11px]">
              <span className={`size-1.5 rounded-full ${open ? "bg-emerald-500" : "bg-red-500"}`} />
              {port}
              {portNames[port] && <span className="font-sans text-[#8a91a3]">{portNames[port]}</span>}
              <span className={open ? "text-emerald-700" : "text-red-600"}>{open ? t("open", "abierto") : t("closed", "cerrado")}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
