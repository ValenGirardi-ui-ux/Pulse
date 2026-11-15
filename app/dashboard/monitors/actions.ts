"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { ALLOWED_PORTS, INTERVALS, MAX_PORTS, runMonitorCheck } from "@/lib/monitors";
import { BlockedAddressError } from "@/lib/scan/scanner";
import { createClient } from "@/lib/supabase/server";

export type MonitorActionResult = { ok: true } | { ok: false; error: "invalid" | "blocked" | "too_soon" | "setup" | "unknown" };

const HOST = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;
const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const URL_TARGET = /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?(\/\S*)?$/;

export async function createMonitor(input: {
  type: "website" | "server";
  target: string;
  intervalMinutes: number;
  ports: number[];
}): Promise<MonitorActionResult> {
  const user = await getCurrentUser();
  const target = input.target.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const intervalMinutes = (INTERVALS as readonly number[]).includes(input.intervalMinutes) ? input.intervalMinutes : 5;
  const ports = [...new Set(input.ports)].filter((p) => ALLOWED_PORTS.includes(p)).slice(0, MAX_PORTS);
  if (input.type === "website" ? !URL_TARGET.test(target) : !(HOST.test(target) || IPV4.test(target)) || ports.length === 0) {
    return { ok: false, error: "invalid" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monitors")
    .insert({ user_id: user.id, type: input.type, target, interval_minutes: intervalMinutes, ports: input.type === "server" ? ports : [] })
    .select("id, user_id, type, target, ports, last_status")
    .single();
  if (error) {
    console.error("Couldn't create monitor:", error);
    return { ok: false, error: error.code === "42P01" || error.code === "PGRST205" ? "setup" : "unknown" };
  }

  try {
    await runMonitorCheck(supabase, data);
  } catch (checkError) {
    if (checkError instanceof BlockedAddressError) {
      await supabase.from("monitors").delete().eq("id", data.id);
      return { ok: false, error: "blocked" };
    }
    console.error("First monitor check failed:", checkError);
  }
  refresh();
  return { ok: true };
}

export async function checkMonitorNow(id: string): Promise<MonitorActionResult> {
  await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from("monitors").select("id, user_id, type, target, ports, last_status, last_checked_at").eq("id", id).maybeSingle();
  if (error || !data) return { ok: false, error: "unknown" };
  if (data.last_checked_at && Date.now() - Date.parse(data.last_checked_at) < 15_000) return { ok: false, error: "too_soon" };
  try {
    await runMonitorCheck(supabase, data);
  } catch (checkError) {
    if (checkError instanceof BlockedAddressError) return { ok: false, error: "blocked" };
    console.error("Monitor check failed:", checkError);
    return { ok: false, error: "unknown" };
  }
  refresh();
  return { ok: true };
}

export async function deleteMonitor(id: string): Promise<MonitorActionResult> {
  await getCurrentUser();
  const supabase = await createClient();
  const { error } = await supabase.from("monitors").delete().eq("id", id);
  if (error) return { ok: false, error: "unknown" };
  refresh();
  return { ok: true };
}
