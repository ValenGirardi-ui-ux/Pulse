import "server-only";

/**
 * Sends a plain-text email through Resend (https://resend.com). Returns false, without throwing, when
 * RESEND_API_KEY isn't set or Resend rejects it. Without a verified domain, Resend only delivers to the
 * email the Resend account was created with.
 */
export async function sendEmail({ to, subject, text, replyTo }: { to: string; subject: string; text: string; replyTo?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || process.env.CONTACT_FROM_EMAIL || "Pulse <onboarding@resend.dev>",
        to,
        subject,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!response.ok) {
      console.error("Email failed:", response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email failed:", error);
    return false;
  }
}
