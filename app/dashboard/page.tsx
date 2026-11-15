import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import type { PerformanceData } from "@/lib/scan/audit";
import { getDashboardData, issueTitle, openIssues, timeAgo, type Bilingual } from "@/lib/scan/data";
import { categories as auditCategories, categoryLabels, categoryScore, ruleOf } from "@/lib/scan/rules";
import { T } from "../i18n";
import { AskPulseButton } from "./agent";
import { severityDot } from "./data";
import { ScanDataSkeleton, ScanEmptyState } from "./empty-state";
import { DownloadReport } from "./report-download";
import { IconArrow, IconChevron, IconSpark } from "./icons";

export const metadata: Metadata = {
  title: "Dashboard · Pulse",
};

type Tone = "good" | "warn" | "bad";

const dot = { good: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-red-500" } as const;

function toneFor(score: number): Tone {
  if (score >= 85) return "good";
  if (score >= 70) return "warn";
  return "bad";
}

function countText(count: number, critical: number): Bilingual {
  if (count === 0) return { en: "No issues", es: "Sin problemas" };
  if (critical > 0) {
    return {
      en: `${critical} critical issue${critical === 1 ? "" : "s"}`,
      es: `${critical} problema${critical === 1 ? "" : "s"} crítico${critical === 1 ? "" : "s"}`,
    };
  }
  return { en: `${count} issue${count === 1 ? "" : "s"}`, es: `${count} problema${count === 1 ? "" : "s"}` };
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <Overview />
    </Suspense>
  );
}

function OverviewSkeleton() {
  return (
    <main aria-busy="true" className="mx-auto w-full max-w-5xl space-y-10 px-4 py-6 sm:px-6 sm:py-8">
      <div className="grid grid-cols-2 gap-y-6 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="lg:px-6 lg:first:pl-0">
            <div className="h-3 w-20 animate-pulse rounded bg-[#f1f2f6]" />
            <div className="mt-3 h-6 w-14 animate-pulse rounded bg-[#ececf1]" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-[68px] animate-pulse rounded-2xl bg-[#f6f7fb]" />
        ))}
      </div>
      <ScanDataSkeleton rows={3} />
    </main>
  );
}

