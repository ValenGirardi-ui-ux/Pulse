import Link from "next/link";
import { IconScan, IconSpark, IconUpDown } from "./icons";
import { Breadcrumb, NavLinks } from "./nav";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex min-h-screen bg-white text-[#0f1a2e]">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-[#ececf1] bg-white md:flex">
        <div className="flex h-14 items-center px-5">
          <Link href="/" className="text-lg font-semibold tracking-tight text-[#4c2882]">
            Pulse
          </Link>
        </div>

        <div className="px-3">
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg border border-[#ececf1] px-3 py-2 text-left transition-colors hover:bg-[#fafafb]"
          >
            <span className="size-2 rounded-full bg-amber-500" />
            <span className="flex-1 truncate font-mono text-[12px]">tivvo.com</span>
            <IconUpDown className="size-3.5 text-[#8a91a3]" />
          </button>
        </div>

        <NavLinks />

        <div className="border-t border-[#f1f2f6] p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#0f1a2e] text-[11px] font-medium text-white">
              P
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">My account</p>
              <p className="truncate font-mono text-[11px] text-[#8a91a3]">120 AI credits</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-[#ececf1] bg-white/85 px-6 backdrop-blur">
          <Breadcrumb />

          <button
            type="button"
            className="group mx-auto flex h-9 w-full max-w-md items-center gap-2.5 rounded-lg border border-[#e3e6ef] bg-white px-3 text-left text-[13px] text-[#8a91a3] shadow-[0_1px_2px_rgba(15,26,46,0.04)] transition-colors hover:border-[#4c2882]/40"
          >
            <IconSpark className="size-3.5 text-[#4c2882]" />
            <span className="flex-1 truncate">
              <span className="font-medium text-[#0f1a2e]">Ask Pulse</span> about your site…
            </span>
            <kbd className="rounded border border-[#ececf1] px-1.5 py-0.5 font-mono text-[10px]">⌘ K</kbd>
          </button>

          <button
            type="button"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#4c2882] px-3.5 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(76,40,130,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] transition-colors hover:bg-[#5a3196]"
          >
            <IconScan className="size-3.5" />
            Scan now
          </button>
        </header>

        {children}
      </div>
    </div>
  );
}
