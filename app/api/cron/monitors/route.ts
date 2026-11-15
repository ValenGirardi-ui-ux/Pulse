import { sendEmail } from "@/lib/email";
import { isDown, runMonitorCheck } from "@/lib/monitors";
import { createAdminClient } from "@/lib/supabase/admin";

// Checks the monitors that are due. Supabase Cron calls it every minute with "Authorization: Bearer <CRON_SECRET>".
export const maxDuration = 60;

const TIME_BUDGET_MS = 45_000;
const CONCURRENCY = 8;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "SUPABASE_SECRET_KEY is not set" }, { status: 500 });

  const { data: monitors, error } = await admin
    .from("monitors")
    .select("id, user_id, type, target, ports, interval_minutes, last_checked_at, last_status")
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(1000);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const now = Date.now();
  // A little slack so a monitor every 1 minute isn't skipped when the cron fires a few seconds early.
  const due = monitors.filter((m) => !m.last_checked_at || now - Date.parse(m.last_checked_at) >= m.interval_minutes * 60_000 - 15_000);

  const started = Date.now();
  const changes = new Map<string, string[]>();
  let checked = 0;
  for (let i = 0; i < due.length && Date.now() - started < TIME_BUDGET_MS; i += CONCURRENCY) {
    await Promise.all(
      due.slice(i, i + CONCURRENCY).map(async (monitor) => {
        try {
          const { check, previousStatus } = await runMonitorCheck(admin, monitor);
          checked++;
          if (previousStatus && isDown(previousStatus) !== isDown(check.status)) {
            const line = isDown(check.status)
              ? `🔴 ${monitor.target}: caído / down (${check.status})`
              : `🟢 ${monitor.target}: volvió / back up (${check.status})`;
            changes.set(monitor.user_id, [...(changes.get(monitor.user_id) ?? []), line]);
          }
        } catch {
          // Blocked or broken targets: skip; the next run will try again.
        }
      }),
    );
  }

  // Email the people whose monitors went down or came back, if they want "site down" alerts.
  let emails = 0;
  if (changes.size) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, alerts_email, alert_site_down")
      .in("id", [...changes.keys()]);
    for (const [userId, lines] of changes) {
      const profile = profiles?.find((p) => p.id === userId);
      if (profile && profile.alert_site_down === false) continue;
      const to = profile?.alerts_email || (await admin.auth.admin.getUserById(userId)).data.user?.email;
      if (!to) continue;
      const sent = await sendEmail({
        to,
        subject: "Pulse: cambio en tus monitores / Monitor status changed",
        text: [...lines, "", process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/monitors` : ""].join("\n"),
      });
      if (sent) emails++;
    }
  }

  // Keep 31 days of history.
  if (new Date().getUTCMinutes() === 0) {
    await admin.from("monitor_checks").delete().lt("checked_at", new Date(Date.now() - 31 * 86_400_000).toISOString());
  }

  return Response.json({ due: due.length, checked, emails });
}
