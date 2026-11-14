"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { scanAndSave } from "@/lib/scan/run";
import { getCurrentSite } from "@/lib/sites";
import { createClient } from "@/lib/supabase/server";

export type ScanResult =
  | { ok: true; score: number; delta: number | null; issues: number; newCount: number; fixedCount: number }
  | { ok: false; error: "no_site" | "too_soon" | "blocked" | "setup" | "unknown" };

/** Scans the current site, saves the result and compares it with the previous scan. */
export async function runScan(): Promise<ScanResult> {
  const user = await getCurrentUser();
  const site = await getCurrentSite();
  if (!site) return { ok: false, error: "no_site" };

  const result = await scanAndSave(await createClient(), { id: site.id, url: site.url, user_id: user.id }, "manual", 20);
  if (!result.ok) return result;

  refresh();
  return {
    ok: true,
    score: result.score,
    delta: result.delta,
    issues: result.issues.length,
    newCount: result.changes.filter((change) => change.kind === "new").length,
    fixedCount: result.changes.filter((change) => change.kind === "fixed").length,
  };
}
