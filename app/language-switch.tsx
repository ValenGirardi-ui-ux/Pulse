"use client";

import { setLang, useLang, type Lang } from "./i18n";

const options: { value: Lang; label: string; name: string }[] = [
  { value: "en", label: "EN", name: "English" },
  { value: "es", label: "ES", name: "Español" },
];

export function LanguageSwitch({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  const lang = useLang();

  return (
    <div
      role="radiogroup"
      aria-label={lang === "es" ? "Idioma" : "Language"}
      className={`inline-flex shrink-0 rounded-full p-0.5 ${
        dark ? "border border-white/12 bg-white/[0.04]" : "border border-black/[0.08] bg-[#f4f5f8]"
      } ${className}`}
    >
      {options.map((option) => {
        const active = option.value === lang;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.name}
            onClick={() => setLang(option.value)}
            className={`rounded-full px-2.5 py-1 font-mono text-[11px] transition-colors ${
              active
                ? dark
                  ? "bg-white text-[#0f1a2e]"
                  : "bg-white text-[#4c2882] shadow-[0_1px_3px_rgba(15,26,46,0.12)]"
                : dark
                  ? "text-white/55 hover:text-white"
                  : "text-[#8a91a3] hover:text-[#0f1a2e]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A round button fixed to the bottom-right corner of the screen. It shows only the other language
 * (EN while in Spanish, ES while in English) and switches to it.
 */
export function LanguageToggle() {
  const lang = useLang();
  const next: Lang = lang === "es" ? "en" : "es";

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={next === "es" ? "Cambiar a español" : "Switch to English"}
      title={next === "es" ? "Español" : "English"}
      className="fixed right-4 bottom-4 z-40 grid size-10 place-items-center rounded-full bg-[#4c2882] font-mono text-[11px] font-semibold text-white shadow-[0_4px_12px_rgba(76,40,130,0.2)] transition-[scale,background-color] duration-300 ease-out hover:scale-110 hover:bg-[#5a3196] sm:right-6 sm:bottom-6"
    >
      {next.toUpperCase()}
    </button>
  );
}
