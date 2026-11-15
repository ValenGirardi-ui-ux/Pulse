import "server-only";
import { isIP } from "node:net";
import { connect } from "node:tls";
import { categories, categoryScore, type Category, type FoundIssue, type RuleId } from "./rules";
import { assertPublic, BlockedAddressError, decodeEntities, metaContent, readText, stripNoise, tags, USER_AGENT } from "./scanner";

// Pulse's SEO + GEO audit. It crawls the site from the outside, collects real evidence and turns it into
// issues with fixed, transparent rules. No AI: nothing here is estimated or invented.

const PAGE_TIMEOUT_MS = 10_000;
const SMALL_TIMEOUT_MS = 6_000;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_LISTED_PAGES = 25;
const GOOGLEBOT_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "anthropic-ai", "PerplexityBot", "Google-Extended", "CCBot"];
const ORG_TYPES = new Set([
  "Organization", "Corporation", "LocalBusiness", "OnlineStore", "OnlineBusiness", "Store", "Restaurant", "ProfessionalService",
  "MedicalBusiness", "MedicalOrganization", "EducationalOrganization", "NGO", "LegalService", "Dentist", "Hotel", "AutoDealer",
  "RealEstateAgent", "HealthAndBeautyBusiness", "HomeAndConstructionBusiness", "FoodEstablishment", "SportsActivityLocation", "Person",
]);
const VAGUE = /^(click here|here|read more|learn more|more|see more|details|link|this|haz clic aqu[ií]|hac[eé] clic ac[aá]|clic aqu[ií]|click aqu[ií]|aqu[ií]|ac[aá]|leer m[aá]s|ver m[aá]s|m[aá]s|m[aá]s informaci[oó]n|saber m[aá]s)$/i;
const SKIP_EXTENSIONS = /\.(pdf|jpe?g|png|gif|webp|avif|svg|ico|zip|rar|gz|mp4|mp3|webm|mov|xml|txt|json|css|js|woff2?|ttf|eot|docx?|xlsx?|pptx?)$/i;
const UTILITY_PATHS = /(login|signin|sign-in|signup|register|cart|carrito|checkout|account|cuenta|search|buscar|contact|contacto|404|privacy|privacidad|terms|terminos|cookies)/i;

export type PageSummary = { url: string; status: number; depth: number | null; words: number; ms: number };
export type PerformanceData = {
  score: number | null;
  lcpMs: number | null;
  cls: number | null;
  tbtMs: number | null;
  fcpMs: number | null;
  speedIndexMs: number | null;
  ttfbMs: number | null;
  fieldInpMs: number | null;
  fieldLcpMs: number | null;
  fieldCls: number | null;
};
export type NotEvaluatedKey = "authority" | "search_console" | "ai_visibility" | "semantic" | "rendering" | "lab_performance";
export type AuditReport = {
  version: 2;
  pagesCrawled: number;
  truncated: boolean;
  pages: PageSummary[];
  categories: Record<Category, number | null>;
  notEvaluated: NotEvaluatedKey[];
  performance: PerformanceData | null;
};
export type AuditOutcome = {
  issues: FoundIssue[];
  pages: number;
  responseMs: number | null;
  statusCode: number | null;
  report: AuditReport;
};
export type AuditOptions = { maxPages?: number; budgetMs?: number };

// ---------------------------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------------------------

type Hop = { url: string; status: number };
type Fetched = {
  url: URL;
  status: number;
  headers: Headers;
  body: string;
  bytes: number;
  ms: number;
  chain: Hop[];
  loop: boolean;
};

/** Follows redirects by hand (recording every hop) and only ever talks to public addresses. */
async function fetchChain(
  input: string | URL,
  { method = "GET", timeoutMs = PAGE_TIMEOUT_MS, maxBytes = MAX_HTML_BYTES, userAgent = USER_AGENT, follow = true } = {},
): Promise<Fetched> {
  let url = new URL(input);
  const chain: Hop[] = [];
  const seen = new Set<string>();
  const started = Date.now();
  const signal = AbortSignal.timeout(timeoutMs);

  for (let hop = 0; hop <= 6; hop++) {
    if (seen.has(url.href)) {
      return { url, status: 0, headers: new Headers(), body: "", bytes: 0, ms: Date.now() - started, chain, loop: true };
    }
    seen.add(url.href);
    await assertPublic(url);
    const response = await fetch(url, {
      method,
      redirect: "manual",
      signal,
      headers: { "User-Agent": userAgent, Accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
    });
    const location = response.headers.get("location");
    if (follow && response.status >= 300 && response.status < 400 && location) {
      chain.push({ url: url.href, status: response.status });
      await response.body?.cancel().catch(() => {});
      url = new URL(location, url);
      continue;
    }
    const body = method === "HEAD" ? "" : await readText(response, maxBytes);
    return {
      url,
      status: response.status,
      headers: response.headers,
      body,
      bytes: Number(response.headers.get("content-length")) || Buffer.byteLength(body),
      ms: Date.now() - started,
      chain,
      loop: false,
    };
  }
  return { url, status: 0, headers: new Headers(), body: "", bytes: 0, ms: Date.now() - started, chain, loop: true };
}

/** HEAD, falling back to a tiny GET for servers that don't support HEAD. Null on network errors. */
async function probe(url: string, userAgent = USER_AGENT) {
  try {
    let result = await fetchChain(url, { method: "HEAD", timeoutMs: SMALL_TIMEOUT_MS, userAgent });
    if ([403, 405, 501].includes(result.status)) {
      result = await fetchChain(url, { timeoutMs: SMALL_TIMEOUT_MS, maxBytes: 2048, userAgent });
    }
    return result;
  } catch (error) {
    if (error instanceof BlockedAddressError) return null;
    // DNS failures come either from our own lookup (error.code) or from fetch (error.cause.code).
    const code = (error as { cause?: { code?: string } }).cause?.code ?? (error as { code?: string }).code;
    return code === "ENOTFOUND" ? ("dns" as const) : null;
  }
}

async function getText(url: string) {
  try {
    const response = await fetchChain(url, { timeoutMs: SMALL_TIMEOUT_MS, maxBytes: 512 * 1024 });
    if (response.status !== 200 || /<html/i.test(response.body.slice(0, 500))) return null;
    return response.body;
  } catch {
    return null;
  }
}

async function inBatches<T>(items: T[], size: number, work: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) await Promise.all(items.slice(i, i + size).map(work));
}

// ---------------------------------------------------------------------------------------------
// Reading pages
// ---------------------------------------------------------------------------------------------

function textOf(fragment: string) {
  return decodeEntities(fragment.replace(/<[^>]+>/g, " "));
}

function words(text: string) {
  return text ? text.split(" ").filter((word) => /[\p{L}\p{N}]/u.test(word)) : [];
}

function normalizeWord(word: string) {
  return word.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
}

function cleanUrl(href: string, base: URL): URL | null {
  if (!href || /^(#|mailto:|tel:|javascript:|data:|sms:|whatsapp:)/i.test(href.trim())) return null;
  try {
    const url = new URL(href.trim(), base);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) if (/^utm_|^fbclid$|^gclid$/i.test(key)) url.searchParams.delete(key);
    return url;
  } catch {
    return null;
  }
}

const pathOf = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
};

type Link = { url: string; raw: string; text: string; rel: string; internal: boolean; hasImageAlt: boolean; label: string };
type Image = { src: string; hasAlt: boolean; width: boolean; height: boolean; lazy: boolean };
type Script = { src: string; inHead: boolean; deferred: boolean };
type JsonLd = { ok: boolean; items: Record<string, unknown>[] };

