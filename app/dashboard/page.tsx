import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
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
  { name: "Development", score: 88, summary: "1 issue" },
  { name: "SEO", score: 84, summary: "1 issue" },
  { name: "Marketing", score: 62, summary: "1 critical issue" },
  { name: "Performance", score: 79, summary: "2 issues" },
];

const activity = [
  { title: "Scan completed", detail: "Score went from 78 to 81", when: "12 min ago" },
  { title: "New issue", detail: "Meta Pixel not detected", when: "2h ago" },
  { title: "Issue resolved", detail: "Broken link on /contact", when: "3h ago" },
];

export default function OverviewPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-6 py-8">
      <section className="grid grid-cols-2 gap-y-6 lg:grid-cols-4 lg:divide-x lg:divide-[#ececf1]">
        <Stat label="Pulse Score" value="81" note="+3 since yesterday" noteClass="text-emerald-600" />
        <Stat
          label="Website Status"
          value={
            <span className="flex items-center gap-2.5">
              <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" />
              Online
            </span>
          }
          note="99.98% uptime"
        />
        <Stat label="Issues" value={String(issues.length)} note="1 critical" noteClass="text-red-600" />
        <Stat label="Last Scan" value="12 min ago" note="48 pages checked" />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.name}
            href="/dashboard/issues"
            className="group rounded-xl border border-[#ececf1] bg-white px-4 py-3.5 transition-colors hover:border-[#d9dce6]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium">{category.name}</span>
              <span className="font-mono text-lg font-medium tracking-tight">{category.score}</span>
            </div>
            <p className="mt-1 flex items-center gap-2 text-xs text-[#8a91a3]">
              <span className={`size-1.5 rounded-full ${dot[toneFor(category.score)]}`} />
              {category.summary}
            </p>
          </Link>
        ))}
      </section>

      <section className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <SectionTitle title="Current Issues" action={`View all ${issues.length}`} href="/dashboard/issues" />
          <ul className="overflow-hidden rounded-xl border border-[#ececf1] bg-white">
            {issues.slice(0, 3).map((issue) => (
              <li key={issue.id} className="border-b border-[#f1f2f6] last:border-b-0">
                <Link
                  href="/dashboard/issues"
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#fafafb]"
                >
                  <span className={`size-2 shrink-0 rounded-full ${severityDot[issue.severity]}`} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{issue.title}</span>
                  <span className="hidden shrink-0 font-mono text-[11px] text-[#8a91a3] sm:block">{issue.page}</span>
                  <IconChevron className="size-3.5 shrink-0 text-[#c9cedd] transition-transform group-hover:translate-x-0.5 group-hover:text-[#5b6478]" />
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="group flex w-full items-center gap-2.5 bg-[#4c2882]/[0.03] px-4 py-3 text-left text-[13px] text-[#4c2882] transition-colors hover:bg-[#4c2882]/[0.06]"
              >
                <IconSpark className="size-3.5" />
                <span className="flex-1">Not sure where to start? Ask Pulse what to fix first</span>
                <IconArrow className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </li>
          </ul>
        </div>

        <div>
          <SectionTitle title="Recent Activity" />
          <ol className="space-y-4 pt-1">
            {activity.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#c9cedd]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[13px] font-medium">{item.title}</p>
                    <span className="shrink-0 font-mono text-[11px] text-[#9aa1b2]">{item.when}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[#8a91a3]">{item.detail}</p>
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
  label: string;
  value: ReactNode;
  note: string;
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

function SectionTitle({ title, action, href }: { title: string; action?: string; href?: string }) {
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
