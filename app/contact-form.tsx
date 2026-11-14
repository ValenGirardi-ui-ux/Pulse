"use client";

import { useActionState } from "react";
import { sendContactMessage, type ContactState } from "./contact-actions";
import { useT } from "./i18n";

const inputClass =
  "mt-2 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-[border-color,background-color] duration-300 placeholder:text-white/30 focus:border-[#a98bd6] focus:bg-white/[0.07]";

export function ContactForm({ buttonClass }: { buttonClass: string }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContactMessage, undefined);
  const t = useT();

  const errors = {
    missing_fields: t("Please fill in every field.", "Completá todos los campos."),
    invalid_email: t("That email doesn't look right.", "Ese email no parece válido."),
    too_long: t("Your message is too long.", "Tu mensaje es demasiado largo."),
    unknown: t("We couldn't send your message. Please try again.", "No pudimos enviar tu mensaje. Probá de nuevo."),
  };

  if (state?.sent) {
    return (
      <div role="status" className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <p className="text-2xl font-light tracking-[-0.02em]">{t("Message sent", "Mensaje enviado")}</p>
        <p className="mt-3 text-[15px] text-white/65">
          {t("Thanks for writing. We'll get back to you soon.", "Gracias por escribirnos. Te respondemos pronto.")}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-5" aria-describedby={state?.error ? "contact-error" : undefined}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm text-white/70">
          {t("Name", "Nombre")}
          <input name="name" type="text" autoComplete="name" required maxLength={100} defaultValue={state?.name} className={inputClass} />
        </label>
        <label className="block text-sm text-white/70">
          Email
          <input name="email" type="email" autoComplete="email" required maxLength={255} defaultValue={state?.email} className={inputClass} />
        </label>
      </div>
      <label className="block text-sm text-white/70">
        {t("Message", "Mensaje")}
        <textarea
          name="message"
          required
          rows={5}
          maxLength={5000}
          defaultValue={state?.message}
          placeholder={t("Tell us what you need…", "Contanos qué necesitás…")}
          className={`${inputClass} resize-y`}
        />
      </label>
      <input name="company" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {state?.error && (
        <p id="contact-error" role="alert" className="text-sm text-red-300">
          {errors[state.error]}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${buttonClass} justify-self-start py-3.5 disabled:opacity-60`}>
        {pending ? t("Sending…", "Enviando…") : t("Send", "Enviar")}
      </button>
    </form>
  );
}
