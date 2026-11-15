import "server-only";
import { connect } from "node:net";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { allowedPorts as ALLOWED_PORTS, maxPorts as MAX_PORTS } from "@/app/dashboard/monitors/data";
import { certificateDaysLeft } from "./scan/audit";
import { assertPublic, BlockedAddressError, fetchPublic } from "./scan/scanner";

// Real uptime monitors. Websites: HTTP status, response time and SSL. Servers: TCP connection to common ports.
// Only public addresses, and only a fixed list of well-known ports, so Pulse can't be used to scan networks.

export { allowedPorts as ALLOWED_PORTS, maxPorts as MAX_PORTS } from "@/app/dashboard/monitors/data";
export const INTERVALS = [1, 5, 15] as const;
const TIMEOUT_MS = 8_000;
const SLOW_MS = 1500;
const SSL_WARNING_DAYS = 14;

export type MonitorStatus = "Healthy" | "Warning" | "Down" | "Online" | "Offline";
export type WebsiteResult = {
  online: boolean;
  httpStatus: number | null;
  responseMs: number | null;
  sslDaysLeft: number | null;
  error: string | null;
};
export type ServerResult = {
  reachable: boolean;
  latencyMs: number | null;
  ports: { port: number; open: boolean }[];
  error: string | null;
};
export type CheckResult =
  | { type: "website"; status: MonitorStatus; ok: boolean; responseMs: number | null; result: WebsiteResult }
  | { type: "server"; status: MonitorStatus; ok: boolean; responseMs: number | null; result: ServerResult };

type MonitorRow = { id: string; user_id: string; type: string; target: string; ports: number[]; last_status: string | null };

async function checkWebsite(target: string): Promise<CheckResult> {
  const url = `https://${target}`;
  try {
    const [response, sslDaysLeft] = await Promise.all([
      fetchPublic(url, { timeoutMs: TIMEOUT_MS, maxBytes: 32 * 1024 }),
      certificateDaysLeft(new URL(url).hostname),
    ]);
    const result: WebsiteResult = { online: response.status < 500, httpStatus: response.status, responseMs: response.ms, sslDaysLeft, error: null };
    const status: MonitorStatus =
      response.status >= 500
        ? "Down"
        : response.status >= 400 || response.ms >= SLOW_MS || (sslDaysLeft !== null && sslDaysLeft < SSL_WARNING_DAYS)
          ? "Warning"
          : "Healthy";
    return { type: "website", status, ok: status !== "Down", responseMs: response.ms, result };
  } catch (error) {
    if (error instanceof BlockedAddressError) throw error;
    const message = error instanceof Error && error.name === "TimeoutError" ? "timeout" : "unreachable";
    return { type: "website", status: "Down", ok: false, responseMs: null, result: { online: false, httpStatus: null, responseMs: null, sslDaysLeft: null, error: message } };
  }
}

function tcpConnect(host: string, port: number): Promise<{ open: boolean; ms: number | null }> {
  return new Promise((resolve) => {
    const started = Date.now();
    const socket = connect({ host, port, timeout: TIMEOUT_MS / 2 });
    const done = (open: boolean) => {
      socket.destroy();
      resolve({ open, ms: open ? Date.now() - started : null });
    };
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

async function checkServer(host: string, ports: number[]): Promise<CheckResult> {
  await assertPublic(new URL(`http://${host}/`));
  const results = await Promise.all(ports.filter((p) => ALLOWED_PORTS.includes(p)).slice(0, MAX_PORTS).map(async (port) => ({ port, ...(await tcpConnect(host, port)) })));
  const open = results.filter((r) => r.open);
  const latencyMs = open.length ? Math.min(...open.map((r) => r.ms ?? Infinity)) : null;
  const result: ServerResult = {
    reachable: open.length > 0,
    latencyMs,
    ports: results.map(({ port, open: isOpen }) => ({ port, open: isOpen })),
    error: open.length ? null : "no open ports",
  };
  return { type: "server", status: open.length ? "Online" : "Offline", ok: open.length > 0, responseMs: latencyMs, result };
}

/** Checks one monitor now, saves the result and returns it with the status it had before. */
export async function runMonitorCheck(supabase: SupabaseClient<Database>, monitor: MonitorRow) {
  const check = monitor.type === "server" ? await checkServer(monitor.target, monitor.ports) : await checkWebsite(monitor.target);
  const now = new Date().toISOString();
  await supabase.from("monitor_checks").insert({
    monitor_id: monitor.id,
    user_id: monitor.user_id,
    checked_at: now,
    ok: check.ok,
    status: check.status,
    response_ms: check.responseMs,
  });
  await supabase
    .from("monitors")
    .update({ last_checked_at: now, last_status: check.status, last_result: check.result })
    .eq("id", monitor.id);
  return { check, previousStatus: monitor.last_status };
}

export function isDown(status: string | null) {
  return status === "Down" || status === "Offline";
}
