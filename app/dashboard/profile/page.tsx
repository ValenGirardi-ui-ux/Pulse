import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { T } from "../../i18n";
import { Section } from "../form-layout";
import { DeleteAccount } from "./delete-account";
import { PhotoPicker } from "./photo-picker";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "Profile · Pulse",
};

async function CurrentPhotoPicker() {
  const user = await getCurrentUser();
  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();
  return <PhotoPicker user={{ id: user.id, initial, photoUrl: user.photoUrl, hasCustomPhoto: user.hasCustomPhoto }} />;
}

async function DangerZone() {
  const user = await getCurrentUser();
  return (
    <Section
      title={<T en="Danger zone" es="Zona de peligro" />}
      description={<T en="This can't be undone." es="No se puede deshacer." />}
    >
      <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 p-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium">
            <T en="Delete account" es="Borrar cuenta" />
          </p>
          <p className="mt-0.5 text-xs text-[#8a91a3]">
            <T
              en="Deletes your account, your sites, their scans and your photo."
              es="Borra tu cuenta, tus sitios, sus escaneos y tu foto."
            />
          </p>
        </div>
        <DeleteAccount email={user.email} />
      </div>
    </Section>
  );
}

async function CurrentProfileForm() {
  const user = await getCurrentUser();
  return <ProfileForm user={{ name: user.name, email: user.email, hasPassword: user.hasPassword }} />;
}

function ProfileFormSkeleton() {
  return (
    <div className="space-y-5 py-8 md:pl-[16.5rem]" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div key={row} className="max-w-xl">
          <div className="h-3 w-24 animate-pulse rounded bg-[#ececf1]" />
          <div className="mt-2 h-9 animate-pulse rounded-lg bg-[#f4f5f8]" />
        </div>
      ))}
    </div>
  );
}

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
          <Suspense fallback={<div className="size-14 animate-pulse rounded-full bg-[#ececf1]" />}>
            <CurrentPhotoPicker />
          </Suspense>
        </Section>

        <Suspense fallback={<ProfileFormSkeleton />}>
          <CurrentProfileForm />
        </Suspense>

        <Suspense fallback={null}>
          <DangerZone />
        </Suspense>
      </div>
    </main>
  );
}
