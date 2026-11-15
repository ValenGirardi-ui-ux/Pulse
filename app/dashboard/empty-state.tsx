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
  title,
  children,
}: {
  number: number;
  state: StepState;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${
          state === "done"
            ? "bg-emerald-500 text-white"
            : state === "current"
              ? "bg-[#4c2882] text-white shadow-[0_0_0_4px_rgba(76,40,130,0.12)]"
              : "bg-[#f1f2f6] text-[#9aa1b2]"
        }`}
        aria-hidden="true"
      >
        {state === "done" ? <IconCheck className="size-3.5" /> : number}
      </span>
      <div className={`min-w-0 flex-1 pt-1 pb-6 ${state === "next" ? "opacity-60" : ""}`}>
        <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </li>
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

  return (
    <section className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_8px_24px_rgba(15,26,46,0.08)] sm:p-8">
      <p className="font-mono text-[11px] tracking-[0.16em] text-[#4c2882] uppercase">
        <T en="Getting started" es="Primeros pasos" />
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
        <T en="Welcome to Pulse" es="Bienvenido a Pulse" />
      </h2>
      <p className="mt-1.5 max-w-xl text-[14px] leading-6 text-[#5b6478]">
        <T
          en="Pulse checks your website and tells you, in plain words, what's wrong and how to fix it. It takes three steps:"
          es="Pulse revisa tu sitio web y te dice, en palabras simples, qué está mal y cómo arreglarlo. Son tres pasos:"
        />
      </p>

      <ol className="mt-7">
        <Step number={1} state={site ? "done" : "current"} title={<T en="Add your website" es="Agregá tu sitio web" />}>
          {site ? (
            <p className="text-[13px] text-[#5b6478]">
              <span className="font-mono text-[#0f1a2e]">{site.url}</span>
            </p>
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

        <Step
          number={2}
          state={site ? "current" : "next"}
          title={<T en="Run your first scan" es="Hacé tu primer escaneo" />}
        >
          <p className="text-[13px] text-[#5b6478]">
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

        <Step number={3} state="next" title={<T en="See what to fix" es="Mirá qué arreglar" />}>
          <p className="text-[13px] text-[#5b6478]">
            <T
              en="You'll get a score from 0 to 100 and a list of issues, most important first, each with step-by-step instructions. After that, Pulse scans your site on its own every 24 hours."
              es="Vas a ver un puntaje de 0 a 100 y una lista de problemas, los más importantes primero, cada uno con instrucciones paso a paso. Después, Pulse escanea tu sitio solo cada 24 horas."
            />
          </p>
        </Step>
      </ol>
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
