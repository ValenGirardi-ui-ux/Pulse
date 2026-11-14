"use client";

import { useActionState } from "react";
import type { Site } from "@/lib/supabase/types";
import { useT } from "../../i18n";
import { Field } from "../form-layout";
import { inputClass, primaryButtonClass } from "../styles";
import { saveSite, type SiteFormState } from "./actions";

/** Edits `site`, or adds a new one when it's null. `adding` hides the "no site yet" hint. */
export function SiteForm({ site, adding = false }: { site: Site | null; adding?: boolean }) {
  const prefix = adding ? "new-site" : "site";
  const [state, action, pending] = useActionState<SiteFormState, FormData>(saveSite, undefined);
  const t = useT();

  const error =
    state?.error === "missing_name"
      ? t("Give your site a name.", "Ponele un nombre a tu sitio.")
      : state?.error === "invalid_url"
        ? t("Enter a valid domain, like yoursite.com", "Ingresá un dominio válido, como tusitio.com")
        : state?.error === "duplicate"
          ? t("You already added that site.", "Ya agregaste ese sitio.")
          : state?.error
            ? t("We couldn't save the site. Try again.", "No pudimos guardar el sitio. Probá de nuevo.")
            : null;

  return (
    <form action={action} className="space-y-5">
      {site && <input type="hidden" name="id" value={site.id} />}
      {!site && !adding && (
        <p className="rounded-xl border border-dashed border-[#4c2882]/25 bg-[#4c2882]/[0.03] px-4 py-3 text-[13px] text-[#5b6478]">
          {t("You haven't added a site yet. Add one so Pulse can start checking it.", "Todavía no agregaste un sitio. Agregá uno para que Pulse empiece a revisarlo.")}
        </p>
      )}
      <Field label={t("Name", "Nombre")} htmlFor={`${prefix}-name`}>
        <input
          id={`${prefix}-name`}
          name="name"
          defaultValue={state?.name ?? site?.name ?? ""}
          placeholder={t("My store", "Mi tienda")}
          className={inputClass}
        />
      </Field>
      <Field label="URL" htmlFor={`${prefix}-url`}>
        <div className="flex h-9 overflow-hidden rounded-full border border-black/[0.08] transition-colors focus-within:border-[#4c2882]/50 focus-within:ring-4 focus-within:ring-[#4c2882]/[0.08]">
          <span className="flex items-center border-r border-[#ececf1] bg-[#fafafb] px-3 font-mono text-xs text-[#8a91a3]">
            https://
          </span>
          <input
            id={`${prefix}-url`}
            name="url"
            defaultValue={state?.url ?? site?.url ?? ""}
            placeholder={t("yoursite.com", "tusitio.com")}
            aria-invalid={state?.error === "invalid_url" ? true : undefined}
            className="min-w-0 flex-1 px-3 font-mono text-[13px] outline-none"
          />
        </div>
      </Field>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? t("Saving…", "Guardando…") : site ? t("Save site", "Guardar sitio") : t("Add site", "Agregar sitio")}
        </button>
        <p role="status" className={`text-xs ${error ? "text-red-600" : "text-emerald-600"}`}>
          {error ?? (state?.ok && !pending ? t("Saved.", "Guardado.") : "")}
        </p>
      </div>
    </form>
  );
}
