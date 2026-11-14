"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountState = { error?: "mismatch" | "setup" | "unknown" } | undefined;

/** Deletes the signed-in user and everything they own, after they type their email to confirm. */
export async function deleteAccount(_state: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  const user = await getCurrentUser();
  const typed = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!typed || typed !== user.email.toLowerCase()) return { error: "mismatch" };

  const supabase = await createClient();

  // Profile photos live in Storage, which the database cascade doesn't reach.
  const { data: photos } = await supabase.storage.from("avatars").list(user.id);
  if (photos?.length) await supabase.storage.from("avatars").remove(photos.map((file) => `${user.id}/${file.name}`));

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    console.error("Couldn't delete account:", error);
    return { error: error.code === "PGRST202" || error.code === "42883" ? "setup" : "unknown" };
  }

  // The user no longer exists: just clear the session cookies in this browser.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}
