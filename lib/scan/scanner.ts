import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { FoundIssue } from "./rules";

// Scans one site from the outside, the way a visitor's browser would see it. No AI, no external APIs.

const USER_AGENT = "Mozilla/5.0 (compatible; PulseBot/1.0; +https://pulse.app)";
const PAGE_TIMEOUT_MS = 12_000;
const SMALL_TIMEOUT_MS = 5_000;
const MAX_HTML_BYTES = 3 * 1024 * 1024;
const MAX_LINKS = 15;

export type ScanOutcome = {
  issues: FoundIssue[];
  pages: number;
  responseMs: number | null;
  statusCode: number | null;
};

type Fetched = { url: URL; status: number; headers: Headers; body: string; ms: number };

class BlockedAddressError extends Error {}

// ---------- Only public addresses: never let a scan reach localhost or a private network. ----------

function isPrivateIp(ip: string): boolean {
  if (ip.startsWith("::ffff:")) return isPrivateIp(ip.slice(7));
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  const v6 = ip.toLowerCase();
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80") || v6.startsWith("ff");
}

async function assertPublic(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new BlockedAddressError("protocol");
  if (url.port && url.port !== "80" && url.port !== "443") throw new BlockedAddressError("port");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new BlockedAddressError("host");
  }
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new BlockedAddressError("private address");
  }
}

/** fetch() that checks every redirect hop is a public address and stops reading huge bodies. */
async function fetchPublic(
  input: string | URL,
  { method = "GET", follow = true, timeoutMs = SMALL_TIMEOUT_MS, maxBytes = 256 * 1024 } = {},
): Promise<Fetched> {
  let url = new URL(input);
  const started = Date.now();
  const signal = AbortSignal.timeout(timeoutMs);

  for (let hop = 0; hop <= 5; hop++) {
    await assertPublic(url);
    const response = await fetch(url, {
      method,
      redirect: "manual",
      signal,
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
    });
    const location = response.headers.get("location");
    if (follow && response.status >= 300 && response.status < 400 && location) {
      await response.body?.cancel();
      url = new URL(location, url);
      continue;
    }
    const body = method === "HEAD" ? "" : await readText(response, maxBytes);
    return { url, status: response.status, headers: response.headers, body, ms: Date.now() - started };
  }
  throw new Error("Too many redirects");
}

async function readText(response: Response, maxBytes: number) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.byteLength;
  }
  await reader.cancel().catch(() => {});
  return new TextDecoder().decode(Buffer.concat(chunks).subarray(0, maxBytes));
}

// ---------- Reading HTML without a parser: good enough for these checks. ----------

function stripNoise(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<template\b[\s\S]*?<\/template>/gi, " ");
}

function parseAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const match of source.matchAll(/([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    attributes[match[1].toLowerCase()] = (match[2] ?? match[3] ?? match[4] ?? "").trim();
  }
  return attributes;
}

function tags(html: string, name: string) {
  return [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, "gi"))].map((match) => parseAttributes(match[1]));
}

function metaContent(metas: Record<string, string>[], key: string) {
  const meta = metas.find((m) => (m.name ?? m.property ?? "").toLowerCase() === key);
  return meta?.content?.trim() ?? "";
}

function decodeEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatSeconds(ms: number) {
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

// ---------- The scan ----------

/** Scans `site`, saved as "example.com" or "example.com/path", and lists what's wrong. */
export async function scanSite(site: string): Promise<ScanOutcome> {
  const issues: FoundIssue[] = [];

  let home: Fetched;
  try {
    home = await fetchPublic(`https://${site}`, { timeoutMs: PAGE_TIMEOUT_MS, maxBytes: MAX_HTML_BYTES });
  } catch (httpsError) {
    if (httpsError instanceof BlockedAddressError) throw httpsError;
    try {
      home = await fetchPublic(`http://${site}`, { timeoutMs: PAGE_TIMEOUT_MS, maxBytes: MAX_HTML_BYTES });
    } catch (error) {
      if (error instanceof BlockedAddressError) throw error;
      return { issues: [{ rule: "site_down", page: "/" }], pages: 0, responseMs: null, statusCode: null };
    }
  }

  const page = home.url.pathname || "/";
  if (home.status >= 400) {
    issues.push({ rule: "http_error", page, detail: String(home.status) });
    return { issues, pages: 1, responseMs: home.ms, statusCode: home.status };
  }

  const origin = home.url.origin;
  const secure = home.url.protocol === "https:";
  const html = home.body;
  const clean = stripNoise(html);
  const metas = tags(clean, "meta");
  const links = tags(clean, "link");

  // Run the extra requests at the same time.
  const [httpRedirects, robots, sitemapFromRoot, favicon, brokenLinks] = await Promise.all([
    secure ? redirectsToHttps(home.url) : Promise.resolve(false),
    fetchPublic(`${origin}/robots.txt`).catch(() => null),
    fetchPublic(`${origin}/sitemap.xml`).catch(() => null),
    hasFavicon(links, origin),
    findBrokenLinks(clean, home.url),
  ]);

  // Development
  if (!secure) issues.push({ rule: "no_https", page });
  if (secure && httpRedirects === false) issues.push({ rule: "no_https_redirect", page });
  if (secure && !home.headers.get("strict-transport-security")) issues.push({ rule: "missing_hsts", page });

  if (secure) {
    const insecure = [
      ...tags(clean, "img").map((t) => t.src),
      ...tags(html, "script").map((t) => t.src),
      ...tags(clean, "iframe").map((t) => t.src),
      ...links.filter((t) => (t.rel ?? "").includes("stylesheet")).map((t) => t.href),
    ].filter((src) => src?.startsWith("http://")).length;
    if (insecure > 0) issues.push({ rule: "mixed_content", page, count: insecure });
  }

  if (!metas.some((m) => (m.name ?? "").toLowerCase() === "viewport")) issues.push({ rule: "missing_viewport", page });
  if (!tags(clean, "html")[0]?.lang) issues.push({ rule: "missing_lang", page });
  if (brokenLinks.count > 0) {
    issues.push({ rule: "broken_links", page, count: brokenLinks.count, detail: brokenLinks.first });
  }

  // SEO
  const robotsMeta = `${metaContent(metas, "robots")} ${home.headers.get("x-robots-tag") ?? ""}`.toLowerCase();
  if (robotsMeta.includes("noindex")) issues.push({ rule: "noindex", page });

  const title = decodeEntities(clean.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  if (!title) issues.push({ rule: "missing_title", page });
  else if (title.length < 10 || title.length > 65) issues.push({ rule: "title_length", page, detail: String(title.length) });

  if (!metaContent(metas, "description")) issues.push({ rule: "missing_description", page });

  const h1Count = tags(clean, "h1").length;
  if (h1Count === 0) issues.push({ rule: "missing_h1", page });
  else if (h1Count > 1) issues.push({ rule: "multiple_h1", page, count: h1Count });

  if (!links.some((l) => (l.rel ?? "").toLowerCase() === "canonical")) issues.push({ rule: "missing_canonical", page });

  const noAlt = tags(clean, "img").filter((img) => !("alt" in img)).length;
  if (noAlt > 0) issues.push({ rule: "images_without_alt", page, count: noAlt });

  const robotsOk = robots && robots.status === 200 && !/<html/i.test(robots.body);
  if (!robotsOk) issues.push({ rule: "missing_robots", page: "/robots.txt" });
  const sitemapInRobots = robotsOk && /^\s*sitemap\s*:/im.test(robots.body);
  const sitemapOk = sitemapInRobots || (sitemapFromRoot?.status === 200 && /<(urlset|sitemapindex)\b/i.test(sitemapFromRoot.body));
  if (!sitemapOk) issues.push({ rule: "missing_sitemap", page: "/sitemap.xml" });

  // Performance
  if (home.ms > 2500) issues.push({ rule: "slow_response", page, detail: formatSeconds(home.ms) });
  else if (home.ms > 1000) issues.push({ rule: "slightly_slow", page, detail: formatSeconds(home.ms) });

  const bytes = Buffer.byteLength(html);
  if (bytes > 1024 * 1024) issues.push({ rule: "heavy_page", page, detail: formatSize(bytes) });
  if (bytes > 10 * 1024 && !home.headers.get("content-encoding")) issues.push({ rule: "no_compression", page });

  // Marketing
  if (!metaContent(metas, "og:title") || !metaContent(metas, "og:image")) {
    issues.push({ rule: "missing_social_preview", page });
  }
  const analytics =
    /googletagmanager\.com|google-analytics\.com|gtag\(|plausible\.io|umami|clarity\.ms|segment\.(com|io)|posthog|_vercel\/insights|@vercel\/analytics|hotjar|matomo|fathom|simpleanalytics|cloudflareinsights/i;
  if (!analytics.test(html)) issues.push({ rule: "no_analytics", page });
  if (!favicon) issues.push({ rule: "missing_favicon", page });

  return { issues, pages: 1 + brokenLinks.checked, responseMs: home.ms, statusCode: home.status };
}

/** Whether the http:// version of the page redirects to https://. Null when http:// isn't reachable at all. */
async function redirectsToHttps(url: URL): Promise<boolean | null> {
  try {
    const plain = new URL(url);
    plain.protocol = "http:";
    const response = await fetchPublic(plain, { method: "HEAD", follow: false });
    const location = response.headers.get("location") ?? "";
    return response.status >= 300 && response.status < 400 && new URL(location, plain).protocol === "https:";
  } catch {
    return null;
  }
}

async function hasFavicon(links: Record<string, string>[], origin: string) {
  if (links.some((l) => (l.rel ?? "").toLowerCase().split(/\s+/).includes("icon"))) return true;
  const response = await fetchPublic(`${origin}/favicon.ico`, { method: "HEAD" }).catch(() => null);
  return Boolean(response && response.status < 400);
}

/** Checks up to MAX_LINKS links to other pages of the same site. */
async function findBrokenLinks(html: string, base: URL) {
  const seen = new Set<string>();
  for (const anchor of tags(html, "a")) {
    const href = anchor.href;
    if (!href || /^(#|mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    let target: URL;
    try {
      target = new URL(href, base);
    } catch {
      continue;
    }
    if (target.origin !== base.origin) continue;
    target.hash = "";
    if (target.href === base.href) continue;
    seen.add(target.href);
    if (seen.size >= MAX_LINKS) break;
  }

  const targets = [...seen];
  const broken: string[] = [];
  let checked = 0;

  // A few at a time, so we don't hammer the site.
  for (let i = 0; i < targets.length; i += 5) {
    await Promise.all(
      targets.slice(i, i + 5).map(async (href) => {
        try {
          let response = await fetchPublic(href, { method: "HEAD" });
          if (response.status === 405 || response.status === 501) response = await fetchPublic(href, { maxBytes: 1024 });
          checked++;
          if (response.status >= 400 && response.status !== 401 && response.status !== 403 && response.status !== 429) {
            broken.push(new URL(href).pathname);
          }
        } catch {
          // A slow or flaky link isn't proof it's broken; skip it.
        }
      }),
    );
  }

  return { count: broken.length, first: broken.sort()[0] ?? "", checked };
}

export { BlockedAddressError };
