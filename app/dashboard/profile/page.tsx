import type { Metadata } from "next";
import { T, TInput } from "../../i18n";
import { Field, Section } from "../form-layout";
import { inputClass as input, primaryButtonClass, secondaryButtonClass as secondaryButton } from "../styles";
import { PhotoPicker } from "./photo-picker";

export const metadata: Metadata = {
  title: "Profile · Pulse",
};

export default function ProfilePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight"><T en="Profile" es="Perfil" /></h1>
        <p className="mt-1 text-[13px] text-[#8a91a3]"><T en="Your personal details and how you sign in." es="Tus datos personales y cómo iniciás sesión." /></p>
      </div>

      <div className="mt-8 divide-y divide-[#ececf1] border-t border-[#ececf1]">
        <Section
          title={<T en="Photo" es="Foto" />}
          description={<T en="Shown in the sidebar and on your activity." es="Se muestra en el menú lateral y en tu actividad." />}
        >
          <PhotoPicker />
        </Section>

        <Section
          title={<T en="Personal info" es="Datos personales" />}
          description={<T en="How Pulse addresses you." es="Cómo te llama Pulse." />}
        >
          <Field label={<T en="Full name" es="Nombre completo" />} htmlFor="profile-name">
            <TInput id="profile-name" placeholder="Your name" placeholderEs="Tu nombre" autoComplete="name" className={input} />
          </Field>
          <Field label="Email" htmlFor="profile-email">
            <input
              id="profile-email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              className={input}
            />
          </Field>
        </Section>

        <Section
          title={<T en="Password" es="Contraseña" />}
          description={<T en="Use at least 8 characters." es="Usá al menos 8 caracteres." />}
        >
          <Field label={<T en="Current password" es="Contraseña actual" />} htmlFor="profile-current-password">
            <input id="profile-current-password" type="password" autoComplete="current-password" className={input} />
          </Field>
          <Field label={<T en="New password" es="Nueva contraseña" />} htmlFor="profile-new-password">
            <input id="profile-new-password" type="password" autoComplete="new-password" className={input} />
          </Field>
        </Section>
      </div>

      <div className="sticky bottom-0 mt-2 flex justify-end gap-2 border-t border-black/[0.06] bg-white/90 py-4 backdrop-blur">
        <button type="button" className={secondaryButton}>
          <T en="Cancel" es="Cancelar" />
        </button>
        <button type="button" className={primaryButtonClass}>
          <T en="Save changes" es="Guardar cambios" />
        </button>
      </div>
    </main>
  );
}
