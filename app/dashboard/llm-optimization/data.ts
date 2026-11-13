import type { Severity } from "../data";

export type Area = "Crawl access" | "HTML structure" | "Content" | "Metadata" | "Structured data" | "JavaScript" | "CSS";
export type Effort = "Low" | "Medium" | "High";

export const areas: Area[] = [
  "Crawl access",
  "HTML structure",
  "Content",
  "Metadata",
  "Structured data",
  "JavaScript",
  "CSS",
];

export type Finding = {
  id: string;
  severity: Severity;
  area: Area;
  effort: Effort;
  title: string;
  why: string;
  found: string;
  pages: string[];
  fix: string[];
  code?: { label: string; lang: string; snippet: string };
};

export type Report = {
  url: string;
  host: string;
  analyzedAt: string;
  pages: number;
  score: number;
  areaScores: { area: Area; score: number; findings: number }[];
  findings: Finding[];
  passed: { area: Area; title: string }[];
};

export const analysisSteps = [
  "Fetching robots.txt, sitemap.xml and llms.txt",
  "Reading raw HTML without JavaScript",
  "Rendering pages like a browser",
  "Checking headings, landmarks and metadata",
  "Reviewing text content and structured data",
  "Writing recommendations",
];

const penalty: Record<Severity, number> = { Critical: 30, Warning: 15, Minor: 6 };

export const severityOrder: Severity[] = ["Critical", "Warning", "Minor"];

export function normalizeUrl(input: string) {
  const value = input.trim();
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!url.hostname.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}

