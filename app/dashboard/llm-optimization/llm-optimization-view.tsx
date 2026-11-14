"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLang, useT } from "../../i18n";
import { severityDot } from "../data";
import { IconBot, IconCheck, IconChevron, IconCopy, IconDownload, IconSpark } from "../icons";
import { inputClass, primaryButtonClass } from "../styles";
import {
  analysisSteps,
  areas,
  normalizeUrl,
  severityOrder,
  type Area,
  type Finding,
  type Report,
} from "./data";
import { AssistantPanel, useAssistant } from "./assistant-panel";
import { downloadFile, printHtml, reportFileName, toHtml, toMarkdown } from "./export";
import { analyzeSiteAction } from "./actions";
import { localizeFinding } from "./findings-es";

const card = "rounded-2xl border border-black/[0.07] bg-white shadow-[0_8px_24px_rgba(15,26,46,0.08)]";

const areaInfo: Record<Area, string> = {
  "Crawl access": "robots.txt, llms.txt and sitemap rules for AI crawlers",
  "HTML structure": "Headings, landmarks and semantic elements",
  Content: "Clear answers, facts, lists and readable copy",
  Metadata: "Titles, descriptions, language and canonical URLs",
  "Structured data": "Schema.org JSON-LD for your business and products",
  JavaScript: "Content that's visible without running scripts",
};

const areaInfoEs: Record<Area, string> = {
  "Crawl access": "Reglas de robots.txt, llms.txt y sitemap para los rastreadores de IA",
  "HTML structure": "Títulos, landmarks y elementos semánticos",
  Content: "Respuestas claras, datos, listas y textos fáciles de leer",
  Metadata: "Títulos, descripciones, idioma y URL canónicas",
  "Structured data": "JSON-LD de Schema.org para tu negocio y tus productos",
  JavaScript: "Contenido que se ve sin ejecutar scripts",
};

const groupLabel = { Critical: "Critical", Warning: "Warnings", Minor: "Minor" } as const;

function scoreTone(score: number) {
  if (score >= 85) return { dot: "bg-emerald-500", text: "text-emerald-600", label: "Good" };
  if (score >= 70) return { dot: "bg-amber-500", text: "text-amber-600", label: "Needs work" };
  return { dot: "bg-red-500", text: "text-red-600", label: "Poor" };
}

export function LlmOptimizationView() {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [report, setReport] = useState<Report | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);
  const assistant = useAssistant(report);
  const t = useT();

  useEffect(() => () => clearInterval(timer.current), []);

  function askAbout(text: string) {
    setChatOpen(true);
    assistant.send(text);
  }

  async function run(url: URL) {
    setError(null);
    assistant.reset();
    setRunning(true);
    setStep(0);
    timer.current = setInterval(() => setStep((current) => Math.min(current + 1, analysisSteps.length - 1)), 650);
    try {
      const result = await analyzeSiteAction(url.href);
      if (result.ok) {
        setReport(result.report);
      } else {
        setError(
          result.error === "blocked"
            ? t(
                "Pulse can only analyze public websites, not local or private addresses.",
                "Pulse solo puede analizar sitios públicos, no direcciones locales o privadas.",
              )
            : t(
                "We couldn't analyze this site. Check the URL and try again.",
                "No pudimos analizar este sitio. Revisá la URL y probá de nuevo.",
              ),
        );
      }
    } catch {
      setError(t("We couldn't analyze this site. Try again.", "No pudimos analizar este sitio. Probá de nuevo."));
    } finally {
      clearInterval(timer.current);
      setRunning(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = normalizeUrl(input);
    if (!url) {
      setError(t("Enter a valid URL, for example https://example.com/example", "Ingresá una URL válida, por ejemplo https://ejemplo.com/ejemplo"));
      return;
    }
    setInput(url.href);
    run(url);
  }

  const showAssistant = running || report !== null;

  return (
    <main
      className={`mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 ${
        showAssistant ? "grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]" : "max-w-5xl"
      }`}
    >
      <div className="min-w-0 space-y-10">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("LLM Optimization", "Optimización para IA")}</h1>
          <p className="mt-1 text-[13px] text-[#8a91a3]">
            {t(
              "Check how well ChatGPT, Claude, Perplexity and other AI assistants can read and cite a website.",
              "Revisá qué tan bien ChatGPT, Claude, Perplexity y otros asistentes de IA pueden leer y citar un sitio web.",
            )}
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate className={`${card} p-4`}>
          <label htmlFor="ai-url" className="text-xs font-medium text-[#5b6478]">
            {t("Website URL", "URL del sitio web")}
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="ai-url"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://example.com"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={running}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "ai-url-error" : undefined}
              className={`${inputClass} h-10 font-mono`}
            />
            <button type="submit" disabled={running || !input.trim()} className={`${primaryButtonClass} h-10 shrink-0 justify-center px-5 text-[13px]`}>
              <IconSpark className="size-3.5" />
              {running ? t("Analyzing…", "Analizando…") : report ? t("Analyze again", "Analizar de nuevo") : t("Analyze", "Analizar")}
            </button>
          </div>
          {error && (
            <p id="ai-url-error" role="alert" className="mt-2 text-xs text-red-600">
              {error}
            </p>
          )}
        </form>

        {running ? <Progress step={step} /> : report ? <ReportView report={report} onAsk={askAbout} /> : <WhatWeCheck />}
      </div>

      {showAssistant && (
        <>
          <aside
            aria-label={t("Pulse Assistant", "Asistente de Pulse")}
            className={`${
              chatOpen ? "fixed inset-x-3 top-20 bottom-3 z-30 flex" : "hidden"
            } lg:sticky lg:inset-auto lg:top-[5.5rem] lg:z-auto lg:flex lg:h-[calc(100vh-7rem)] lg:self-start`}
          >
            <div className="h-full w-full">
              <AssistantPanel
                host={report?.host ?? null}
                analyzing={running}
                messages={assistant.messages}
                thinking={assistant.thinking}
                onSend={assistant.send}
                onClose={() => setChatOpen(false)}
              />
            </div>
          </aside>

          {!chatOpen && (
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className={`${primaryButtonClass} fixed right-5 bottom-5 z-20 h-11 px-5 text-[13px] shadow-[0_12px_32px_rgba(76,40,130,0.35)] lg:hidden`}
            >
              <IconSpark className="size-3.5" />
              {t("Ask Pulse", "Preguntale a Pulse")}
            </button>
          )}
        </>
      )}
    </main>
  );
}

