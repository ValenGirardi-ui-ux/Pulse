import type { Metadata } from "next";
import { Sora } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { GoogleButton } from "../auth/google-button";
import { T } from "../i18n";
import { SignupForm } from "./signup-form";

const pulse = Sora({
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create your account · Pulse",
};

async function SignupFormWithUrl({ searchParams }: { searchParams: PageProps<"/signup">["searchParams"] }) {
  const { url } = await searchParams;
  return <SignupForm website={typeof url === "string" ? url : ""} />;
}

export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  return (
    <div className={`${pulse.className} relative min-h-screen bg-white text-black`}>
      <Link
        href="/"
        className="absolute top-5 right-6 text-sm text-neutral-500 transition-colors duration-200 hover:text-black"
      >
        <T en="Close" es="Cerrar" />
      </Link>
      <main className="mx-auto flex min-h-screen w-full max-w-[27rem] flex-col items-center justify-center px-5 py-8 sm:py-6">
        <h1 className="text-3xl font-semibold sm:text-2xl tracking-tight">
          <T en="Create your account" es="Creá tu cuenta" />
        </h1>
        <p className="mt-1 text-center text-sm text-neutral-500">
          <T en="Start checking the health of your site for free." es="Empezá a revisar la salud de tu sitio gratis." />
        </p>
        <Suspense fallback={<SignupForm />}>
          <SignupFormWithUrl searchParams={searchParams} />
        </Suspense>
        <div className="relative my-6 w-full sm:my-3">
          <div className="border-t border-neutral-300" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-neutral-600">
            <T en="or" es="o" />
          </span>
        </div>
        <GoogleButton />
        <p className="mt-7 text-sm sm:mt-4">
          <T en="Already have an account?" es="¿Ya tenés cuenta?" />{" "}
          <Link href="/login" className="text-blue-600">
            <T en="Log in" es="Iniciá sesión" />
          </Link>
        </p>
      </main>
    </div>
  );
}
