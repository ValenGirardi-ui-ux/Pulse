"use client";

import { useActionState } from "react";
import { signup, type AuthState } from "../auth/actions";
import { authErrors } from "../auth/messages";
import { PendingScreen } from "../auth/pending-screen";
import { useLang, useT } from "../i18n";

const inputClass =
  "mt-2 w-full rounded-full border border-black/[0.07] bg-white px-4 py-3 text-sm sm:mt-1.5 sm:py-2 shadow-[0_1px_4px_rgba(0,0,0,0.04)] outline-none transition-[border-color,box-shadow] focus:border-[#4c2882]/50 focus:ring-4 focus:ring-[#4c2882]/[0.08]";

export function SignupForm({ website = "" }: { website?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signup, undefined);
  const lang = useLang();
  const t = useT();

  if (state?.checkEmail) {
    return (
      <div role="status" className="mt-8 w-full rounded-3xl border border-[#4c2882]/15 bg-[#4c2882]/[0.04] p-6 text-center sm:mt-5">
        <p className="text-base font-semibold">{t("Check your email", "Revisá tu email")}</p>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          {t(
            `We sent a link to ${state.email}. Open it to confirm your account and go to your dashboard.`,
            `Te mandamos un link a ${state.email}. Abrilo para confirmar tu cuenta y entrar a tu panel.`,
          )}
        </p>
      </div>
    );
  }

  const error = state?.error ? authErrors[state.error][lang] : null;

  return (
    <form action={action} className="mt-8 w-full sm:mt-5" aria-describedby={error ? "signup-error" : undefined}>
      <label className="block text-sm font-semibold" htmlFor="signup-name">
        {t("Name", "Nombre")}
      </label>
      <input
        id="signup-name"
        name="name"
        type="text"
        autoComplete="name"
        required
        defaultValue={state?.name}
        className={inputClass}
      />

      <label className="mt-5 block text-sm font-semibold sm:mt-3" htmlFor="signup-email">
        {t("Email address", "Email")}
      </label>
      <input
        id="signup-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state?.email}
        className={inputClass}
      />

      <label className="mt-5 block text-sm font-semibold sm:mt-3" htmlFor="signup-password">
        {t("Password", "Contraseña")}
      </label>
      <input
        id="signup-password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        className={inputClass}
      />

      <label className="mt-5 block text-sm font-semibold sm:mt-3" htmlFor="signup-website">
        {t("Your website", "Tu sitio web")}{" "}
        <span className="font-normal text-neutral-500">{t("(optional)", "(opcional)")}</span>
      </label>
      <input
        id="signup-website"
        name="website"
        type="text"
        placeholder={t("yourwebsite.com", "tusitioweb.com")}
        defaultValue={state?.website ?? website}
        className={`${inputClass} font-mono placeholder:text-neutral-400`}
      />

      {error && (
        <p id="signup-error" role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-7 w-full rounded-full bg-[#4c2882] py-3.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(76,40,130,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] transition-colors hover:bg-[#5a3196] disabled:cursor-wait disabled:opacity-70 sm:mt-4 sm:py-2.5"
      >
        {pending ? t("Creating account…", "Creando cuenta…") : t("Create account", "Crear cuenta")}
      </button>
      <PendingScreen en="Creating your account…" es="Creando tu cuenta…" />
    </form>
  );
}
