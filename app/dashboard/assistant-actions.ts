"use server";

import { answerFromReport, answerFromScans } from "@/lib/assistant";
import { getCurrentUser } from "@/lib/auth";
import type { Report } from "./llm-optimization/data";

function looksLikeReport(value: unknown): value is Report {
  if (typeof value !== "object" || value === null) return false;
  const report = value as Partial<Report>;
  return (
    typeof report.host === "string" &&
    typeof report.score === "number" &&
    Array.isArray(report.findings) &&
    Array.isArray(report.areaScores) &&
    Array.isArray(report.passed)
  );
}

/**
 * Answers a question about the user's site with fixed rules, no AI: from the LLM report when one is open,
 * otherwise from the scans of the current site.
 */
export async function askPulse(question: string, lang: string, report: unknown): Promise<string> {
  await getCurrentUser();
  const text = String(question ?? "").slice(0, 500);
  const language = lang === "es" ? "es" : "en";
  if (looksLikeReport(report)) return answerFromReport(text, report, language);
  return answerFromScans(text, language);
}
