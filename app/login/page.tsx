import type { Metadata } from "next";
import { Sora } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { GoogleButton } from "../auth/google-button";
import { T } from "../i18n";
import { LoginForm } from "./login-form";

const pulse = Sora({
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Log in · Pulse",
};

export default function LoginPage() {
  return (
    <div className={`${pulse.className} relative min-h-screen bg-white text-black`}>
      <Link
        href="/"
        className="absolute top-5 right-6 text-sm text-neutral-500 transition-colors duration-200 hover:text-black"
      >
        <T en="Close" es="Cerrar" />
      </Link>
      <main className="mx-auto flex min-h-screen w-full max-w-[27rem] flex-col items-center justify-center px-5 py-8">
        <h1 className="text-3xl font-semibold sm:text-2xl tracking-tight">
          <T en="Log in" es="Iniciar sesión" />
        </h1>
        <Suspense fallback={<div className="mt-9 h-[17rem] w-full sm:mt-6 sm:h-[13.5rem]" />}>
          <LoginForm />
        </Suspense>
        <div className="relative my-7 w-full sm:my-4">
          <div className="border-t border-neutral-300" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-neutral-600">
            <T en="or" es="o" />
          </span>
        </div>
        <GoogleButton />
        <p className="mt-8 text-sm sm:mt-6">
          <T en="New to Pulse?" es="¿Nuevo en Pulse?" />{" "}
          <Link href="/signup" className="text-blue-600">
            <T en="Create an account" es="Creá una cuenta" />
          </Link>
        </p>
      </main>
    </div>
  );
}
