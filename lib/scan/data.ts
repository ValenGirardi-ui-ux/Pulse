import "server-only";
import { cache } from "react";
import { getCurrentSite } from "@/lib/sites";
import { createClient } from "@/lib/supabase/server";
import type { Site } from "@/lib/supabase/types";
import type { AuditReport } from "./audit";
import { describe, effortOrder, isRuleId, ruleOf, severityOrder, type Category, type Effort, type FoundIssue, type Severity } from "./rules";

export type Bilingual = { en: string; es: string };
export type ChangeKind = "new" | "fixed";
export type StoredChange = FoundIssue & { kind: ChangeKind };

export type Scan = {
  id: string;
  createdAt: string;
  source: "manual" | "scheduled";
  score: number;
  pages: number;
  durationMs: number;
  responseMs: number | null;
  statusCode: number | null;
  issues: FoundIssue[];
  changes: StoredChange[];
  /** The full audit report (version 2 scans); null for older scans. */
  report: AuditReport | null;
};

export type DashboardData = {
  site: Site | null;
  /** Newest first. */
  scans: Scan[];
  /** True when the scans table doesn't exist yet in Supabase. */
  setupNeeded: boolean;
};

export function parseIssues(value: unknown): FoundIssue[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is FoundIssue =>
      typeof item === "object" && item !== null && isRuleId(item.rule) && typeof item.page === "string",
  );
}

function parseChanges(value: unknown): StoredChange[] {
  return parseIssues(value).filter((item): item is StoredChange => {
    const kind = (item as { kind?: unknown }).kind;
    return kind === "new" || kind === "fixed";
  });
}

/** The current site and its latest scans. Loaded once per request. */
export const getDashboardData = cache(async (): Promise<DashboardData> => {
  const site = await getCurrentSite();
  if (!site) return { site: null, scans: [], setupNeeded: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .eq("site_id", site.id)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return { site, scans: [], setupNeeded: true };
    throw new Error(`Couldn't load scans: ${error.message}`);
  }

  return {
    site,
    setupNeeded: false,
    scans: data.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      source: row.source === "scheduled" ? "scheduled" : "manual",
      score: row.score,
      pages: row.pages,
      durationMs: row.duration_ms,
      responseMs: row.response_ms,
      statusCode: row.status_code,
      issues: parseIssues(row.issues),
      changes: parseChanges(row.changes),
      report: parseReport((row as { report?: unknown }).report),
    })),
  };
});

function parseReport(value: unknown): AuditReport | null {
  if (typeof value !== "object" || value === null) return null;
  const report = value as Partial<AuditReport>;
  return report.version === 2 && typeof report.categories === "object" ? (report as AuditReport) : null;
}

export function issueKey(issue: FoundIssue) {
  return `${issue.rule}:${issue.page}`;
}

export type IssueView = {
  key: string;
  severity: Severity;
  category: Category;
  page: string;
  effort: Effort;
  count: number | null;
  pages: string[];
  evidence: string | null;
  en: ReturnType<typeof describe>;
  es: ReturnType<typeof describe>;
  found: Bilingual;
};

/** The open issues (from the latest scan), worst first, with when each one first showed up. */
export function openIssues(scans: Scan[], now = Date.now()): IssueView[] {
  const latest = scans[0];
  if (!latest) return [];
  return latest.issues
    .map((issue) => {
      let foundAt = latest.createdAt;
      for (const older of scans.slice(1)) {
        if (!older.issues.some((other) => issueKey(other) === issueKey(issue))) break;
        foundAt = older.createdAt;
      }
      const rule = ruleOf(issue);
      return {
        key: issueKey(issue),
        severity: rule.severity,
        category: rule.category,
        page: issue.page,
        effort: rule.effort,
        count: issue.count ?? null,
        pages: issue.pages ?? [issue.page],
        evidence: issue.evidence ?? null,
        en: describe(issue, "en"),
        es: describe(issue, "es"),
        found: timeAgo(foundAt, now),
      };
    })
    // Worst first; for the same severity, the quickest fixes first.
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || effortOrder[a.effort] - effortOrder[b.effort]);
}

export function issueTitle(issue: FoundIssue): Bilingual {
  return { en: describe(issue, "en").title, es: describe(issue, "es").title };
}

// ---------- Dates, formatted on the server so the page and the browser always agree. ----------

export function timeAgo(iso: string, now = Date.now()): Bilingual {
  const minutes = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (minutes < 1) return { en: "just now", es: "recién" };
  if (minutes < 60) return { en: `${minutes} min ago`, es: `hace ${minutes} min` };
  const hours = Math.round(minutes / 60);
  if (hours < 24) return { en: `${hours}h ago`, es: `hace ${hours} h` };
  const days = Math.round(hours / 24);
  return { en: `${days}d ago`, es: `hace ${days} d` };
}

function startOfDay(time: number) {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function dayLabel(iso: string, now = Date.now()): Bilingual {
  const day = startOfDay(Date.parse(iso));
  const today = startOfDay(now);
  if (day === today) return { en: "Today", es: "Hoy" };
  if (today - day <= 24 * 60 * 60 * 1000) return { en: "Yesterday", es: "Ayer" };
  const date = new Date(iso);
  return {
    en: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    es: date.toLocaleDateString("es-AR", { day: "numeric", month: "short" }),
  };
}

export function clockTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function formatDuration(ms: number) {
  const seconds = Math.max(1, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
}
