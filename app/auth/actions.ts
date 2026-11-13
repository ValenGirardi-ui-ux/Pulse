"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { nameFromUrl, normalizeSiteUrl } from "@/lib/sites";
import { createClient } from "@/lib/supabase/server";

export type AuthErrorCode =
  | "missing_fields"
  | "invalid_credentials"
  | "email_not_confirmed"
  | "weak_password"
  | "user_exists"
  | "invalid_email"
  | "invalid_website"
  | "rate_limited"
  | "not_configured"
  | "password_mismatch"
  | "same_password"
  | "reset_expired"
  | "unknown";

export type AuthState =
  | { error?: AuthErrorCode; checkEmail?: boolean; email?: string; name?: string; website?: string }
  | undefined;

async function siteOrigin() {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host");
  const proto = list.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;
}

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function toCode(error: { code?: string; message: string; status?: number }): AuthErrorCode {
  switch (error.code) {
    case "invalid_credentials":
      return "invalid_credentials";
    case "email_not_confirmed":
      return "email_not_confirmed";
    case "weak_password":
      return "weak_password";
    case "same_password":
      return "same_password";
    case "user_already_exists":
    case "email_exists":
      return "user_exists";
    case "email_address_invalid":
      return "invalid_email";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rate_limited";
  }
  if (error.status === 429) return "rate_limited";
  return "unknown";
}

async function supabaseOrError() {
  try {
    return { supabase: await createClient() };
  } catch {
    return { error: "not_configured" as const };
  }
}

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "missing_fields", email };

  const { supabase, error: setupError } = await supabaseOrError();
  if (!supabase) return { error: setupError, email };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: toCode(error), email };

  redirect("/dashboard");
}

export async function signup(_state: AuthState, formData: FormData): Promise<AuthState> {
  const name = field(formData, "name");
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");
  const websiteInput = field(formData, "website");
  if (!name || !email || !password) return { error: "missing_fields", email, name, website: websiteInput };

  const website = websiteInput ? normalizeSiteUrl(websiteInput) : null;
  if (websiteInput && !website) return { error: "invalid_website", email, name, website: websiteInput };

  const { supabase, error: setupError } = await supabaseOrError();
  if (!supabase) return { error: setupError, email, name, website: websiteInput };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/dashboard`,
      data: {
        full_name: name,
        ...(website ? { website, site_name: nameFromUrl(website) } : {}),
      },
    },
  });
  if (error) return { error: toCode(error), email, name, website: websiteInput };

  // With "Confirm email" on, there's no session until the user clicks the link in their inbox.
  if (!data.session) return { checkEmail: true, email };

  redirect("/dashboard");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await siteOrigin()}/auth/callback?next=/dashboard`,
      // Always show Google's account picker instead of reusing the browser's account.
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/** Signs out and opens the login page, so someone can sign in with another account. */
export async function switchAccount() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Emails a link to choose a new password. Says the same thing whether or not the account exists. */
export async function requestPasswordReset(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = field(formData, "email");
  if (!email) return { error: "missing_fields", email };

  const { supabase, error: setupError } = await supabaseOrError();
  if (!supabase) return { error: setupError, email };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });
  if (error) {
    const code = toCode(error);
    if (code === "rate_limited" || code === "invalid_email") return { error: code, email };
  }
  return { checkEmail: true, email };
}

/** Sets a new password for the user who arrived from the reset link. */
export async function updatePassword(_state: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!password || !confirm) return { error: "missing_fields" };
  if (password !== confirm) return { error: "password_mismatch" };

  const { supabase, error: setupError } = await supabaseOrError();
  if (!supabase) return { error: setupError };

  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "reset_expired" };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: toCode(error) };

  redirect("/dashboard");
}
