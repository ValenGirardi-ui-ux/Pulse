import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// Shared helpers to fetch public pages safely and read their HTML. Used by the audit (audit.ts) and LLM Optimization (llm.ts).

export const USER_AGENT = "Mozilla/5.0 (compatible; PulseBot/1.0; +https://pulse.app)";
const SMALL_TIMEOUT_MS = 5_000;

export type Fetched = { url: URL; status: number; headers: Headers; body: string; ms: number };

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

export async function assertPublic(url: URL) {
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
export async function fetchPublic(
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

export async function readText(response: Response, maxBytes: number) {
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

export function stripNoise(html: string) {
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

export function tags(html: string, name: string) {
  return [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, "gi"))].map((match) => parseAttributes(match[1]));
}

export function metaContent(metas: Record<string, string>[], key: string) {
  const meta = metas.find((m) => (m.name ?? m.property ?? "").toLowerCase() === key);
  return meta?.content?.trim() ?? "";
}

export function decodeEntities(text: string) {
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

export { BlockedAddressError };
