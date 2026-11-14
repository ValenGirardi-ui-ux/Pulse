"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { normalizeSiteUrl, rememberSite } from "@/lib/sites";
import { createClient } from "@/lib/supabase/server";

export type SiteFormState =
  | { ok?: boolean; error?: "missing_name" | "invalid_url" | "duplicate" | "unknown"; name?: string; url?: string }
  | undefined;

/** Adds a site (and switches to it), or updates one when the form includes an id. */
export async function saveSite(_state: SiteFormState, formData: FormData): Promise<SiteFormState> {
  const user = await getCurrentUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const urlInput = String(formData.get("url") ?? "").trim();

  if (!name) return { error: "missing_name", name, url: urlInput };
  const url = normalizeSiteUrl(urlInput);
  if (!url) return { error: "invalid_url", name, url: urlInput };

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from("sites").update({ name, url }).eq("id", id).eq("user_id", user.id);
    if (error) return { error: error.code === "23505" ? "duplicate" : "unknown", name, url: urlInput };
    refresh();
    return { ok: true, name, url };
  }

  const { data, error } = await supabase.from("sites").insert({ user_id: user.id, name, url }).select("id").single();
  if (error) return { error: error.code === "23505" ? "duplicate" : "unknown", name, url: urlInput };
  await rememberSite(data.id);
  refresh();
  return { ok: true };
}

export async function removeSite(id: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { error } = await supabase.from("sites").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false };
  refresh();
  return { ok: true };
}
