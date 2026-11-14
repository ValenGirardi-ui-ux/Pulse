import "server-only";
import type { Finding, Report } from "@/app/dashboard/llm-optimization/data";
import { getDashboardData, openIssues, timeAgo, type IssueView, type Scan } from "./scan/data";
import { describe, severityOrder, type Severity } from "./scan/rules";

// Pulse's assistant. It answers from the user's own data with fixed rules: no AI model, nothing to pay for.

export type Lang = "en" | "es";

/** Lowercase, no accents, no punctuation: "¿Qué arreglo?" → "que arreglo". */
function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const has = (text: string, pattern: RegExp) => pattern.test(text);

const INTENTS = {
  fixFirst: /\b(first|priorit|start|primero|prioriz|empiez|empez|arregl|fix|urgent|importan)/,
  scoreChange: /\b(score|puntaje|puntuacion|nota|chang|cambi|baj|subi|drop|went)/,
  critical: /\b(critic)/,
  speed: /\b(slow|fast|speed|lent|rapid|veloc|tarda|respon|performance|rendimiento)/,
  help: /^(hi|hello|hey|hola|buenas|help|ayuda|que podes|what can)/,
  llmsTxt: /llms ?\.?txt/,
  jsonLd: /\b(json-?ld|structured|estructurad|schema)/,
  explainScore: /\b(explain|explica|significa|mean|entend|understand)/,
};

const STOP_WORDS = new Set(
  "the and for with what why how does your you my mine site page this that are is was can que como por para con una uno los las del mis mio esta este hay tiene tengo sitio pagina problema problemas issue issues explain explicame decime sobre about".split(
    " ",
  ),
);

function severityLabel(severity: Severity, lang: Lang) {
  const labels: Record<Severity, [string, string]> = {
    Critical: ["critical", "crítico"],
    Warning: ["warning", "advertencia"],
    Minor: ["minor", "menor"],
  };
  return labels[severity][lang === "es" ? 1 : 0];
}

// ---------------------------------------------------------------------------------------------
// Dashboard ("Ask Pulse"): answers from the scans of the current site.
// ---------------------------------------------------------------------------------------------

function issueBlock(issue: IssueView, index: number, lang: Lang, allSteps: boolean) {
  const text = issue[lang];
  const steps = allSteps ? text.fix : text.fix.slice(0, 1);
  const how = lang === "es" ? "Cómo arreglarlo" : "How to fix it";
  return [
    `${index + 1}. ${text.title} (${severityLabel(issue.severity, lang)}, ${issue.page})`,
    `   ${text.impact}`,
    allSteps
      ? `   ${how}:\n${steps.map((step, i) => `   ${i + 1}) ${step}`).join("\n")}`
      : `   ${how}: ${steps[0] ?? ""}`,
  ].join("\n");
}

function suggestionsText(lang: Lang) {
  return lang === "es"
    ? "Podés preguntarme:\n• ¿Qué arreglo primero?\n• ¿Por qué cambió mi puntaje?\n• Explicame el problema crítico\n• ¿Mi sitio está más lento?\n• O el nombre de un problema, como \"sitemap\" o \"h1\"."
    : "You can ask me:\n• What should I fix first?\n• Why did my score change?\n• Explain my critical issue\n• Is my site slower than last week?\n• Or the name of an issue, like \"sitemap\" or \"h1\".";
}

