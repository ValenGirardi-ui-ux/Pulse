import Link from "next/link";
import type { DashboardData } from "@/lib/scan/data";
import { T } from "../i18n";
import { IconScan } from "./icons";

/** What the dashboard shows before there's anything to show: no site, no scans yet, or scans not set up. */
export function ScanEmptyState({ data }: { data: DashboardData }) {
  const content = !data.site
    ? {
        title: <T en="Add your site first" es="Primero agregá tu sitio" />,
        text: (
          <T
            en="Pulse needs to know which website to check. Add it in Settings and run your first scan."
            es="Pulse necesita saber qué sitio revisar. Agregalo en Configuración y hacé tu primer escaneo."
          />
        ),
        action: (
          <Link
            href="/dashboard/settings"
            className="mt-5 inline-flex h-9 items-center rounded-full bg-[#4c2882] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#5a3196]"
          >
            <T en="Add your site" es="Agregar tu sitio" />
          </Link>
        ),
      }
    : data.setupNeeded
      ? {
          title: <T en="Scans aren't set up yet" es="Los escaneos todavía no están configurados" />,
          text: (
            <T
              en="Run supabase/migrations/0004_scans.sql in the Supabase SQL Editor, then reload this page."
              es="Corré supabase/migrations/0004_scans.sql en el SQL Editor de Supabase y recargá esta página."
            />
          ),
          action: null,
        }
      : {
          title: <T en="Run your first scan" es="Hacé tu primer escaneo" />,
          text: (
            <T
              en={`Press "Scan now" at the top and Pulse will check ${data.site.url} in a few seconds.`}
              es={`Tocá "Escanear ahora" arriba y Pulse va a revisar ${data.site.url} en unos segundos.`}
            />
          ),
          action: null,
        };

  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#d9dce6] px-6 py-14 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-[#4c2882]/[0.07] text-[#4c2882]">
        <IconScan className="size-4" />
      </span>
      <h2 className="mt-4 text-sm font-semibold">{content.title}</h2>
      <p className="mt-1.5 max-w-sm text-[13px] leading-5 text-[#8a91a3]">{content.text}</p>
      {content.action}
    </div>
  );
}

/** Placeholder shown while a dashboard page loads its scans. */
export function ScanDataSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 border-b border-[#f1f2f6] px-4 py-4 last:border-b-0">
          <span className="size-2 rounded-full bg-[#ececf1]" />
          <span className="h-3 flex-1 animate-pulse rounded bg-[#f1f2f6]" />
          <span className="h-3 w-12 animate-pulse rounded bg-[#f4f5f8]" />
        </div>
      ))}
    </div>
  );
}
