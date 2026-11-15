"use client";

import { useEffect, useRef, useState } from "react";
import type { PerformanceData } from "@/lib/scan/audit";
import type { IssueView } from "@/lib/scan/data";
import { categoryLabels, effortLabels, severityLabels, type Category, type Severity } from "@/lib/scan/rules";
import { useLang, useT, type Lang } from "../i18n";
import { IconDownload } from "./icons";
import { downloadFile, printHtml } from "./llm-optimization/export";

export type SiteReport = {
  site: string;
  name: string;
  createdAt: string;
  score: number;
  pagesCrawled: number | null;
  categories: { key: Category; score: number | null }[];
  performance: PerformanceData | null;
  issues: IssueView[];
};

const severities: Severity[] = ["Critical", "High", "Warning", "Minor"];
const severityColor: Record<Severity, string> = { Critical: "#ef4444", High: "#f97316", Warning: "#f59e0b", Minor: "#9aa1b2" };

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatDate(iso: string, lang: Lang) {
  return new Date(iso).toLocaleString(lang === "es" ? "es-AR" : "en-US", { dateStyle: "long", timeStyle: "short" });
}

function vitals(p: PerformanceData) {
  const ms = (v: number | null) => (v === null ? "—" : v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${Math.round(v)} ms`);
  return [
    ["LCP", ms(p.fieldLcpMs ?? p.lcpMs)],
    ["INP", ms(p.fieldInpMs)],
    ["CLS", (p.fieldCls ?? p.cls)?.toFixed(2) ?? "—"],
    ["FCP", ms(p.fcpMs)],
    ["TBT", ms(p.tbtMs)],
    ["Speed Index", ms(p.speedIndexMs)],
    ["TTFB", ms(p.ttfbMs)],
  ] as const;
}

function fileName(report: SiteReport, extension: string) {
  const day = report.createdAt.slice(0, 10);
  return `pulse-${report.site.replace(/[^a-z0-9.-]/gi, "-")}-${day}.${extension}`;
}

export function reportToMarkdown(report: SiteReport, lang: Lang) {
  const L = (en: string, es: string) => (lang === "es" ? es : en);
  const lines = [
    `# ${L("SEO + GEO report", "Reporte SEO + GEO")}: ${report.site}`,
    "",
    `${L("Scanned", "Escaneado")}: ${formatDate(report.createdAt, lang)}`,
    report.pagesCrawled !== null ? `${L("Pages crawled", "Páginas recorridas")}: ${report.pagesCrawled}` : "",
    "",
    `## ${L("Overall SEO score", "Puntaje SEO general")}: ${report.score}/100`,
    "",
    ...report.categories.map((c) => `- ${categoryLabels[c.key][lang]}: ${c.score ?? "—"}/100`),
  ];
  if (report.performance) {
    lines.push("", `## Core Web Vitals (mobile)`, "", ...vitals(report.performance).map(([k, v]) => `- ${k}: ${v}`));
  }
  lines.push("", `## ${L("Issues", "Problemas")} (${report.issues.length})`);
  for (const severity of severities) {
    const items = report.issues.filter((i) => i.severity === severity);
    if (!items.length) continue;
    lines.push("", `### ${severityLabels[severity][lang]} (${items.length})`);
    for (const issue of items) {
      const text = issue[lang];
      lines.push(
        "",
        `#### ${text.title}`,
        "",
        `${categoryLabels[issue.category][lang]} · ${effortLabels[issue.effort][lang]}`,
        "",
        text.impact,
      );
      if (issue.evidence) lines.push("", `**${L("Evidence", "Evidencia")}:** \`${issue.evidence}\``);
      if (issue.pages.length) lines.push("", `**${L("Affected URLs", "URLs afectadas")}:** ${issue.pages.map((p) => `\`${p}\``).join(", ")}`);
      lines.push("", `**${L("How to fix", "Cómo arreglarlo")}:**`, ...text.fix.map((step, n) => `${n + 1}. ${step}`));
      if (text.code) lines.push("", "```", text.code, "```");
      lines.push("", `**${L("How to check it's fixed", "Cómo verificar que se resolvió")}:** ${text.verify}`);
    }
  }
  return lines.filter((line, i, all) => !(line === "" && all[i - 1] === "")).join("\n");
}

export function reportToHtml(report: SiteReport, lang: Lang) {
  const L = (en: string, es: string) => (lang === "es" ? es : en);
  const tone = (score: number | null) => (score === null ? "#c9cedd" : score >= 85 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444");
  const categories = report.categories
    .map((c) => `<div class="cat"><span>${escapeHtml(categoryLabels[c.key][lang])}</span><b style="color:${tone(c.score)}">${c.score ?? "—"}</b></div>`)
    .join("");
  const performance = report.performance
    ? `<h2>Core Web Vitals (mobile)</h2><div class="cats">${vitals(report.performance)
        .map(([k, v]) => `<div class="cat"><span>${k}</span><b>${escapeHtml(v)}</b></div>`)
        .join("")}</div>`
    : "";
  const issues = severities
    .map((severity) => {
      const items = report.issues.filter((i) => i.severity === severity);
      if (!items.length) return "";
      return `<h2><span class="dot" style="background:${severityColor[severity]}"></span>${escapeHtml(severityLabels[severity][lang])} <small>${items.length}</small></h2>${items
        .map((issue) => {
          const text = issue[lang];
          return `<article>
            <h3>${escapeHtml(text.title)}</h3>
            <p class="meta">${escapeHtml(categoryLabels[issue.category][lang])} · ${escapeHtml(effortLabels[issue.effort][lang])}</p>
            <p>${escapeHtml(text.impact)}</p>
            ${issue.evidence ? `<p class="label">${L("Evidence", "Evidencia")}</p><code class="block">${escapeHtml(issue.evidence)}</code>` : ""}
            ${issue.pages.length ? `<p class="label">${L("Affected URLs", "URLs afectadas")} (${issue.pages.length})</p><p class="urls">${issue.pages.map((p) => `<code>${escapeHtml(p)}</code>`).join(" ")}</p>` : ""}
            <p class="label">${L("How to fix", "Cómo arreglarlo")}</p>
            <ol>${text.fix.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
            ${text.code ? `<pre>${escapeHtml(text.code)}</pre>` : ""}
            <p class="label">${L("How to check it's fixed", "Cómo verificar que se resolvió")}</p>
            <p>${escapeHtml(text.verify)}</p>
          </article>`;
        })
        .join("")}`;
    })
    .join("");

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pulse · ${escapeHtml(report.site)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #f6f7fb; color: #0f1a2e; font: 14px/1.6 -apple-system, "Segoe UI", Roboto, sans-serif; }
  .page { max-width: 880px; margin: 0 auto; padding: 48px 32px; }
  header { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; border-bottom: 1px solid #e3e6ef; padding-bottom: 24px; }
  .brand { color: #4c2882; font-weight: 700; font-size: 18px; }
  h1 { margin: 6px 0 0; font-size: 26px; font-weight: 400; letter-spacing: -0.02em; }
  .muted { color: #8a91a3; font-size: 13px; }
  .score { text-align: right; }
  .score b { display: block; font-size: 52px; font-weight: 300; line-height: 1; letter-spacing: -0.04em; }
  h2 { margin: 36px 0 12px; font-size: 16px; display: flex; align-items: center; gap: 8px; }
  h2 small { color: #9aa1b2; font-weight: 400; }
  .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .cats { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 8px; }
  .cat { background: #fff; border: 1px solid #e3e6ef; border-radius: 10px; padding: 10px 12px; display: flex; justify-content: space-between; gap: 8px; font-size: 13px; }
  .cat b { font-family: ui-monospace, monospace; }
  article { background: #fff; border: 1px solid #e3e6ef; border-radius: 12px; padding: 18px 20px; margin-bottom: 10px; break-inside: avoid; }
  article h3 { margin: 0; font-size: 15px; }
  .meta { margin: 2px 0 8px; color: #8a91a3; font-size: 12px; }
  .label { margin: 12px 0 4px; font-size: 12px; font-weight: 600; color: #5b6478; }
  article p { margin: 0; }
  ol { margin: 0; padding-left: 20px; }
  code { font-family: ui-monospace, monospace; font-size: 12px; background: #f4f5f8; border-radius: 4px; padding: 1px 5px; }
  code.block { display: block; padding: 8px 10px; word-break: break-all; }
  .urls code { display: inline-block; margin: 0 4px 4px 0; }
  pre { background: #0f1a2e; color: #fff; border-radius: 8px; padding: 12px; font-size: 12px; overflow-x: auto; white-space: pre-wrap; }
  footer { margin-top: 40px; color: #9aa1b2; font-size: 12px; text-align: center; }
  @media print { body { background: #fff; } .page { padding: 0; } }
</style>
</head>
<body>
<div class="page">
  <header>
    <div>
      <div class="brand">Pulse</div>
      <h1>${escapeHtml(report.name)} · ${escapeHtml(report.site)}</h1>
      <div class="muted">${L("Scanned", "Escaneado")}: ${escapeHtml(formatDate(report.createdAt, lang))}${report.pagesCrawled !== null ? ` · ${report.pagesCrawled} ${L("pages crawled", "páginas recorridas")}` : ""}</div>
    </div>
    <div class="score"><span class="muted">${L("Overall SEO score", "Puntaje SEO general")}</span><b style="color:${tone(report.score)}">${report.score}</b></div>
  </header>
  <h2>${L("Scores by area", "Puntaje por área")}</h2>
  <div class="cats">${categories}</div>
  ${performance}
  <h2>${L("Issues", "Problemas")} <small>${report.issues.length}</small></h2>
  ${report.issues.length ? issues : `<p class="muted">${L("No issues found.", "No se encontraron problemas.")}</p>`}
  <footer>${L("Generated by Pulse", "Generado por Pulse")}</footer>
</div>
</body>
</html>`;
}

/** "Download report" on Overview: PDF (print), HTML or Markdown, in the language the user picked. */
export function DownloadReport({ report }: { report: SiteReport }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const lang = useLang();
  const t = useT();

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const options = [
    { label: "PDF", detail: t("Choose “Save as PDF”", "Elegí “Guardar como PDF”"), action: () => printHtml(reportToHtml(report, lang)) },
    {
      label: t("HTML report", "Informe HTML"),
      detail: t("Opens in any browser", "Se abre en cualquier navegador"),
      action: () => downloadFile(fileName(report, "html"), reportToHtml(report, lang), "text/html"),
    },
    {
      label: "Markdown",
      detail: t("For docs, tickets and GitHub", "Para documentos, tickets y GitHub"),
      action: () => downloadFile(fileName(report, "md"), reportToMarkdown(report, lang), "text/markdown"),
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 text-xs font-medium transition-colors hover:border-[#4c2882]/35"
      >
        <IconDownload className="size-3.5" />
        {t("Download report", "Descargar reporte")}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-1.5 w-60 rounded-xl border border-black/[0.07] bg-white p-1.5 shadow-[0_16px_40px_rgba(15,26,46,0.14)]">
          {options.map((option) => (
            <button
              key={option.label}
              type="button"
              role="menuitem"
              onClick={() => {
                option.action();
                setOpen(false);
              }}
              className="block w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-black/[0.04]"
            >
              <span className="block text-[13px] font-medium">{option.label}</span>
              <span className="block text-[11px] text-[#8a91a3]">{option.detail}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