type Page = {
  url: string;
  path: string;
  depth: number | null;
  status: number;
  chain: Hop[];
  loop: boolean;
  headers: Headers;
  ms: number;
  bytes: number;
  html: string;
  isHtml: boolean;
  title: string;
  titleCount: number;
  description: string;
  descriptionCount: number;
  headings: { level: number; text: string }[];
  canonicals: string[];
  robots: string;
  lang: string;
  charset: boolean;
  viewport: boolean;
  links: Link[];
  images: Image[];
  scripts: Script[];
  stylesheets: string[];
  jsonld: JsonLd[];
  microdata: boolean;
  rdfa: boolean;
  hreflang: { lang: string; href: string }[];
  og: Record<string, string>;
  twitterCard: boolean;
  favicon: boolean;
  manifest: boolean;
  wordCount: number;
  textKey: string;
  shingles: Set<string>;
  longParagraphs: number;
  hasArticle: boolean;
  hasTime: boolean;
  hasAuthor: boolean;
  hasDetails: number;
  unlabeledFields: number;
  unnamedButtons: number;
  spaRoot: boolean;
  mixed: number;
};

function flattenJsonLd(value: unknown, out: Record<string, unknown>[]) {
  if (Array.isArray(value)) value.forEach((item) => flattenJsonLd(item, out));
  else if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    if ("@type" in object) out.push(object);
    for (const [key, child] of Object.entries(object)) if (key !== "@context") flattenJsonLd(child, out);
  }
}

function typesOf(item: Record<string, unknown>) {
  const type = item["@type"];
  return (Array.isArray(type) ? type : [type]).filter((t): t is string => typeof t === "string");
}

