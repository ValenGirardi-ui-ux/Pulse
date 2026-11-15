import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentSite, getSites } from "@/lib/sites";
import { AccountMenu } from "./account-menu";
import { AgentPanel, AgentProvider, AgentToggle } from "./agent";
import { MobileNav } from "./mobile-nav";
import { Breadcrumb, NavLinks } from "./nav";
import { ScanButton } from "./scan-dialog";
import { SiteSwitcher } from "./site-switcher";

// "Scan now" is a Server Action used from every dashboard page; the full audit needs up to ~2 minutes.
export const maxDuration = 180;

async function CurrentAccountMenu() {
  const user = await getCurrentUser();
  return <AccountMenu user={{ name: user.name, email: user.email, photoUrl: user.photoUrl }} />;
}

async function CurrentSiteSwitcher() {
  const [sites, current] = await Promise.all([getSites(), getCurrentSite()]);
  return (
    <SiteSwitcher
      key={current?.id ?? "none"}
      sites={sites.map(({ id, name, url }) => ({ id, name, url }))}
      currentId={current?.id ?? null}
    />
  );
}

async function CurrentBreadcrumb() {
  const site = await getCurrentSite();
  return <Breadcrumb site={site?.url ?? null} />;
}

async function CurrentScanButton() {
  const site = await getCurrentSite();
  return <ScanButton key={site?.id ?? "none"} site={site?.url ?? null} />;
}

function SidebarContent() {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href="/" className="text-lg font-semibold tracking-tight text-[#4c2882]">
          Pulse
        </Link>
      </div>

      <Suspense fallback={<div className="mx-3 mb-3 h-[46px] animate-pulse rounded-2xl bg-[#f4f5f8]" />}>
        <CurrentSiteSwitcher />
      </Suspense>

      <NavLinks />

      <Suspense fallback={<AccountMenu user={null} />}>
        <CurrentAccountMenu />
      </Suspense>
    </>
  );
}

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <AgentProvider>
      <div className="relative min-h-screen bg-white text-[#0f1a2e]">
        <div className="relative flex min-h-screen">
          <aside className="sticky top-3 my-3 ml-3 hidden h-[calc(100vh-1.5rem)] w-60 shrink-0 flex-col overflow-hidden rounded-[1.75rem] border border-black/[0.07] bg-white shadow-[0_8px_28px_rgba(15,26,46,0.08)] md:flex">
            <SidebarContent />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-3 z-30 mx-3 mt-3 flex h-14 items-center gap-2 rounded-full border border-black/[0.07] bg-white pr-2 pl-5 shadow-[0_8px_24px_rgba(15,26,46,0.08)] md:gap-4 md:pr-5">
              <MobileNav>
                <SidebarContent />
              </MobileNav>
              <Suspense fallback={<Breadcrumb />}>
                <CurrentBreadcrumb />
              </Suspense>

              <AgentToggle />

              <Suspense fallback={<ScanButton />}>
                <CurrentScanButton />
              </Suspense>
            </header>

            {children}
          </div>

          <AgentPanel />
        </div>
      </div>
    </AgentProvider>
  );
}
