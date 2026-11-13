"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logout } from "../auth/actions";
import { useT } from "../i18n";
import { IconGear, IconLogout, IconUser } from "./icons";

const item =
  "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] text-[#3c4558] transition-colors hover:bg-black/[0.04] hover:text-[#0f1a2e]";

export type AccountUser = { name: string; email: string };

export function AccountMenu({ user }: { user: AccountUser | null }) {
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
  const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase();
  const name = user?.name ?? t("My account", "Mi cuenta");
  const email = user?.email ?? "…";

  return (
    <div ref={ref} className="relative p-3">
      {open && (
        <div
          role="menu"
          aria-label={t("Account", "Cuenta")}
          className="absolute inset-x-3 bottom-full mb-1 rounded-2xl border border-black/[0.07] bg-white p-1.5 shadow-[0_16px_40px_rgba(15,26,46,0.14)]"
        >
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#0f1a2e] text-[11px] font-medium text-white">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{name}</p>
              <p className="truncate font-mono text-[11px] text-[#8a91a3]">{email}</p>
            </div>
          </div>

          <div className="my-1.5 h-px bg-[#ececf1]" />

          <Link href="/dashboard/profile" role="menuitem" onClick={close} className={item}>
            <IconUser className="size-4" />
            {t("Profile", "Perfil")}
          </Link>
          <Link href="/dashboard/settings" role="menuitem" onClick={close} className={item}>
            <IconGear className="size-4" />
            {t("Settings", "Configuración")}
          </Link>

          <div className="my-1.5 h-px bg-[#ececf1]" />

          <form action={logout}>
            <button type="submit" role="menuitem" className={item}>
              <IconLogout className="size-4" />
              {t("Log out", "Cerrar sesión")}
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left transition-colors ${
          open ? "bg-black/[0.06]" : "bg-black/[0.03] hover:bg-black/[0.05]"
        }`}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-[#0f1a2e] text-[11px] font-medium text-white">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium">{name}</p>
          <p className="truncate font-mono text-[11px] text-[#8a91a3]">{email}</p>
        </div>
      </button>
    </div>
  );
}
