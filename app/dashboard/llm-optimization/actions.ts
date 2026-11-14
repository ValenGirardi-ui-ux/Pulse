"use server";

import { getCurrentUser } from "@/lib/auth";
import { analyzeForLlms } from "@/lib/scan/llm";
import { BlockedAddressError } from "@/lib/scan/scanner";
import type { Report } from "./data";

export type AnalyzeResult = { ok: true; report: Report } | { ok: false; error: "invalid" | "blocked" | "unreachable" };

/** Reads a public site the way AI crawlers do and lists what to improve. Rule-based, no AI. */
export async function analyzeSiteAction(href: string): Promise<AnalyzeResult> {
  await getCurrentUser();

  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return { ok: false, error: "invalid" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, error: "invalid" };

  try {
    return { ok: true, report: await analyzeForLlms(url) };
  } catch (error) {
    if (error instanceof BlockedAddressError) return { ok: false, error: "blocked" };
    console.error("LLM analysis failed:", error);
    return { ok: false, error: "unreachable" };
  }
}
