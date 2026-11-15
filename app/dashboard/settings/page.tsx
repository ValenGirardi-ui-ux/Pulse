import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentSite, getSites } from "@/lib/sites";
import { createClient } from "@/lib/supabase/server";
import { T } from "../../i18n";
import { LanguageSwitch } from "../../language-switch";
import { Section } from "../form-layout";
import { SiteForm } from "./site-form";
import { RemoveSite } from "./remove-site";
import { SettingsForm } from "./preferences-form";
import { SwitchSiteButton } from "./switch-site-button";

export const metadata: Metadata = {
  title: "Settings · Pulse",
};

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          <T en="Settings" es="Configuración" />
        </h1>
        <p className="mt-1 text-[13px] text-[#8a91a3]">
          <T en="Manage your sites, your alerts and your account." es="Administrá tus sitios, tus alertas y tu cuenta." />
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

        <Suspense fallback={<SettingsSkeleton />}>
          <CurrentSettings />
        </Suspense>

        <Suspense fallback={null}>
          <YourSites />
        </Suspense>

        <Suspense fallback={null}>
          <DangerZone />
        </Suspense>
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

async function CurrentSettings() {
  const [user, site] = await Promise.all([getCurrentUser(), getCurrentSite()]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("auto_scans, alerts_email, alert_new_critical, alert_site_down")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <Section title={<T en="Scanning and alerts" es="Escaneos y alertas" />} description={<T en="Not set up yet." es="Todavía no configurado." />}>
        <p className="text-[13px] text-[#8a91a3]">
          <T
            en="Run supabase/migrations/0006_preferences.sql in the Supabase SQL Editor, then reload this page."
            es="Corré supabase/migrations/0006_preferences.sql en el SQL Editor de Supabase y recargá esta página."
          />
        </p>
      </Section>
    );
  }

  return (
    <SettingsForm
      key={site?.id ?? "none"}
      site={site}
      accountEmail={user.email}
      preferences={{
        autoScans: data?.auto_scans ?? true,
        alertsEmail: data?.alerts_email ?? "",
        alertNewCritical: data?.alert_new_critical ?? true,
        alertSiteDown: data?.alert_site_down ?? true,
      }}
    />
  );
}

async function YourSites() {
  const [sites, current] = await Promise.all([getSites(), getCurrentSite()]);

  if (sites.length === 0) {
    return (
      <div id="add-site" className="scroll-mt-24">
        <Section
          title={<T en="Your site" es="Tu sitio" />}
          description={<T en="Add the website you want Pulse to check." es="Agregá el sitio que querés que revise Pulse." />}
        >
          <SiteForm site={null} adding />
        </Section>
      </div>
    );
  }

  return (
    <div id="add-site" className="scroll-mt-24">
      <Section
        title={<T en="Your sites" es="Tus sitios" />}
        description={<T en="Switch between your sites or add another one." es="Cambiá entre tus sitios o agregá otro." />}
      >
        <ul className="overflow-hidden rounded-2xl border border-black/[0.07]">
          {sites.map((site) => (
            <li key={site.id} className="flex items-center gap-3 border-b border-[#f1f2f6] px-4 py-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{site.name}</p>
                <p className="truncate font-mono text-[11px] text-[#8a91a3]">{site.url}</p>
              </div>
              {site.id === current?.id ? (
                <span className="rounded-full bg-[#4c2882]/[0.08] px-2.5 py-1 text-[11px] font-medium text-[#4c2882]">
                  <T en="Showing now" es="Mostrando ahora" />
                </span>
              ) : (
                <SwitchSiteButton siteId={site.id} />
              )}
            </li>
          ))}
        </ul>
        <div className="rounded-2xl border border-dashed border-[#d9dce6] p-4">
          <p className="mb-4 text-[13px] font-medium">
            <T en="Add another site" es="Agregar otro sitio" />
          </p>
          <SiteForm site={null} adding />
        </div>
      </Section>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-5 py-8 md:pl-[16.5rem]" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div key={row} className="max-w-xl">
          <div className="mb-1.5 h-3 w-16 rounded bg-[#ececf1]" />
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
