import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { requireSupabaseEnv } from "./env";

/** Supabase client for Client Components. Used to upload files straight from the browser. */
export function createClient() {
  const { url, key } = requireSupabaseEnv();
  return createBrowserClient<Database>(url, key);
}
