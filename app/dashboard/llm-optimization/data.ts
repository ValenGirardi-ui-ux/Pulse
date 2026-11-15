import type { Severity } from "../data";

export type Area = "Crawl access" | "HTML structure" | "Content" | "Metadata" | "Structured data" | "JavaScript";
export type Effort = "Low" | "Medium" | "High";

export const areas: Area[] = [
  "Crawl access",
  "HTML structure",
  "Content",
  "Metadata",
  "Structured data",
  "JavaScript",
];

export type Finding = {
  id: string;
  severity: Severity;
  area: Area;
  effort: Effort;
  title: string;
  why: string;
  found: string;
  pages: string[];
  fix: string[];
  code?: { label: string; lang: string; snippet: string };
  /** Spanish text for the same finding. */
  es?: { title: string; why: string; found: string; fix: string[]; codeLabel?: string };
};

export type Report = {
  url: string;
  host: string;
  analyzedAt: string;
  pages: number;
  score: number;
  areaScores: { area: Area; score: number; findings: number }[];
  findings: Finding[];
  passed: { area: Area; title: string; titleEs?: string }[];
};

export const analysisSteps = [
  "Fetching robots.txt, sitemap.xml and llms.txt",
  "Reading raw HTML without JavaScript",
  "Following links to other pages",
  "Checking headings, landmarks and metadata",
  "Reviewing text content and structured data",
  "Writing recommendations",
];

export const severityOrder: Severity[] = ["Critical", "High", "Warning", "Minor"];

export function normalizeUrl(input: string) {
  const value = input.trim();
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!url.hostname.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}
