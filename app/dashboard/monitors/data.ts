export type MonitorType = "website" | "server";
export type Interval = "1 min" | "5 min" | "15 min";
export const intervals: readonly Interval[] = ["1 min", "5 min", "15 min"];

export type WebsiteStatus = "Healthy" | "Warning" | "Down";
export type ServerStatus = "Online" | "Offline";
export type Status = WebsiteStatus | ServerStatus | "Checking";

export type WebsiteChecks = {
  online: boolean;
  httpStatus: number | null;
  responseMs: number | null;
  ssl: { valid: boolean; daysLeft: number | null };
  errorPages: number;
  brokenLinks: number;
};

export type Port = { port: number; open: boolean };

export type ServerChecks = {
  reachable: boolean;
  pingOk: boolean;
  latencyMs: number | null;
  availability: string;
  ports: Port[];
};

type Base = { id: string; target: string; interval: Interval; lastChecked: string };

export type WebsiteMonitor = Base & { type: "website"; checks: WebsiteChecks | null };
export type ServerMonitor = Base & { type: "server"; checks: ServerChecks | null };
export type Monitor = WebsiteMonitor | ServerMonitor;

export const thresholds = {
  slowResponseMs: 600,
  verySlowResponseMs: 1500,
  sslWarningDays: 14,
  highLatencyMs: 150,
};

export function websiteStatus(checks: WebsiteChecks): WebsiteStatus {
  if (!checks.online || (checks.httpStatus ?? 0) >= 500) return "Down";
  if (
    (checks.httpStatus ?? 0) >= 400 ||
    (checks.responseMs ?? 0) >= thresholds.slowResponseMs ||
    !checks.ssl.valid ||
    (checks.ssl.daysLeft ?? Infinity) < thresholds.sslWarningDays ||
    checks.errorPages > 0 ||
    checks.brokenLinks > 0
  ) {
    return "Warning";
  }
  return "Healthy";
}

export function serverStatus(checks: ServerChecks): ServerStatus {
  return checks.reachable ? "Online" : "Offline";
}

export function statusOf(monitor: Monitor): Status {
  if (!monitor.checks) return "Checking";
  return monitor.type === "website" ? websiteStatus(monitor.checks) : serverStatus(monitor.checks);
}

export const statusStyle: Record<Status, { dot: string; chip: string }> = {
  Healthy: { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" },
  Online: { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" },
  Warning: { dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700" },
  Down: { dot: "bg-red-500", chip: "bg-red-50 text-red-700" },
  Offline: { dot: "bg-red-500", chip: "bg-red-50 text-red-700" },
  Checking: { dot: "bg-[#4c2882] animate-pulse", chip: "bg-[#4c2882]/[0.07] text-[#4c2882]" },
};

export const defaultPorts = [22, 80, 443];

export const portNames: Record<number, string> = {
  21: "FTP",
  22: "SSH",
  25: "SMTP",
  53: "DNS",
  80: "HTTP",
  443: "HTTPS",
  3306: "MySQL",
  5432: "PostgreSQL",
  6379: "Redis",
  8080: "HTTP alt",
};

export const initialMonitors: Monitor[] = [
  {
    id: "w-atendium",
    type: "website",
    target: "atendium.com",
    interval: "5 min",
    lastChecked: "1 min ago",
    checks: {
      online: true,
      httpStatus: 200,
      responseMs: 214,
      ssl: { valid: true, daysLeft: 210 },
      errorPages: 0,
      brokenLinks: 0,
    },
  },
  {
    id: "w-tivvo",
    type: "website",
    target: "tivvo.com",
    interval: "5 min",
    lastChecked: "2 min ago",
    checks: {
      online: true,
      httpStatus: 200,
      responseMs: 842,
      ssl: { valid: true, daysLeft: 64 },
      errorPages: 0,
      brokenLinks: 0,
    },
  },
  {
    id: "w-nubbapay",
    type: "website",
    target: "nubbapay.com",
    interval: "1 min",
    lastChecked: "Just now",
    checks: {
      online: false,
      httpStatus: 503,
      responseMs: 1210,
      ssl: { valid: true, daysLeft: 9 },
      errorPages: 48,
      brokenLinks: 4,
    },
  },
  {
    id: "s-api-tivvo",
    type: "server",
    target: "api.tivvo.com",
    interval: "1 min",
    lastChecked: "Just now",
    checks: {
      reachable: true,
      pingOk: true,
      latencyMs: 38,
      availability: "99.99%",
      ports: [
        { port: 22, open: true },
        { port: 443, open: true },
        { port: 5432, open: false },
      ],
    },
  },
  {
    id: "s-db-atendium",
    type: "server",
    target: "db.atendium.com",
    interval: "5 min",
    lastChecked: "3 min ago",
    checks: {
      reachable: true,
      pingOk: true,
      latencyMs: 182,
      availability: "99.95%",
      ports: [
        { port: 22, open: true },
        { port: 5432, open: true },
      ],
    },
  },
  {
    id: "s-backup",
    type: "server",
    target: "203.0.113.24",
    interval: "15 min",
    lastChecked: "6 min ago",
    checks: {
      reachable: false,
      pingOk: false,
      latencyMs: null,
      availability: "92.10%",
      ports: [
        { port: 22, open: false },
        { port: 80, open: false },
      ],
    },
  },
];

function hash(text: string) {
  let h = 0;
  for (const char of text) h = (h * 31 + char.charCodeAt(0)) >>> 0;
  return h;
}

export function mockWebsiteChecks(url: string): WebsiteChecks {
  const h = hash(url);
  return {
    online: true,
    httpStatus: 200,
    responseMs: 160 + (h % 320),
    ssl: { valid: true, daysLeft: 30 + (h % 300) },
    errorPages: 0,
    brokenLinks: h % 4 === 0 ? 1 : 0,
  };
}

export function mockServerChecks(host: string, ports: number[]): ServerChecks {
  const h = hash(host);
  return {
    reachable: true,
    pingOk: true,
    latencyMs: 15 + (h % 70),
    availability: "100%",
    ports: ports.map((port) => ({ port, open: defaultPorts.includes(port) })),
  };
}

export function cleanUrl(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
}

export function isValidUrl(value: string) {
  const url = cleanUrl(value);
  return !url.includes("://") && /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?(\/\S*)?$/.test(url);
}

export function isValidHost(value: string) {
  const host = value.trim().toLowerCase();
  const ipv4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
  const domain = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;
  return ipv4.test(host) || domain.test(host);
}