function WhatWeCheck() {
  const t = useT();
  return (
    <section>
      <h2 className="mb-2.5 text-xs font-medium text-[#5b6478]">{t("What we check", "Qué revisamos")}</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => (
          <li key={area} className={`${card} px-4 py-3.5`}>
            <p className="text-[13px] font-medium">{t(area)}</p>
            <p className="mt-0.5 text-xs leading-5 text-[#8a91a3]">{t(areaInfo[area], areaInfoEs[area])}</p>
          </li>
        ))}
        <li className="flex items-center gap-3 rounded-2xl border border-dashed border-[#4c2882]/25 bg-[#4c2882]/[0.03] px-4 py-3.5">
          <IconBot className="size-5 shrink-0 text-[#4c2882]" />
          <p className="text-xs leading-5 text-[#5b6478]">
            {t(
              "You get a prioritized list of fixes with code examples, ready to download and share.",
              "Recibís una lista priorizada de arreglos con ejemplos de código, lista para descargar y compartir.",
            )}
          </p>
        </li>
      </ul>
    </section>
  );
}

function Progress({ step }: { step: number }) {
  const t = useT();
  return (
    <section className={`${card} p-5`} aria-live="polite">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium">{t("Analyzing site", "Analizando el sitio")}</p>
        <span className="font-mono text-[11px] text-[#8a91a3]">
          {step + 1}/{analysisSteps.length}
        </span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#f1f2f6]">
        <div
          className="h-full rounded-full bg-[#4c2882] transition-[width] duration-500 ease-out"
          style={{ width: `${((step + 1) / analysisSteps.length) * 100}%` }}
        />
      </div>
      <ol className="mt-4 space-y-2">
        {analysisSteps.map((label, index) => (
          <li
            key={label}
            className={`flex items-center gap-3 text-[13px] ${
              index < step ? "text-[#5b6478]" : index === step ? "font-medium text-[#0f1a2e]" : "text-[#c9cedd]"
            }`}
          >
            {index < step ? (
              <IconCheck className="size-3.5 shrink-0 text-emerald-500" />
            ) : (
              <span
                className={`mx-[3px] size-2 shrink-0 rounded-full ${index === step ? "animate-pulse bg-[#4c2882]" : "bg-[#e4e6ee]"}`}
              />
            )}
            {t(label)}
          </li>
        ))}
      </ol>
    </section>
  );
}

