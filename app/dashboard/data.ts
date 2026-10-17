export type Severity = "Critical" | "Warning" | "Minor";
export type Category = "Development" | "SEO" | "Marketing" | "Performance";

export const severityDot: Record<Severity, string> = {
  Critical: "bg-red-500",
  Warning: "bg-amber-500",
  Minor: "bg-[#c9cedd]",
};

export const issues: {
  id: string;
  severity: Severity;
  title: string;
  impact: string;
  category: Category;
  page: string;
  found: string;
  fix: string[];
}[] = [
  {
    id: "meta-pixel",
    severity: "Critical",
    title: "Meta Pixel not detected",
    impact: "Your ads can't track conversions from this site.",
    category: "Marketing",
    page: "All pages",
    found: "2h ago",
    fix: [
      "Copy the Pixel base code from Meta Events Manager.",
      "Paste it inside the <head> of every page, or add it through Google Tag Manager.",
      "Run a new scan to confirm Pulse detects it.",
    ],
  },
  {
    id: "lcp-pricing",
    severity: "Warning",
    title: "Slow load time (LCP 2.8s)",
    impact: "Visitors wait almost 3 seconds to see the main content.",
    category: "Performance",
    page: "/pricing",
    found: "1d ago",
    fix: [
      "Compress the hero image and serve it as WebP or AVIF.",
      "Load fonts with font-display: swap.",
      "Defer scripts that aren't needed for the first view.",
    ],
  },
  {
    id: "js-errors",
    severity: "Warning",
    title: "2 JavaScript errors in console",
    impact: "Some scripts fail to run and could break the checkout.",
    category: "Development",
    page: "/checkout",
    found: "1d ago",
    fix: [
      "Open /checkout and check the browser console for the two errors.",
      "Fix or remove the scripts that throw them.",
      "Test a full purchase before scanning again.",
    ],
  },
  {
    id: "meta-description",
    severity: "Minor",
    title: "3 pages missing meta description",
    impact: "Search results show a random snippet instead of your summary.",
    category: "SEO",
    page: "/blog/*",
    found: "3d ago",
    fix: [
      "Write a 140–160 character summary for each of the 3 posts.",
      "Add it as the meta description in your CMS or page head.",
    ],
  },
  {
    id: "images",
    severity: "Minor",
    title: "Images not optimized",
    impact: "Large images make the homepage heavier than it needs to be.",
    category: "Performance",
    page: "/",
    found: "3d ago",
    fix: [
      "Resize images to the size they're shown at.",
      "Convert them to WebP and enable lazy loading below the fold.",
    ],
  },
];

export const resolved = [
  { title: "Broken link on /contact", category: "Development", when: "3h ago" },
  { title: "SSL certificate renewed", category: "Development", when: "5d ago" },
  { title: "Sitemap added", category: "SEO", when: "1w ago" },
];

export type Change = { kind: "new" | "fixed" | "improved"; text: string };

export const scans: {
  id: string;
  day: string;
  time: string;
  ago: string;
  trigger: "Manual" | "Scheduled";
  pages: number;
  duration: string;
  score: number;
  delta: number | null;
  changes: Change[];
}[] = [
  {
    id: "s7",
    day: "Today",
    time: "00:13",
    ago: "12 min ago",
    trigger: "Manual",
    pages: 48,
    duration: "1m 42s",
    score: 81,
    delta: 3,
    changes: [
      { kind: "fixed", text: "Broken link on /contact" },
      { kind: "improved", text: "Performance went from 74 to 79" },
    ],
  },
  {
    id: "s6",
    day: "Yesterday",
    time: "22:20",
    ago: "2h ago",
    trigger: "Manual",
    pages: 48,
    duration: "1m 39s",
    score: 78,
    delta: -6,
    changes: [{ kind: "new", text: "Meta Pixel not detected" }],
  },
  {
    id: "s5",
    day: "Yesterday",
    time: "12:00",
    ago: "12h ago",
    trigger: "Scheduled",
    pages: 48,
    duration: "1m 36s",
    score: 84,
    delta: 2,
    changes: [{ kind: "improved", text: "Performance went from 71 to 74" }],
  },
  {
    id: "s4",
    day: "Yesterday",
    time: "00:00",
    ago: "1d ago",
    trigger: "Scheduled",
    pages: 47,
    duration: "1m 41s",
    score: 82,
    delta: -1,
    changes: [
      { kind: "new", text: "Slow load time on /pricing" },
      { kind: "new", text: "2 JavaScript errors on /checkout" },
    ],
  },
  {
    id: "s3",
    day: "Oct 15",
    time: "12:00",
    ago: "2d ago",
    trigger: "Scheduled",
    pages: 47,
    duration: "1m 33s",
    score: 83,
    delta: 0,
    changes: [],
  },
  {
    id: "s3b",
    day: "Oct 15",
    time: "00:00",
    ago: "2d ago",
    trigger: "Scheduled",
    pages: 47,
    duration: "1m 34s",
    score: 83,
    delta: 0,
    changes: [],
  },
  {
    id: "s2",
    day: "Oct 14",
    time: "12:00",
    ago: "3d ago",
    trigger: "Scheduled",
    pages: 47,
    duration: "1m 35s",
    score: 83,
    delta: -2,
    changes: [
      { kind: "new", text: "3 pages missing meta description" },
      { kind: "new", text: "Images not optimized on /" },
    ],
  },
  {
    id: "s1",
    day: "Oct 14",
    time: "00:00",
    ago: "3d ago",
    trigger: "Scheduled",
    pages: 46,
    duration: "1m 30s",
    score: 85,
    delta: null,
    changes: [],
  },
];
