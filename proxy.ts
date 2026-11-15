import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./lib/supabase/env";

// Refreshes the Supabase session on every request and keeps signed-out users out of the dashboard.
// Signed-in users who open /login or /signup go to the dashboard; to use another account they log out first.
export async function proxy(request: NextRequest) {
  // If Supabase falls back to the Site URL after Google sign-in or email confirmation,
  // the auth code lands on the home page. Finish signing in and go to the dashboard.
  const code = request.nextUrl.searchParams.get("code");
  if (code && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    url.search = "";
    url.searchParams.set("code", code);
    url.searchParams.set("next", "/dashboard");
    return NextResponse.redirect(url);
  }

  const env = getSupabaseEnv();
  if (!env) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Don't run code between createServerClient and getClaims: it can cause random logouts.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  if (!signedIn && pathname.startsWith("/dashboard")) {
    return redirectKeepingCookies(request, response, "/login");
  }

  if (signedIn && (pathname === "/login" || pathname === "/signup")) {
    // getClaims only checks the token signature. Confirm the account still exists before sending them to the
    // dashboard: a deleted or revoked session would otherwise bounce between /login and /dashboard forever.
    const { data: current } = await supabase.auth.getUser();
    if (current.user) return redirectKeepingCookies(request, response, "/dashboard");
    await supabase.auth.signOut({ scope: "local" });
  }

  return response;
}

function redirectKeepingCookies(request: NextRequest, response: NextResponse, path: string) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
