"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type ContactState =
  | { sent?: boolean; error?: "missing_fields" | "invalid_email" | "too_long" | "unknown"; name?: string; email?: string; message?: string }
  | undefined;

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function sendContactMessage(_state: ContactState, formData: FormData): Promise<ContactState> {
  // Hidden field that people never see; bots fill it in. Pretend it worked.
  if (field(formData, "company")) return { sent: true };

  const name = field(formData, "name");
  const email = field(formData, "email");
  const message = field(formData, "message");
  const keep = { name, email, message };

  if (!name || !email || !message) return { error: "missing_fields", ...keep };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "invalid_email", ...keep };
  if (name.length > 100 || email.length > 255 || message.length > 5000) return { error: "too_long", ...keep };

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("contact_messages").insert({ name, email, message });
    if (error) return { error: "unknown", ...keep };
  } catch {
    return { error: "unknown", ...keep };
  }

  // Email the team after the response is sent, so the visitor never waits on it.
  after(() => notifyByEmail({ name, email, message }));

  return { sent: true };
}

/**
 * Sends the message to CONTACT_NOTIFY_EMAIL through Resend. Does nothing until RESEND_API_KEY and
 * CONTACT_NOTIFY_EMAIL are set; the message is already saved in Supabase either way.
 */
async function notifyByEmail({ name, email, message }: { name: string; email: string; message: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFY_EMAIL;
  if (!apiKey || !to) return;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || "Pulse <onboarding@resend.dev>",
        to,
        reply_to: email,
        subject: `Nuevo mensaje de contacto: ${name}`,
        text: `${name} <${email}> escribió:\n\n${message}`,
      }),
    });
    if (!response.ok) console.error("Contact email failed:", response.status, await response.text());
  } catch (error) {
    console.error("Contact email failed:", error);
  }
}
