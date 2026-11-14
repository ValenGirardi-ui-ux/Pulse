import "server-only";
import { headers } from "next/headers";

/** The address of this app, for links in emails and sign-in redirects. */
export async function siteOrigin() {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host");
  const proto = list.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;
}
