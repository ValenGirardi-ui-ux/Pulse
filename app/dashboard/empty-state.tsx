import Link from "next/link";
import type { ReactNode } from "react";
import type { DashboardData } from "@/lib/scan/data";
import { T } from "../i18n";
import { IconCheck } from "./icons";
import { ScanButton } from "./scan-dialog";
import { SiteForm } from "./settings/site-form";

type StepState = "done" | "current" | "next";

function Step({
  number,
  state,
  last = false,
  title,
  children,
}: {
  number: number;
  state: StepState;
  last?: boolean;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <li className="relative flex gap-4">
      {!last && (
        <span
          aria-hidden="true"
          className={`absolute top-9 bottom-0 left-4 w-px -translate-x-1/2 ${state === "done" ? "bg-emerald-300" : "bg-[#e6e8ef]"}`}
        />
      )}
      <span
        aria-hidden="true"
        className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${
          state === "done"
            ? "bg-emerald-500 text-white"
            : state === "current"
              ? "bg-[#4c2882] text-white shadow-[0_0_0_5px_rgba(76,40,130,0.12)]"
              : "border border-[#e6e8ef] bg-white text-[#9aa1b2]"
        }`}
      >
        {state === "done" ? <IconCheck className="size-3.5" /> : number}
      </span>
      <div
        className={`mb-5 min-w-0 flex-1 rounded-2xl ${
          state === "current" ? "border border-[#4c2882]/15 bg-[#4c2882]/[0.03] p-4 sm:p-5" : "px-1 pt-1"
        } ${state === "next" ? "opacity-55" : ""}`}
      >
        <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </li>
  );
}

const previewIssues = [
  { dot: "bg-red-500", en: "Your home page returns an error", es: "Tu página principal devuelve un error" },
  { dot: "bg-amber-500", en: "Meta description missing", es: "Falta la meta descripción" },
  { dot: "bg-[#c9cedd]", en: "No analytics detected", es: "No se detectó analítica" },
];

/** A small sample of what a scan result looks like, so new users know what they'll get. */
function ResultPreview() {
  const score = 72;
  const circumference = 2 * Math.PI * 26;
  return (
    <div aria-hidden="true" className="rounded-2xl border border-black/[0.06] bg-[#fafafb] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold">
          <T en="What you'll see" es="Lo que vas a ver" />
        </p>
        <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-medium text-[#8a91a3]">
          <T en="Example" es="Ejemplo" />
        </span>
      </div>

      <div className="mt-4 flex items-center gap-4 rounded-xl bg-white p-4 shadow-[0_4px_14px_rgba(15,26,46,0.06)]">
        <svg viewBox="0 0 64 64" className="size-16 shrink-0 -rotate-90">
          <circle cx="32" cy="32" r="26" fill="none" stroke="#eee8f6" strokeWidth="7" />
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            stroke="#4c2882"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
          />
        </svg>
        <div>
          <p className="text-2xl font-semibold tracking-tight">
            {score}
            <span className="text-sm font-normal text-[#9aa1b2]">/100</span>
          </p>
          <p className="text-xs text-[#8a91a3]">
            <T en="Pulse Score" es="Puntaje Pulse" />
          </p>
        </div>
      </div>

      <ul className="mt-3 overflow-hidden rounded-xl bg-white shadow-[0_4px_14px_rgba(15,26,46,0.06)]">
        {previewIssues.map((issue) => (
          <li key={issue.en} className="flex items-center gap-2.5 border-b border-[#f1f2f6] px-3.5 py-2.5 last:border-b-0">
            <span className={`size-1.5 shrink-0 rounded-full ${issue.dot}`} />
            <span className="truncate text-[12px] font-medium">
              <T en={issue.en} es={issue.es} />
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs leading-5 text-[#8a91a3]">
        <T
          en="Each issue comes with step-by-step instructions to fix it."
          es="Cada problema viene con instrucciones paso a paso para arreglarlo."
        />
      </p>
    </div>
  );
}

/**
 * The first thing a new user sees: three steps to get from "nothing" to "I know what to fix".
 * Shown on Overview, Issues and Scans until the first scan exists.
 */
export function ScanEmptyState({ data }: { data: DashboardData }) {
  if (data.site && data.setupNeeded) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d9dce6] px-6 py-10 text-center">
        <h2 className="text-sm font-semibold">
          <T en="Scans aren't set up yet" es="Los escaneos todavía no están configurados" />
        </h2>
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-5 text-[#8a91a3]">
          <T
            en="Run supabase/migrations/0004_scans.sql in the Supabase SQL Editor, then reload this page."
            es="Corré supabase/migrations/0004_scans.sql en el SQL Editor de Supabase y recargá esta página."
          />
        </p>
      </div>
    );
  }

  const site = data.site;
  const current = site ? 2 : 1;

  return (
    <section className="overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-[0_8px_24px_rgba(15,26,46,0.08)]">
      <div className="border-b border-[#f1f2f6] bg-[linear-gradient(135deg,rgba(76,40,130,0.06),transparent_60%)] px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="font-mono text-[11px] tracking-[0.16em] text-[#4c2882] uppercase">
              <T en="Getting started" es="Primeros pasos" />
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              <T en="Welcome to Pulse" es="Bienvenido a Pulse" />
            </h2>
            <p className="mt-1.5 text-[14px] leading-6 text-[#5b6478]">
              <T
                en="Pulse checks your website and tells you, in plain words, what's wrong and how to fix it."
                es="Pulse revisa tu sitio web y te dice, en palabras simples, qué está mal y cómo arreglarlo."
              />
            </p>
          </div>
          <div className="w-full max-w-[12rem]">
            <p className="text-xs font-medium text-[#5b6478]">
              <T en={`Step ${current} of 3`} es={`Paso ${current} de 3`} />
            </p>
            <div className="mt-2 flex gap-1.5" aria-hidden="true">
              {[1, 2, 3].map((n) => (
                <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= current ? "bg-[#4c2882]" : "bg-[#e6e8ef]"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 px-5 py-7 sm:px-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-10">
        <ol>
          <Step number={1} state={site ? "done" : "current"} title={<T en="Add your website" es="Agregá tu sitio web" />}>
            {site ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-black/[0.07] bg-[#fafafb] px-3 py-1 font-mono text-[12px] text-[#0f1a2e]">
                  {site.url}
                </span>
                <Link href="/dashboard/settings" className="text-xs text-[#8a91a3] transition-colors hover:text-[#4c2882]">
                  <T en="Change" es="Cambiar" />
                </Link>
              </div>
            ) : (
              <div className="max-w-md">
                <p className="mb-4 text-[13px] text-[#5b6478]">
                  <T
                    en="Write its address, like mystore.com, and give it a name you'll recognize."
                    es="Escribí su dirección, como mitienda.com, y ponele un nombre que reconozcas."
                  />
                </p>
                <SiteForm site={null} adding />
              </div>
            )}
          </Step>

          <Step number={2} state={site ? "current" : "next"} title={<T en="Run your first scan" es="Hacé tu primer escaneo" />}>
            <p className="text-[13px] leading-5 text-[#5b6478]">
              <T
                en="Pulse opens your site like a visitor would and checks about 25 things. It takes a few seconds."
                es="Pulse abre tu sitio como lo haría un visitante y revisa unas 25 cosas. Tarda unos segundos."
              />
            </p>
            {site && (
              <div className="mt-4">
                <ScanButton site={site.url} variant="large" />
              </div>
            )}
          </Step>

          <Step number={3} state="next" last title={<T en="See what to fix" es="Mirá qué arreglar" />}>
            <p className="text-[13px] leading-5 text-[#5b6478]">
              <T
                en="Fix the issues, most important first. After that, Pulse scans your site on its own every 24 hours."
                es="Arreglá los problemas, empezando por los más importantes. Después, Pulse escanea tu sitio solo cada 24 horas."
              />
            </p>
          </Step>
        </ol>

        <ResultPreview />
      </div>
    </section>
  );
}

/** Placeholder shown while a dashboard page loads its scans. */
export function ScanDataSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 border-b border-[#f1f2f6] px-4 py-4 last:border-b-0">
          <span className="size-2 rounded-full bg-[#ececf1]" />
          <span className="h-3 flex-1 animate-pulse rounded bg-[#f1f2f6]" />
          <span className="h-3 w-12 animate-pulse rounded bg-[#f4f5f8]" />
        </div>
      ))}
    </div>
  );
}
