"use client";

import { useState } from "react";
import { issues, severityDot, type Category, type Severity } from "../data";
import { IconChevron, IconSpark } from "../icons";

const filters: ("All" | Category)[] = ["All", "Development", "SEO", "Marketing", "Performance"];
const groups: { severity: Severity; label: string }[] = [
  { severity: "Critical", label: "Critical" },
  { severity: "Warning", label: "Warnings" },
  { severity: "Minor", label: "Minor" },
];

export function IssuesList() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [openId, setOpenId] = useState<string | null>(issues[0].id);

  const visible = issues.filter((issue) => filter === "All" || issue.category === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-1.5">
        {filters.map((name) => {
          const count = name === "All" ? issues.length : issues.filter((i) => i.category === name).length;
          const active = filter === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => setFilter(name)}
              aria-pressed={active}
              className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors ${
                active
                  ? "border-[#0f1a2e] bg-[#0f1a2e] text-white"
                  : "border-[#ececf1] text-[#5b6478] hover:border-[#d9dce6] hover:text-[#0f1a2e]"
              }`}
            >
              {name}
              <span className={`font-mono text-[10px] ${active ? "text-white/60" : "text-[#9aa1b2]"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {groups.map(({ severity, label }) => {
        const items = visible.filter((issue) => issue.severity === severity);
        if (items.length === 0) return null;

        return (
          <section key={severity}>
            <h2 className="mb-2.5 flex items-center gap-2 text-xs font-medium text-[#5b6478]">
              <span className={`size-1.5 rounded-full ${severityDot[severity]}`} />
              {label}
              <span className="font-mono text-[11px] text-[#9aa1b2]">{items.length}</span>
            </h2>

            <ul className="overflow-hidden rounded-xl border border-[#ececf1]">
              {items.map((issue) => {
                const open = openId === issue.id;
                return (
                  <li key={issue.id} className="border-b border-[#f1f2f6] last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : issue.id)}
                      aria-expanded={open}
                      className="group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#fafafb]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{issue.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-[#8a91a3]">{issue.impact}</span>
                      </span>
                      <span className="hidden w-24 shrink-0 text-xs text-[#5b6478] md:block">{issue.category}</span>
                      <span className="hidden w-20 shrink-0 truncate font-mono text-[11px] text-[#8a91a3] sm:block">
                        {issue.page}
                      </span>
                      <span className="hidden w-14 shrink-0 text-right font-mono text-[11px] text-[#9aa1b2] sm:block">
                        {issue.found}
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
                            <p className="text-xs font-medium text-[#5b6478]">How to fix</p>
                            <ol className="mt-2.5 space-y-2">
                              {issue.fix.map((step, index) => (
                                <li key={step} className="flex gap-3 text-[13px] leading-5 text-[#3c4558]">
                                  <span className="mt-px font-mono text-[11px] text-[#9aa1b2]">{index + 1}</span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#4c2882] px-3 text-xs font-medium text-white transition-colors hover:bg-[#5a3196]"
                              >
                                <IconSpark className="size-3" />
                                Ask Pulse for help
                              </button>
                              <button
                                type="button"
                                className="inline-flex h-8 items-center rounded-lg border border-[#e3e6ef] bg-white px-3 text-xs font-medium transition-colors hover:border-[#c9cedd]"
                              >
                                Mark as fixed
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
