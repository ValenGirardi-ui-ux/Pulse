"use client";

import { useEffect, useState, type ReactNode } from "react";

export function SiteHeader({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-4 z-20 px-4">
      <div
        className={`mx-auto flex w-full max-w-4xl items-center justify-between gap-6 rounded-full border border-[#4c2882]/25 px-5 py-2 text-sm text-black transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-out ${
          scrolled
            ? "bg-white/80 shadow-[0_8px_24px_rgba(76,40,130,0.12)] backdrop-blur-md"
            : "bg-transparent shadow-[0_2px_8px_rgba(76,40,130,0.12)]"
        }`}
      >
        {children}
      </div>
    </header>
  );
}
