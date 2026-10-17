"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconAlert, IconGear, IconGrid, IconPulse, IconScan } from "./icons";

const links = [
  { href: "/dashboard", label: "Overview", icon: IconGrid },
  { href: "/dashboard/monitors", label: "Monitors", icon: IconPulse },
  { href: "/dashboard/issues", label: "Issues", icon: IconAlert, badge: "5" },
  { href: "/dashboard/scans", label: "Scans", icon: IconScan },
  { href: "/dashboard/settings", label: "Settings", icon: IconGear },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="mt-4 flex-1 space-y-0.5 px-3">
      {links.map(({ href, label, icon: Icon, badge }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
              active ? "bg-[#4c2882]/[0.07] font-medium text-[#4c2882]" : "text-[#5b6478] hover:bg-[#f4f5f8] hover:text-[#0f1a2e]"
            }`}
          >
            <Icon className="size-4" />
            <span className="flex-1">{label}</span>
            {badge && <span className="rounded-full bg-[#f1f2f6] px-1.5 font-mono text-[10px] text-[#5b6478]">{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function Breadcrumb() {
  const pathname = usePathname();
  const current = links.find((link) => link.href === pathname)?.label ?? "Overview";
  const scope = pathname.startsWith("/dashboard/monitors") ? "All sites" : "tivvo.com";

  return (
    <div className="flex shrink-0 items-center gap-2 text-sm">
      <span className="text-[#8a91a3]">{scope}</span>
      <span className="text-[#c9cedd]">/</span>
      <span className="font-medium">{current}</span>
    </div>
  );
}
