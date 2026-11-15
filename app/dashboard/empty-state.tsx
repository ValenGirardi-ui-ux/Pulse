import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import type { DashboardData } from "@/lib/scan/data";
import { T } from "../i18n";
import { ScanButton } from "./scan-dialog";
import { SiteForm } from "./settings/site-form";

/** The hand-drawn underline from the landing page. */
function Squiggle({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      {children}
      <svg
        viewBox="0 0 200 16"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -bottom-[0.12em] left-0 h-[0.22em] w-full"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 10 C 30 3, 52 14, 82 8 S 140 4, 168 9 S 192 11, 198 7"
          stroke="#4c2882"
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          opacity="0.75"
        />
      </svg>
    </span>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13px] font-medium text-[#4c2882]">{children}</p>
  );
}

type StepState = "done" | "current" | "next";

function Step({ n, state, title, children }: { n: string; state: StepState; title: ReactNode; children?: ReactNode }) {
  return (
    <li className="grid gap-x-6 gap-y-3 border-t border-[#ececf1] py-6 sm:grid-cols-[7rem_minmax(0,1fr)]">
      <p className="text-[13px] text-[#8a91a3]">
        <T en="Step" es="Paso" /> {Number(n)}
        {state === "done" && (
          <span className="mt-0.5 block text-emerald-600">
            <T en="done" es="listo" />
          </span>
        )}
      </p>
      <div className={state === "next" ? "text-[#9aa1b2]" : ""}>
        <h3 className={`text-lg tracking-tight ${state === "current" ? "text-[#0f1a2e]" : state === "done" ? "text-[#5b6478]" : ""}`}>
          {title}
        </h3>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </li>
  );
}

const sampleIssues = [
  { dot: "bg-red-500", en: "Your home page returns an error", es: "Tu página principal devuelve un error" },
  { dot: "bg-amber-500", en: "Meta description missing", es: "Falta la meta descripción" },
  { dot: "bg-[#c9cedd]", en: "No analytics detected", es: "No se detectó analítica" },
];

function SampleResult() {
  return (
    <div aria-hidden="true" className="border-l border-[#ececf1] lg:pl-8">
      <p className="text-[13px] text-[#8a91a3]">
        <T en="A result looks like this" es="Un resultado se ve así" />
      </p>
      <p className="mt-5 text-6xl leading-none font-light tracking-[-0.04em] text-[#0f1a2e]">
        72<span className="text-xl text-[#c9cedd]">/100</span>
      </p>
      <p className="mt-2 text-xs text-[#8a91a3]">
        <T en="Pulse Score · example" es="Puntaje Pulse · ejemplo" />
      </p>
      <ul className="mt-6 space-y-3">
        {sampleIssues.map((issue) => (
          <li key={issue.en} className="flex items-baseline gap-2.5 text-[13px] text-[#3c4558]">
            <span className={`size-1.5 shrink-0 translate-y-[-1px] rounded-full ${issue.dot}`} />
            <T en={issue.en} es={issue.es} />
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs leading-5 text-[#8a91a3]">
        <T en="Each one comes with the steps to fix it." es="Cada uno trae los pasos para arreglarlo." />
      </p>
    </div>
  );
}

/**
 * The first thing a new user sees: three steps to get from "nothing" to "I know what to fix".
 * Shown on Overview, Issues and Scans until the first scan exists.
 */
export async function ScanEmptyState({ data }: { data: DashboardData }) {
  if (data.site && data.setupNeeded) {
    return (
      <div className="rounded-xl border border-dashed border-[#d9dce6] px-6 py-10 text-center">
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

  const user = await getCurrentUser();
  const firstName = user.name.split(" ")[0];
  const site = data.site;

  return (
    <section className="rounded-xl border border-[#e3e6ef] bg-white px-5 py-8 sm:px-10 sm:py-10">
      <Eyebrow>
        <T en="Getting started" es="Primeros pasos" />
      </Eyebrow>
      <h2 className="mt-5 text-3xl leading-[1.15] font-light tracking-[-0.03em] sm:text-4xl">
        <T
          en={
            <>
              Hi {firstName}. Let&apos;s check your <Squiggle>site</Squiggle>.
            </>
          }
          es={
            <>
              Hola {firstName}. Revisemos tu <Squiggle>sitio</Squiggle>.
            </>
          }
        />
      </h2>
      <p className="mt-4 max-w-lg text-[15px] leading-7 text-[#5b6478]">
        <T
          en="Pulse looks at your website the way a visitor would and tells you what's wrong, in plain words. It takes about a minute."
          es="Pulse mira tu sitio como lo haría un visitante y te dice qué está mal, en palabras simples. Te lleva un minuto."
        />
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <ol className="border-b border-[#ececf1]">
          <Step n="01" state={site ? "done" : "current"} title={<T en="Add your website" es="Agregá tu sitio" />}>
            {site ? (
              <p className="text-[13px] text-[#5b6478]">
                <span className="font-mono text-[#0f1a2e]">{site.url}</span>
                <span className="mx-2 text-[#d9dce6]">·</span>
                <Link href="/dashboard/settings" className="underline decoration-[#d9dce6] underline-offset-4 transition-colors hover:text-[#4c2882]">
                  <T en="change" es="cambiar" />
                </Link>
              </p>
            ) : (
              <div className="max-w-md">
                <p className="mb-4 text-[13px] text-[#5b6478]">
                  <T
                    en="Its address, like mystore.com, and a name so you recognize it."
                    es="Su dirección, como mitienda.com, y un nombre para reconocerlo."
                  />
                </p>
                <SiteForm site={null} adding />
              </div>
            )}
          </Step>

          <Step n="02" state={site ? "current" : "next"} title={<T en="Run the first scan" es="Hacé el primer escaneo" />}>
            <p className="text-[13px] leading-5">
              <T
                en="We check about 25 things: speed, SEO, broken links, security and more. A few seconds."
                es="Revisamos unas 25 cosas: velocidad, SEO, links rotos, seguridad y más. Unos segundos."
              />
            </p>
            {site && (
              <div className="mt-5">
                <ScanButton site={site.url} variant="large" />
              </div>
            )}
          </Step>

          <Step n="03" state="next" title={<T en="Fix what matters" es="Arreglá lo importante" />}>
            <p className="text-[13px] leading-5">
              <T
                en="Start at the top of the list. From then on we check your site every 24 hours and email you if something breaks."
                es="Empezá por arriba de la lista. De ahí en más revisamos tu sitio cada 24 horas y te avisamos por mail si algo se rompe."
              />
            </p>
          </Step>
        </ol>

        <SampleResult />
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
