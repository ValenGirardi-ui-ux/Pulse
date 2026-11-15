"use client";

import { useActionState, useState, type ReactNode } from "react";
import type { Site } from "@/lib/supabase/types";
import { useT } from "../../i18n";
import { Toggle } from "../controls";
import { Field, Section } from "../form-layout";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "../styles";
import { saveSettings, type SettingsState } from "./preferences-actions";

export type Preferences = {
  autoScans: boolean;
  alertsEmail: string;
  alertNewCritical: boolean;
  alertSiteDown: boolean;
};

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

/** Current site + automatic scan + alerts, saved together with the "Save changes" button at the bottom. */
export function SettingsForm({
  site,
  preferences,
  accountEmail,
}: {
  site: Site | null;
  preferences: Preferences;
  accountEmail: string;
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, undefined);
  // Bumping this remounts the fields, which puts every input and toggle back to the saved values.
  const [version, setVersion] = useState(0);
  const t = useT();

  const errors: Record<NonNullable<NonNullable<SettingsState>["error"]>, string> = {
    missing_name: t("Give your site a name.", "Ponele un nombre a tu sitio."),
    invalid_url: t("Enter a valid domain, like yoursite.com", "Ingresá un dominio válido, como tusitio.com"),
    duplicate: t("You already have a site with that address.", "Ya tenés un sitio con esa dirección."),
    invalid_email: t("That alerts email isn't valid.", "El email para las alertas no es válido."),
    setup: t(
      "Alerts aren't set up yet. Run the preferences SQL in Supabase.",
      "Las alertas todavía no están configuradas. Corré el SQL de preferencias en Supabase.",
    ),
    unknown: t("We couldn't save your changes. Try again.", "No pudimos guardar los cambios. Probá de nuevo."),
  };
  const message = state?.error ? errors[state.error] : state?.ok && !pending ? t("Changes saved.", "Cambios guardados.") : null;

  return (
    <form action={action}>
      <div key={version} className="divide-y divide-[#ececf1]">
        {site && (
          <Section
            title={t("Current site", "Sitio actual")}
            description={t("The website the dashboard is showing now.", "El sitio que está mostrando el dashboard ahora.")}
          >
            <input type="hidden" name="site_id" value={site.id} />
            <Field label={t("Name", "Nombre")} htmlFor="site-name">
              <input
                id="site-name"
                name="site_name"
                defaultValue={state?.siteName ?? site.name}
                placeholder={t("My store", "Mi tienda")}
                className={inputClass}
              />
            </Field>
            <Field label="URL" htmlFor="site-url">
              <div className="flex h-9 overflow-hidden rounded-full border border-black/[0.08] transition-colors focus-within:border-[#4c2882]/50 focus-within:ring-4 focus-within:ring-[#4c2882]/[0.08]">
                <span className="flex items-center border-r border-[#ececf1] bg-[#fafafb] px-3 font-mono text-xs text-[#8a91a3]">
                  https://
                </span>
                <input
                  id="site-url"
                  name="site_url"
                  defaultValue={state?.siteUrl ?? site.url}
                  placeholder={t("yoursite.com", "tusitio.com")}
                  aria-invalid={state?.error === "invalid_url" ? true : undefined}
                  className="min-w-0 flex-1 px-3 font-mono text-[13px] outline-none"
                />
              </div>
            </Field>
          </Section>
        )}

        <Section
          title={t("Scanning", "Escaneos")}
          description={t("When Pulse checks your sites on its own.", "Cuándo Pulse revisa tus sitios por su cuenta.")}
        >
          <Row
            label={t("Daily automatic scan", "Escaneo automático diario")}
            hint={t("Pulse scans all your sites every 24 hours.", "Pulse escanea todos tus sitios cada 24 horas.")}
          >
            <Toggle label="Daily automatic scan" name="auto_scans" defaultOn={preferences.autoScans} />
          </Row>
        </Section>

        <Section
          title={t("Alerts", "Alertas")}
          description={t("What Pulse emails you about after the daily scan.", "Sobre qué te avisa Pulse por email después del escaneo diario.")}
        >
          <Field label={t("Send alerts to", "Enviar alertas a")} htmlFor="alerts-email">
            <input
              id="alerts-email"
              name="alerts_email"
              type="email"
              defaultValue={preferences.alertsEmail}
              placeholder={accountEmail}
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-[#8a91a3]">
              {t(`Leave it empty to use ${accountEmail}.`, `Dejalo vacío para usar ${accountEmail}.`)}
            </p>
          </Field>
          <Row
            label={t("New critical issues", "Nuevos problemas críticos")}
            hint={t("When the daily scan finds a new critical issue.", "Cuando el escaneo diario encuentra un problema crítico nuevo.")}
          >
            <Toggle label="New critical issues" name="alert_new_critical" defaultOn={preferences.alertNewCritical} />
          </Row>
          <Row
            label={t("Site down", "Sitio caído")}
            hint={t("When the daily scan can't open your site.", "Cuando el escaneo diario no puede abrir tu sitio.")}
          >
            <Toggle label="Site down" name="alert_site_down" defaultOn={preferences.alertSiteDown} />
          </Row>
        </Section>
      </div>

      <div className="sticky bottom-0 z-10 mt-2 flex flex-wrap items-center justify-end gap-x-4 gap-y-2 border-t border-black/[0.06] bg-white/90 py-4 backdrop-blur">
        <p aria-live="polite" className={`mr-auto text-xs ${state?.error ? "text-red-600" : "text-emerald-700"}`}>
          {message}
        </p>
        <div className="flex gap-2">
          <button type="button" disabled={pending} onClick={() => setVersion((n) => n + 1)} className={secondaryButtonClass}>
            {t("Cancel", "Cancelar")}
          </button>
          <button type="submit" disabled={pending} className={`${primaryButtonClass} disabled:opacity-60`}>
            {pending ? t("Saving…", "Guardando…") : t("Save changes", "Guardar cambios")}
          </button>
        </div>
      </div>
    </form>
  );
}
