"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updatePassword, type AuthState } from "../auth/actions";
import { authErrors } from "../auth/messages";
import { PendingScreen } from "../auth/pending-screen";
import { useLang, useT } from "../i18n";

const inputClass =
  "mt-2 w-full rounded-full border border-black/[0.07] bg-white px-4 py-3 text-sm sm:py-2 shadow-[0_1px_4px_rgba(0,0,0,0.04)] outline-none transition-[border-color,box-shadow] focus:border-[#4c2882]/50 focus:ring-4 focus:ring-[#4c2882]/[0.08]";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, undefined);
  const lang = useLang();
  const t = useT();
  const error = state?.error ? authErrors[state.error][lang] : null;

  return (
    <form action={action} className="mt-9 w-full sm:mt-6" aria-describedby={error ? "reset-error" : undefined}>
      <label className="block text-sm font-semibold" htmlFor="reset-password">
        {t("New password", "Contraseña nueva")}
      </label>
      <input
        id="reset-password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        className={inputClass}
      />
      <label className="mt-6 block text-sm font-semibold sm:mt-4" htmlFor="reset-confirm">
        {t("Repeat the password", "Repetí la contraseña")}
      </label>
      <input
        id="reset-confirm"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        className={inputClass}
      />
      {error && (
        <p id="reset-error" role="alert" className="mt-4 text-sm text-red-600">
          {error}{" "}
          {state?.error === "reset_expired" && (
            <Link href="/forgot-password" className="text-blue-600">
              {t("Get a new link", "Pedir otro link")}
            </Link>
          )}
        </p>
      )}
      <button type="submit" disabled={pending} className="mt-7 w-full rounded-full bg-[#4c2882] py-3.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(76,40,130,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] transition-colors hover:bg-[#5a3196] disabled:cursor-wait disabled:opacity-70 sm:mt-4 sm:py-2.5">
        {pending ? t("Saving…", "Guardando…") : t("Save password", "Guardar contraseña")}
      </button>
      <PendingScreen en="Saving…" es="Guardando…" />
    </form>
  );
}