function summary(url: string, scans: Scan[], issues: IssueView[], lang: Lang) {
  const latest = scans[0];
  const critical = issues.filter((issue) => issue.severity === "Critical").length;
  const when = timeAgo(latest.createdAt)[lang];
  const top = issues[0];
  const lines =
    lang === "es"
      ? [
          `${url} tiene un puntaje de ${latest.score}/100 (último escaneo: ${when}).`,
          issues.length === 0
            ? "No tiene problemas abiertos."
            : `Hay ${issues.length} ${issues.length === 1 ? "problema abierto" : "problemas abiertos"}${critical ? `, ${critical} ${critical === 1 ? "crítico" : "críticos"}` : ""}. El más importante: ${top.es.title}.`,
        ]
      : [
          `${url} has a score of ${latest.score}/100 (last scan: ${when}).`,
          issues.length === 0
            ? "It has no open issues."
            : `There ${issues.length === 1 ? "is 1 open issue" : `are ${issues.length} open issues`}${critical ? `, ${critical} critical` : ""}. The most important: ${top.en.title}.`,
        ];
  return `${lines.join(" ")}\n\n${suggestionsText(lang)}`;
}

function answerFixFirst(issues: IssueView[], lang: Lang) {
  if (issues.length === 0) {
    return lang === "es"
      ? "No tenés problemas abiertos. Tu sitio está bien en todo lo que revisa Pulse. Hacé un escaneo de vez en cuando para que siga así."
      : "You have no open issues. Your site passes everything Pulse checks. Scan it now and then to keep it that way.";
  }
  const top = issues.slice(0, 3);
  const intro = lang === "es" ? "Empezá por estos, en orden de importancia:" : "Start with these, in order of importance:";
  const outro =
    lang === "es"
      ? "Cuando los arregles, hacé un nuevo escaneo para confirmarlo."
      : "Once you fix them, run a new scan to confirm.";
  return [intro, ...top.map((issue, i) => issueBlock(issue, i, lang, false)), outro].join("\n\n");
}

function answerScoreChange(scans: Scan[], lang: Lang) {
  const [latest, previous] = scans;
  if (!previous) {
    return lang === "es"
      ? `Por ahora tenés un solo escaneo (puntaje ${latest.score}). Hacé otro y te digo qué cambió.`
      : `You only have one scan so far (score ${latest.score}). Run another one and I'll tell you what changed.`;
  }
  const delta = latest.score - previous.score;
  const added = latest.changes.filter((change) => change.kind === "new");
  const fixed = latest.changes.filter((change) => change.kind === "fixed");
  const title = (issue: (typeof added)[number]) => describe(issue, lang).title;

  const head =
    delta === 0
      ? lang === "es"
        ? `Tu puntaje no cambió: sigue en ${latest.score}.`
        : `Your score didn't change: it's still ${latest.score}.`
      : lang === "es"
        ? `Tu puntaje ${delta > 0 ? "subió" : "bajó"} de ${previous.score} a ${latest.score} (${delta > 0 ? "+" : ""}${delta}).`
        : `Your score went ${delta > 0 ? "up" : "down"} from ${previous.score} to ${latest.score} (${delta > 0 ? "+" : ""}${delta}).`;

  const parts = [head];
  if (added.length) {
    parts.push(
      `${lang === "es" ? "Problemas nuevos" : "New issues"}:\n${added.map((issue) => `• ${title(issue)} (${issue.page})`).join("\n")}`,
    );
  }
  if (fixed.length) {
    parts.push(
      `${lang === "es" ? "Problemas resueltos" : "Fixed issues"}:\n${fixed.map((issue) => `• ${title(issue)} (${issue.page})`).join("\n")}`,
    );
  }
  if (!added.length && !fixed.length) {
    parts.push(
      lang === "es"
        ? "Los problemas son los mismos que en el escaneo anterior."
        : "The issues are the same as in the previous scan.",
    );
  }
  return parts.join("\n\n");
}

function answerCritical(issues: IssueView[], lang: Lang) {
  const critical = issues.filter((issue) => issue.severity === "Critical");
  if (critical.length === 0) {
    const next = issues[0];
    return lang === "es"
      ? `No tenés problemas críticos.${next ? ` El más importante ahora es: ${next.es.title}.` : ""}`
      : `You have no critical issues.${next ? ` The most important one now is: ${next.en.title}.` : ""}`;
  }
  return critical.map((issue, i) => issueBlock(issue, i, lang, true)).join("\n\n");
}

