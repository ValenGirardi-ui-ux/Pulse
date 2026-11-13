import type { Metadata } from "next";
import { T } from "../../i18n";
import { ScansList } from "./scans-list";

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
            en="Every scan checks all your pages. Click one to see what changed."
            es="Cada escaneo revisa todas tus páginas. Tocá uno para ver qué cambió."
          />
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-black/[0.07] bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(15,26,46,0.08)]">
        <div className="flex items-center gap-2.5">
          <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" />
          <span className="text-[13px] font-medium">
            <T en="Automatic scans on" es="Escaneos automáticos activados" />
          </span>
        </div>
        <p className="text-[13px] text-[#5b6478]">
          <T en="Every 12 hours" es="Cada 12 horas" /> <span className="text-[#c9cedd]">·</span>{" "}
          <T en="Next scan in" es="Próximo escaneo en" />{" "}
          <span className="font-mono text-xs text-[#0f1a2e]">11h 35m</span>
        </p>
        <button
          type="button"
          className="ml-auto inline-flex h-8 items-center rounded-full border border-black/[0.08] bg-white px-3 text-xs font-medium transition-colors hover:border-[#c9cedd]"
        >
          <T en="Change schedule" es="Cambiar frecuencia" />
        </button>
      </div>

      <ScansList />
    </main>
  );
}
