import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { runAudit, type AuditOptions } from "./audit";
import { issueKey, parseIssues, type StoredChange } from "./data";
import { overallScore, type FoundIssue } from "./rules";
import { BlockedAddressError } from "./scanner";

export type ScanSaved =
  | {
      ok: true;
      score: number;
      delta: number | null;
      issues: FoundIssue[];
      changes: StoredChange[];
      statusCode: number | null;
      pages: number;
    }
  | { ok: false; error: "too_soon" | "blocked" | "setup" | "unknown" };

type SiteToScan = { id: string; url: string; user_id: string };

/**
 * Audits a site, compares it with its previous scan and saves the result. Used by "Scan now" (with the
 * user's client) and by the daily automatic scan (with the admin client).
 */
export async function scanAndSave(
  supabase: SupabaseClient<Database>,
  site: SiteToScan,
  source: "manual" | "scheduled",
  minSecondsBetweenScans: number,
  options: AuditOptions = {},
): Promise<ScanSaved> {
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
  if (previous && Date.now() - Date.parse(previous.created_at) < minSecondsBetweenScans * 1000) {
    return { ok: false, error: "too_soon" };
  }

  const started = Date.now();
  let outcome;
  try {
    outcome = await runAudit(site.url, options);
  } catch (error) {
    if (error instanceof BlockedAddressError) return { ok: false, error: "blocked" };
    console.error("Audit failed:", error);
    return { ok: false, error: "unknown" };
  }

  const score = outcome.pages > 0 ? overallScore(outcome.issues, outcome.pages) : 0;
  const before = previous ? parseIssues(previous.issues) : [];
  const nowKeys = new Set(outcome.issues.map(issueKey));
  const beforeKeys = new Set(before.map(issueKey));
  const changes: StoredChange[] = previous
    ? [
        ...outcome.issues.filter((issue) => !beforeKeys.has(issueKey(issue))).map((issue) => ({ ...issue, kind: "new" as const })),
        ...before.filter((issue) => !nowKeys.has(issueKey(issue))).map((issue) => ({ ...issue, kind: "fixed" as const })),
      ]
    : [];

  const row = {
    site_id: site.id,
    user_id: site.user_id,
    source,
    score,
    pages: outcome.pages,
    duration_ms: Date.now() - started,
    response_ms: outcome.responseMs,
    status_code: outcome.statusCode,
    issues: outcome.issues,
    changes,
  };
  let { error } = await supabase.from("scans").insert({ ...row, report: outcome.report });
  // Before migration 0007 there's no report column: save the scan without it.
  if (error && (error.code === "PGRST204" || error.code === "42703")) ({ error } = await supabase.from("scans").insert(row));
  if (error) {
    console.error("Couldn't save scan:", error);
    return { ok: false, error: "unknown" };
  }

  return {
    ok: true,
    score,
    delta: previous ? score - previous.score : null,
    issues: outcome.issues,
    changes,
    statusCode: outcome.statusCode,
    pages: outcome.pages,
  };
}
