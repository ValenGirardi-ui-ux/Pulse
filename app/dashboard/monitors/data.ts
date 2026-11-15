export type MonitorType = "website" | "server";
export type Interval = "1 min" | "5 min" | "15 min";
export const intervals: readonly Interval[] = ["1 min", "5 min", "15 min"];

export type Status = "Healthy" | "Warning" | "Down" | "Online" | "Offline" | "Checking";

export type WebsiteChecks = {
  online: boolean;
  httpStatus: number | null;
  responseMs: number | null;
  sslDaysLeft: number | null;
};

export type ServerChecks = {
  reachable: boolean;
  latencyMs: number | null;
  ports: { port: number; open: boolean }[];
};

/** What the monitors page shows for each monitor (all values come from real checks). */
export type MonitorView = {
  id: string;
  type: MonitorType;
  target: string;
  interval: Interval;
  status: Status;
  lastChecked: { en: string; es: string } | null;
  availability: string | null;
  website: WebsiteChecks | null;
  server: ServerChecks | null;
};

export const thresholds = {
  slowResponseMs: 600,
  verySlowResponseMs: 1500,
  sslWarningDays: 14,
  highLatencyMs: 150,
};

export const statusStyle: Record<Status, { dot: string; chip: string }> = {
  Healthy: { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" },
  Online: { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" },
  Warning: { dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700" },
  Down: { dot: "bg-red-500", chip: "bg-red-50 text-red-700" },
  Offline: { dot: "bg-red-500", chip: "bg-red-50 text-red-700" },
  Checking: { dot: "bg-[#4c2882] animate-pulse", chip: "bg-[#4c2882]/[0.07] text-[#4c2882]" },
};

/** Ports a server monitor may check. A fixed list of well-known services, so Pulse can't be used as a port scanner. */
export const allowedPorts = [21, 22, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 1433, 3306, 5432, 6379, 8080, 8443, 27017];
export const maxPorts = 6;
export const defaultPorts = [80, 443];

export const portNames: Record<number, string> = {
  21: "FTP",
  22: "SSH",
  25: "SMTP",
  53: "DNS",
  80: "HTTP",
  110: "POP3",
  143: "IMAP",
  443: "HTTPS",
  465: "SMTPS",
  587: "SMTP",
  993: "IMAPS",
  995: "POP3S",
  1433: "SQL Server",
  3306: "MySQL",
  5432: "PostgreSQL",
  6379: "Redis",
  8080: "HTTP alt",
  8443: "HTTPS alt",
  27017: "MongoDB",
};

export const intervalMinutes: Record<Interval, number> = { "1 min": 1, "5 min": 5, "15 min": 15 };

export function intervalFromMinutes(minutes: number): Interval {
  return minutes === 1 ? "1 min" : minutes === 15 ? "15 min" : "5 min";
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
