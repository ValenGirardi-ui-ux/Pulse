import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "./supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
};

/** The signed-in user, validated against Supabase. Redirects to /login when there's no session. */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");

  const { user } = data;
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
  const email = user.email ?? "";

  return {
    id: user.id,
    email,
    name: profile?.full_name || metadataName || email.split("@")[0],
  };
});
