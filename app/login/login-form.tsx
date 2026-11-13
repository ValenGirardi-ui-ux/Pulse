"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { login, type AuthState } from "../auth/actions";
import { authErrors } from "../auth/messages";
import { PendingScreen } from "../auth/pending-screen";
import { useLang, useT } from "../i18n";

const inputClass =
  "mt-2 w-full rounded-full border border-black/[0.07] bg-white px-4 py-3 text-sm sm:py-2 shadow-[0_1px_4px_rgba(0,0,0,0.04)] outline-none transition-[border-color,box-shadow] focus:border-[#4c2882]/50 focus:ring-4 focus:ring-[#4c2882]/[0.08]";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, undefined);
  const searchParams = useSearchParams();
  const lang = useLang();
  const t = useT();

  const urlError = searchParams.get("error");
  const errorKey = state?.error ?? (urlError === "google" || urlError === "callback" ? urlError : null);
  const error = errorKey ? authErrors[errorKey][lang] : null;

  return (
    <form action={action} className="mt-9 w-full sm:mt-6" aria-describedby={error ? "login-error" : undefined}>
      <label className="block text-sm font-semibold" htmlFor="login-email">
        {t("Email address", "Email")}
      </label>
      <input
        id="login-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state?.email}
        className={inputClass}
      />
      <div className="mt-6 flex items-center justify-between sm:mt-4">
        <label className="text-sm font-semibold" htmlFor="login-password">
          {t("Password", "Contraseña")}
        </label>
        <button type="button" className="text-sm text-blue-600">
          {t("Forgot password?", "¿Olvidaste tu contraseña?")}
        </button>
      </div>
      <input
        id="login-password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className={inputClass}
      />
      {error && (
        <p id="login-error" role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-7 w-full rounded-full bg-[#4c2882] py-3.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(76,40,130,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] transition-colors hover:bg-[#5a3196] disabled:cursor-wait disabled:opacity-70 sm:mt-4 sm:py-2.5"
      >
        {pending ? t("Logging in…", "Iniciando sesión…") : t("Log in", "Iniciar sesión")}
      </button>
      <PendingScreen en="Logging in…" es="Iniciando sesión…" />
    </form>
  );
}
