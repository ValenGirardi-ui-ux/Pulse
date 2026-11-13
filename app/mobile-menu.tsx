"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { switchAccount } from "./auth/actions";
import { useT } from "./i18n";

export function MobileMenu({ links, signedIn = false }: { links: { href: string; label: string }[]; signedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    if (!open) return;

    function onPointer(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="md:hidden">
      <button
        type="button"
        aria-label={open ? t("Close menu", "Cerrar menú") : t("Open menu", "Abrir menú")}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(!open)}
        className="-mr-2 flex size-9 items-center justify-center rounded-full text-[#0f1a2e] transition-colors hover:bg-[#4c2882]/[0.06]"
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
          {open ? <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /> : <path d="M2 4.5h12M2 8h12M2 11.5h12" />}
        </svg>
      </button>

      <nav
        id="mobile-menu"
        aria-label={t("Main", "Principal")}
        inert={!open}
        className={`absolute inset-x-4 top-full mt-2 origin-top rounded-3xl border border-[#4c2882]/15 bg-white/95 p-2 shadow-[0_16px_40px_rgba(76,40,130,0.14)] backdrop-blur-md transition-[opacity,transform] duration-200 ease-out ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={close}
            className="block rounded-2xl px-4 py-3 text-[15px] text-[#0f1a2e] transition-colors hover:bg-[#4c2882]/[0.05]"
          >
            {t(link.label)}
          </a>
        ))}
        <div className="mx-4 my-1.5 h-px bg-[#ececf1]" />
        {signedIn ? (
          <form action={switchAccount}>
            <button type="submit" className="w-full cursor-pointer text-left block rounded-2xl px-4 py-3 text-[15px] text-[#4c2882] transition-colors hover:bg-[#4c2882]/[0.05]">
              {t("Switch account", "Cambiar cuenta")}
            </button>
          </form>
        ) : (
          <Link href="/login" onClick={close} className="block rounded-2xl px-4 py-3 text-[15px] text-[#4c2882] transition-colors hover:bg-[#4c2882]/[0.05]">
            {t("Log in", "Iniciar sesión")}
          </Link>
        )}
      </nav>
    </div>
  );
}
