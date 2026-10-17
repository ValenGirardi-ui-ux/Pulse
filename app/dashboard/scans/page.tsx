import type { Metadata } from "next";
import { ScansList } from "./scans-list";

export const metadata: Metadata = {
  title: "Scans · Pulse",
};

export default function ScansPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Scans</h1>
        <p className="mt-1 text-[13px] text-[#8a91a3]">
          Every scan checks all your pages. Click one to see what changed.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-[#ececf1] px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" />
          <span className="text-[13px] font-medium">Automatic scans on</span>
        </div>
        <p className="text-[13px] text-[#5b6478]">
          Every 12 hours <span className="text-[#c9cedd]">·</span> Next scan in{" "}
          <span className="font-mono text-xs text-[#0f1a2e]">11h 35m</span>
        </p>
        <button
          type="button"
          className="ml-auto inline-flex h-8 items-center rounded-lg border border-[#e3e6ef] px-3 text-xs font-medium transition-colors hover:border-[#c9cedd]"
        >
          Change schedule
        </button>
      </div>

      <ScansList />
    </main>
  );
}