async function Overview() {
  const data = await getDashboardData();
  const [latest, previous] = data.scans;

  if (!latest) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <ScanEmptyState data={data} />
      </main>
    );
  }

  const issues = openIssues(data.scans);
  const critical = issues.filter((issue) => issue.severity === "Critical").length;
  const delta = previous ? latest.score - previous.score : null;
  const online = latest.statusCode !== null && latest.statusCode < 400;
  const lastScan = timeAgo(latest.createdAt);

  const categories = auditCategories.map((name) => {
    const inCategory = latest.issues.filter((issue) => ruleOf(issue).category === name);
    const criticalHere = inCategory.filter((issue) => ruleOf(issue).severity === "Critical").length;
    const stored = latest.report?.categories[name];
    const score = stored !== undefined ? stored : categoryScore(latest.issues, name, Math.max(1, latest.pages));
    return { name, score, summary: countText(inCategory.length, criticalHere) };
  });

  const activity = data.scans.slice(0, 3).flatMap((scan, index) => {
    const before = data.scans[index + 1];
    const when = timeAgo(scan.createdAt);
    const scoreText: Bilingual = before
      ? { en: `Score went from ${before.score} to ${scan.score}`, es: `El puntaje pasó de ${before.score} a ${scan.score}` }
      : { en: `First score: ${scan.score}`, es: `Primer puntaje: ${scan.score}` };
    return [
      { key: `${scan.id}-scan`, title: { en: "Scan completed", es: "Escaneo completado" }, detail: scoreText, when },
      ...scan.changes.map((change) => ({
        key: `${scan.id}-${change.kind}-${change.rule}-${change.page}`,
        title: change.kind === "new" ? { en: "New issue", es: "Problema nuevo" } : { en: "Issue resolved", es: "Problema resuelto" },
        detail: issueTitle(change),
        when,
      })),
    ];
  }).slice(0, 5);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-6 sm:px-6 sm:py-8">
      {data.site && (
        <div className="-mb-4 flex justify-end">
          <DownloadReport
            report={{
              site: data.site.url,
              name: data.site.name,
              createdAt: latest.createdAt,
              score: latest.score,
              pagesCrawled: latest.report?.pagesCrawled ?? latest.pages,
              categories: categories.map((category) => ({ key: category.name, score: category.score })),
              performance: latest.report?.performance ?? null,
              issues,
            }}
          />
        </div>
      )}

      <section className="grid grid-cols-2 gap-y-6 lg:grid-cols-4 lg:divide-x lg:divide-[#ececf1]">
        <Stat
          label={<T en="Pulse Score" es="Puntaje Pulse" />}
          value={String(latest.score)}
          note={
            delta === null ? (
              <T en="First scan" es="Primer escaneo" />
            ) : (
              <T
                en={`${delta > 0 ? "+" : ""}${delta} since last scan`}
                es={`${delta > 0 ? "+" : ""}${delta} desde el último escaneo`}
              />
            )
          }
          noteClass={delta === null || delta === 0 ? undefined : delta > 0 ? "text-emerald-600" : "text-red-600"}
        />
        <Stat
          label={<T en="Website Status" es="Estado del sitio" />}
          value={
            <span className="flex items-center gap-2.5">
              <span
                className={`size-2 rounded-full ${
                  online ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" : "bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.15)]"
                }`}
              />
              {online ? <T en="Online" es="En línea" /> : <T en="Offline" es="Caído" />}
            </span>
          }
          note={
            latest.responseMs !== null ? (
              <T
                en={`Responded in ${(latest.responseMs / 1000).toFixed(1)} s`}
                es={`Respondió en ${(latest.responseMs / 1000).toFixed(1)} s`}
              />
            ) : (
              <T en="Didn't respond" es="No respondió" />
            )
          }
          noteClass={online ? undefined : "text-red-600"}
        />
        <Stat
          label={<T en="Issues" es="Problemas" />}
          value={String(issues.length)}
          note={<T en={`${critical} critical`} es={`${critical} ${critical === 1 ? "crítico" : "críticos"}`} />}
          noteClass={critical > 0 ? "text-red-600" : undefined}
        />
        <Stat
          label={<T en="Last Scan" es="Último escaneo" />}
          value={<T en={lastScan.en} es={lastScan.es} />}
          note={<T en={`${latest.pages} pages checked`} es={`${latest.pages} páginas revisadas`} />}
        />
      </section>

      <p className="-mt-4 rounded-xl bg-[#4c2882]/[0.04] px-4 py-3 text-[13px] leading-5 text-[#3c4558]">
        <T
          en="Your Pulse Score goes from 0 to 100. Each issue lowers it: fix the ones below, starting with the most important, and run a new scan to see it go up."
          es="Tu Puntaje Pulse va de 0 a 100. Cada problema lo baja: arreglá los de abajo, empezando por los más importantes, y hacé un nuevo escaneo para verlo subir."
        />
      </p>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.name}
            href="/dashboard/issues"
            className="group rounded-2xl border border-black/[0.07] bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(15,26,46,0.08)] transition-[border-color,box-shadow] hover:border-[#4c2882]/20 hover:shadow-[0_12px_32px_rgba(15,26,46,0.12)]"
          >
            <div className="flex items-center justify-between">
              <span className="truncate text-[13px] font-medium">
                <T en={categoryLabels[category.name].en} es={categoryLabels[category.name].es} />
              </span>
              <span className="font-mono text-lg font-medium tracking-tight">{category.score ?? "—"}</span>
            </div>
            <p className="mt-1 flex items-center gap-2 text-xs text-[#8a91a3]">
              <span className={`size-1.5 rounded-full ${category.score === null ? "bg-[#c9cedd]" : dot[toneFor(category.score)]}`} />
              {category.score === null ? <T en="Not evaluated" es="No evaluado" /> : <T en={category.summary.en} es={category.summary.es} />}
            </p>
          </Link>
        ))}
      </section>

      {latest.report && (
        <p className="-mt-6 text-xs text-[#8a91a3]">
          <T
            en={`Based on ${latest.report.pagesCrawled} pages crawled${latest.report.truncated ? " (crawl limit reached)" : ""}. The overall score is a weighted average of the areas.`}
            es={`Basado en ${latest.report.pagesCrawled} páginas recorridas${latest.report.truncated ? " (se llegó al límite del recorrido)" : ""}. El puntaje general es un promedio ponderado de las áreas.`}
          />
        </p>
      )}

      <section className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <SectionTitle
            title={<T en="Current Issues" es="Problemas actuales" />}
            action={issues.length > 0 ? <T en={`View all ${issues.length}`} es={`Ver los ${issues.length}`} /> : undefined}
            href="/dashboard/issues"
          />
          <ul className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_8px_24px_rgba(15,26,46,0.08)]">
            {issues.length === 0 && (
              <li className="px-4 py-6 text-center text-[13px] text-[#8a91a3]">
                <T en="No issues found. Nice work!" es="No encontramos problemas. ¡Bien ahí!" />
              </li>
            )}
            {issues.slice(0, 3).map((issue) => (
              <li key={issue.key} className="border-b border-[#f1f2f6] last:border-b-0">
                <Link
                  href="/dashboard/issues"
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#fafafb]"
                >
                  <span className={`size-2 shrink-0 rounded-full ${severityDot[issue.severity]}`} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                    <T en={issue.en.title} es={issue.es.title} />
                  </span>
                  <span className="hidden shrink-0 font-mono text-[11px] text-[#8a91a3] sm:block">{issue.page}</span>
                  <IconChevron className="size-3.5 shrink-0 text-[#c9cedd] transition-transform group-hover:translate-x-0.5 group-hover:text-[#5b6478]" />
                </Link>
              </li>
            ))}
            {issues.length > 0 && (
              <li>
                <AskPulseButton
                  question="What should I fix first?"
                  className="group flex w-full items-center gap-2.5 bg-[#4c2882]/[0.03] px-4 py-3 text-left text-[13px] text-[#4c2882] transition-colors hover:bg-[#4c2882]/[0.06]"
                >
                  <IconSpark className="size-3.5" />
                  <span className="flex-1">
                    <T
                      en="Not sure where to start? Ask Pulse what to fix first"
                      es="¿No sabés por dónde empezar? Preguntale a Pulse qué arreglar primero"
                    />
                  </span>
                  <IconArrow className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </AskPulseButton>
              </li>
            )}
          </ul>
        </div>

        <div>
          <SectionTitle title={<T en="Recent Activity" es="Actividad reciente" />} />
          <ol className="space-y-4 pt-1">
            {activity.map((item) => (
              <li key={item.key} className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#c9cedd]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[13px] font-medium">
                      <T en={item.title.en} es={item.title.es} />
                    </p>
                    <span className="shrink-0 font-mono text-[11px] text-[#9aa1b2]">
                      <T en={item.when.en} es={item.when.es} />
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[#8a91a3]">
                    <T en={item.detail.en} es={item.detail.es} />
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {latest.report?.performance && <CoreWebVitals data={latest.report.performance} />}

    </main>
  );
}

function metric(value: number | null, format: (v: number) => string, good: number, poor: number) {
  if (value === null) return { text: "—", tone: "bg-[#c9cedd]" };
  return { text: format(value), tone: value <= good ? "bg-emerald-500" : value <= poor ? "bg-amber-500" : "bg-red-500" };
}

function CoreWebVitals({ data }: { data: PerformanceData }) {
  const ms = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${Math.round(v)} ms`);
  const rows = [
    { label: "LCP", hint: { en: "Largest Contentful Paint", es: "Carga del contenido principal" }, ...metric(data.fieldLcpMs ?? data.lcpMs, ms, 2500, 4000) },
    { label: "INP", hint: { en: "Interaction to Next Paint (real users)", es: "Respuesta a interacciones (usuarios reales)" }, ...metric(data.fieldInpMs, ms, 200, 500) },
    { label: "CLS", hint: { en: "Cumulative Layout Shift", es: "Movimiento del diseño" }, ...metric(data.fieldCls ?? data.cls, (v) => v.toFixed(2), 0.1, 0.25) },
    { label: "FCP", hint: { en: "First Contentful Paint", es: "Primer contenido visible" }, ...metric(data.fcpMs, ms, 1800, 3000) },
    { label: "TBT", hint: { en: "Total Blocking Time", es: "Tiempo de bloqueo total" }, ...metric(data.tbtMs, ms, 200, 600) },
    { label: "SI", hint: { en: "Speed Index", es: "Índice de velocidad" }, ...metric(data.speedIndexMs, ms, 3400, 5800) },
    { label: "TTFB", hint: { en: "Server response time", es: "Tiempo de respuesta del servidor" }, ...metric(data.ttfbMs, ms, 800, 1800) },
  ];
  return (
    <section>
      <SectionTitle title={<T en="Core Web Vitals (mobile)" es="Core Web Vitals (mobile)" />} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-black/[0.07] px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-[#5b6478]">
              <span className={`size-1.5 rounded-full ${row.tone}`} />
              {row.label}
            </p>
            <p className="mt-1 font-mono text-[15px] font-medium">{row.text}</p>
            <p className="mt-0.5 text-[10px] leading-4 text-[#9aa1b2]">
              <T en={row.hint.en} es={row.hint.es} />
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-[#8a91a3]">
        <T
          en={`Measured with Google PageSpeed Insights${data.score !== null ? ` (performance ${data.score}/100)` : ""}. INP and field values come from real Chrome users when Google has enough data.`}
          es={`Medido con Google PageSpeed Insights${data.score !== null ? ` (rendimiento ${data.score}/100)` : ""}. INP y los valores de campo vienen de usuarios reales de Chrome cuando Google tiene datos suficientes.`}
        />
      </p>
    </section>
  );
}

function Stat({
  label,
  value,
  note,
  noteClass = "text-[#8a91a3]",
}: {
  label: ReactNode;
  value: ReactNode;
  note: ReactNode;
  noteClass?: string;
}) {
  return (
    <div className="lg:px-6 lg:first:pl-0">
      <p className="text-xs text-[#8a91a3]">{label}</p>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <p className={`mt-1 text-xs ${noteClass}`}>{note}</p>
    </div>
  );
}

function SectionTitle({ title, action, href }: { title: ReactNode; action?: ReactNode; href?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-medium">{title}</h2>
      {action && href && (
        <Link href={href} className="text-xs text-[#8a91a3] transition-colors hover:text-[#4c2882]">
          {action}
        </Link>
      )}
    </div>
  );
}
