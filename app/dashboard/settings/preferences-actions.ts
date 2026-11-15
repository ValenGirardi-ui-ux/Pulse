"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { normalizeSiteUrl } from "@/lib/sites";
import { createClient } from "@/lib/supabase/server";

export type SettingsState =
  | {
      ok?: boolean;
      error?: "missing_name" | "invalid_url" | "duplicate" | "invalid_email" | "setup" | "unknown";
      siteName?: string;
      siteUrl?: string;
    }
  | undefined;

/**
 * The single "Save changes" of Settings: the current site's name and address, the automatic scan and the
 * email alerts. Everything is checked first, so nothing is saved halfway when one field is wrong.
 */
export async function saveSettings(_state: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await getCurrentUser();
  const siteId = String(formData.get("site_id") ?? "");
  const siteName = String(formData.get("site_name") ?? "").trim();
  const siteUrlInput = String(formData.get("site_url") ?? "").trim();
  const email = String(formData.get("alerts_email") ?? "").trim().toLowerCase();
  const keep = { siteName, siteUrl: siteUrlInput };

  let siteUrl: string | null = null;
  if (siteId) {
    if (!siteName) return { error: "missing_name", ...keep };
    siteUrl = normalizeSiteUrl(siteUrlInput);
    if (!siteUrl) return { error: "invalid_url", ...keep };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "invalid_email", ...keep };

  const supabase = await createClient();

  if (siteId && siteUrl) {
    const { error } = await supabase.from("sites").update({ name: siteName, url: siteUrl }).eq("id", siteId).eq("user_id", user.id);
    if (error) return { error: error.code === "23505" ? "duplicate" : "unknown", ...keep };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      auto_scans: formData.get("auto_scans") === "on",
      alerts_email: email || null,
      alert_new_critical: formData.get("alert_new_critical") === "on",
      alert_site_down: formData.get("alert_site_down") === "on",
    })
    .eq("id", user.id);
  if (error) {
    console.error("Couldn't save preferences:", error);
    return { error: error.code === "42703" || error.code === "PGRST204" ? "setup" : "unknown", ...keep };
  }

  refresh();
  return { ok: true };
}
