import { Sora } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import { T } from "./i18n";

const pulse = Sora({
  weight: ["400", "600"],
  subsets: ["latin"],
});

const contactEmail = "hello@pulse.app";

export type LegalSection = { title: { en: string; es: string }; body: { en: ReactNode; es: ReactNode }[] };

const legalLinks = [
  { href: "/terms", en: "Terms of use", es: "Términos de uso" },
  { href: "/privacy", en: "Privacy", es: "Privacidad" },
  { href: "/security", en: "Security", es: "Seguridad" },
];

/** Shared layout for the Terms, Privacy and Security pages. */
export function LegalPage({
  current,
  title,
  intro,
  sections,
}: {
  current: string;
  title: { en: string; es: string };
  intro: { en: ReactNode; es: ReactNode };
  sections: LegalSection[];
}) {
  return (
    <div className={`${pulse.className} min-h-screen bg-white text-[#0f1a2e]`}>
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 pt-8">
        <Link href="/" className="text-base font-semibold tracking-tight text-[#4c2882]">
          Pulse
        </Link>
        <Link href="/" className="text-sm text-neutral-500 transition-colors hover:text-black">
          <T en="Back to home" es="Volver al inicio" />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-3xl px-6 pt-14 pb-24">
        <nav className="flex flex-wrap gap-2 text-[13px]" aria-label="Legal">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.href === current ? "page" : undefined}
              className={`rounded-full border px-3.5 py-1.5 transition-colors ${
                link.href === current
                  ? "border-[#4c2882] bg-[#4c2882] text-white"
                  : "border-black/[0.08] text-[#5b6478] hover:border-[#4c2882]/35 hover:text-[#4c2882]"
              }`}
            >
              <T en={link.en} es={link.es} />
            </Link>
          ))}
        </nav>
        <h1 className="mt-10 text-4xl font-light tracking-[-0.03em] sm:text-5xl">
          <T en={title.en} es={title.es} />
        </h1>
        <p className="mt-3 font-mono text-[11px] tracking-[0.16em] text-[#8a91a3] uppercase">
          <T en="Last updated: November 13, 2026" es="Última actualización: 13 de noviembre de 2026" />
        </p>
        <p className="mt-8 text-[15px] leading-7 text-[#5b6478]">
          <T en={intro.en} es={intro.es} />
        </p>
        {sections.map((section) => (
          <section key={section.title.en} className="mt-12">
            <h2 className="text-xl font-semibold tracking-tight">
              <T en={section.title.en} es={section.title.es} />
            </h2>
            {section.body.map((paragraph, index) => (
              <p key={index} className="mt-4 text-[15px] leading-7 text-[#5b6478]">
                <T en={paragraph.en} es={paragraph.es} />
              </p>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}

export function EmailLink() {
  return (
    <a href={`mailto:${contactEmail}`} className="text-[#4c2882] underline underline-offset-2">
      {contactEmail}
    </a>
  );
}
