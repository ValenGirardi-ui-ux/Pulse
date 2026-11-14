"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type PreferencesState = { ok?: boolean; error?: "invalid_email" | "setup" | "unknown" } | undefined;

/** Saves the automatic scan and email alert settings of the signed-in user. */
export async function savePreferences(_state: PreferencesState, formData: FormData): Promise<PreferencesState> {
  const user = await getCurrentUser();
  const email = String(formData.get("alerts_email") ?? "").trim().toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "invalid_email" };

  const supabase = await createClient();
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
    return { error: error.code === "42703" || error.code === "PGRST204" ? "setup" : "unknown" };
  }
  refresh();
  return { ok: true };
}
