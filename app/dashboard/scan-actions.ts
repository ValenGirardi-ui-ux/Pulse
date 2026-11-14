"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { issueKey, parseIssues, type StoredChange } from "@/lib/scan/data";
import { scoreOf } from "@/lib/scan/rules";
import { BlockedAddressError, scanSite } from "@/lib/scan/scanner";
import { getCurrentSite } from "@/lib/sites";
import { createClient } from "@/lib/supabase/server";

export type ScanResult =
  | { ok: true; score: number; delta: number | null; issues: number; newCount: number; fixedCount: number }
  | { ok: false; error: "no_site" | "too_soon" | "blocked" | "setup" | "unknown" };

const MIN_SECONDS_BETWEEN_SCANS = 20;

/** Scans the current site, saves the result and compares it with the previous scan. */
export async function runScan(): Promise<ScanResult> {
  const user = await getCurrentUser();
  const site = await getCurrentSite();
  if (!site) return { ok: false, error: "no_site" };

  const supabase = await createClient();
  const { data: previousRows, error: previousError } = await supabase
    .from("scans")
    .select("created_at, score, issues")
    .eq("site_id", site.id)
    .order("created_at", { ascending: false })
    .limit(1);
  if (previousError) {
    console.error("Scan setup error:", previousError);
    return { ok: false, error: "setup" };
  }

  const previous = previousRows[0];
  if (previous && Date.now() - Date.parse(previous.created_at) < MIN_SECONDS_BETWEEN_SCANS * 1000) {
    return { ok: false, error: "too_soon" };
  }

  const started = Date.now();
  let outcome;
  try {
    outcome = await scanSite(site.url);
  } catch (error) {
    if (error instanceof BlockedAddressError) return { ok: false, error: "blocked" };
    console.error("Scan failed:", error);
    return { ok: false, error: "unknown" };
  }

  const score = scoreOf(outcome.issues);
  const before = previous ? parseIssues(previous.issues) : [];
  const nowKeys = new Set(outcome.issues.map(issueKey));
  const beforeKeys = new Set(before.map(issueKey));
  const changes: StoredChange[] = previous
    ? [
        ...outcome.issues.filter((issue) => !beforeKeys.has(issueKey(issue))).map((issue) => ({ ...issue, kind: "new" as const })),
        ...before.filter((issue) => !nowKeys.has(issueKey(issue))).map((issue) => ({ ...issue, kind: "fixed" as const })),
      ]
    : [];

  const { error } = await supabase.from("scans").insert({
    site_id: site.id,
    user_id: user.id,
    source: "manual",
    score,
    pages: outcome.pages,
    duration_ms: Date.now() - started,
    response_ms: outcome.responseMs,
    status_code: outcome.statusCode,
    issues: outcome.issues,
    changes,
  });
  if (error) {
    console.error("Couldn't save scan:", error);
    return { ok: false, error: "unknown" };
  }

  refresh();
  return {
    ok: true,
    score,
    delta: previous ? score - previous.score : null,
    issues: outcome.issues.length,
    newCount: changes.filter((change) => change.kind === "new").length,
    fixedCount: changes.filter((change) => change.kind === "fixed").length,
  };
}
