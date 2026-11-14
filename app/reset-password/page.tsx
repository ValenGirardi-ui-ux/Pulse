import type { Metadata } from "next";
import { Sora } from "next/font/google";
import Link from "next/link";
import { T } from "../i18n";
import { ResetPasswordForm } from "./reset-password-form";

const pulse = Sora({
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Choose a new password · Pulse",
};

export default function ResetPasswordPage() {
  return (
    <div className={`${pulse.className} relative min-h-screen bg-white text-black`}>
      <Link
        href="/login"
        className="absolute top-5 right-6 text-sm text-neutral-500 transition-colors duration-200 hover:text-black"
      >
        <T en="Close" es="Cerrar" />
      </Link>
      <main className="mx-auto flex min-h-screen w-full max-w-[27rem] flex-col items-center justify-center px-5 py-8">
        <h1 className="text-center text-3xl font-semibold tracking-tight sm:text-2xl">
          <T en="Choose a new password" es="Elegí una contraseña nueva" />
        </h1>
        <p className="mt-1 text-center text-sm text-neutral-500">
          <T en="Use at least 8 characters." es="Usá al menos 8 caracteres." />
        </p>
        <ResetPasswordForm />
      </main>
    </div>
  );
}
