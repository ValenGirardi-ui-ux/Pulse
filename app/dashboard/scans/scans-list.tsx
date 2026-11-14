"use client";

import { useState } from "react";
import type { Bilingual, ChangeKind } from "@/lib/scan/data";
import { useLang, useT } from "../../i18n";
import { IconChevron } from "../icons";

export type ScanView = {
  id: string;
  day: Bilingual;
  time: string;
  ago: Bilingual;
  source: "manual" | "scheduled";
  pages: number;
  duration: string;
  score: number;
  delta: number | null;
  first: boolean;
  changes: { kind: ChangeKind; text: Bilingual }[];
};

const changeStyle: Record<ChangeKind, { label: string; labelEs: string; className: string }> = {
  new: { label: "New", labelEs: "Nuevo", className: "text-red-600" },
  fixed: { label: "Fixed", labelEs: "Resuelto", className: "text-emerald-600" },
};

function summary(scan: ScanView, t: ReturnType<typeof useT>) {
  if (scan.first) return t("First scan", "Primer escaneo");
  if (scan.changes.length === 0) return t("No changes", "Sin cambios");
  const newCount = scan.changes.filter((c) => c.kind === "new").length;
  const fixedCount = scan.changes.filter((c) => c.kind === "fixed").length;
  return [
    newCount > 0 && `${newCount} ${t("new", newCount === 1 ? "nuevo" : "nuevos")}`,
    fixedCount > 0 && `${fixedCount} ${t("fixed", fixedCount === 1 ? "resuelto" : "resueltos")}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

function scoreTone(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-amber-500";
  return "bg-red-500";
}

export function ScansList({ scans }: { scans: ScanView[] }) {
  const [openId, setOpenId] = useState<string | null>(scans[0]?.id ?? null);
  const lang = useLang();
  const t = useT();
  const days = [...new Map(scans.map((scan) => [scan.day.en, scan.day])).values()];

  return (
    <div className="space-y-8">
      {days.map((day) => (
        <section key={day.en}>
          <h2 className="mb-2.5 text-xs font-medium text-[#5b6478]">{day[lang]}</h2>
          <ul className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_8px_24px_rgba(15,26,46,0.08)]">
            {scans
              .filter((scan) => scan.day.en === day.en)
              .map((scan) => {
                const open = openId === scan.id;
                return (
                  <li key={scan.id} className="border-b border-[#f1f2f6] last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : scan.id)}
                      aria-expanded={open}
                      className="group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#fafafb]"
                    >
                      <span className="w-12 shrink-0 font-mono text-[13px]">{scan.time}</span>
                      <span className="w-20 shrink-0">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[11px] ${
                            scan.source === "manual" ? "bg-[#4c2882]/[0.07] text-[#4c2882]" : "bg-[#f4f5f8] text-[#5b6478]"
                          }`}
                        >
                          {scan.source === "manual" ? t("Manual") : t("Scheduled")}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-[#5b6478]">{summary(scan, t)}</span>
                      <span className="hidden w-20 shrink-0 font-mono text-[11px] text-[#8a91a3] sm:block">
                        {scan.pages} {t("pages", "páginas")}
                      </span>
                      <span className="flex w-16 shrink-0 items-center justify-end gap-2">
                        <span className={`size-1.5 rounded-full ${scoreTone(scan.score)}`} />
                        <span className="font-mono text-[13px] font-medium">{scan.score}</span>
                      </span>
                      <span
                        className={`w-8 shrink-0 text-right font-mono text-[11px] ${
                          scan.delta === null || scan.delta === 0
                            ? "text-[#9aa1b2]"
                            : scan.delta > 0
                              ? "text-emerald-600"
                              : "text-red-600"
                        }`}
                      >
                        {scan.delta === null ? "" : scan.delta === 0 ? "0" : scan.delta > 0 ? `+${scan.delta}` : scan.delta}
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
                          <div className="flex flex-col gap-4 rounded-lg bg-[#fafafb] p-4 sm:flex-row sm:items-start">
                            <div className="flex-1">
                              <p className="text-xs font-medium text-[#5b6478]">{t("What changed", "Qué cambió")}</p>
                              {scan.first ? (
                                <p className="mt-2.5 text-[13px] text-[#8a91a3]">
                                  {t(
                                    "This was the first scan. The next ones will show what changed.",
                                    "Este fue el primer escaneo. Los próximos van a mostrar qué cambió.",
                                  )}
                                </p>
                              ) : scan.changes.length === 0 ? (
                                <p className="mt-2.5 text-[13px] text-[#8a91a3]">
                                  {t("Everything looked the same as the previous scan.", "Todo estaba igual que en el escaneo anterior.")}
                                </p>
                              ) : (
                                <ul className="mt-2.5 space-y-2">
                                  {scan.changes.map((change) => (
                                    <li key={`${change.kind}-${change.text.en}`} className="flex gap-3 text-[13px]">
                                      <span className={`w-16 shrink-0 text-xs font-medium ${changeStyle[change.kind].className}`}>
                                        {t(changeStyle[change.kind].label, changeStyle[change.kind].labelEs)}
                                      </span>
                                      <span className="text-[#3c4558]">{change.text[lang]}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <dl className="grid shrink-0 grid-cols-3 gap-6 sm:grid-cols-1 sm:gap-2 sm:text-right">
                              <div>
                                <dt className="text-[11px] text-[#9aa1b2]">{t("Ran", "Hecho")}</dt>
                                <dd className="font-mono text-xs">{scan.ago[lang]}</dd>
                              </div>
                              <div>
                                <dt className="text-[11px] text-[#9aa1b2]">{t("Duration", "Duración")}</dt>
                                <dd className="font-mono text-xs">{scan.duration}</dd>
                              </div>
                              <div>
                                <dt className="text-[11px] text-[#9aa1b2]">{t("Pages", "Páginas")}</dt>
                                <dd className="font-mono text-xs">{scan.pages}</dd>
                              </div>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
