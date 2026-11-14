import "server-only";
import { cache } from "react";
import { getCurrentUser } from "./auth";
import { createClient } from "./supabase/server";
import type { Site } from "./supabase/types";

/** All sites of the signed-in user, oldest first. Row Level Security only returns their own. */
export const getSites = cache(async (): Promise<Site[]> => {
  await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from("sites").select("*").order("created_at", { ascending: true });
  if (error) throw new Error(`Couldn't load sites: ${error.message}`);
  return data;
});

/** The site the dashboard is showing. For now, the user's first site. */
export async function getCurrentSite(): Promise<Site | null> {
  const sites = await getSites();
  return sites[0] ?? null;
}

/** Turns "https://www.Example.com/" into "www.example.com". Returns null if it isn't a valid domain. */
export function normalizeSiteUrl(input: string): string | null {
  const value = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!value || value.includes(" ")) return null;
  const host = value.split("/")[0];
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?$/.test(host)) return null;
  return value;
}

/** A readable default name from a URL: "tivvo.com" → "Tivvo". */
export function nameFromUrl(url: string): string {
  const host = url.split("/")[0].replace(/^www\./, "").split(":")[0];
  const base = host.split(".")[0] ?? host;
  return base.charAt(0).toUpperCase() + base.slice(1);
}