function parsePage(fetched: Fetched, depth: number | null, homeHost: string): Page {
  const url = fetched.url.href;
  const contentType = fetched.headers.get("content-type") ?? "";
  const isHtml = fetched.status === 200 && (contentType.includes("html") || /<html|<body/i.test(fetched.body.slice(0, 2000)));
  const html = isHtml ? fetched.body : "";
  const clean = stripNoise(html);
  const rawHead = html.match(/<head\b[\s\S]*?<\/head>/i)?.[0] ?? "";
  const body = clean.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? clean;
  const metas = tags(clean, "meta");
  const linkTags = tags(clean, "link");

  const titles = [...clean.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => textOf(m[1]));
  const descriptions = metas.filter((m) => (m.name ?? "").toLowerCase() === "description");
  const headings = [...body.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({ level: Number(m[1]), text: textOf(m[2]) }));

  const links: Link[] = [];
  for (const match of body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attributes = Object.fromEntries(
      [...match[1].matchAll(/([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)].map((m) => [m[1].toLowerCase(), (m[2] ?? m[3] ?? m[4] ?? "").trim()]),
    );
    const href = attributes.href;
    const target = href ? cleanUrl(href, fetched.url) : null;
    if (!target) continue;
    const inner = match[2];
    links.push({
      url: target.href,
      raw: href,
      text: textOf(inner),
      rel: (attributes.rel ?? "").toLowerCase(),
      internal: target.hostname === homeHost,
      hasImageAlt: /<img\b[^>]*\balt\s*=\s*["'][^"']+["']/i.test(inner),
      label: attributes["aria-label"] || attributes.title || "",
    });
  }

  const images: Image[] = tags(body, "img").map((img) => ({
    src: img.src || img["data-src"] || "",
    hasAlt: "alt" in img,
    width: Boolean(img.width),
    height: Boolean(img.height),
    lazy: (img.loading ?? "").toLowerCase() === "lazy",
  }));

  const scripts: Script[] = [...html.matchAll(/<script\b([^>]*)>/gi)]
    .map((m) => {
      const attributes = m[1];
      const src = attributes.match(/\bsrc\s*=\s*["']?([^"'\s>]+)/i)?.[1] ?? "";
      return {
        src,
        inHead: rawHead.includes(m[0]),
        deferred: /\b(async|defer)\b/i.test(attributes) || /type\s*=\s*["']?module/i.test(attributes),
      };
    })
    .filter((script) => script.src);

  const jsonld: JsonLd[] = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => {
    try {
      const items: Record<string, unknown>[] = [];
      flattenJsonLd(JSON.parse(m[1].trim()), items);
      return { ok: true, items };
    } catch {
      return { ok: false, items: [] };
    }
  });

  const og: Record<string, string> = {};
  for (const key of ["og:title", "og:description", "og:image", "og:site_name"]) og[key] = metaContent(metas, key);

  const text = textOf(body);
  const list = words(text);
  const normalized = list.map(normalizeWord).filter(Boolean);
  const shingles = new Set<string>();
  for (let i = 0; i + 5 <= normalized.length && shingles.size < 4000; i++) shingles.add(normalized.slice(i, i + 5).join(" "));

  const paragraphs = [...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => words(textOf(m[1])).length);

  // Form fields that people fill in, minus those with an accessible name.
  const fields = tags(body, "input").filter((input) => !/^(hidden|submit|button|image|reset)$/i.test(input.type ?? ""));
  fields.push(...tags(body, "select"), ...tags(body, "textarea"));
  const labelFor = new Set(tags(body, "label").map((label) => label.for).filter(Boolean));
  const wrapped = [...body.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/gi)].reduce(
    (sum, m) => sum + (m[1].match(/<(input|select|textarea)\b/gi)?.length ?? 0),
    0,
  );
  const unlabeled = fields.filter((field) => !(field.id && labelFor.has(field.id)) && !field["aria-label"] && !field["aria-labelledby"] && !field.title).length;

  const unnamedButtons = [...body.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)].filter(
    (m) => !textOf(m[2]) && !/aria-label(ledby)?\s*=\s*["'][^"']+/i.test(m[1]) && !/\btitle\s*=\s*["'][^"']+/i.test(m[1]) && !/<img\b[^>]*\balt\s*=\s*["'][^"']+/i.test(m[2]),
  ).length;

  const secure = fetched.url.protocol === "https:";
  const mixed = secure
    ? [
        ...tags(body, "img").map((t) => t.src),
        ...tags(html, "script").map((t) => t.src),
        ...tags(body, "iframe").map((t) => t.src),
        ...tags(body, "source").map((t) => t.src),
        ...linkTags.filter((t) => (t.rel ?? "").includes("stylesheet")).map((t) => t.href),
      ].filter((src) => src?.startsWith("http://")).length
    : 0;

  const robots = `${metaContent(metas, "robots")} ${metaContent(metas, "googlebot")} ${fetched.headers.get("x-robots-tag") ?? ""}`.toLowerCase().trim();

  return {
    url,
    path: pathOf(url),
    depth,
    status: fetched.status,
    chain: fetched.chain,
    loop: fetched.loop,
    headers: fetched.headers,
    ms: fetched.ms,
    bytes: fetched.bytes,
    html,
    isHtml,
    title: titles[0] ?? "",
    titleCount: titles.length,
    description: descriptions[0]?.content?.trim() ?? "",
    descriptionCount: descriptions.length,
    headings,
    canonicals: linkTags.filter((l) => (l.rel ?? "").toLowerCase() === "canonical").map((l) => l.href ?? ""),
    robots,
    lang: tags(clean, "html")[0]?.lang ?? "",
    charset: metas.some((m) => "charset" in m || (m["http-equiv"] ?? "").toLowerCase() === "content-type") || /charset=/i.test(fetched.headers.get("content-type") ?? ""),
    viewport: metas.some((m) => (m.name ?? "").toLowerCase() === "viewport"),
    links,
    images,
    scripts,
    stylesheets: linkTags.filter((l) => (l.rel ?? "").toLowerCase().includes("stylesheet")).map((l) => l.href ?? ""),
    jsonld,
    microdata: /\bitemscope\b/i.test(body),
    rdfa: /\btypeof\s*=|\bvocab\s*=/i.test(body),
    hreflang: linkTags
      .filter((l) => (l.rel ?? "").toLowerCase() === "alternate" && l.hreflang)
      .map((l) => ({ lang: l.hreflang, href: cleanUrl(l.href ?? "", fetched.url)?.href ?? "" })),
    og,
    twitterCard: Boolean(metaContent(metas, "twitter:card")),
    favicon: linkTags.some((l) => (l.rel ?? "").toLowerCase().split(/\s+/).includes("icon")),
    manifest: linkTags.some((l) => (l.rel ?? "").toLowerCase() === "manifest"),
    wordCount: list.length,
    textKey: normalized.length >= 50 ? normalized.join(" ") : "",
    shingles,
    longParagraphs: paragraphs.filter((count) => count > 120).length,
    hasArticle: /<article\b/i.test(body) || jsonld.some((block) => block.items.some((item) => typesOf(item).some((t) => /Article|BlogPosting/.test(t)))),
    hasTime: /<time\b/i.test(body) || /"datePublished"/.test(html),
    hasAuthor: /rel\s*=\s*["']author|class\s*=\s*["'][^"']*author|"author"\s*:/i.test(html) || Boolean(metaContent(metas, "author")),
    hasDetails: (body.match(/<details\b/gi) ?? []).length,
    unlabeledFields: Math.max(0, unlabeled - wrapped),
    unnamedButtons,
    spaRoot: /<div[^>]+id\s*=\s*["'](root|__next|app|__nuxt|svelte)["'][^>]*>\s*<\/div>/i.test(html),
    mixed,
  };
}

// ---------------------------------------------------------------------------------------------
// robots.txt
// ---------------------------------------------------------------------------------------------

type RobotsGroup = { agents: string[]; rules: { allow: boolean; pattern: string }[] };

function parseRobots(text: string | null): RobotsGroup[] {
  if (!text) return [];
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;
  let readingAgents = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const match = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!match) continue;
    const field = match[1].toLowerCase();
    const value = match[2].trim();
    if (field === "user-agent") {
      if (!current || !readingAgents) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      readingAgents = true;
      continue;
    }
    readingAgents = false;
    if (!current) continue;
    if ((field === "allow" || field === "disallow") && value) current.rules.push({ allow: field === "allow", pattern: value });
  }
  return groups;
}

function robotsAllows(groups: RobotsGroup[], agent: string, path: string) {
  const group = groups.find((g) => g.agents.includes(agent.toLowerCase())) ?? groups.find((g) => g.agents.includes("*"));
  if (!group) return true;
  let best: { allow: boolean; length: number } | null = null;
  for (const r of group.rules) {
    // robots.txt patterns: "*" matches anything and a trailing "$" anchors the end.
    const regex = new RegExp("^" + r.pattern.replace(/[.+?^{}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*"));
    if (regex.test(path) && (!best || r.pattern.length > best.length || (r.pattern.length === best.length && r.allow))) {
      best = { allow: r.allow, length: r.pattern.length };
    }
  }
  return best ? best.allow : true;
}

// ---------------------------------------------------------------------------------------------
// PageSpeed Insights (free Google API: lab Core Web Vitals, accessibility audits, field data)
// ---------------------------------------------------------------------------------------------

type PsiAudit = { score: number | null; numericValue?: number; title?: string; details?: { overallSavingsBytes?: number } };
type PsiResult = {
  lighthouseResult?: {
    categories?: Record<string, { score: number | null; auditRefs?: { id: string }[] }>;
    audits?: Record<string, PsiAudit>;
  };
  loadingExperience?: { metrics?: Record<string, { percentile?: number }> };
};

async function pageSpeed(url: string): Promise<PsiResult | null> {
  const params = new URLSearchParams({ url, strategy: "mobile" });
  for (const category of ["PERFORMANCE", "ACCESSIBILITY", "SEO"]) params.append("category", category);
  if (process.env.PAGESPEED_API_KEY) params.set("key", process.env.PAGESPEED_API_KEY);
  try {
    const response = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`, {
      signal: AbortSignal.timeout(70_000),
    });
    if (!response.ok) {
      console.error("PageSpeed Insights:", response.status);
      return null;
    }
    return (await response.json()) as PsiResult;
  } catch (error) {
    console.error("PageSpeed Insights failed:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------------------------
// The audit
// ---------------------------------------------------------------------------------------------

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
const kb = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);
const limit = (paths: Iterable<string>) => [...new Set(paths)].slice(0, MAX_LISTED_PAGES);

export async function runAudit(site: string, options: AuditOptions = {}): Promise<AuditOutcome> {
  const maxPages = options.maxPages ?? 30;
  const budgetMs = options.budgetMs ?? 50_000;
  const started = Date.now();
  const issues: FoundIssue[] = [];
  const add = (rule: RuleId, page: string, extra: Omit<FoundIssue, "rule" | "page"> = {}) => issues.push({ rule, page, ...extra });

  // 1. The home page (https first, then http).
  let home: Fetched;
  try {
    home = await fetchChain(`https://${site}`);
  } catch (httpsError) {
    if (httpsError instanceof BlockedAddressError) throw httpsError;
    try {
      home = await fetchChain(`http://${site}`);
    } catch (error) {
      if (error instanceof BlockedAddressError) throw error;
      return emptyOutcome([{ rule: "site_down", page: "/" }]);
    }
  }
  if (home.loop) return emptyOutcome([{ rule: "redirect_loop", page: "/", count: 1 }]);
  if (home.status >= 400 || home.status === 0) {
    return { ...emptyOutcome([{ rule: "http_error", page: pathOf(home.url.href), detail: String(home.status) }]), responseMs: home.ms, statusCode: home.status };
  }

  const base = home.url;
  const host = base.hostname;
  const origin = base.origin;
  const secure = base.protocol === "https:";

  // 2. Site-wide files and lab metrics, in parallel with the crawl.
  const psiPromise = pageSpeed(base.href);
  const [robotsText, llmsTxt, sitemapUrls] = await Promise.all([
    getText(`${origin}/robots.txt`),
    getText(`${origin}/llms.txt`),
    readSitemaps(origin),
  ]);
  const robots = parseRobots(robotsText);
  const sitemapSet = new Set(sitemapUrls.filter((u) => new URL(u).hostname === host).map((u) => cleanUrl(u, base)?.href ?? u));

  // 3. Crawl: breadth first from the home page, then the sitemap URLs nobody linked.
  const pages = new Map<string, Page>();
  const queued = new Map<string, number | null>();
  const queue: string[] = [];
  const enqueue = (url: string, depth: number | null) => {
    if (queued.has(url)) {
      const known = queued.get(url);
      if (depth !== null && (known === null || (known !== undefined && depth < known))) queued.set(url, depth);
      return;
    }
    if (SKIP_EXTENSIONS.test(new URL(url).pathname)) return;
    queued.set(url, depth);
    queue.push(url);
  };

  const homePage = parsePage(home, 0, host);
  pages.set(homePage.url, homePage);
  queued.set(homePage.url, 0);
  for (const hop of home.chain) queued.set(hop.url, 0);
  for (const link of homePage.links) if (link.internal) enqueue(link.url, 1);
  for (const url of sitemapSet) enqueue(url, null);

  let cursor = 0;
  const worker = async () => {
    while (cursor < queue.length && pages.size < maxPages && Date.now() - started < budgetMs) {
      const url = queue[cursor++];
      if (pages.has(url)) continue;
      const depth = queued.get(url) ?? null;
      try {
        const fetched = await fetchChain(url);
        const page = parsePage(fetched, depth, host);
        pages.set(url, page);
        if (page.url !== url) pages.set(page.url, page);
        if (page.isHtml && !page.robots.includes("nofollow")) {
          for (const link of page.links) if (link.internal) enqueue(link.url, depth === null ? null : depth + 1);
        }
      } catch {
        // Timeouts and network errors: leave the page out rather than guess.
      }
    }
  };
  await Promise.all(Array.from({ length: 5 }, worker));
  const truncated = cursor < queue.length;

  // Every fetch we made (a page reached through a redirect and directly counts twice, with different chains)…
  const fetches = [...new Set(pages.values())];
  // …and every distinct final page.
  const crawled = [...new Map(fetches.map((page) => [page.url, page])).values()];
  const htmlPages = crawled.filter((page) => page.isHtml);
  const pagesCrawled = htmlPages.length;

  // Who links to whom, for broken links, redirects and orphans.
  const inbound = new Map<string, Set<string>>();
  for (const page of htmlPages) {
    for (const link of page.links) {
      if (!link.internal || link.url === page.url) continue;
      const sources = inbound.get(link.url) ?? new Set<string>();
      sources.add(page.path);
      inbound.set(link.url, sources);
    }
  }
  const statusOf = new Map<string, Page>();
  for (const page of fetches) {
    statusOf.set(page.url, page);
    for (const hop of page.chain) statusOf.set(hop.url, page);
  }

  // 4. Extra checks, in parallel: link targets we didn't crawl, sitemap URLs, external links, images, assets, hosts, TLS, Googlebot.
  const uncrawledTargets = [...inbound.keys()].filter((url) => !statusOf.has(url)).slice(0, 15);
  const sitemapToCheck = [...sitemapSet].filter((url) => !statusOf.has(url)).slice(0, 15);
  const externalLinks = [...new Set(htmlPages.flatMap((p) => p.links.filter((l) => !l.internal).map((l) => l.url)))].slice(0, 20);
  const imageUrls = [...new Set(htmlPages.flatMap((p) => p.images.map((i) => cleanUrl(i.src, new URL(p.url))?.href).filter((u): u is string => Boolean(u))))];
  const assetUrls = [...homePage.scripts.map((s) => s.src), ...homePage.stylesheets]
    .map((src) => cleanUrl(src, base))
    .filter((u): u is URL => Boolean(u) && u!.hostname === host)
    .map((u) => u.href)
    .slice(0, 6);

  const probed = new Map<string, Awaited<ReturnType<typeof probe>>>();
  const probeAll = (urls: string[]) => inBatches(urls, 6, async (url) => void probed.set(url, await probe(url)));

  const [, , , imageInfo, assetInfo, httpVariant, otherHost, certDays, googlebot] = await Promise.all([
    probeAll(uncrawledTargets),
    probeAll(sitemapToCheck),
    probeAll(externalLinks),
    (async () => {
      const info: { url: string; status: number; size: number; type: string }[] = [];
      await inBatches(imageUrls.slice(0, 15), 5, async (url) => {
        const result = await probe(url);
        if (result && result !== "dns") {
          info.push({ url, status: result.status, size: Number(result.headers.get("content-length")) || 0, type: result.headers.get("content-type") ?? "" });
        }
      });
      return info;
    })(),
    (async () => {
      const info: { url: string; cache: string }[] = [];
      await inBatches(assetUrls, 6, async (url) => {
        const result = await probe(url);
        if (result && result !== "dns" && result.status === 200) info.push({ url, cache: (result.headers.get("cache-control") ?? "").toLowerCase() });
      });
      return info;
    })(),
    secure ? fetchChain(`http://${host}/`, { method: "HEAD", timeoutMs: SMALL_TIMEOUT_MS, follow: false }).catch(() => null) : Promise.resolve(null),
    (async () => {
      const other = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
      try {
        const result = await fetchChain(`${base.protocol}//${other}/`, { method: "HEAD", timeoutMs: SMALL_TIMEOUT_MS, follow: false });
        return { host: other, status: result.status };
      } catch {
        return null;
      }
    })(),
    secure ? certificateDaysLeft(host) : Promise.resolve(null),
    fetchChain(base.href, { userAgent: GOOGLEBOT_UA, timeoutMs: PAGE_TIMEOUT_MS }).catch(() => null),
  ]);

  // -------------------------------------------------------------- Technical SEO
  const errors5xx = crawled.filter((p) => p.status >= 500);
  if (errors5xx.length) add("page_errors_5xx", errors5xx[0].path, { count: errors5xx.length, pages: limit(errors5xx.map((p) => p.path)) });

  const loops = fetches.filter((p) => p.loop);
  if (loops.length) add("redirect_loop", loops[0].path, { count: loops.length, pages: limit(loops.map((p) => p.path)) });

  const chains = fetches.filter((p) => p.chain.length >= 2);
  if (chains.length) {
    add("redirect_chains", pathOf(chains[0].chain[0].url), {
      count: chains.length,
      pages: limit(chains.map((p) => pathOf(p.chain[0].url))),
      evidence: chains[0].chain.map((h) => `${h.status} ${pathOf(h.url)}`).join(" → ") + ` → ${pathOf(chains[0].url)}`,
    });
  }
  const temporary = fetches.filter((p) => p.chain.some((h) => h.status === 302 || h.status === 307));
  if (temporary.length) add("temporary_redirects", pathOf(temporary[0].chain[0].url), { count: temporary.length, pages: limit(temporary.map((p) => pathOf(p.chain[0].url))) });

  if (homePage.robots.includes("noindex")) add("noindex", "/", { evidence: homePage.robots });
  const noindexPages = htmlPages.filter((p) => p !== homePage && p.robots.includes("noindex"));
  if (noindexPages.length) add("noindex_pages", noindexPages[0].path, { count: noindexPages.length, pages: limit(noindexPages.map((p) => p.path)) });
  const noindexInSitemap = noindexPages.filter((p) => sitemapSet.has(p.url));
  if (noindexInSitemap.length) add("noindex_in_sitemap", "/sitemap.xml", { count: noindexInSitemap.length, pages: limit(noindexInSitemap.map((p) => p.path)) });

  const candidates = new Set([...htmlPages.map((p) => p.url), ...sitemapSet]);
  const blocked = [...candidates].filter((url) => !robotsAllows(robots, "googlebot", pathOf(url)));
  if (blocked.length) add("blocked_by_robots", "/robots.txt", { count: blocked.length, pages: limit(blocked.map(pathOf)) });

  if (!robotsText) add("missing_robots", "/robots.txt");
  if (sitemapUrls.length === 0) add("missing_sitemap", "/sitemap.xml");
  const badSitemap = [...sitemapSet].filter((url) => {
    const page = statusOf.get(url);
    if (page) return page.status !== 200 || page.url !== url;
    const result = probed.get(url);
    return result && result !== "dns" ? result.status !== 200 || result.chain.length > 0 : result === "dns";
  });
  if (badSitemap.length) add("sitemap_bad_urls", "/sitemap.xml", { count: badSitemap.length, pages: limit(badSitemap.map(pathOf)) });

  const withoutCanonical = htmlPages.filter((p) => p.canonicals.length === 0);
  if (withoutCanonical.length) add("canonical_missing", withoutCanonical[0].path, { count: withoutCanonical.length, pages: limit(withoutCanonical.map((p) => p.path)) });
  const multipleCanonical = htmlPages.filter((p) => new Set(p.canonicals).size > 1);
  if (multipleCanonical.length) add("canonical_multiple", multipleCanonical[0].path, { count: multipleCanonical.length, pages: limit(multipleCanonical.map((p) => p.path)) });

  const canonicalTargets = new Map<string, string[]>();
  for (const page of htmlPages) {
    const target = page.canonicals[0] ? cleanUrl(page.canonicals[0], new URL(page.url))?.href : null;
    if (!target || target === page.url) continue;
    canonicalTargets.set(target, [...(canonicalTargets.get(target) ?? []), page.path]);
  }
  const canonicalProbe = [...canonicalTargets.keys()].filter((url) => !statusOf.has(url)).slice(0, 10);
  await probeAll(canonicalProbe);
  const badCanonical: string[] = [];
  for (const [target, sources] of canonicalTargets) {
    const page = statusOf.get(target);
    const result = probed.get(target);
    const broken = page
      ? page.status !== 200 || page.url !== target
      : result === "dns" || (result ? result.status !== 200 || result.chain.length > 0 : false);
    if (broken) badCanonical.push(...sources);
  }
  if (badCanonical.length) add("canonical_to_error", badCanonical[0], { count: badCanonical.length, pages: limit(badCanonical) });
  const conflict = htmlPages.filter((p) => p.robots.includes("noindex") && p.canonicals[0] && cleanUrl(p.canonicals[0], new URL(p.url))?.href !== p.url);
  if (conflict.length) add("canonical_noindex_conflict", conflict[0].path, { count: conflict.length, pages: limit(conflict.map((p) => p.path)) });

  const soft404 = htmlPages.filter((p) => /\b(404|not found|page not found|no encontrad[ao]|no existe|p[aá]gina no encontrada)\b/i.test(`${p.title} ${p.headings.find((h) => h.level === 1)?.text ?? ""}`));
  if (soft404.length) add("soft_404", soft404[0].path, { count: soft404.length, pages: limit(soft404.map((p) => p.path)) });

  const byText = new Map<string, Page[]>();
  for (const page of htmlPages) if (page.textKey) byText.set(page.textKey, [...(byText.get(page.textKey) ?? []), page]);
  const exactDuplicates = [...byText.values()].filter((group) => group.length > 1).flat();
  if (exactDuplicates.length) add("duplicate_content", exactDuplicates[0].path, { count: exactDuplicates.length, pages: limit(exactDuplicates.map((p) => p.path)) });
  const nearDuplicates = new Set<string>();
  const comparable = htmlPages.filter((p) => p.wordCount >= 100 && !exactDuplicates.includes(p));
  for (let i = 0; i < comparable.length; i++) {
    for (let j = i + 1; j < comparable.length; j++) {
      const a = comparable[i].shingles;
      const b = comparable[j].shingles;
      let shared = 0;
      for (const s of a) if (b.has(s)) shared++;
      const similarity = shared / (a.size + b.size - shared || 1);
      if (similarity >= 0.85) {
        nearDuplicates.add(comparable[i].path);
        nearDuplicates.add(comparable[j].path);
      }
    }
  }
  if (nearDuplicates.size) add("near_duplicate_content", [...nearDuplicates][0], { count: nearDuplicates.size, pages: limit(nearDuplicates) });

  const jsPages = htmlPages.filter((p) => p.wordCount < 80 && p.scripts.length > 0 && (p.spaRoot || p.wordCount < 30));
  if (jsPages.length) add("js_dependent_content", jsPages[0].path, { count: jsPages.length, pages: limit(jsPages.map((p) => p.path)), evidence: `${jsPages[0].path}: ${jsPages[0].wordCount} words in the HTML` });
  const thin = htmlPages.filter((p) => p.wordCount < 150 && !jsPages.includes(p) && !UTILITY_PATHS.test(p.path) && !soft404.includes(p));
  if (thin.length) add("thin_content", thin[0].path, { count: thin.length, pages: limit(thin.map((p) => p.path)), evidence: thin.slice(0, 5).map((p) => `${p.path}: ${p.wordCount}`).join(", ") });

  const linkedUrls = new Set(htmlPages.flatMap((p) => p.links.filter((l) => l.internal).map((l) => l.url)));
  const badUrls = [...linkedUrls].filter((url) => {
    const parsed = new URL(url);
    return (
      /[A-Z]/.test(parsed.pathname) ||
      /_/.test(parsed.pathname) ||
      /%20|\s/.test(parsed.pathname) ||
      url.length > 115 ||
      [...parsed.searchParams.keys()].length > 2 ||
      /(^|[?&;])(sid|sessionid|jsessionid|phpsessid)=/i.test(parsed.search + parsed.pathname)
    );
  });
  if (badUrls.length) add("url_issues", pathOf(badUrls[0]), { count: badUrls.length, pages: limit(badUrls.map(pathOf)) });
  const slashMismatch = [...linkedUrls].filter((url) => {
    const parsed = new URL(url);
    if (parsed.pathname === "/") return false;
    const twin = new URL(url);
    twin.pathname = parsed.pathname.endsWith("/") ? parsed.pathname.slice(0, -1) : `${parsed.pathname}/`;
    return linkedUrls.has(twin.href) && !parsed.pathname.endsWith("/");
  });
  if (slashMismatch.length) add("trailing_slash", pathOf(slashMismatch[0]), { count: slashMismatch.length, pages: limit(slashMismatch.map(pathOf)) });

  if (otherHost && otherHost.status === 200) add("host_inconsistency", "/", { detail: otherHost.host, evidence: `${otherHost.host} → HTTP 200 (no redirect)` });

  const hreflangProblems = new Set<string>();
  const evidenceHreflang: string[] = [];
  const validLang = /^([a-z]{2,3}(-[A-Za-z]{2}|-[0-9]{3}|-[A-Za-z]{4})?|x-default)$/i;
  for (const page of htmlPages) {
    if (page.hreflang.length === 0) continue;
    const invalid = page.hreflang.filter((h) => !validLang.test(h.lang));
    const self = page.hreflang.some((h) => h.href === page.url);
    if (invalid.length) evidenceHreflang.push(`${page.path}: ${invalid.map((h) => h.lang).join(", ")}`);
    if (invalid.length || !self) hreflangProblems.add(page.path);
    for (const alt of page.hreflang) {
      const other = pages.get(alt.href);
      if (other?.isHtml && other.url !== page.url && !other.hreflang.some((h) => h.href === page.url)) hreflangProblems.add(page.path);
    }
  }
  if (hreflangProblems.size) add("hreflang_issues", [...hreflangProblems][0], { count: hreflangProblems.size, pages: limit(hreflangProblems), evidence: evidenceHreflang.slice(0, 3).join("; ") || undefined });

  if (googlebot) {
    const botWords = googlebot.status === 200 ? parsePage(googlebot, 0, host).wordCount : 0;
    const differentStatus = googlebot.status !== homePage.status;
    const differentContent = homePage.wordCount >= 100 && botWords < homePage.wordCount * 0.5;
    if (differentStatus || differentContent) {
      add("ua_inconsistency", "/", {
        detail: differentStatus ? `HTTP ${googlebot.status} vs ${homePage.status}` : `${botWords} vs ${homePage.wordCount} words`,
      });
    }
  }

  // -------------------------------------------------------------- On-page SEO
  const noTitle = htmlPages.filter((p) => !p.title);
  if (noTitle.length) add("missing_title", noTitle[0].path, { count: noTitle.length, pages: limit(noTitle.map((p) => p.path)) });
  const sameTitle = groupDuplicates(htmlPages, (p) => p.title.toLowerCase());
  if (sameTitle.length) add("duplicate_title", sameTitle[0].path, { count: sameTitle.length, pages: limit(sameTitle.map((p) => p.path)), evidence: `"${sameTitle[0].title}"` });
  const badTitleLength = htmlPages.filter((p) => p.title && (p.title.length < 30 || p.title.length > 60));
  if (badTitleLength.length) add("title_length", badTitleLength[0].path, { count: badTitleLength.length, pages: limit(badTitleLength.map((p) => p.path)), evidence: badTitleLength.slice(0, 3).map((p) => `${p.path}: ${p.title.length}`).join(", ") });

  const indexable = htmlPages.filter((p) => !p.robots.includes("noindex"));
  const noDescription = indexable.filter((p) => !p.description);
  if (noDescription.length) add("missing_description", noDescription[0].path, { count: noDescription.length, pages: limit(noDescription.map((p) => p.path)) });
  const sameDescription = groupDuplicates(indexable, (p) => p.description.toLowerCase());
  if (sameDescription.length) add("duplicate_description", sameDescription[0].path, { count: sameDescription.length, pages: limit(sameDescription.map((p) => p.path)) });
  const badDescriptionLength = indexable.filter((p) => p.description && (p.description.length < 70 || p.description.length > 160));
  if (badDescriptionLength.length) add("description_length", badDescriptionLength[0].path, { count: badDescriptionLength.length, pages: limit(badDescriptionLength.map((p) => p.path)) });

  const contentPages = htmlPages.filter((p) => !jsPages.includes(p));
  const noH1 = contentPages.filter((p) => !p.headings.some((h) => h.level === 1));
  if (noH1.length) add("missing_h1", noH1[0].path, { count: noH1.length, pages: limit(noH1.map((p) => p.path)) });
  const manyH1 = contentPages.filter((p) => p.headings.filter((h) => h.level === 1).length > 1);
  if (manyH1.length) add("multiple_h1", manyH1[0].path, { count: manyH1.length, pages: limit(manyH1.map((p) => p.path)) });
  const skipped = contentPages.filter((p) => p.headings.some((h, i) => i > 0 && h.level - p.headings[i - 1].level > 1));
  if (skipped.length) add("heading_hierarchy", skipped[0].path, { count: skipped.length, pages: limit(skipped.map((p) => p.path)) });
  const emptyHeadings = contentPages.reduce((sum, p) => sum + p.headings.filter((h) => !h.text).length, 0);
  if (emptyHeadings) add("empty_headings", contentPages.find((p) => p.headings.some((h) => !h.text))!.path, { count: emptyHeadings, pages: limit(contentPages.filter((p) => p.headings.some((h) => !h.text)).map((p) => p.path)) });

  const keyWords = (text: string) => new Set(words(text).map(normalizeWord).filter((w) => w.length >= 4));
  const mismatch = contentPages.filter((p) => {
    const h1 = p.headings.find((h) => h.level === 1)?.text;
    if (!p.title || !h1) return false;
    const a = keyWords(p.title);
    const b = keyWords(h1);
    if (a.size === 0 || b.size === 0) return false;
    return ![...a].some((w) => b.has(w));
  });
  if (mismatch.length) add("title_h1_mismatch", mismatch[0].path, { count: mismatch.length, pages: limit(mismatch.map((p) => p.path)) });

  const genericLinks = htmlPages.flatMap((p) => p.links.filter((l) => VAGUE.test(l.text)).map(() => p.path));
  if (genericLinks.length) add("generic_anchors", genericLinks[0], { count: genericLinks.length, pages: limit(genericLinks) });
  const emptyLinks = htmlPages.flatMap((p) => p.links.filter((l) => !l.text && !l.hasImageAlt && !l.label).map(() => p.path));
  if (emptyLinks.length) add("empty_anchors", emptyLinks[0], { count: emptyLinks.length, pages: limit(emptyLinks) });
  const headDuplicates = htmlPages.filter((p) => p.titleCount > 1 || p.descriptionCount > 1);
  if (headDuplicates.length) add("head_duplicates", headDuplicates[0].path, { count: headDuplicates.length, pages: limit(headDuplicates.map((p) => p.path)) });

  const missingSocial = [
    !homePage.og["og:title"] && "og:title",
    !homePage.og["og:description"] && "og:description",
    !homePage.og["og:image"] && "og:image",
    !homePage.twitterCard && "twitter:card",
  ].filter(Boolean) as string[];
  if (missingSocial.length) add("social_preview", "/", { detail: missingSocial.join(", ") });
  if (!homePage.favicon) {
    const ico = await probe(`${origin}/favicon.ico`);
    if (!ico || ico === "dns" || ico.status >= 400) add("missing_favicon", "/");
  }
  const longText = contentPages.filter((p) => p.longParagraphs >= 2);
  if (longText.length) add("long_paragraphs", longText[0].path, { count: longText.length, pages: limit(longText.map((p) => p.path)) });

  // -------------------------------------------------------------- GEO readiness
  const blockedBots = AI_BOTS.filter((bot) => !robotsAllows(robots, bot, "/"));
  if (blockedBots.length) add("ai_bots_blocked", "/robots.txt", { detail: blockedBots.join(", "), evidence: `Disallow: / → ${blockedBots.join(", ")}` });
  const restrictive = homePage.robots.match(/\b(noai|noimageai|nosnippet|max-snippet\s*:\s*0)\b/g);
  if (restrictive) add("ai_usage_restricted", "/", { detail: [...new Set(restrictive)].join(", ") });
  if (!llmsTxt) add("llms_txt_missing", "/llms.txt");

  const allItems = htmlPages.flatMap((p) => p.jsonld.flatMap((block) => block.items.map((item) => ({ item, page: p }))));
  const homeItems = homePage.jsonld.flatMap((block) => block.items);
  const orgs = allItems.filter(({ item }) => typesOf(item).some((t) => ORG_TYPES.has(t)));
  if (!homeItems.some((item) => typesOf(item).some((t) => ORG_TYPES.has(t)))) add("no_entity", "/");

  const orgName = orgs.map(({ item }) => item.name).find((n): n is string => typeof n === "string") ?? "";
  const siteName = homePage.og["og:site_name"];
  const comparableName = (name: string) => normalizeWord(name.replace(/\s+/g, ""));
  if (orgName && siteName && !comparableName(orgName).includes(comparableName(siteName)) && !comparableName(siteName).includes(comparableName(orgName))) {
    add("brand_inconsistency", "/", { detail: `"${orgName}" / "${siteName}"` });
  }

  const allLinks = htmlPages.flatMap((p) => p.links);
  const hasContact =
    htmlPages.some((p) => /href\s*=\s*["'](tel:|mailto:)/i.test(p.html) || /<address\b/i.test(p.html)) ||
    allItems.some(({ item }) => "telephone" in item || "email" in item || "address" in item) ||
    allLinks.some((l) => l.internal && /contact|contacto/i.test(pathOf(l.url)));
  if (!hasContact) add("no_contact_info", "/");
  if (!allLinks.some((l) => l.internal && /(about|nosotros|quienes-somos|sobre-nosotros|acerca|empresa|company|team|equipo)/i.test(pathOf(l.url)))) {
    add("no_about_page", "/");
  }
  const hasFaq =
    allItems.some(({ item }) => typesOf(item).includes("FAQPage")) ||
    htmlPages.some((p) => p.hasDetails >= 2 || p.headings.some((h) => /(faq|preguntas frecuentes|frequently asked)/i.test(h.text))) ||
    allLinks.some((l) => l.internal && /(faq|preguntas)/i.test(pathOf(l.url)));
  if (!hasFaq && pagesCrawled >= 3) add("no_faq", "/");
  const undatedArticles = htmlPages.filter((p) => p.hasArticle && (!p.hasTime || !p.hasAuthor));
  if (undatedArticles.length) add("no_author_dates", undatedArticles[0].path, { count: undatedArticles.length, pages: limit(undatedArticles.map((p) => p.path)) });

  // -------------------------------------------------------------- Structured data
  if (homePage.jsonld.length === 0 && !homePage.microdata && !homePage.rdfa) add("no_structured_data", "/");
  const invalidBlocks = htmlPages.flatMap((p) => p.jsonld.filter((b) => !b.ok).map(() => p.path));
  if (invalidBlocks.length) add("invalid_jsonld", invalidBlocks[0], { count: invalidBlocks.length, pages: limit(invalidBlocks) });

  const missingFields: string[] = [];
  const missingPages: string[] = [];
  for (const { item, page } of allItems) {
    for (const type of typesOf(item)) {
      const absent = (REQUIRED[type] ?? []).filter((alternatives) => !alternatives.some((field) => item[field] !== undefined && item[field] !== ""));
      if (absent.length) {
        missingFields.push(`${type}: ${absent.map((a) => a.join("|")).join(", ")} (${page.path})`);
        missingPages.push(page.path);
      }
    }
  }
  if (missingFields.length) add("schema_missing_fields", missingPages[0], { count: missingFields.length, pages: limit(missingPages), evidence: missingFields.slice(0, 4).join("; ") });

  const relativeUrls: string[] = [];
  for (const { item, page } of allItems) {
    for (const field of ["url", "logo", "image", "sameAs"]) {
      const values = Array.isArray(item[field]) ? (item[field] as unknown[]) : [item[field]];
      for (const value of values) if (typeof value === "string" && value && !/^https?:\/\//i.test(value)) relativeUrls.push(page.path);
    }
  }
  if (relativeUrls.length) add("schema_bad_urls", relativeUrls[0], { count: relativeUrls.length, pages: limit(relativeUrls) });
  const orgNames = [...new Set(orgs.map(({ item }) => item.name).filter((n): n is string => typeof n === "string" && n.trim() !== "").map((n) => n.trim()))];
  if (orgNames.length > 1) add("schema_duplicate_entities", "/", { detail: orgNames.slice(0, 3).join(" / ") });

  // -------------------------------------------------------------- Performance
  if (homePage.ms > 2500) add("slow_response", "/", { detail: seconds(homePage.ms) });
  else if (homePage.ms > 1000) add("slightly_slow", "/", { detail: seconds(homePage.ms) });
  const heavy = htmlPages.filter((p) => p.bytes > 1024 * 1024);
  if (heavy.length) add("heavy_page", heavy[0].path, { count: heavy.length, detail: kb(Math.max(...heavy.map((p) => p.bytes))), pages: limit(heavy.map((p) => p.path)) });
  if (homePage.bytes > 10 * 1024 && !home.headers.get("content-encoding")) add("no_compression", "/");
  const uncached = assetInfo.filter((a) => !/max-age=[1-9]|immutable/.test(a.cache));
  if (uncached.length) add("no_static_cache", pathOf(uncached[0].url), { count: uncached.length, pages: limit(uncached.map((a) => pathOf(a.url))) });
  const blocking = homePage.scripts.filter((s) => s.inHead && !s.deferred);
  if (blocking.length) add("render_blocking_scripts", "/", { count: blocking.length, evidence: blocking.slice(0, 3).map((s) => s.src).join(", ") });
  const thirdParty = new Set(homePage.scripts.map((s) => cleanUrl(s.src, base)?.hostname).filter((h): h is string => Boolean(h) && h !== host));
  if (thirdParty.size > 5) add("third_party_scripts", "/", { count: thirdParty.size, evidence: [...thirdParty].slice(0, 6).join(", ") });
  const heavyImages = imageInfo.filter((i) => i.status === 200 && i.size > 300 * 1024);
  if (heavyImages.length) add("heavy_images", pathOf(heavyImages[0].url), { count: heavyImages.length, pages: limit(heavyImages.map((i) => pathOf(i.url))), evidence: heavyImages.slice(0, 3).map((i) => `${pathOf(i.url)}: ${kb(i.size)}`).join(", ") });
  const legacy = imageInfo.filter((i) => /image\/(jpeg|png)/.test(i.type));
  const modern = imageInfo.some((i) => /image\/(webp|avif)/.test(i.type));
  if (legacy.length >= 3 && !modern) add("legacy_image_formats", pathOf(legacy[0].url), { count: legacy.length, pages: limit(legacy.map((i) => pathOf(i.url))) });
  const brokenImages = imageInfo.filter((i) => i.status >= 400);
  if (brokenImages.length) add("broken_images", pathOf(brokenImages[0].url), { count: brokenImages.length, pages: limit(brokenImages.map((i) => pathOf(i.url))) });
  const lazyFirst = contentPages.filter((p) => p.images[0]?.lazy);
  if (lazyFirst.length) add("lcp_image_lazy", lazyFirst[0].path, { count: lazyFirst.length, pages: limit(lazyFirst.map((p) => p.path)) });
  const eager = contentPages.filter((p) => p.images.length > 8 && !p.images.some((i) => i.lazy));
  if (eager.length) add("no_lazy_loading", eager[0].path, { count: eager.length, pages: limit(eager.map((p) => p.path)) });

  // -------------------------------------------------------------- Architecture & links
  const broken: { target: string; sources: string[] }[] = [];
  const toRedirect: string[] = [];
  for (const [target, sources] of inbound) {
    const page = statusOf.get(target);
    const result = probed.get(target);
    const status = page ? (page.url === target ? page.status : page.chain.length ? 301 : page.status) : result && result !== "dns" ? (result.chain.length ? 301 : result.status) : result === "dns" ? 404 : null;
    if (status === null) continue;
    if (status >= 400) broken.push({ target, sources: [...sources] });
    else if (status >= 300) toRedirect.push(...sources);
  }
  if (broken.length) {
    add("broken_internal_links", broken[0].sources[0], {
      count: broken.length,
      detail: pathOf(broken[0].target),
      pages: limit(broken.flatMap((b) => b.sources)),
      evidence: broken.slice(0, 4).map((b) => `${b.sources[0]} → ${pathOf(b.target)}`).join("; "),
    });
  }
  if (toRedirect.length) add("links_to_redirects", toRedirect[0], { count: toRedirect.length, pages: limit(toRedirect) });
  const brokenExternal = externalLinks.filter((url) => {
    const result = probed.get(url);
    if (result === "dns") return true;
    return Boolean(result) && (result!.status === 404 || result!.status === 410 || result!.status >= 500);
  });
  if (brokenExternal.length) add("broken_external_links", "/", { count: brokenExternal.length, evidence: brokenExternal.slice(0, 4).join(", ") });

  const deep = htmlPages.filter((p) => p.depth !== null && p.depth > 3);
  if (deep.length) add("deep_pages", deep[0].path, { count: deep.length, pages: limit(deep.map((p) => p.path)) });
  if (!truncated) {
    const orphans = [...sitemapSet].filter((url) => url !== homePage.url && !inbound.has(url) && statusOf.get(url)?.status === 200);
    if (orphans.length) add("orphan_pages", pathOf(orphans[0]), { count: orphans.length, pages: limit(orphans.map(pathOf)) });
    const weak = htmlPages.filter((p) => p !== homePage && (inbound.get(p.url)?.size ?? 0) === 1);
    if (weak.length) add("weak_internal_linking", weak[0].path, { count: weak.length, pages: limit(weak.map((p) => p.path)) });
  }
  const nofollow = htmlPages.flatMap((p) => p.links.filter((l) => l.internal && l.rel.includes("nofollow")).map(() => p.path));
  if (nofollow.length) add("nofollow_internal", nofollow[0], { count: nofollow.length, pages: limit(nofollow) });

  // -------------------------------------------------------------- Mobile & accessibility
  if (!homePage.viewport) add("missing_viewport", "/");
  const noLang = htmlPages.filter((p) => !p.lang);
  if (noLang.length) add("missing_lang", noLang[0].path, { count: noLang.length, pages: limit(noLang.map((p) => p.path)) });
  if (!homePage.charset) add("missing_charset", "/");
  const noAlt = htmlPages.flatMap((p) => p.images.filter((i) => !i.hasAlt).map(() => p.path));
  if (noAlt.length) add("images_without_alt", noAlt[0], { count: noAlt.length, pages: limit(noAlt) });
  const noDims = htmlPages.flatMap((p) => p.images.filter((i) => !i.width || !i.height).map(() => p.path));
  if (noDims.length) add("images_without_dimensions", noDims[0], { count: noDims.length, pages: limit(noDims) });
  const unlabeled = htmlPages.filter((p) => p.unlabeledFields > 0);
  if (unlabeled.length) add("form_labels", unlabeled[0].path, { count: unlabeled.reduce((s, p) => s + p.unlabeledFields, 0), pages: limit(unlabeled.map((p) => p.path)) });
  const unnamed = htmlPages.filter((p) => p.unnamedButtons > 0);
  if (unnamed.length) add("buttons_without_name", unnamed[0].path, { count: unnamed.reduce((s, p) => s + p.unnamedButtons, 0), pages: limit(unnamed.map((p) => p.path)) });
  if (!homePage.manifest) add("missing_manifest", "/");

  // -------------------------------------------------------------- Security & infrastructure
  if (!secure) add("no_https", "/");
  if (secure && httpVariant) {
    const location = httpVariant.headers.get("location") ?? "";
    const redirects = httpVariant.status >= 300 && httpVariant.status < 400 && location.startsWith("https://");
    if (!redirects) add("no_https_redirect", "/", { evidence: `http://${host}/ → HTTP ${httpVariant.status}` });
  }
  if (certDays !== null && certDays < 14) add("cert_expiring", "/", { detail: certDays <= 0 ? "expired" : `${certDays} days` });
  const mixed = htmlPages.filter((p) => p.mixed > 0);
  if (mixed.length) add("mixed_content", mixed[0].path, { count: mixed.reduce((s, p) => s + p.mixed, 0), pages: limit(mixed.map((p) => p.path)) });
  if (secure && !home.headers.get("strict-transport-security")) add("missing_hsts", "/");
  const csp = home.headers.get("content-security-policy") ?? "";
  const missingHeaders = [
    !csp && "Content-Security-Policy",
    !home.headers.get("x-content-type-options") && "X-Content-Type-Options",
    !home.headers.get("referrer-policy") && "Referrer-Policy",
    !home.headers.get("x-frame-options") && !/frame-ancestors/i.test(csp) && "X-Frame-Options",
  ].filter(Boolean) as string[];
  if (missingHeaders.length) add("missing_security_headers", "/", { detail: missingHeaders.join(", ") });
  const server = [home.headers.get("server"), home.headers.get("x-powered-by")].filter((v): v is string => Boolean(v) && /\d/.test(v!));
  if (server.length) add("server_version_exposed", "/", { detail: server.join(", ") });

  // -------------------------------------------------------------- PageSpeed Insights
  const psi = await psiPromise;
  const notEvaluated: NotEvaluatedKey[] = ["authority", "search_console", "ai_visibility", "semantic", "rendering"];
  let performance: PerformanceData | null = null;
  if (psi?.lighthouseResult?.audits) {
    const audits = psi.lighthouseResult.audits;
    const value = (id: string) => (typeof audits[id]?.numericValue === "number" ? audits[id].numericValue! : null);
    const field = psi.loadingExperience?.metrics ?? {};
    performance = {
      score: psi.lighthouseResult.categories?.performance?.score != null ? Math.round(psi.lighthouseResult.categories.performance.score * 100) : null,
      lcpMs: value("largest-contentful-paint"),
      cls: value("cumulative-layout-shift"),
      tbtMs: value("total-blocking-time"),
      fcpMs: value("first-contentful-paint"),
      speedIndexMs: value("speed-index"),
      ttfbMs: value("server-response-time"),
      fieldInpMs: field.INTERACTION_TO_NEXT_PAINT?.percentile ?? null,
      fieldLcpMs: field.LARGEST_CONTENTFUL_PAINT_MS?.percentile ?? null,
      fieldCls: field.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile != null ? field.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100 : null,
    };
    const lcp = performance.fieldLcpMs ?? performance.lcpMs;
    if (lcp !== null && lcp > 2500) add("lcp_poor", "/", { detail: seconds(lcp), evidence: performance.fieldLcpMs !== null ? "Field data (real users, p75)" : "Lab data (PageSpeed Insights, mobile)" });
    const cls = performance.fieldCls ?? performance.cls;
    if (cls !== null && cls > 0.1) add("cls_poor", "/", { detail: cls.toFixed(2) });
    if (performance.tbtMs !== null && performance.tbtMs > 200) add("tbt_poor", "/", { detail: `${Math.round(performance.tbtMs)} ms` });
    if (performance.fieldInpMs !== null && performance.fieldInpMs > 200) add("inp_poor", "/", { detail: `${performance.fieldInpMs} ms` });
    const savings = (audits["unused-javascript"]?.details?.overallSavingsBytes ?? 0) + (audits["unused-css-rules"]?.details?.overallSavingsBytes ?? 0);
    if (savings > 150 * 1024) add("unused_code", "/", { detail: `~${kb(savings)}` });

    const failed = (id: string) => audits[id]?.score === 0;
    if (failed("color-contrast")) add("a11y_contrast", "/");
    if (failed("target-size") || failed("tap-targets")) add("a11y_tap_targets", "/");
    if (failed("font-size")) add("a11y_font_size", "/");
    const handled = new Set(["color-contrast", "target-size", "tap-targets", "image-alt", "html-has-lang", "label", "button-name", "link-name", "meta-viewport"]);
    const otherA11y = (psi.lighthouseResult.categories?.accessibility?.auditRefs ?? []).map((ref) => ref.id).filter((id) => failed(id) && !handled.has(id));
    if (otherA11y.length) add("a11y_other", "/", { count: otherA11y.length, detail: otherA11y.slice(0, 3).map((id) => audits[id]?.title ?? id).join(", ") });
  } else {
    notEvaluated.push("lab_performance");
  }

  const categoriesScores = Object.fromEntries(categories.map((c) => [c, categoryScore(issues, c, Math.max(1, pagesCrawled))])) as Record<Category, number | null>;

  return {
    issues,
    pages: pagesCrawled,
    responseMs: homePage.ms,
    statusCode: homePage.status,
    report: {
      version: 2,
      pagesCrawled,
      truncated,
      pages: crawled.slice(0, 60).map((p) => ({ url: p.path, status: p.status, depth: p.depth, words: p.wordCount, ms: p.ms })),
      categories: categoriesScores,
      notEvaluated,
      performance,
    },
  };
}

/** Fields search engines require for rich results, per Schema.org type. Each inner list means "one of these". */
const REQUIRED: Record<string, string[][]> = {
  Organization: [["name"]],
  LocalBusiness: [["name"], ["address"]],
  WebSite: [["name"], ["url"]],
  Article: [["headline"]],
  BlogPosting: [["headline"]],
  NewsArticle: [["headline"]],
  Product: [["name"], ["offers", "review", "aggregateRating"]],
  Offer: [["price", "priceSpecification"], ["priceCurrency", "priceSpecification"]],
  AggregateRating: [["ratingValue"], ["ratingCount", "reviewCount"]],
  Review: [["author"], ["reviewRating"]],
  BreadcrumbList: [["itemListElement"]],
  FAQPage: [["mainEntity"]],
  HowTo: [["name"], ["step"]],
  Event: [["name"], ["startDate"], ["location"]],
  Person: [["name"]],
  VideoObject: [["name"], ["thumbnailUrl"], ["uploadDate"]],
  SoftwareApplication: [["name"], ["offers", "aggregateRating", "review"]],
  ImageObject: [["contentUrl", "url"]],
  Service: [["name", "serviceType"]],
};

function groupDuplicates(pages: Page[], key: (page: Page) => string) {
  const groups = new Map<string, Page[]>();
  for (const page of pages) {
    const value = key(page);
    if (value) groups.set(value, [...(groups.get(value) ?? []), page]);
  }
  return [...groups.values()].filter((group) => group.length > 1).flat();
}

/** All URLs in /sitemap.xml (or the sitemaps listed in robots.txt), following sitemap indexes. */
async function readSitemaps(origin: string) {
  const robots = await getText(`${origin}/robots.txt`);
  const listed = robots ? [...robots.matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)].map((m) => m[1]) : [];
  const toRead = listed.length ? listed.slice(0, 3) : [`${origin}/sitemap.xml`];
  const urls: string[] = [];
  const read = async (url: string, depth: number) => {
    let body = "";
    try {
      const response = await fetchChain(url, { timeoutMs: SMALL_TIMEOUT_MS, maxBytes: 2 * 1024 * 1024 });
      if (response.status !== 200) return;
      body = response.body;
    } catch {
      return;
    }
    const locs = [...body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => decodeEntities(m[1]));
    if (/<sitemapindex\b/i.test(body)) {
      if (depth < 1) await Promise.all(locs.slice(0, 5).map((loc) => read(loc, depth + 1)));
    } else {
      urls.push(...locs.slice(0, 500));
    }
  };
  await Promise.all(toRead.map((url) => read(url, 0)));
  return urls.filter((url) => /^https?:\/\//i.test(url)).slice(0, 500);
}

/** Days until the site's TLS certificate expires, or null if it can't be read. */
export async function certificateDaysLeft(host: string): Promise<number | null> {
  try {
    await assertPublic(new URL(`https://${host}/`));
  } catch {
    return null;
  }
  return new Promise((resolve) => {
    const socket = connect({ host, port: 443, servername: isIP(host) ? undefined : host, rejectUnauthorized: false, timeout: SMALL_TIMEOUT_MS }, () => {
      const certificate = socket.getPeerCertificate();
      socket.end();
      const validTo = certificate?.valid_to ? Date.parse(certificate.valid_to) : NaN;
      resolve(Number.isNaN(validTo) ? null : Math.floor((validTo - Date.now()) / 86_400_000));
    });
    socket.on("error", () => resolve(null));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(null);
    });
  });
}

function emptyOutcome(issues: FoundIssue[]): AuditOutcome {
  return {
    issues,
    pages: 0,
    responseMs: null,
    statusCode: null,
    report: {
      version: 2,
      pagesCrawled: 0,
      truncated: false,
      pages: [],
      categories: Object.fromEntries(categories.map((c) => [c, null])) as Record<Category, number | null>,
      notEvaluated: ["authority", "search_console", "ai_visibility", "semantic", "rendering", "lab_performance"],
      performance: null,
    },
  };
}
