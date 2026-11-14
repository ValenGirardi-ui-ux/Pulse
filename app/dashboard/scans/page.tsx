import type { Metadata } from "next";
import { Suspense } from "react";
import { clockTime, dayLabel, formatDuration, getDashboardData, issueTitle, timeAgo } from "@/lib/scan/data";
import { T } from "../../i18n";
import { ScanDataSkeleton, ScanEmptyState } from "../empty-state";
import { ScansList, type ScanView } from "./scans-list";

export const metadata: Metadata = {
  title: "Scans · Pulse",
};

export default function ScansPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          <T en="Scans" es="Escaneos" />
        </h1>
        <p className="mt-1 text-[13px] text-[#8a91a3]">
          <T
            en="Every scan checks your site and the pages it links to. Click one to see what changed."
            es="Cada escaneo revisa tu sitio y las páginas a las que enlaza. Tocá uno para ver qué cambió."
          />
        </p>
      </div>

      <Suspense fallback={<ScanDataSkeleton />}>
        <ScansContent />
      </Suspense>
    </main>
  );
}

async function ScansContent() {
  const data = await getDashboardData();
  const scans: ScanView[] = data.scans.map((scan, index) => {
    const before = data.scans[index + 1];
    return {
      id: scan.id,
      day: dayLabel(scan.createdAt),
      time: clockTime(scan.createdAt),
      ago: timeAgo(scan.createdAt),
      source: scan.source,
      pages: scan.pages,
      duration: formatDuration(scan.durationMs),
      score: scan.score,
      delta: before ? scan.score - before.score : null,
      first: !before,
      changes: scan.changes.map((change) => ({ kind: change.kind, text: issueTitle(change) })),
    };
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-black/[0.07] bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(15,26,46,0.08)]">
        <div className="flex items-center gap-2.5">
          <span className="size-2 rounded-full bg-[#c9cedd]" />
          <span className="text-[13px] font-medium">
            <T en="Manual scans" es="Escaneos manuales" />
          </span>
        </div>
        <p className="text-[13px] text-[#5b6478]">
          <T
            en={`Press "Scan now" whenever you want to check ${data.site?.url ?? "your site"}. Automatic scans are coming soon.`}
            es={`Tocá "Escanear ahora" cuando quieras revisar ${data.site?.url ?? "tu sitio"}. Los escaneos automáticos llegan pronto.`}
          />
        </p>
      </div>

      {scans.length === 0 ? <ScanEmptyState data={data} /> : <ScansList scans={scans} />}
    </>
  );
}
