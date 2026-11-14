import type { Lang } from "../../i18n";
import type { Finding } from "./data";

/** Returns the finding in the chosen language. The analysis sends both; English is the base. */
export function localizeFinding(finding: Finding, lang: Lang): Finding {
  if (lang !== "es" || !finding.es) return finding;
  const text = finding.es;
  return {
    ...finding,
    title: text.title,
    why: text.why,
    found: text.found,
    fix: text.fix,
    code: finding.code && text.codeLabel ? { ...finding.code, label: text.codeLabel } : finding.code,
  };
}