function answerSpeed(scans: Scan[], lang: Lang) {
  const timed = scans.filter((scan) => scan.responseMs !== null).slice(0, 6);
  const latest = timed[0];
  if (!latest) {
    return lang === "es"
      ? "En los últimos escaneos tu sitio no respondió, así que no pude medir la velocidad."
      : "Your site didn't respond in the last scans, so I couldn't measure its speed.";
  }
  const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
  const older = timed.slice(1);
  if (older.length === 0) {
    return lang === "es"
      ? `En el último escaneo tu sitio respondió en ${seconds(latest.responseMs!)}. Hacé más escaneos y te digo si se pone más lento.`
      : `In the last scan your site responded in ${seconds(latest.responseMs!)}. Run more scans and I'll tell you if it gets slower.`;
  }
  const average = older.reduce((sum, scan) => sum + scan.responseMs!, 0) / older.length;
  const ratio = latest.responseMs! / average;
  const verdict =
    ratio > 1.3
      ? lang === "es"
        ? "Está más lento que antes."
        : "It's slower than before."
      : ratio < 0.77
        ? lang === "es"
          ? "Está más rápido que antes."
          : "It's faster than before."
        : lang === "es"
          ? "Está más o menos igual que antes."
          : "It's about the same as before.";
  const tip =
    latest.responseMs! > 1000
      ? lang === "es"
        ? "\n\nMás de 1 segundo es bastante: activar caché o una CDN suele ayudar mucho."
        : "\n\nOver 1 second is a lot: turning on caching or a CDN usually helps a lot."
      : "";
  return (
    (lang === "es"
      ? `Último escaneo: ${seconds(latest.responseMs!)}. Promedio de los ${older.length} anteriores: ${seconds(average)}. ${verdict}`
      : `Last scan: ${seconds(latest.responseMs!)}. Average of the previous ${older.length}: ${seconds(average)}. ${verdict}`) + tip
  );
}

