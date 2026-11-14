"use client";

import { useActionState } from "react";
import { useT } from "../../i18n";
import { Field, Section } from "../form-layout";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "../styles";
import { saveProfile, type ProfileErrorCode, type ProfileState } from "./actions";

export type ProfileUser = { name: string; email: string; hasPassword: boolean };

export function ProfileForm({ user }: { user: ProfileUser }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, undefined);
  const t = useT();

  const errors: Record<ProfileErrorCode, string> = {
    missing_name: t("Enter your name.", "Escribí tu nombre."),
    name_too_long: t("Your name can be up to 80 characters.", "Tu nombre puede tener hasta 80 caracteres."),
    invalid_email: t("That email address isn't valid.", "Ese email no es válido."),
    email_taken: t("There's already an account with that email.", "Ya hay una cuenta con ese email."),
    password_too_short: t("The new password needs at least 8 characters.", "La contraseña nueva necesita al menos 8 caracteres."),
    current_password_required: t("Enter your current password to set a new one.", "Escribí tu contraseña actual para poner una nueva."),
    wrong_current_password: t("Your current password isn't right.", "La contraseña actual no es correcta."),
    same_password: t("Choose a password different from your current one.", "Elegí una contraseña distinta a la actual."),
    sign_in_again: t("For your security, log out and back in, then try again.", "Por seguridad, cerrá sesión, volvé a entrar y probá de nuevo."),
    rate_limited: t("Too many attempts. Wait a minute and try again.", "Demasiados intentos. Esperá un minuto y probá de nuevo."),
    unknown: t("We couldn't save your changes. Try again.", "No pudimos guardar los cambios. Probá de nuevo."),
  };

  return (
    <form action={action}>
      <div className="divide-y divide-[#ececf1]">
        <Section
          title={t("Personal info", "Datos personales")}
          description={t("How Pulse addresses you.", "Cómo te llama Pulse.")}
        >
          <Field label={t("Full name", "Nombre completo")} htmlFor="profile-name">
            <input
              id="profile-name"
              name="name"
              required
              maxLength={80}
              autoComplete="name"
              placeholder={t("Your name", "Tu nombre")}
              defaultValue={state?.name ?? user.name}
              className={inputClass}
            />
          </Field>
          <Field label="Email" htmlFor="profile-email">
            <input
              id="profile-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={state?.email ?? user.email}
              className={inputClass}
            />
          </Field>
        </Section>

        <Section
          title={t("Password", "Contraseña")}
          description={
            user.hasPassword
              ? t("Use at least 8 characters. Leave it empty to keep your current one.", "Usá al menos 8 caracteres. Dejalo vacío para mantener la actual.")
              : t("You sign in with Google. Add a password to also log in with your email.", "Entrás con Google. Agregá una contraseña para poder entrar también con tu email.")
          }
        >
          {user.hasPassword && (
            <Field label={t("Current password", "Contraseña actual")} htmlFor="profile-current-password">
              <input id="profile-current-password" name="currentPassword" type="password" autoComplete="current-password" className={inputClass} />
            </Field>
          )}
          <Field label={t("New password", "Nueva contraseña")} htmlFor="profile-new-password">
            <input id="profile-new-password" name="newPassword" type="password" minLength={8} autoComplete="new-password" className={inputClass} />
          </Field>
        </Section>
      </div>

      <div className="sticky bottom-0 mt-2 flex flex-wrap items-center justify-end gap-x-4 gap-y-2 border-t border-black/[0.06] bg-white/90 py-4 backdrop-blur">
        <p aria-live="polite" className={`mr-auto text-xs ${state?.error ? "text-red-600" : "text-emerald-700"}`}>
          {state?.error
            ? errors[state.error]
            : state?.saved
              ? state.emailPending
                ? t(
                    `Saved. To change your email, open the link we sent to ${state.emailPending}.`,
                    `Guardado. Para cambiar tu email, abrí el link que mandamos a ${state.emailPending}.`,
                  )
                : t("Changes saved.", "Cambios guardados.")
              : null}
        </p>
        <div className="flex gap-2">
          <button type="reset" disabled={pending} className={secondaryButtonClass}>
            {t("Cancel", "Cancelar")}
          </button>
          <button type="submit" disabled={pending} className={`${primaryButtonClass} disabled:opacity-60`}>
            {pending ? t("Saving…", "Guardando…") : t("Save changes", "Guardar cambios")}
          </button>
        </div>
      </div>
    </form>
  );
}
