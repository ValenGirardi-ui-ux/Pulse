"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useT } from "../../i18n";
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

export function MonitorsView() {
  const [monitors, setMonitors] = useState<Monitor[]>(initialMonitors);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const timers = useRef<number[]>([]);
  const t = useT();

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
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
      <p role="note" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-5 text-amber-800">
        {t(
          "Demo: this section shows example data so you can see how monitors will work. Real monitors are coming soon. Your own site is checked from Overview and Scans.",
          "Demo: esta sección muestra datos de ejemplo para que veas cómo van a funcionar los monitores. Los monitores reales llegan pronto. Tu sitio se revisa desde Resumen y Escaneos.",
        )}
      </p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("Monitors", "Monitores")}</h1>
          <p className="mt-1 text-[13px] text-[#8a91a3]">
            {monitors.length} {t("monitors", "monitores")}
            {down > 0 && <span className="text-red-600">
                {" "}
                · {down} {t("down", down === 1 ? "caído" : "caídos")}
              </span>}
            {warnings > 0 && <span className="text-amber-600">
                {" "}
                · {warnings} {t("warning", warnings === 1 ? "advertencia" : "advertencias")}
              </span>}
          </p>
        </div>
        <button type="button" onClick={() => setDialogOpen(true)} className={`${primaryButtonClass} h-9`}>
          <span aria-hidden="true" className="text-sm leading-none">
            +
          </span>
          {t("New monitor", "Nuevo monitor")}
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
                {t(group.title)}
                <span className="font-mono text-[11px] text-[#9aa1b2]">{items.length}</span>
              </h2>

              {items.length === 0 ? (
                <div className="flex items-center justify-between rounded-xl border border-dashed border-[#e3e6ef] px-4 py-5">
                  <p className="text-[13px] text-[#8a91a3]">{t(group.empty, group.emptyEs)}</p>
                  <button type="button" onClick={() => setDialogOpen(true)} className={secondaryButtonClass}>
                    {t("New monitor", "Nuevo monitor")}
                  </button>
                </div>
              ) : (
                <ul className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_8px_24px_rgba(15,26,46,0.08)]">
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
          {t(monitor.lastChecked)}
        </span>
        <span className="w-20 shrink-0 text-right">
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${style.chip}`}>{t(status)}</span>
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
                  {checking ? t("Checking…", "Comprobando…") : t("Check now", "Comprobar ahora")}
                </button>
                <button
                  type="button"
                  onClick={onRemove}
                  className="ml-auto text-xs text-[#8a91a3] transition-colors hover:text-red-600"
                >
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

function rowSummary(monitor: Monitor, t: ReturnType<typeof useT>) {
  if (!monitor.checks) return t("Running the first check…", "Haciendo la primera comprobación…");

  if (monitor.type === "website") {
    const c = monitor.checks;
    if (!c.online) return `${t("Not responding", "No responde")} · HTTP ${c.httpStatus ?? "—"}`;
    return `HTTP ${c.httpStatus} · ${c.responseMs} ms`;
  }

  const c = monitor.checks;
  if (!c.reachable) return t("No response to ping", "No responde al ping");
  const open = c.ports.filter((p) => p.open).length;
  return t(
    `${c.latencyMs} ms · ${open} of ${c.ports.length} ports open`,
    `${c.latencyMs} ms · ${open} de ${c.ports.length} puertos abiertos`,
  );
}

function CheckingState({ type }: { type: MonitorType }) {
  const t = useT();
  const steps =
    type === "website"
      ? ["Online", "HTTP code", "Response time", "SSL certificate", "Pages with errors", "Broken links"]
      : ["Status", "Availability", "Ping", "Latency", "Ports"];
  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {steps.map((label) => (
        <div key={label} className="flex items-center justify-between gap-4">
          <dt className="text-[13px] text-[#5b6478]">{t(label)}</dt>
          <dd className="h-3 w-16 animate-pulse rounded bg-[#ececf1]" />
        </div>
      ))}
    </dl>
  );
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

function WebsiteDetails({ checks }: { checks: WebsiteChecks }) {
  const http = checks.httpStatus ?? 0;
  const ms = checks.responseMs;
  const days = checks.ssl.daysLeft;
  const t = useT();

  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      <CheckItem label="Online" tone={checks.online ? "good" : "bad"}>
        {checks.online ? t("Yes", "Sí") : "No"}
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
        {!checks.ssl.valid
          ? t("Invalid", "Inválido")
          : days === null
            ? t("Valid", "Válido")
            : t(`${days} days left`, `quedan ${days} días`)}
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
  const t = useT();
  return (
    <div className="space-y-4">
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <CheckItem label="Status" tone={checks.reachable ? "good" : "bad"}>
          {checks.reachable ? t("Online") : t("Offline")}
        </CheckItem>
        <CheckItem label="Availability (30 days)" tone={parseFloat(checks.availability) >= 99.9 ? "good" : "warn"}>
          {checks.availability}
        </CheckItem>
        <CheckItem label="Ping" tone={checks.pingOk ? "good" : "bad"}>
          {checks.pingOk ? t("Responding", "Responde") : t("No response", "Sin respuesta")}
        </CheckItem>
        <CheckItem
          label="Latency"
          tone={checks.latencyMs === null ? "muted" : checks.latencyMs >= thresholds.highLatencyMs ? "warn" : "good"}
        >
          {checks.latencyMs === null ? "—" : `${checks.latencyMs} ms`}
        </CheckItem>
      </dl>

      <div>
        <p className="text-[13px] text-[#5b6478]">{t("Ports")}</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {checks.ports.map(({ port, open }) => (
            <li
              key={port}
              className="inline-flex h-6 items-center gap-1.5 rounded-md border border-[#ececf1] bg-white px-2 font-mono text-[11px]"
            >
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
