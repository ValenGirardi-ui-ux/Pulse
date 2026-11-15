import { sendEmail } from "@/lib/email";
import { describe, ruleOf } from "@/lib/scan/rules";
import { scanAndSave } from "@/lib/scan/run";
import { createAdminClient } from "@/lib/supabase/admin";

// The daily automatic scan. Vercel Cron calls it (see vercel.json) with "Authorization: Bearer <CRON_SECRET>".
export const maxDuration = 300;

const MAX_SITES = 500;
const TIME_BUDGET_MS = 200_000;
const AUDIT_OPTIONS = { maxPages: 20, budgetMs: 35_000 };
const SKIP_IF_SCANNED_WITHIN_SECONDS = 60 * 60;
const DOWN_RULES = new Set(["site_down", "http_error"]);

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "SUPABASE_SECRET_KEY is not set" }, { status: 500 });

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, alerts_email, alert_new_critical, alert_site_down")
    .eq("auto_scans", true);
  if (profilesError) return Response.json({ error: profilesError.message }, { status: 500 });
  if (profiles.length === 0) return Response.json({ scanned: 0, emails: 0 });

  const { data: sites, error: sitesError } = await admin
    .from("sites")
    .select("id, url, name, user_id")
    .in("user_id", profiles.map((profile) => profile.id))
    .order("created_at", { ascending: true })
    .limit(MAX_SITES);
  if (sitesError) return Response.json({ error: sitesError.message }, { status: 500 });

  // Sites scanned least recently go first, so every site gets its turn even when there are many.
  const { data: recent } = await admin
    .from("scans")
    .select("site_id, created_at")
    .in("site_id", sites.map((site) => site.id))
    .order("created_at", { ascending: false })
    .limit(1000);
  const lastScan = new Map<string, number>();
  for (const row of recent ?? []) if (!lastScan.has(row.site_id)) lastScan.set(row.site_id, Date.parse(row.created_at));
  sites.sort((a, b) => (lastScan.get(a.id) ?? 0) - (lastScan.get(b.id) ?? 0));

  const started = Date.now();
  const alerts = new Map<string, string[]>();
  let scanned = 0;

  // Three sites at a time, and stop starting new ones before the function runs out of time.
  for (let i = 0; i < sites.length && Date.now() - started < TIME_BUDGET_MS; i += 3) {
    await Promise.all(
      sites.slice(i, i + 3).map(async (site) => {
        const result = await scanAndSave(admin, site, "scheduled", SKIP_IF_SCANNED_WITHIN_SECONDS, AUDIT_OPTIONS);
        if (!result.ok) return;
        scanned++;

        const profile = profiles.find((p) => p.id === site.user_id);
        if (!profile) return;
        const fresh = result.changes.filter((change) => change.kind === "new" && ruleOf(change).severity === "Critical");
        const lines = fresh
          .filter((change) => (DOWN_RULES.has(change.rule) ? profile.alert_site_down : profile.alert_new_critical))
          .map((change) => `• ${describe(change, "es").title} / ${describe(change, "en").title} (${change.page})`);
        if (lines.length === 0) return;

        const list = alerts.get(site.user_id) ?? [];
        list.push(`${site.name} (${site.url}) – ${result.score}/100\n${lines.join("\n")}`);
        alerts.set(site.user_id, list);
      }),
    );
  }

  let emails = 0;
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  for (const [userId, blocks] of alerts) {
    const profile = profiles.find((p) => p.id === userId);
    let to = profile?.alerts_email ?? null;
    if (!to) to = (await admin.auth.admin.getUserById(userId)).data.user?.email ?? null;
    if (!to) continue;

    const sent = await sendEmail({
      to,
      subject: "Pulse: problemas críticos nuevos / New critical issues",
      text: [
        "El escaneo diario de Pulse encontró problemas críticos nuevos:",
        "Pulse's daily scan found new critical issues:",
        "",
        blocks.join("\n\n"),
        "",
        appUrl ? `${appUrl}/dashboard/issues` : "",
        "",
        "Podés cambiar estas alertas en Configuración. / You can change these alerts in Settings.",
      ].join("\n"),
    });
    if (sent) emails++;
  }

  return Response.json({ scanned, emails });
}
