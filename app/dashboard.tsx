"use client";

import { useEffect, useRef, useState } from "react";

type Status = "Healthy" | "Warning" | "Critical" | "Scanning";

type Site = {
  url: string;
  score: number;
  status: Status;
  note: string;
  checks: { label: string; value: number }[];
};

const initialSites: Site[] = [
  {
    url: "atendium.com",
    score: 94,
    status: "Healthy",
    note: "None",
    checks: [
      { label: "Availability", value: 100 },
      { label: "Performance", value: 91 },
      { label: "SEO", value: 95 },
      { label: "Tracking", value: 90 },
    ],
  },
  {
    url: "tivvo.com",
    score: 81,
    status: "Warning",
    note: "Meta Pixel missing",
    checks: [
      { label: "Availability", value: 100 },
      { label: "Performance", value: 84 },
      { label: "SEO", value: 88 },
      { label: "Tracking", value: 52 },
    ],
  },
  {
    url: "nubbapay.com",
    score: 67,
    status: "Critical",
    note: "4 broken links",
    checks: [
      { label: "Availability", value: 96 },
      { label: "Performance", value: 63 },
      { label: "SEO", value: 48 },
      { label: "Tracking", value: 61 },
    ],
  },
];

const statusStyles = {
  Healthy: { dot: "bg-emerald-500", text: "text-emerald-700", chip: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500" },
  Warning: { dot: "bg-amber-500", text: "text-amber-700", chip: "bg-amber-50 text-amber-700", bar: "bg-amber-500" },
  Critical: { dot: "bg-red-500", text: "text-red-600", chip: "bg-red-50 text-red-600", bar: "bg-red-500" },
  Scanning: { dot: "bg-[#4c2882] animate-pulse", text: "text-[#5b6478]", chip: "bg-[#4c2882]/10 text-[#4c2882]", bar: "bg-[#4c2882]" },
} as const;

const SCAN_MS = 1400;

function barColor(value: number) {
  if (value >= 85) return "bg-emerald-500";
  if (value >= 65) return "bg-amber-500";
  return "bg-red-500";
}

export function Dashboard() {
  const [tab, setTab] = useState<"sites" | "reports">("sites");
  const [sites, setSites] = useState(initialSites);
  const [query, setQuery] = useState("");
  const [openUrl, setOpenUrl] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  function scan(url: string) {
    setSites((list) =>
      list.map((site) => (site.url === url ? { ...site, status: "Scanning", note: "Scanning…" } : site)),
    );
    const id = window.setTimeout(() => {
      setSites((list) =>
        list.map((site) => (site.url === url ? (initialSites.find((s) => s.url === url) ?? site) : site)),
      );
    }, SCAN_MS);
    timers.current.push(id);
  }

  const visible = sites.filter((site) => site.url.includes(query.trim().toLowerCase()));
  const scanned = sites.filter((site) => site.status !== "Scanning");
  const average = scanned.length
    ? Math.round(scanned.reduce((sum, site) => sum + site.score, 0) / scanned.length)
    : 0;
  const counts = {
    Healthy: scanned.filter((s) => s.status === "Healthy").length,
    Warning: scanned.filter((s) => s.status === "Warning").length,
    Critical: scanned.filter((s) => s.status === "Critical").length,
  };

  const tabClass = (active: boolean) =>
    `rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors duration-200 ${
      active ? "bg-white/10 text-white/90" : "text-white/50 hover:text-white/80"
    }`;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e3e6ef] bg-white shadow-[0_2px_4px_rgba(15,26,46,0.04),0_24px_60px_rgba(15,26,46,0.12)]">
      <div className="flex items-center justify-between bg-[#0f1a2e] px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">Pulse</span>
          <button type="button" onClick={() => setTab("sites")} className={tabClass(tab === "sites")}>
            Sites
          </button>
          <button type="button" onClick={() => setTab("reports")} className={tabClass(tab === "reports")}>
            Reports
          </button>
        </div>
        <span className="size-6 rounded-full bg-white/15" aria-hidden="true" />
      </div>

      {tab === "sites" ? (
        <>
          <div className="border-b border-[#eef0f5] px-5 py-3">
            <label htmlFor="dash-filter" className="sr-only">
              Filter sites
            </label>
            <input
              id="dash-filter"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter sites…"
              className="w-full bg-transparent py-1 font-mono text-[11px] text-[#0f1a2e] outline-none placeholder:text-[#9aa1b2]"
            />
          </div>

          <div className="grid grid-cols-[1.3fr_0.5fr_0.9fr_1.4fr] gap-4 px-5 pt-3 pb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#9aa1b2]">
            <span>Site</span>
            <span>Score</span>
            <span>Status</span>
            <span>Issues</span>
          </div>

          <ul className="px-5 pb-3">
            {visible.length === 0 && (
              <li className="border-t border-[#f1f2f6] py-6 text-center font-mono text-[11px] text-[#9aa1b2]">
                No sites match “{query}”.
              </li>
            )}
            {visible.map((site) => {
              const style = statusStyles[site.status];
              const isOpen = openUrl === site.url && site.status !== "Scanning";

              return (
                <li key={site.url} className="border-t border-[#f1f2f6]">
                  <button
                    type="button"
                    onClick={() => setOpenUrl(isOpen ? null : site.url)}
                    aria-expanded={isOpen}
                    disabled={site.status === "Scanning"}
                    className="-mx-2 grid w-[calc(100%+1rem)] grid-cols-[1.3fr_0.5fr_0.9fr_1.4fr] items-center gap-4 rounded-lg px-2 py-3 text-left text-[12px] transition-colors duration-200 hover:bg-[#f6f7fb] disabled:cursor-wait"
                  >
                    <span className="flex min-w-0 items-center gap-2 font-mono text-[#0f1a2e]">
                      <span className={`size-1.5 shrink-0 rounded-full ${style.dot}`} />
                      <span className="truncate">{site.url}</span>
                    </span>
                    <span className="text-base font-semibold tracking-tight text-[#0f1a2e]">
                      {site.status === "Scanning" ? "–" : site.score}
                    </span>
                    <span>
                      <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] ${style.chip}`}>
                        {site.status}
                      </span>
                    </span>
                    <span className={`truncate ${site.status === "Healthy" ? "text-[#5b6478]" : style.text}`}>
                      {site.status === "Scanning" ? "" : site.status === "Healthy" ? "✓ " : "! "}
                      {site.note}
                    </span>
                  </button>

                  <div
                    inert={!isOpen}
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="mb-3 rounded-xl bg-[#f6f7fb] p-4">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                          {site.checks.map((check) => (
                            <div key={check.label}>
                              <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-[#5b6478]">
                                <span>{check.label}</span>
                                <span className="text-[#0f1a2e]">{check.value}</span>
                              </div>
                              <div className="mt-1.5 h-1 rounded-full bg-[#e3e6ef]">
                                <div
                                  className={`h-full rounded-full transition-[width] duration-700 ease-out ${barColor(check.value)}`}
                                  style={{ width: isOpen ? `${check.value}%` : "0%" }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => scan(site.url)}
                            className="rounded-full border border-[#4c2882]/30 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#4c2882] transition-colors duration-200 hover:border-[#4c2882] hover:bg-[#4c2882] hover:text-white"
                          >
                            Scan again
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <div className="px-5 py-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#9aa1b2]">Average Pulse Score</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight text-[#0f1a2e]">{average}</p>
            </div>
            <div className="flex gap-2">
              {(Object.keys(counts) as (keyof typeof counts)[]).map((status) => (
                <span
                  key={status}
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] ${statusStyles[status].chip}`}
                >
                  {counts[status]} {status}
                </span>
              ))}
            </div>
          </div>
          <ul className="mt-5 space-y-3">
            {scanned.map((site) => (
              <li key={site.url}>
                <button
                  type="button"
                  onClick={() => {
                    setTab("sites");
                    setQuery("");
                    setOpenUrl(site.url);
                  }}
                  className="group w-full text-left"
                >
                  <div className="flex justify-between font-mono text-[11px] text-[#0f1a2e]">
                    <span className="transition-colors group-hover:text-[#4c2882]">{site.url}</span>
                    <span>{site.score}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-[#eef0f5]">
                    <div
                      className={`h-full rounded-full ${statusStyles[site.status].bar}`}
                      style={{ width: `${site.score}%` }}
                    />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
