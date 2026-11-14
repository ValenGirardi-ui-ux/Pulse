import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Supabase client with the secret key: it skips Row Level Security, so only use it in trusted server code
 * that runs without a user (like the daily scan). Returns null when SUPABASE_SECRET_KEY isn't set.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
