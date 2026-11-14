import type { Metadata } from "next";
import { Suspense } from "react";
import { getDashboardData, issueTitle, openIssues, timeAgo } from "@/lib/scan/data";
import { ruleOf } from "@/lib/scan/rules";
import { T } from "../../i18n";
import { ScanDataSkeleton, ScanEmptyState } from "../empty-state";
import { IconCheck } from "../icons";
import { IssuesList } from "./issues-list";

export const metadata: Metadata = {
  title: "Issues · Pulse",
};

export default function IssuesPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          <T en="Issues" es="Problemas" />
        </h1>
        <p className="mt-1 text-[13px] text-[#8a91a3]">
          <T
            en="What Pulse found on your site, sorted by what to fix first. Click one to see how to fix it."
            es="Lo que Pulse encontró en tu sitio, ordenado por qué arreglar primero. Tocá uno para ver cómo arreglarlo."
          />
        </p>
      </div>

      <Suspense fallback={<ScanDataSkeleton />}>
        <IssuesContent />
      </Suspense>
    </main>
  );
}

async function IssuesContent() {
  const data = await getDashboardData();
  const issues = openIssues(data.scans);
  const resolved = data.scans
    .flatMap((scan) =>
      scan.changes
        .filter((change) => change.kind === "fixed")
        .map((change) => ({
          key: `${scan.id}-${change.rule}-${change.page}`,
          title: issueTitle(change),
          category: ruleOf(change).category,
          when: timeAgo(scan.createdAt),
        })),
    )
    .slice(0, 5);

  return (
    <>
      {data.scans.length === 0 ? (
        <ScanEmptyState data={data} />
      ) : issues.length === 0 ? (
        <div className="rounded-2xl border border-black/[0.07] px-6 py-10 text-center text-[13px] text-[#8a91a3]">
          <T en="No open issues. Your site looks healthy!" es="No hay problemas abiertos. ¡Tu sitio se ve sano!" />
        </div>
      ) : (
        <IssuesList issues={issues} />
      )}

      {resolved.length > 0 && (
        <section>
          <h2 className="mb-2.5 text-xs font-medium text-[#5b6478]">
            <T en="Recently fixed" es="Resueltos hace poco" />
          </h2>
          <ul className="space-y-2.5">
            {resolved.map((item) => (
              <li key={item.key} className="flex items-center gap-3 text-[13px] text-[#8a91a3]">
                <IconCheck className="size-3.5 shrink-0 text-emerald-500" />
                <span className="flex-1 truncate">
                  <T en={item.title.en} es={item.title.es} />
                </span>
                <span className="hidden text-xs sm:block">
                  <T en={item.category} />
                </span>
                <span className="w-16 text-right font-mono text-[11px] text-[#9aa1b2]">
                  <T en={item.when.en} es={item.when.es} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
