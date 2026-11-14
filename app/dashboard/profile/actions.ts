"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { siteOrigin } from "@/lib/site-origin";
import { createClient } from "@/lib/supabase/server";

export type ProfileErrorCode =
  | "missing_name"
  | "name_too_long"
  | "invalid_email"
  | "email_taken"
  | "password_too_short"
  | "current_password_required"
  | "wrong_current_password"
  | "same_password"
  | "sign_in_again"
  | "rate_limited"
  | "unknown";

export type ProfileState =
  | { saved?: boolean; emailPending?: string; error?: ProfileErrorCode; name?: string; email?: string }
  | undefined;

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function authError(error: { code?: string; status?: number }): ProfileErrorCode {
  switch (error.code) {
    case "email_exists":
    case "user_already_exists":
      return "email_taken";
    case "email_address_invalid":
      return "invalid_email";
    case "weak_password":
      return "password_too_short";
    case "same_password":
      return "same_password";
    case "reauthentication_needed":
    case "session_not_found":
      return "sign_in_again";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rate_limited";
  }
  return error.status === 429 ? "rate_limited" : "unknown";
}

/** Saves the name, email and password from the profile page. Only what changed is updated. */
export async function saveProfile(_state: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const keep = { name, email };

  // Check everything first, so nothing is half-saved when one field is wrong.
  if (!name) return { error: "missing_name", ...keep };
  if (name.length > 80) return { error: "name_too_long", ...keep };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "invalid_email", ...keep };
  if (newPassword && newPassword.length < 8) return { error: "password_too_short", ...keep };
  if (newPassword && user.hasPassword && !currentPassword) return { error: "current_password_required", ...keep };

  const supabase = await createClient();

  if (newPassword && user.hasPassword) {
    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
    if (error) return { error: "wrong_current_password", ...keep };
  }

  if (name !== user.name) {
    const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", user.id);
    if (error) return { error: "unknown", ...keep };
  }

  if (newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: authError(error), ...keep };
  }

  let emailPending: string | undefined;
  if (email !== user.email.toLowerCase()) {
    const { error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/dashboard/profile` },
    );
    if (error) return { error: authError(error), ...keep };
    emailPending = email;
  }

  refresh();
  return { saved: true, emailPending };
}