function findIssue(question: string, issues: IssueView[]) {
  const words = question.split(" ").filter((word) => word.length >= 2 && !STOP_WORDS.has(word));
  if (words.length === 0) return null;
  let best: { issue: IssueView; hits: number } | null = null;
  for (const issue of issues) {
    const haystack = normalize(`${issue.key} ${issue.en.title} ${issue.es.title} ${issue.page}`);
    const hits = words.filter((word) => haystack.includes(word)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { issue, hits };
  }
  return best?.issue ?? null;
}

export async function answerFromScans(question: string, lang: Lang): Promise<string> {
  const data = await getDashboardData();
  if (!data.site) {
    return lang === "es"
      ? "Todavía no agregaste un sitio. Agregalo en Configuración y hacé un escaneo: después te puedo decir qué arreglar."
      : "You haven't added a site yet. Add it in Settings and run a scan: then I can tell you what to fix.";
  }
  if (data.scans.length === 0) {
    return lang === "es"
      ? `Todavía no escaneaste ${data.site.url}. Tocá "Escanear ahora" arriba y después preguntame lo que quieras.`
      : `You haven't scanned ${data.site.url} yet. Press "Scan now" at the top, then ask me anything.`;
  }

  const issues = openIssues(data.scans);
  const q = normalize(question);

  if (has(q, INTENTS.critical)) return answerCritical(issues, lang);
  if (has(q, INTENTS.speed)) return answerSpeed(data.scans, lang);
  if (has(q, INTENTS.scoreChange) && !has(q, INTENTS.fixFirst)) return answerScoreChange(data.scans, lang);
  if (has(q, INTENTS.fixFirst)) return answerFixFirst(issues, lang);

  const match = findIssue(q, issues);
  if (match) return issueBlock(match, 0, lang, true).replace(/^1\. /, "");

  if (has(q, INTENTS.help)) return suggestionsText(lang);
  return summary(data.site.url, data.scans, issues, lang);
}

// ---------------------------------------------------------------------------------------------
// LLM Optimization: answers from the report on screen.
// ---------------------------------------------------------------------------------------------

const effortOrder = { Low: 0, Medium: 1, High: 2 } as const;

const areaNamesEs: Record<Finding["area"], string> = {
  "Crawl access": "Acceso de rastreo",
  "HTML structure": "Estructura HTML",
  Content: "Contenido",
  Metadata: "Metadatos",
  "Structured data": "Datos estructurados",
  JavaScript: "JavaScript",
};

const areaName = (area: Finding["area"], lang: Lang) => (lang === "es" ? areaNamesEs[area] : area);

function localized(finding: Finding, lang: Lang) {
  if (lang !== "es" || !finding.es) return { title: finding.title, why: finding.why, found: finding.found, fix: finding.fix };
  return { title: finding.es.title, why: finding.es.why, found: finding.es.found, fix: finding.es.fix };
}

function llmSuggestions(lang: Lang) {
  return lang === "es"
    ? "Podés preguntarme:\n• ¿Qué arreglo primero?\n• Escribime un llms.txt para este sitio\n• Creá el JSON-LD para mi página principal\n• Explicame mi puntaje\n• O un tema: bots, JavaScript, títulos, metadatos, contenido."
    : "You can ask me:\n• What should I fix first?\n• Write an llms.txt for this site\n• Create the JSON-LD for my home page\n• Explain my score\n• Or a topic: bots, JavaScript, headings, metadata, content.";
}

const AREA_WORDS: { area: Finding["area"]; pattern: RegExp }[] = [
  { area: "Crawl access", pattern: /\b(bot|bots|robots|crawl|rastre|sitemap|gpt|claude|perplexity)/ },
  { area: "JavaScript", pattern: /\b(javascript|js|script|render)/ },
  { area: "HTML structure", pattern: /\b(heading|h1|h2|titulo|estructura|structure|main|semantic|semantic)/ },
  { area: "Metadata", pattern: /\b(meta|description|descripcion|title|canonical|lang|idioma|open graph)/ },
  { area: "Content", pattern: /\b(content|contenido|link|parrafo|paragraph|imagen|image|alt|fecha|date)/ },
  { area: "Structured data", pattern: /\b(structured|estructurad|schema)/ },
];

function codeOf(report: Report, id: string) {
  return report.findings.find((finding) => finding.id === id)?.code?.snippet ?? null;
}

export function answerFromReport(question: string, report: Report, lang: Lang): string {
  const q = normalize(question);
  const host = report.host;

  if (has(q, INTENTS.llmsTxt)) {
    const hasOne = report.passed.some((item) => item.title === "llms.txt found");
    const snippet =
      codeOf(report, "no-llms-txt") ??
      `# ${host}\n\n> One sentence about what you do and who it's for.\n\n## Main pages\n\n- [Home](https://${host}/): What you offer\n- [Contact](https://${host}/contact): How to reach you`;
    const intro = hasOne
      ? lang === "es"
        ? `Tu sitio ya tiene un llms.txt. Si querés mejorarlo, este es un buen formato:`
        : `Your site already has an llms.txt. If you want to improve it, this is a good format:`
      : lang === "es"
        ? `Creá un archivo llms.txt en la raíz de tu sitio (https://${host}/llms.txt) con algo así, cambiando los textos por los tuyos:`
        : `Create an llms.txt file at the root of your site (https://${host}/llms.txt) with something like this, using your own text:`;
    return `${intro}\n\n${snippet}`;
  }

  if (has(q, INTENTS.jsonLd)) {
    const snippet =
      codeOf(report, "no-structured-data") ??
      `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Your company",\n  "url": "https://${host}/"\n}\n</script>`;
    const intro =
      lang === "es"
        ? "Pegá esto dentro del <head> de tu página principal y cambiá el nombre, la URL y el logo por los tuyos:"
        : "Paste this inside the <head> of your home page and change the name, URL and logo to yours:";
    const outro =
      lang === "es"
        ? "Después validalo con la prueba de resultados enriquecidos de Google."
        : "Then validate it with Google's Rich Results Test.";
    return `${intro}\n\n${snippet}\n\n${outro}`;
  }

  const sorted = [...report.findings].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity] || effortOrder[a.effort] - effortOrder[b.effort],
  );

  if (has(q, INTENTS.fixFirst)) {
    if (sorted.length === 0) {
      return lang === "es"
        ? "No hay nada para arreglar: tu sitio pasó todos los controles."
        : "There's nothing to fix: your site passed every check.";
    }
    const intro = lang === "es" ? "Empezá por estos (los más graves y fáciles primero):" : "Start with these (most severe and easiest first):";
    return [
      intro,
      ...sorted.slice(0, 3).map((finding, i) => {
        const text = localized(finding, lang);
        return `${i + 1}. ${text.title} (${severityLabel(finding.severity, lang)})\n   ${text.why}\n   ${lang === "es" ? "Primer paso" : "First step"}: ${text.fix[0] ?? ""}`;
      }),
    ].join("\n\n");
  }

  if (has(q, INTENTS.explainScore) || has(q, INTENTS.scoreChange)) {
    const areas = [...report.areaScores].sort((a, b) => a.score - b.score);
    const lines = areas.map(({ area, score, findings }) => {
      const count = findings ? ` (${findings} ${lang === "es" ? (findings === 1 ? "hallazgo" : "hallazgos") : findings === 1 ? "finding" : "findings"})` : "";
      return `• ${areaName(area, lang)}: ${score}/100${count}`;
    });
    const verdict =
      report.score >= 85
        ? lang === "es"
          ? "Está muy bien: las IAs pueden leer y citar tu sitio sin problemas."
          : "That's very good: AI assistants can read and cite your site without trouble."
        : report.score >= 70
          ? lang === "es"
            ? "Está bien, pero hay cosas que hacen más difícil que las IAs entiendan tu sitio."
            : "That's fine, but some things make it harder for AI assistants to understand your site."
          : lang === "es"
            ? "Está bajo: a las IAs les cuesta leer tu sitio, así que es poco probable que lo recomienden."
            : "That's low: AI assistants struggle to read your site, so they're unlikely to recommend it.";
    return lang === "es"
      ? `Tu puntaje es ${report.score}/100, el promedio de estas áreas (de peor a mejor):\n${lines.join("\n")}\n\n${verdict}`
      : `Your score is ${report.score}/100, the average of these areas (worst first):\n${lines.join("\n")}\n\n${verdict}`;
  }

  const area = AREA_WORDS.find(({ pattern }) => pattern.test(q))?.area;
  if (area) {
    const items = sorted.filter((finding) => finding.area === area);
    if (items.length === 0) {
      return lang === "es" ? `En "${areaName(area, lang)}" no encontré problemas.` : `I found no issues in "${area}".`;
    }
    return items
      .map((finding) => {
        const text = localized(finding, lang);
        return `${text.title}\n${text.found}\n${text.fix.map((step, i) => `${i + 1}) ${step}`).join("\n")}`;
      })
      .join("\n\n");
  }

  const critical = sorted.filter((finding) => finding.severity === "Critical").length;
  const head =
    lang === "es"
      ? `${host} tiene ${report.score}/100 en optimización para IA, con ${sorted.length} ${sorted.length === 1 ? "hallazgo" : "hallazgos"}${critical ? ` (${critical} ${critical === 1 ? "crítico" : "críticos"})` : ""}.`
      : `${host} scores ${report.score}/100 for AI optimization, with ${sorted.length} finding${sorted.length === 1 ? "" : "s"}${critical ? ` (${critical} critical)` : ""}.`;
  return `${head}\n\n${llmSuggestions(lang)}`;
}
