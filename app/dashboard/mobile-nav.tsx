"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useT } from "../i18n";

export function MobileNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useT();

  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={t("Open menu", "Abrir menú")}
        aria-expanded={open}
        aria-controls="dashboard-mobile-nav"
        onClick={() => setOpen(true)}
        className="-ml-2 flex size-9 items-center justify-center rounded-full text-[#0f1a2e] transition-colors hover:bg-black/[0.04]"
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="size-4"
          aria-hidden="true"
        >
          <path d="M2 4.5h12M2 8h12M2 11.5h8" />
        </svg>
      </button>

      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-[#0f1a2e]/25 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="dashboard-mobile-nav"
        aria-label="Dashboard"
        inert={!open}
        className={`fixed inset-y-3 left-3 z-50 flex w-[min(18rem,calc(100vw-4rem))] flex-col overflow-hidden rounded-[1.75rem] border border-black/[0.07] bg-white shadow-[0_24px_60px_rgba(15,26,46,0.22)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]"
        }`}
      >
        <button
          type="button"
          aria-label={t("Close menu", "Cerrar menú")}
          onClick={() => setOpen(false)}
          className="absolute top-3.5 right-3.5 z-10 flex size-9 items-center justify-center rounded-full text-[#5b6478] transition-colors hover:bg-black/[0.04]"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="size-4"
            aria-hidden="true"
          >
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
          </svg>
        </button>
        {children}
      </aside>
    </div>
  );
}
