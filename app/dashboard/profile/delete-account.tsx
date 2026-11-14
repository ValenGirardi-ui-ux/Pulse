"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useLang, useT } from "../../i18n";
import { inputClass, secondaryButtonClass } from "../styles";
import { deleteAccount, type DeleteAccountState } from "./account-actions";

export function DeleteAccount({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [state, action, pending] = useActionState<DeleteAccountState, FormData>(deleteAccount, undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();
  const lang = useLang();

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      setShown(true);
      inputRef.current?.focus();
    });
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      setShown(false);
    };
  }, [open, pending]);

  const error =
    state?.error === "mismatch"
      ? t("That isn't your email. Type it exactly to confirm.", "Ese no es tu email. Escribilo igual para confirmar.")
      : state?.error === "setup"
        ? t(
            "Deleting accounts isn't set up yet. Run the delete account SQL in Supabase.",
            "Borrar cuentas todavía no está configurado. Corré el SQL de borrar cuenta en Supabase.",
          )
        : state?.error
          ? t("We couldn't delete your account. Try again.", "No pudimos borrar tu cuenta. Probá de nuevo.")
          : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 shrink-0 items-center rounded-full border border-red-200 bg-white px-3 text-xs font-medium text-red-600 transition-colors hover:border-red-600 hover:bg-red-600 hover:text-white"
      >
        {t("Delete account", "Borrar cuenta")}
      </button>

      {open && (
        <div
          className={`fixed inset-0 z-50 flex items-start justify-center bg-[#0f1a2e]/20 px-4 py-[18vh] backdrop-blur-[2px] transition-opacity duration-200 ${
            shown ? "opacity-100" : "opacity-0"
          }`}
          onMouseDown={(event) => event.target === event.currentTarget && !pending && setOpen(false)}
        >
          <form
            action={action}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-description"
            className={`w-full max-w-sm rounded-2xl border border-[#ececf1] bg-white shadow-[0_24px_60px_rgba(15,26,46,0.18)] transition-transform duration-200 ease-out ${
              shown ? "translate-y-0 scale-100" : "translate-y-2 scale-[0.98]"
            }`}
          >
            <div className="px-5 py-5">
              <h2 id="delete-account-title" className="text-sm font-semibold">
                {t("Delete your account?", "¿Borrar tu cuenta?")}
              </h2>
              <p id="delete-account-description" className="mt-1.5 text-xs leading-5 text-[#5b6478]">
                {lang === "es"
                  ? "Se borran tu cuenta, tu perfil, tu foto, todos tus sitios y sus escaneos. No se puede deshacer."
                  : "This deletes your account, profile, photo, all your sites and their scans. It can't be undone."}
              </p>
              <label htmlFor="delete-account-email" className="mt-4 block text-xs font-medium text-[#3c4558]">
                {lang === "es" ? (
                  <>
                    Escribí <span className="font-mono text-[#0f1a2e]">{email}</span> para confirmar
                  </>
                ) : (
                  <>
                    Type <span className="font-mono text-[#0f1a2e]">{email}</span> to confirm
                  </>
                )}
              </label>
              <input
                ref={inputRef}
                id="delete-account-email"
                name="email"
                type="email"
                autoComplete="off"
                required
                className={`${inputClass} mt-1.5`}
              />
              {error && (
                <p role="alert" className="mt-2 text-xs text-red-600">
                  {error}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#f1f2f6] px-5 py-3.5">
              <button type="button" disabled={pending} onClick={() => setOpen(false)} className={secondaryButtonClass}>
                {t("Cancel", "Cancelar")}
              </button>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-8 items-center rounded-full bg-red-600 px-3.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-wait disabled:opacity-70"
              >
                {pending ? t("Deleting…", "Borrando…") : t("Delete forever", "Borrar para siempre")}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