function ReportView({ report, onAsk }: { report: Report; onAsk: (text: string) => void }) {
  const t = useT();
  const lang = useLang();
  const findings = report.findings.map((finding) => localizeFinding(finding, lang));
  const [filter, setFilter] = useState<"All" | Area>("All");
  const [openId, setOpenId] = useState<string | null>(findings[0]?.id ?? null);

  const visible = findings.filter((finding) => filter === "All" || finding.area === filter);
  const counts = severityOrder.map((severity) => ({
    severity,
    n: findings.filter((finding) => finding.severity === severity).length,
  }));
  const tone = scoreTone(report.score);

  return (
    <div className="space-y-10">
      <section className={`${card} flex flex-col gap-6 p-5 md:flex-row md:items-center`}>
        <div className="flex items-center gap-5">
          <ScoreRing score={report.score} />
          <div className="min-w-0">
            <p className="text-xs text-[#8a91a3]">{t("LLM optimization score", "Puntaje de optimización para IA")}</p>
            <p className={`text-[13px] font-medium ${tone.text}`}>{t(tone.label)}</p>
            <p className="mt-2 truncate font-mono text-[13px]">{report.host}</p>
            <p className="font-mono text-[11px] text-[#9aa1b2]">
              {report.pages} {t("pages", "páginas")} ·{" "}
              {new Date(report.analyzedAt).toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
        </div>

        <dl className="flex gap-6 md:ml-auto md:border-l md:border-[#ececf1] md:pl-6">
          {counts.map(({ severity, n }) => (
            <div key={severity}>
              <dt className="flex items-center gap-1.5 text-[11px] text-[#9aa1b2]">
                <span className={`size-1.5 rounded-full ${severityDot[severity]}`} />
                {t(groupLabel[severity])}
              </dt>
              <dd className="font-mono text-lg font-medium">{n}</dd>
            </div>
          ))}
        </dl>

        <DownloadMenu report={report} />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {report.areaScores.map(({ area, score, findings: count }) => {
          const active = filter === area;
          return (
            <button
              key={area}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(active ? "All" : area)}
              className={`${card} px-4 py-3.5 text-left transition-[border-color,box-shadow] hover:border-[#4c2882]/20 hover:shadow-[0_12px_32px_rgba(15,26,46,0.12)] ${
                active ? "border-[#4c2882]/40 ring-4 ring-[#4c2882]/[0.08]" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-medium">{t(area)}</span>
                <span className="font-mono text-[13px] font-medium">{score}</span>
              </div>
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-[#f1f2f6]">
                <div className={`h-full rounded-full ${scoreTone(score).dot}`} style={{ width: `${score}%` }} />
              </div>
              <p className="mt-2 text-[11px] text-[#8a91a3]">
                {count === 0
                  ? t("No issues", "Sin problemas")
                  : t(
                      `${count} ${count === 1 ? "finding" : "findings"}`,
                      `${count} ${count === 1 ? "hallazgo" : "hallazgos"}`,
                    )}
              </p>
            </button>
          );
        })}
        <div className={`${card} px-4 py-3.5`}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium">{t("Passed checks", "Controles aprobados")}</span>
            <span className="font-mono text-[13px] font-medium">{report.passed.length}</span>
          </div>
          <div className="mt-2.5 h-1 rounded-full bg-emerald-500" />
          <p className="mt-2 text-[11px] text-[#8a91a3]">{t("Already in good shape", "Ya están en buen estado")}</p>
        </div>
      </section>

      <div className="space-y-8">
        <div className="flex flex-wrap gap-1.5">
          {(["All", ...areas] as const).map((name) => {
            const count = name === "All" ? findings.length : findings.filter((f) => f.area === name).length;
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

        {visible.length === 0 && <p className="text-[13px] text-[#8a91a3]">
            {t("No findings in this area. Nice work.", "No hay hallazgos en esta área. ¡Buen trabajo!")}
          </p>}

        {severityOrder.map((severity) => {
          const items = visible.filter((finding) => finding.severity === severity);
          if (items.length === 0) return null;
          return (
            <section key={severity}>
              <h2 className="mb-2.5 flex items-center gap-2 text-xs font-medium text-[#5b6478]">
                <span className={`size-1.5 rounded-full ${severityDot[severity]}`} />
                {t(groupLabel[severity])}
                <span className="font-mono text-[11px] text-[#9aa1b2]">{items.length}</span>
              </h2>
              <ul className={`overflow-hidden ${card}`}>
                {items.map((finding) => (
                  <FindingRow
                    key={finding.id}
                    finding={finding}
                    open={openId === finding.id}
                    onToggle={() => setOpenId(openId === finding.id ? null : finding.id)}
                    onAsk={() => onAsk(t(`How do I fix "${finding.title}" on my site?`, `¿Cómo arreglo "${finding.title}" en mi sitio?`))}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <section>
        <h2 className="mb-2.5 text-xs font-medium text-[#5b6478]">{t("Passed checks", "Controles aprobados")}</h2>
        <ul className="space-y-2.5">
          {report.passed.map((item) => (
            <li key={item.title} className="flex items-center gap-3 text-[13px] text-[#8a91a3]">
              <IconCheck className="size-3.5 shrink-0 text-emerald-500" />
              <span className="flex-1 truncate">{item.titleEs ? t(item.title, item.titleEs) : t(item.title)}</span>
              <span className="hidden text-xs sm:block">{t(item.area)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const stroke = score >= 85 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative size-16 shrink-0">
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#f1f2f6" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-lg font-semibold">{score}</span>
    </div>
  );
}

function DownloadMenu({ report }: { report: Report }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const options = [
    {
      label: t("HTML report", "Informe HTML"),
      detail: t("Opens in any browser", "Se abre en cualquier navegador"),
      action: () => downloadFile(reportFileName(report, "html"), toHtml(report), "text/html"),
    },
    {
      label: "PDF",
      detail: t("Choose “Save as PDF”", "Elegí “Guardar como PDF”"),
      action: () => printHtml(toHtml(report)),
    },
    {
      label: "Markdown",
      detail: t("For docs, tickets and GitHub", "Para documentos, tickets y GitHub"),
      action: () => downloadFile(reportFileName(report, "md"), toMarkdown(report), "text/markdown"),
    },
  ];

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`${primaryButtonClass} h-9 px-4 text-[13px]`}
      >
        <IconDownload className="size-3.5" />
        {t("Download report", "Descargar informe")}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-60 rounded-2xl border border-black/[0.07] bg-white p-1.5 shadow-[0_12px_32px_rgba(15,26,46,0.14)]"
        >
          {options.map((option) => (
            <button
              key={option.label}
              type="button"
              role="menuitem"
              onClick={() => {
                option.action();
                setOpen(false);
              }}
              className="flex w-full flex-col rounded-xl px-3 py-2 text-left transition-colors hover:bg-[#f4f5f8]"
            >
              <span className="text-[13px] font-medium">{option.label}</span>
              <span className="text-[11px] text-[#8a91a3]">{option.detail}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FindingRow({
  finding,
  open,
  onToggle,
  onAsk,
}: {
  finding: Finding;
  open: boolean;
  onToggle: () => void;
  onAsk: () => void;
}) {
  const t = useT();
  return (
    <li className="border-b border-[#f1f2f6] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#fafafb]"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">{finding.title}</span>
          <span className="mt-0.5 block truncate text-xs text-[#8a91a3]">{finding.why}</span>
        </span>
        <span className="hidden w-28 shrink-0 text-xs text-[#5b6478] md:block">{t(finding.area)}</span>
        <span className="hidden w-20 shrink-0 text-right font-mono text-[11px] text-[#8a91a3] sm:block">
          {t(`${finding.effort} effort`, `Esfuerzo ${t(finding.effort).toLowerCase()}`)}
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
            <div className="space-y-4 rounded-lg bg-[#fafafb] p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-[#5b6478]">{t("Why it matters", "Por qué importa")}</p>
                  <p className="mt-1.5 text-[13px] leading-5 text-[#3c4558]">{finding.why}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#5b6478]">{t("What we found", "Qué encontramos")}</p>
                  <p className="mt-1.5 text-[13px] leading-5 text-[#3c4558]">{finding.found}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {finding.pages.map((page) => (
                      <span key={page} className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[11px] text-[#5b6478] ring-1 ring-black/[0.06]">
                        {page}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-[#5b6478]">{t("How to fix", "Cómo arreglarlo")}</p>
                <ol className="mt-2.5 space-y-2">
                  {finding.fix.map((step, index) => (
                    <li key={step} className="flex gap-3 text-[13px] leading-5 text-[#3c4558]">
                      <span className="mt-px font-mono text-[11px] text-[#9aa1b2]">{index + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {finding.code && <CodeBlock {...finding.code} />}

              <button
                type="button"
                onClick={onAsk}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#4c2882] px-3 text-xs font-medium text-white transition-colors hover:bg-[#5a3196]"
              >
                <IconSpark className="size-3" />
                {t("Ask Pulse about this", "Preguntale a Pulse sobre esto")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function CodeBlock({ label, snippet }: { label: string; snippet: string }) {
  const [copied, setCopied] = useState(false);
  const t = useT();

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="overflow-hidden rounded-xl bg-[#0f1a2e]">
      <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-2">
        <span className="text-[11px] text-white/60">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <IconCheck className="size-3" /> : <IconCopy className="size-3" />}
          {copied ? t("Copied", "Copiado") : t("Copy", "Copiar")}
        </button>
      </div>
      <pre className="overflow-x-auto px-3.5 py-3 font-mono text-xs leading-5 text-[#e6e8ef]">
        <code>{snippet}</code>
      </pre>
    </div>
  );
}
