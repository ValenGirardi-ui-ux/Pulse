import type { Severity } from "@/lib/scan/rules";

export type { Category, Severity } from "@/lib/scan/rules";

export const severityDot: Record<Severity, string> = {
  Critical: "bg-red-500",
  Warning: "bg-amber-500",
  Minor: "bg-[#c9cedd]",
};
