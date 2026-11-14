import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { getCurrentSite } from "@/lib/sites";
import { T } from "../../i18n";
import { LanguageSwitch } from "../../language-switch";
import { Segmented, Toggle } from "../controls";
import { Field, Section } from "../form-layout";
import { SiteForm } from "./site-form";
import { inputClass as input, primaryButtonClass, secondaryButtonClass as secondaryButton } from "../styles";
import { RemoveSite } from "./remove-site";

export const metadata: Metadata = {
  title: "Settings · Pulse",
};

const alerts = [
  { label: "New critical issues", labelEs: "Nuevos problemas críticos", hint: "Sent right away.", hintEs: "Se envían en el momento.", on: true },
  { label: "New warnings", labelEs: "Nuevas advertencias", hint: "Grouped once a day.", hintEs: "Agrupadas una vez por día.", on: true },
  { label: "Weekly summary", labelEs: "Resumen semanal", hint: "Every Monday morning.", hintEs: "Todos los lunes a la mañana.", on: false },
];

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          <T en="Settings" es="Configuración" />
        </h1>
        <p className="mt-1 text-[13px] text-[#8a91a3]">
          <T en="Manage your site, your alerts and your account." es="Administrá tu sitio, tus alertas y tu cuenta." />
        </p>
      </div>

      <div className="mt-8 divide-y divide-[#ececf1] border-t border-[#ececf1]">
        <Section
          title={<T en="Language" es="Idioma" />}
          description={<T en="The language Pulse uses across the app." es="El idioma que usa Pulse en toda la app." />}
        >
          <Row
            label={<T en="App language" es="Idioma de la app" />}
            hint={<T en="English or Spanish. Changes right away." es="Inglés o español. Cambia al instante." />}
          >
            <LanguageSwitch />
          </Row>
        </Section>

        <Section title={<T en="Site" es="Sitio" />} description={<T en="The website Pulse checks." es="El sitio web que revisa Pulse." />}>
          <Suspense fallback={<SiteFormSkeleton />}>
            <CurrentSiteForm />
          </Suspense>
        </Section>

        <Section
          title={<T en="Scanning" es="Escaneos" />}
          description={<T en="When Pulse checks your site on its own." es="Cuándo Pulse revisa tu sitio por su cuenta." />}
        >
          <Row
            label={<T en="Automatic scans" es="Escaneos automáticos" />}
            hint={
              <T
                en="Pulse scans every page and tells you what changed."
                es="Pulse escanea cada página y te avisa qué cambió."
              />
            }
          >
            <Toggle label="Automatic scans" defaultOn />
          </Row>
          <Row
            label={<T en="Frequency" es="Frecuencia" />}
            hint={<T en="Next scan in 11h 35m." es="Próximo escaneo en 11 h 35 min." />}
          >
            <Segmented label="Scan frequency" options={["6h", "12h", "24h"]} defaultValue="12h" />
          </Row>
        </Section>

        <Section title={<T en="Alerts" es="Alertas" />} description={<T en="What Pulse emails you about." es="Sobre qué te avisa Pulse por email." />}>
          <Field label={<T en="Send alerts to" es="Enviar alertas a" />} htmlFor="alert-email">
            <input id="alert-email" type="email" placeholder="you@company.com" className={input} />
          </Field>
          {alerts.map((alert) => (
            <Row key={alert.label} label={<T en={alert.label} es={alert.labelEs} />} hint={<T en={alert.hint} es={alert.hintEs} />}>
              <Toggle label={alert.label} defaultOn={alert.on} />
            </Row>
          ))}
        </Section>

        <Section
          title={<T en="Ask Pulse" es="Preguntale a Pulse" />}
          description={
            <T
              en="AI credits are used each time you ask a question."
              es="Se usan créditos de IA cada vez que hacés una pregunta."
            />
          }
        >
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-[13px] font-medium">
                120{" "}
                <span className="font-normal text-[#8a91a3]">
                  <T en="of 200 credits left" es="de 200 créditos disponibles" />
                </span>
              </p>
              <span className="text-xs text-[#8a91a3]">
                <T en="Resets Nov 1" es="Se renuevan el 1 nov" />
              </span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#f1f2f6]">
              <div className="h-full w-[60%] rounded-full bg-[#4c2882]" />
            </div>
          </div>
        </Section>

        <Suspense fallback={null}>
          <DangerZone />
        </Suspense>
      </div>

      <div className="sticky bottom-0 mt-2 flex justify-end gap-2 border-t border-black/[0.06] bg-white/90 py-4 backdrop-blur">
        <button type="button" className={secondaryButton}>
          <T en="Cancel" es="Cancelar" />
        </button>
        <button type="button" className={primaryButtonClass}>
          <T en="Save changes" es="Guardar cambios" />
        </button>
      </div>
    </main>
  );
}

function Row({ label, hint, children }: { label: ReactNode; hint: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <p className="text-[13px] font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-[#8a91a3]">{hint}</p>
      </div>
      {children}
    </div>
  );
}

async function CurrentSiteForm() {
  const site = await getCurrentSite();
  return <SiteForm site={site} />;
}

function SiteFormSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      {[0, 1].map((row) => (
        <div key={row}>
          <div className="mb-1.5 h-3 w-12 rounded bg-[#ececf1]" />
          <div className="h-9 animate-pulse rounded-full bg-[#f4f5f8]" />
        </div>
      ))}
    </div>
  );
}

async function DangerZone() {
  const site = await getCurrentSite();
  if (!site) return null;

  return (
    <Section
      title={<T en="Danger zone" es="Zona de peligro" />}
      description={<T en="This can't be undone." es="No se puede deshacer." />}
    >
      <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 p-4">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">
            <T en={`Remove ${site.url}`} es={`Eliminar ${site.url}`} />
          </p>
          <p className="mt-0.5 text-xs text-[#8a91a3]">
            <T en="Deletes the site, its scans and its history." es="Borra el sitio, sus escaneos y su historial." />
          </p>
        </div>
        <RemoveSite siteId={site.id} site={site.url} />
      </div>
    </Section>
  );
}