function buildFindings(host: string): Finding[] {
  return [
    {
      id: "ai-bots-blocked",
      severity: "Critical",
      area: "Crawl access",
      effort: "Low",
      title: "robots.txt blocks AI crawlers",
      why: "GPTBot, ClaudeBot and PerplexityBot are disallowed, so these assistants can't read your pages or cite them in answers.",
      found: `https://${host}/robots.txt has "Disallow: /" for GPTBot, ClaudeBot and PerplexityBot.`,
      pages: ["/robots.txt"],
      fix: [
        "Remove the Disallow rules for the AI user agents you want to be visible in.",
        "Keep blocking only private paths such as /admin or /checkout.",
        "Re-run the analysis to confirm the crawlers are allowed.",
      ],
      code: {
        label: "robots.txt",
        lang: "txt",
        snippet: `User-agent: GPTBot\nUser-agent: ClaudeBot\nUser-agent: PerplexityBot\nAllow: /\nDisallow: /admin\n\nSitemap: https://${host}/sitemap.xml`,
      },
    },
    {
      id: "client-only-content",
      severity: "Critical",
      area: "JavaScript",
      effort: "High",
      title: "Main content only appears after JavaScript runs",
      why: "Most AI crawlers read the raw HTML and don't execute JavaScript. They see an almost empty page.",
      found: "The raw HTML of 9 pages has fewer than 50 words. After rendering, the same pages have 600+ words.",
      pages: ["/", "/pricing", "/features", "/blog/*"],
      fix: [
        "Render the main content on the server (SSR) or at build time (static generation).",
        "Keep client-side JavaScript for interactivity only, not for loading the text.",
        "Check the result with “View source”: the text should be visible there.",
      ],
      code: {
        label: "Raw HTML today",
        lang: "html",
        snippet: `<body>\n  <div id="root"></div>\n  <script src="/bundle.js"></script>\n</body>`,
      },
    },
    {
      id: "no-llms-txt",
      severity: "Warning",
      area: "Crawl access",
      effort: "Low",
      title: "No llms.txt file",
      why: "llms.txt gives language models a short, curated map of your most important pages and what they contain.",
      found: `https://${host}/llms.txt returns 404.`,
      pages: ["/llms.txt"],
      fix: [
        "Create /llms.txt at the root of the site.",
        "Add a one-line description of the business and links to the key pages with a short summary each.",
      ],
      code: {
        label: "llms.txt",
        lang: "md",
        snippet: `# ${host}\n\n> One sentence that explains what you do and for whom.\n\n## Main pages\n- [Pricing](https://${host}/pricing): plans, prices and what each includes\n- [Features](https://${host}/features): what the product does\n- [FAQ](https://${host}/faq): common questions with direct answers`,
      },
    },
    {
      id: "heading-hierarchy",
      severity: "Warning",
      area: "HTML structure",
      effort: "Low",
      title: "Broken heading hierarchy",
      why: "Models use headings to split a page into topics. Several H1s or skipped levels make that structure ambiguous.",
      found: "3 pages have more than one <h1>. 7 pages jump from <h1> to <h4>.",
      pages: ["/", "/features", "/about"],
      fix: [
        "Use exactly one <h1> per page that states the page topic.",
        "Nest sections with <h2> and <h3> in order, without skipping levels.",
        "Don't use headings for styling; use CSS classes instead.",
      ],
      code: {
        label: "Recommended structure",
        lang: "html",
        snippet: `<h1>Project management for small teams</h1>\n  <h2>Features</h2>\n    <h3>Task boards</h3>\n    <h3>Time tracking</h3>\n  <h2>Pricing</h2>`,
      },
    },
    {
      id: "no-landmarks",
      severity: "Warning",
      area: "HTML structure",
      effort: "Medium",
      title: "Content wrapped in generic <div>s",
      why: "Without <main>, <article> or <nav>, crawlers can't tell your content apart from menus, footers and banners.",
      found: "No <main> element on 12 of 14 pages. Blog posts don't use <article>.",
      pages: ["/", "/blog/*", "/pricing"],
      fix: [
        "Wrap the primary content of every page in a single <main>.",
        "Use <article> for blog posts and <section> with a heading for each block.",
        "Use <nav>, <header> and <footer> for the site chrome.",
      ],
      code: {
        label: "Semantic layout",
        lang: "html",
        snippet: `<header>…</header>\n<nav>…</nav>\n<main>\n  <article>\n    <h1>Post title</h1>\n    <p>…</p>\n  </article>\n</main>\n<footer>…</footer>`,
      },
    },
    {
      id: "no-structured-data",
      severity: "Warning",
      area: "Structured data",
      effort: "Medium",
      title: "No structured data (JSON-LD)",
      why: "Schema.org data states facts like your name, products, prices and FAQs in a format machines read without guessing.",
      found: "No JSON-LD found on any page.",
      pages: ["/", "/pricing", "/faq"],
      fix: [
        "Add an Organization block on the home page.",
        "Add Product or SoftwareApplication with offers on the pricing page.",
        "Add FAQPage on pages with questions and answers.",
      ],
      code: {
        label: "JSON-LD for the home page",
        lang: "html",
        snippet: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "${host}",\n  "url": "https://${host}",\n  "logo": "https://${host}/logo.png",\n  "sameAs": ["https://www.linkedin.com/company/…"]\n}\n</script>`,
      },
    },
    {
      id: "meta-descriptions",
      severity: "Warning",
      area: "Metadata",
      effort: "Low",
      title: "Missing or duplicated titles and descriptions",
      why: "The title and meta description are often the first summary a model reads. Duplicates make pages look interchangeable.",
      found: "6 pages have no meta description. 4 pages share the title “Home”.",
      pages: ["/features", "/about", "/contact", "/blog"],
      fix: [
        "Write a unique <title> of 50–60 characters for each page: topic first, brand last.",
        "Write a meta description of 140–160 characters that answers “what is this page about?”.",
      ],
      code: {
        label: "Example",
        lang: "html",
        snippet: `<title>Pricing and plans | ${host}</title>\n<meta name="description" content="Compare the Free, Pro and Team plans: prices, limits and what each one includes." />`,
      },
    },
    {
      id: "buried-answers",
      severity: "Warning",
      area: "Content",
      effort: "Medium",
      title: "Key answers are buried in long paragraphs",
      why: "Assistants quote short, self-contained statements. Marketing copy without clear facts is rarely cited.",
      found: "Pages open with slogans. Prices, limits and requirements appear only deep in the text.",
      pages: ["/", "/pricing", "/features"],
      fix: [
        "Start each page with a 2–3 sentence summary that answers what it is, who it's for and what it costs.",
        "Turn recurring questions into an FAQ with one question per heading and a direct answer below.",
        "Use lists and tables for specs, plans and comparisons.",
      ],
    },
    {
      id: "text-in-images",
      severity: "Warning",
      area: "Content",
      effort: "Low",
      title: "Important text inside images",
      why: "Text inside images is invisible to text-based crawlers unless it's repeated in HTML or alt text.",
      found: "18 images have no alt text. The pricing table on /pricing is a single image.",
      pages: ["/pricing", "/"],
      fix: [
        "Rebuild the pricing table in HTML.",
        "Add descriptive alt text to every meaningful image; use alt=\"\" for decorative ones.",
      ],
    },
    {
      id: "hidden-content",
      severity: "Minor",
      area: "CSS",
      effort: "Low",
      title: "Content loaded only when a tab or accordion opens",
      why: "If the text is injected on click, crawlers never see it. Hidden-but-present text is still readable.",
      found: "FAQ answers on /faq are fetched when the accordion opens.",
      pages: ["/faq"],
      fix: [
        "Render all the text in the HTML and hide it with CSS, or use the native <details> element.",
      ],
      code: {
        label: "Native accordion",
        lang: "html",
        snippet: `<details>\n  <summary>Can I cancel anytime?</summary>\n  <p>Yes. You can cancel from Settings and keep access until the end of the billing period.</p>\n</details>`,
      },
    },
    {
      id: "js-links",
      severity: "Minor",
      area: "JavaScript",
      effort: "Low",
      title: "Navigation uses click handlers instead of links",
      why: "Crawlers follow <a href> links. Buttons with onClick navigation hide pages from discovery.",
      found: "The main menu and footer use <div onClick> for 5 internal pages.",
      pages: ["/"],
      fix: ["Replace clickable <div>s and <button>s used for navigation with <a href> links."],
      code: {
        label: "Before → after",
        lang: "html",
        snippet: `<!-- Before -->\n<div onclick="go('/pricing')">Pricing</div>\n\n<!-- After -->\n<a href="/pricing">Pricing</a>`,
      },
    },
    {
      id: "lang-canonical",
      severity: "Minor",
      area: "Metadata",
      effort: "Low",
      title: "Missing lang attribute and canonical URLs",
      why: "The language and canonical URL tell models which version of a page to trust and how to read it.",
      found: "<html> has no lang attribute. 8 pages have no canonical link.",
      pages: ["/", "/blog/*"],
      fix: [
        "Set <html lang=\"…\"> to the language of the content.",
        "Add <link rel=\"canonical\"> pointing to the preferred URL of each page.",
      ],
    },
    {
      id: "no-dates",
      severity: "Minor",
      area: "Content",
      effort: "Low",
      title: "Articles have no visible dates or authors",
      why: "Models prefer recent, attributable sources. Without dates they can't tell if the information is current.",
      found: "Blog posts show no publish or update date and no author.",
      pages: ["/blog/*"],
      fix: [
        "Show the publish and last-updated dates in a <time datetime=\"…\"> element.",
        "Show the author name and link to an author page.",
      ],
    },
    {
      id: "vague-links",
      severity: "Minor",
      area: "Content",
      effort: "Low",
      title: "Vague link text",
      why: "Link text describes the target page. “Click here” gives no context about what the page contains.",
      found: "23 links use “click here”, “read more” or “learn more”.",
      pages: ["/", "/blog/*"],
      fix: ["Rewrite link text to describe the destination, e.g. “See the pricing plans”."],
    },
  ];
}

const passedChecks: { area: Area; title: string }[] = [
  { area: "Crawl access", title: "sitemap.xml found and referenced in robots.txt" },
  { area: "Crawl access", title: "All pages served over HTTPS" },
  { area: "Metadata", title: "Open Graph tags present" },
  { area: "CSS", title: "Text is readable without CSS" },
  { area: "JavaScript", title: "No JavaScript errors on load" },
  { area: "HTML structure", title: "Valid HTML, no unclosed tags" },
];

// Demo data until the analysis API exists. Keep the signature so the UI doesn't change.
export async function analyzeSite(url: URL): Promise<Report> {
  await new Promise((resolve) => setTimeout(resolve, analysisSteps.length * 650));

  const findings = buildFindings(url.hostname);
  const areaScores = areas.map((area) => {
    const items = findings.filter((finding) => finding.area === area);
    const lost = items.reduce((sum, finding) => sum + penalty[finding.severity], 0);
    return { area, score: Math.max(20, 100 - lost), findings: items.length };
  });

  return {
    url: url.href,
    host: url.hostname,
    analyzedAt: new Date().toISOString(),
    pages: 14,
    score: Math.round(areaScores.reduce((sum, { score }) => sum + score, 0) / areaScores.length),
    areaScores,
    findings,
    passed: passedChecks,
  };
}
