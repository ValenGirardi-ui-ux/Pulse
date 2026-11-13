import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { T } from "../i18n";
import { AskPulseButton } from "./agent";
import { issues, severityDot } from "./data";
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

const categories = [
  { name: "Development", score: 88, summary: "1 issue", summaryEs: "1 problema" },
  { name: "SEO", score: 84, summary: "1 issue", summaryEs: "1 problema" },
  { name: "Marketing", score: 62, summary: "1 critical issue", summaryEs: "1 problema crítico" },
  { name: "Performance", score: 79, summary: "2 issues", summaryEs: "2 problemas" },
];

const activity = [
  { title: "Scan completed", titleEs: "Escaneo completado", detail: "Score went from 78 to 81", detailEs: "El puntaje pasó de 78 a 81", when: "12 min ago" },
  { title: "New issue", titleEs: "Problema nuevo", detail: "Meta Pixel not detected", detailEs: "Meta Pixel no detectado", when: "2h ago" },
  { title: "Issue resolved", titleEs: "Problema resuelto", detail: "Broken link on /contact", detailEs: "Link roto en /contact", when: "3h ago" },
];

export default function OverviewPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-6 sm:px-6 sm:py-8">
      <section className="grid grid-cols-2 gap-y-6 lg:grid-cols-4 lg:divide-x lg:divide-[#ececf1]">
        <Stat
          label={<T en="Pulse Score" es="Puntaje Pulse" />}
          value="81"
          note={<T en="+3 since yesterday" es="+3 desde ayer" />}
          noteClass="text-emerald-600"
        />
        <Stat
          label={<T en="Website Status" es="Estado del sitio" />}
          value={
            <span className="flex items-center gap-2.5">
              <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" />
              <T en="Online" />
            </span>
          }
          note={<T en="99.98% uptime" es="99,98% de disponibilidad" />}
        />
        <Stat
          label={<T en="Issues" es="Problemas" />}
          value={String(issues.length)}
          note={<T en="1 critical" es="1 crítico" />}
          noteClass="text-red-600"
        />
        <Stat
          label={<T en="Last Scan" es="Último escaneo" />}
          value={<T en="12 min ago" />}
          note={<T en="48 pages checked" es="48 páginas revisadas" />}
        />
      </section>

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
              <T en={category.summary} es={category.summaryEs} />
            </p>
          </Link>
        ))}
      </section>

      <section className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <SectionTitle
            title={<T en="Current Issues" es="Problemas actuales" />}
            action={<T en={`View all ${issues.length}`} es={`Ver los ${issues.length}`} />}
            href="/dashboard/issues"
          />
          <ul className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_8px_24px_rgba(15,26,46,0.08)]">
            {issues.slice(0, 3).map((issue) => (
              <li key={issue.id} className="border-b border-[#f1f2f6] last:border-b-0">
                <Link
                  href="/dashboard/issues"
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#fafafb]"
                >
                  <span className={`size-2 shrink-0 rounded-full ${severityDot[issue.severity]}`} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                    <T en={issue.title} />
                  </span>
                  <span className="hidden shrink-0 font-mono text-[11px] text-[#8a91a3] sm:block">
                    <T en={issue.page} />
                  </span>
                  <IconChevron className="size-3.5 shrink-0 text-[#c9cedd] transition-transform group-hover:translate-x-0.5 group-hover:text-[#5b6478]" />
                </Link>
              </li>
            ))}
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
          </ul>
        </div>

        <div>
          <SectionTitle title={<T en="Recent Activity" es="Actividad reciente" />} />
          <ol className="space-y-4 pt-1">
            {activity.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#c9cedd]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[13px] font-medium">
                      <T en={item.title} es={item.titleEs} />
                    </p>
                    <span className="shrink-0 font-mono text-[11px] text-[#9aa1b2]">
                      <T en={item.when} />
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[#8a91a3]">
                    <T en={item.detail} es={item.detailEs} />
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
