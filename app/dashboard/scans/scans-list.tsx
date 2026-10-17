"use client";

import { useState } from "react";
import { scans, type Change } from "../data";
import { IconChevron } from "../icons";

const changeStyle: Record<Change["kind"], { label: string; className: string }> = {
  new: { label: "New", className: "text-red-600" },
  fixed: { label: "Fixed", className: "text-emerald-600" },
  improved: { label: "Improved", className: "text-[#4c2882]" },
};

function summary(changes: Change[]) {
  if (changes.length === 0) return "No changes";
  const counts = (["new", "fixed", "improved"] as const)
    .map((kind) => ({ kind, n: changes.filter((c) => c.kind === kind).length }))
    .filter(({ n }) => n > 0);
  return counts.map(({ kind, n }) => `${n} ${kind}`).join(" · ");
}

function scoreTone(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-amber-500";
  return "bg-red-500";
}

export function ScansList() {
  const [openId, setOpenId] = useState<string | null>(scans[0].id);
  const days = [...new Set(scans.map((scan) => scan.day))];

  return (
    <div className="space-y-8">
      {days.map((day) => (
        <section key={day}>
          <h2 className="mb-2.5 text-xs font-medium text-[#5b6478]">{day}</h2>
          <ul className="overflow-hidden rounded-xl border border-[#ececf1]">
            {scans
              .filter((scan) => scan.day === day)
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
                            scan.trigger === "Manual" ? "bg-[#4c2882]/[0.07] text-[#4c2882]" : "bg-[#f4f5f8] text-[#5b6478]"
                          }`}
                        >
                          {scan.trigger}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-[#5b6478]">{summary(scan.changes)}</span>
                      <span className="hidden w-16 shrink-0 font-mono text-[11px] text-[#8a91a3] sm:block">
                        {scan.pages} pages
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
                              <p className="text-xs font-medium text-[#5b6478]">What changed</p>
                              {scan.changes.length === 0 ? (
                                <p className="mt-2.5 text-[13px] text-[#8a91a3]">Everything looked the same as the previous scan.</p>
                              ) : (
                                <ul className="mt-2.5 space-y-2">
                                  {scan.changes.map((change) => (
                                    <li key={change.text} className="flex gap-3 text-[13px]">
                                      <span className={`w-16 shrink-0 text-xs font-medium ${changeStyle[change.kind].className}`}>
                                        {changeStyle[change.kind].label}
                                      </span>
                                      <span className="text-[#3c4558]">{change.text}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <dl className="grid shrink-0 grid-cols-3 gap-6 sm:grid-cols-1 sm:gap-2 sm:text-right">
                              <div>
                                <dt className="text-[11px] text-[#9aa1b2]">Ran</dt>
                                <dd className="font-mono text-xs">{scan.ago}</dd>
                              </div>
                              <div>
                                <dt className="text-[11px] text-[#9aa1b2]">Duration</dt>
                                <dd className="font-mono text-xs">{scan.duration}</dd>
                              </div>
                              <div>
                                <dt className="text-[11px] text-[#9aa1b2]">Pages</dt>
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
