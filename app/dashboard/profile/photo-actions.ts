"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "avatars";

/** Deletes every file in the user's avatar folder except `keep`. */
async function removeOtherFiles(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, keep?: string) {
  const { data } = await supabase.storage.from(BUCKET).list(userId);
  const stale = (data ?? []).map((file) => `${userId}/${file.name}`).filter((path) => path !== keep);
  if (stale.length) await supabase.storage.from(BUCKET).remove(stale);
}

/** Called after the browser uploaded a photo to avatars/<user id>/...: makes it the profile photo. */
export async function setAvatar(path: string): Promise<{ error?: boolean }> {
  const user = await getCurrentUser();
  if (!new RegExp(`^${user.id}/[\\w.-]+$`).test(path)) return { error: true };

  const supabase = await createClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const { error } = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
  if (error) return { error: true };

  await removeOtherFiles(supabase, user.id, path);
  refresh();
  return {};
}

/** Removes the uploaded profile photo. */
export async function removeAvatar(): Promise<{ error?: boolean }> {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) return { error: true };

  await removeOtherFiles(supabase, user.id);
  refresh();
  return {};
}
