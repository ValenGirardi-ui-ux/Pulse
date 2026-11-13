"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type AuthState } from "../auth/actions";
import { authErrors } from "../auth/messages";
import { useLang, useT } from "../i18n";

const inputClass =
  "mt-2 w-full rounded-full border border-black/[0.07] bg-white px-4 py-3 text-sm sm:py-2 shadow-[0_1px_4px_rgba(0,0,0,0.04)] outline-none transition-[border-color,box-shadow] focus:border-[#4c2882]/50 focus:ring-4 focus:ring-[#4c2882]/[0.08]";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, undefined);
  const lang = useLang();
  const t = useT();
  const error = state?.error ? authErrors[state.error][lang] : null;

  if (state?.checkEmail) {
    return (
      <div role="status" className="mt-9 w-full text-center text-sm text-neutral-600 sm:mt-6">
        <p>
          {t(
            "If there's an account with that email, we sent you a link to choose a new password.",
            "Si hay una cuenta con ese email, te mandamos un link para elegir una contraseña nueva.",
          )}
        </p>
        <p className="mt-2 font-semibold break-all text-black">{state.email}</p>
        <Link href="/login" className="mt-6 inline-block text-blue-600">
          {t("Back to log in", "Volver a iniciar sesión")}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-9 w-full sm:mt-6" aria-describedby={error ? "forgot-error" : undefined}>
      <label className="block text-sm font-semibold" htmlFor="forgot-email">
        {t("Email address", "Email")}
      </label>
      <input
        id="forgot-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state?.email}
        className={inputClass}
      />
      {error && (
        <p id="forgot-error" role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className="mt-7 w-full rounded-full bg-[#4c2882] py-3.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(76,40,130,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] transition-colors hover:bg-[#5a3196] disabled:cursor-wait disabled:opacity-70 sm:mt-4 sm:py-2.5">
        {pending ? t("Sending…", "Enviando…") : t("Send reset link", "Enviar link")}
      </button>
    </form>
  );
}
