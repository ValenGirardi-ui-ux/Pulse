"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useT } from "../i18n";
import { IconCheck, IconUpDown } from "./icons";
import { selectSite } from "./site-actions";

export type SwitcherSite = { id: string; name: string; url: string };

/** Shows the site the dashboard is about and lets you switch to another one. */
export function SiteSwitcher({ sites, currentId }: { sites: SwitcherSite[]; currentId: string | null }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();
  const current = sites.find((site) => site.id === currentId) ?? null;

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

  function choose(id: string) {
    setOpen(false);
    if (id === currentId) return;
    startTransition(() => selectSite(id));
  }

  if (!current) {
    return (
      <div className="px-3 pb-3">
        <Link
          href="/dashboard"
          className="flex items-center justify-center rounded-2xl border border-dashed border-[#4c2882]/30 px-3 py-2.5 text-[13px] font-medium text-[#4c2882] transition-colors hover:bg-[#4c2882]/[0.04]"
        >
          {t("+ Add your site", "+ Agregar tu sitio")}
        </Link>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative px-3 pb-3">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("Switch site", "Cambiar de sitio")}
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-2.5 rounded-2xl border border-black/[0.07] px-3 py-2 text-left transition-colors hover:bg-black/[0.03] ${
          pending ? "opacity-60" : ""
        }`}
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#4c2882]/[0.08] text-[11px] font-semibold text-[#4c2882]">
          {current.name.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">{current.name}</span>
          <span className="block truncate font-mono text-[10px] text-[#8a91a3]">{current.url}</span>
        </span>
        <IconUpDown className="size-3.5 shrink-0 text-[#9aa1b2]" />
      </button>

      {open && (
        <div className="absolute inset-x-3 top-full z-40 mt-1 rounded-2xl border border-black/[0.07] bg-white p-1.5 shadow-[0_16px_40px_rgba(15,26,46,0.14)]">
          <p className="px-2.5 pt-1.5 pb-1 text-[11px] text-[#9aa1b2]">{t("Your sites", "Tus sitios")}</p>
          <ul role="listbox" aria-label={t("Your sites", "Tus sitios")}>
            {sites.map((site) => {
              const selected = site.id === currentId;
              return (
                <li key={site.id} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => choose(site.id)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-black/[0.04]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px]">{site.name}</span>
                      <span className="block truncate font-mono text-[10px] text-[#8a91a3]">{site.url}</span>
                    </span>
                    {selected && <IconCheck className="size-3.5 shrink-0 text-[#4c2882]" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="my-1.5 h-px bg-[#ececf1]" />
          <Link
            href="/dashboard/settings#add-site"
            onClick={() => setOpen(false)}
            className="flex items-center rounded-xl px-2.5 py-2 text-[13px] text-[#4c2882] transition-colors hover:bg-[#4c2882]/[0.05]"
          >
            {t("+ Add another site", "+ Agregar otro sitio")}
          </Link>
        </div>
      )}
    </div>
  );
}
