import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { getDashboardData, issueTitle, openIssues, timeAgo, type Bilingual } from "@/lib/scan/data";
import { ruleOf, scoreOf, type Category } from "@/lib/scan/rules";
import { T } from "../i18n";
import { AskPulseButton } from "./agent";
import { severityDot } from "./data";
import { ScanDataSkeleton, ScanEmptyState } from "./empty-state";
import { IconArrow, IconChevron, IconSpark } from "./icons";

export const metadata: Metadata = {
  title: "Dashboard · Pulse",
};

type Tone = "good" | "warn" | "bad";

const dot = { good: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-red-500" } as const;
const categoryNames: Category[] = ["Development", "SEO", "Marketing", "Performance"];

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

  const categories = categoryNames.map((name) => {
    const inCategory = latest.issues.filter((issue) => ruleOf(issue).category === name);
    const criticalHere = inCategory.filter((issue) => ruleOf(issue).severity === "Critical").length;
    return { name, score: scoreOf(latest.issues, name), summary: countText(inCategory.length, criticalHere) };
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
              <span className="text-[13px] font-medium">
                <T en={category.name} />
              </span>
              <span className="font-mono text-lg font-medium tracking-tight">{category.score}</span>
            </div>
            <p className="mt-1 flex items-center gap-2 text-xs text-[#8a91a3]">
              <span className={`size-1.5 rounded-full ${dot[toneFor(category.score)]}`} />
              <T en={category.summary.en} es={category.summary.es} />
            </p>
          </Link>
        ))}
      </section>

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
    </main>
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
