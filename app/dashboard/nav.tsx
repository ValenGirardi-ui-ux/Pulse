"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "../i18n";
import { IconAlert, IconBot, IconGrid, IconPulse, IconScan } from "./icons";

const links = [
  { href: "/dashboard", label: "Overview", es: "Resumen", icon: IconGrid },
  { href: "/dashboard/monitors", label: "Monitors", es: "Monitores", icon: IconPulse, demo: true },
  { href: "/dashboard/issues", label: "Issues", es: "Problemas", icon: IconAlert },
  { href: "/dashboard/scans", label: "Scans", es: "Escaneos", icon: IconScan },
  { href: "/dashboard/llm-optimization", label: "LLM Optimization", es: "Optimización para IA", icon: IconBot },
];

export function NavLinks() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav className="flex-1 space-y-1 px-3">
      {links.map(({ href, label, es, icon: Icon, ...link }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-full px-3 py-2 text-[13px] transition-colors ${
              active
                ? "bg-[#4c2882] font-medium text-white shadow-[0_6px_16px_rgba(76,40,130,0.22)]"
                : "text-[#5b6478] hover:bg-black/[0.04] hover:text-[#0f1a2e]"
            }`}
          >
            <Icon className="size-4" />
            <span className="flex-1">{t(label, es)}</span>
            {"demo" in link && (
              <span
                className={`rounded-full px-1.5 text-[10px] font-medium ${
                  active ? "bg-white/20 text-white" : "bg-black/[0.05] text-[#8a91a3]"
                }`}
              >
                Demo
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** "site / page" at the top of the dashboard. `site` is the current site's address; undefined while it loads. */
export function Breadcrumb({ site }: { site?: string | null }) {
  const pathname = usePathname();
  const t = useT();
  const link = links.find((item) => item.href === pathname);
  const current = link
    ? t(link.label, link.es)
    : pathname === "/dashboard/settings"
      ? t("Settings", "Configuración")
      : pathname === "/dashboard/profile"
        ? t("Profile", "Perfil")
        : t("Overview", "Resumen");
  const scope = pathname.startsWith("/dashboard/monitors")
    ? t("All sites", "Todos los sitios")
    : site === null
      ? t("No site yet", "Sin sitio")
      : site;

  return (
    <div className="flex min-w-0 items-center gap-2 text-sm md:shrink-0">
      {scope && (
        <>
          <span className="hidden max-w-[16rem] truncate text-[#8a91a3] md:inline">{scope}</span>
          <span className="hidden text-[#c9cedd] md:inline">/</span>
        </>
      )}
      <span className="truncate font-medium">{current}</span>
    </div>
  );
}
