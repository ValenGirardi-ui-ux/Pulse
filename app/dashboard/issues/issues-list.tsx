"use client";

import { useState } from "react";
import type { IssueView } from "@/lib/scan/data";
import { severityDot, type Category, type Severity } from "../data";
import { useAgent } from "../agent";
import { useLang, useT } from "../../i18n";
import { IconChevron, IconSpark } from "../icons";

const filters: ("All" | Category)[] = ["All", "Development", "SEO", "Marketing", "Performance"];
const groups: { severity: Severity; label: string }[] = [
  { severity: "Critical", label: "Critical" },
  { severity: "Warning", label: "Warnings" },
  { severity: "Minor", label: "Minor" },
];

export function IssuesList({ issues }: { issues: IssueView[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [openId, setOpenId] = useState<string | null>(issues[0]?.key ?? null);
  const { ask } = useAgent();
  const lang = useLang();
  const t = useT();

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
              {name === "All" ? t("All", "Todos") : t(name)}
              <span className={`font-mono text-[10px] ${active ? "text-white/60" : "text-[#9aa1b2]"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="text-[13px] text-[#8a91a3]">{t("No issues in this category.", "No hay problemas en esta categoría.")}</p>
      )}

      {groups.map(({ severity, label }) => {
        const items = visible.filter((issue) => issue.severity === severity);
        if (items.length === 0) return null;

        return (
          <section key={severity}>
            <h2 className="mb-2.5 flex items-center gap-2 text-xs font-medium text-[#5b6478]">
              <span className={`size-1.5 rounded-full ${severityDot[severity]}`} />
              {t(label)}
              <span className="font-mono text-[11px] text-[#9aa1b2]">{items.length}</span>
            </h2>

            <ul className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_8px_24px_rgba(15,26,46,0.08)]">
              {items.map((issue) => {
                const open = openId === issue.key;
                const text = issue[lang];
                return (
                  <li key={issue.key} className="border-b border-[#f1f2f6] last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : issue.key)}
                      aria-expanded={open}
                      className="group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#fafafb]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{text.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-[#8a91a3]">{text.impact}</span>
                      </span>
                      <span className="hidden w-24 shrink-0 text-xs text-[#5b6478] md:block">{t(issue.category)}</span>
                      <span className="hidden w-24 shrink-0 truncate font-mono text-[11px] text-[#8a91a3] sm:block">
                        {issue.page}
                      </span>
                      <span className="hidden w-16 shrink-0 text-right font-mono text-[11px] text-[#9aa1b2] sm:block">
                        {issue.found[lang]}
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
                            <p className="text-xs font-medium text-[#5b6478]">{t("How to fix", "Cómo arreglarlo")}</p>
                            <ol className="mt-2.5 space-y-2">
                              {text.fix.map((step, index) => (
                                <li key={step} className="flex gap-3 text-[13px] leading-5 text-[#3c4558]">
                                  <span className="mt-px font-mono text-[11px] text-[#9aa1b2]">{index + 1}</span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  ask(
                                    t(
                                      `Help me fix "${issue.en.title}" (${issue.page}). ${issue.en.impact}`,
                                      `Ayudame a arreglar "${issue.es.title}" (${issue.page}). ${issue.es.impact}`,
                                    ),
                                  )
                                }
                                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#4c2882] px-3 text-xs font-medium text-white transition-colors hover:bg-[#5a3196]"
                              >
                                <IconSpark className="size-3" />
                                {t("Ask Pulse for help", "Pedirle ayuda a Pulse")}
                              </button>
                              <span className="text-xs text-[#9aa1b2]">
                                {t("Fixed it? Run a new scan to confirm.", "¿Lo arreglaste? Hacé un nuevo escaneo para confirmarlo.")}
                              </span>
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
