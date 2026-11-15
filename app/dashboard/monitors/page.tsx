import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { timeAgo } from "@/lib/scan/data";
import { createClient } from "@/lib/supabase/server";
import type { ServerResult, WebsiteResult } from "@/lib/monitors";
import { intervalFromMinutes, type MonitorView, type Status } from "./data";
import { MonitorsView } from "./monitors-view";

export const metadata: Metadata = {
  title: "Monitors · Pulse",
};

const statuses: Status[] = ["Healthy", "Warning", "Down", "Online", "Offline"];

async function MonitorsForUser() {
  await getCurrentUser();
  const supabase = await createClient();
  const [{ data: rows, error }, { data: stats }] = await Promise.all([
    supabase.from("monitors").select("*").order("created_at", { ascending: false }),
    supabase.rpc("monitor_stats"),
  ]);

  if (error) {
    const setupNeeded = error.code === "42P01" || error.code === "PGRST205";
    if (!setupNeeded) throw new Error(`Couldn't load monitors: ${error.message}`);
    return <MonitorsView monitors={[]} setupNeeded />;
  }

  const monitors: MonitorView[] = rows.map((row) => {
    const stat = stats?.find((s) => s.monitor_id === row.id);
    const availability = stat && stat.total > 0 ? `${((Number(stat.ok_count) / Number(stat.total)) * 100).toFixed(2).replace(/\.00$/, "")}%` : null;
    const result = row.last_result as Partial<WebsiteResult & ServerResult> | null;
    const status = statuses.includes(row.last_status as Status) ? (row.last_status as Status) : "Checking";
    return {
      id: row.id,
      type: row.type === "server" ? "server" : "website",
      target: row.target,
      interval: intervalFromMinutes(row.interval_minutes),
      status,
      lastChecked: row.last_checked_at ? timeAgo(row.last_checked_at) : null,
      availability,
      website:
        row.type === "website" && result
          ? { online: Boolean(result.online), httpStatus: result.httpStatus ?? null, responseMs: result.responseMs ?? null, sslDaysLeft: result.sslDaysLeft ?? null }
          : null,
      server:
        row.type === "server" && result
          ? { reachable: Boolean(result.reachable), latencyMs: result.latencyMs ?? null, ports: Array.isArray(result.ports) ? result.ports : [] }
          : null,
    };
  });

  return <MonitorsView monitors={monitors} setupNeeded={false} />;
}

export default function MonitorsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8" aria-busy="true">
          <div className="h-6 w-32 animate-pulse rounded bg-[#ececf1]" />
          <div className="h-40 animate-pulse rounded-2xl bg-[#f6f7fb]" />
        </main>
      }
    >
      <MonitorsForUser />
    </Suspense>
  );
}
