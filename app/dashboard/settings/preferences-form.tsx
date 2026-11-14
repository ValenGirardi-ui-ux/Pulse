"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useT } from "../../i18n";
import { Toggle } from "../controls";
import { Field, Section } from "../form-layout";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "../styles";
import { savePreferences, type PreferencesState } from "./preferences-actions";

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

export function PreferencesForm({ preferences, accountEmail }: { preferences: Preferences; accountEmail: string }) {
  const [state, action, pending] = useActionState<PreferencesState, FormData>(savePreferences, undefined);
  // Bumping this remounts the fields, which puts every toggle and input back to the saved values.
  const [version, setVersion] = useState(0);
  const t = useT();

  const message = state?.error
    ? state.error === "invalid_email"
      ? t("That email address isn't valid.", "Ese email no es válido.")
      : state.error === "setup"
        ? t(
            "These settings aren't set up yet. Run the preferences SQL in Supabase.",
            "Estas opciones todavía no están configuradas. Corré el SQL de preferencias en Supabase.",
          )
        : t("We couldn't save your settings. Try again.", "No pudimos guardar la configuración. Probá de nuevo.")
    : state?.ok && !pending
      ? t("Settings saved.", "Configuración guardada.")
      : null;

  return (
    <form action={action}>
      <div key={version} className="divide-y divide-[#ececf1]">
        <Section
          title={t("Scanning", "Escaneos")}
          description={t("When Pulse checks your sites on its own.", "Cuándo Pulse revisa tus sitios por su cuenta.")}
        >
          <Row
            label={t("Daily automatic scan", "Escaneo automático diario")}
            hint={t(
              "Pulse scans all your sites once a day, around 9:00 (Argentina time).",
              "Pulse escanea todos tus sitios una vez por día, cerca de las 9:00 (hora de Argentina).",
            )}
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

      <div className="sticky bottom-0 mt-2 flex flex-wrap items-center justify-end gap-x-4 gap-y-2 border-t border-black/[0.06] bg-white/90 py-4 backdrop-blur">
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
