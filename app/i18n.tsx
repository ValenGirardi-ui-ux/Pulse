"use client";

import { useEffect, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { dictionary } from "./i18n-dictionary";

export type Lang = "en" | "es";

const STORAGE_KEY = "pulse-lang";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): Lang {
  return localStorage.getItem(STORAGE_KEY) === "es" ? "es" : "en";
}

function getServerSnapshot(): Lang {
  return "en";
}

export function setLang(lang: Lang) {
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
  listeners.forEach((listener) => listener());
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Returns a translator. Call it with both versions — `t("Save", "Guardar")` — or with only the
 * English text to look it up in the shared dictionary (used for sample data like issue titles).
 */
export function useT() {
  const lang = useLang();
  return (en: string, es?: string) => (lang === "es" ? (es ?? dictionary[en] ?? en) : en);
}

/** Translated text for server components: `<T en="Settings" es="Configuración" />`. */
export function T({ en, es }: { en: ReactNode; es?: ReactNode }) {
  const lang = useLang();
  if (lang === "en") return en;
  if (es !== undefined) return es;
  return typeof en === "string" ? (dictionary[en] ?? en) : en;
}

/** An <input> whose placeholder is translated, for use in server components. */
export function TInput({
  placeholder,
  placeholderEs,
  ...props
}: Omit<ComponentProps<"input">, "placeholder"> & { placeholder: string; placeholderEs: string }) {
  const t = useT();
  return <input {...props} placeholder={t(placeholder, placeholderEs)} />;
}

/** Keeps <html lang> in sync with the chosen language. */
export function HtmlLang() {
  const lang = useLang();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
