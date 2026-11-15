import "server-only";
import type { Area, Effort, Finding, Report } from "@/app/dashboard/llm-optimization/data";
import type { Severity } from "./rules";
import { decodeEntities, fetchPublic, metaContent, stripNoise, tags, type Fetched } from "./scanner";

// How easy it is for AI assistants (ChatGPT, Claude, Perplexity…) to read and cite a site.
// Rule-based: it reads the raw HTML the way most AI crawlers do. No AI involved.

const PAGE_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 3 * 1024 * 1024;
const EXTRA_PAGES = 4;

const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "anthropic-ai", "PerplexityBot", "Google-Extended", "CCBot"];
const AREAS: Area[] = ["Crawl access", "HTML structure", "Content", "Metadata", "Structured data", "JavaScript"];
const penalty: Record<Severity, number> = { Critical: 30, High: 20, Warning: 15, Minor: 6 };

type Page = { path: string; html: string; clean: string };
type Passed = Report["passed"][number];
type Text = { en: string; es: string };

type Check = {
  id: string;
  severity: Severity;
  area: Area;
  effort: Effort;
  title: Text;
  why: Text;
  found: Text;
  pages: string[];
  fix: Text[];
  code?: { label: Text; lang: string; snippet: string };
};

function finding(check: Check): Finding {
  return {
    id: check.id,
    severity: check.severity,
    area: check.area,
    effort: check.effort,
    title: check.title.en,
    why: check.why.en,
    found: check.found.en,
    pages: check.pages,
    fix: check.fix.map((step) => step.en),
    code: check.code && { label: check.code.label.en, lang: check.code.lang, snippet: check.code.snippet },
    es: {
      title: check.title.es,
      why: check.why.es,
      found: check.found.es,
      fix: check.fix.map((step) => step.es),
      codeLabel: check.code?.label.es,
    },
  };
}

function wordCount(clean: string) {
  const body = clean.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? clean;
  const text = decodeEntities(body.replace(/<[^>]+>/g, " "));
  return text ? text.split(" ").filter((word) => /[\p{L}\p{N}]/u.test(word)).length : 0;
}

function textOf(fragment: string) {
  return decodeEntities(fragment.replace(/<[^>]+>/g, " "));
}

async function getText(url: string) {
  const response = await fetchPublic(url).catch(() => null);
  if (!response || response.status !== 200 || /<html/i.test(response.body.slice(0, 500))) return null;
  return response.body;
}

/** Which AI bots robots.txt keeps out of the whole site. */
function blockedBots(robots: string | null) {
  if (!robots) return [];
  const groups: { agents: string[]; disallowAll: boolean; allowRoot: boolean }[] = [];
  let current: (typeof groups)[number] | null = null;
  let readingAgents = false;

  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const match = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!match) continue;
    const [, key, value] = match;
    const field = key.toLowerCase();
    if (field === "user-agent") {
      if (!current || !readingAgents) {
        current = { agents: [], disallowAll: false, allowRoot: false };
        groups.push(current);
      }
      current.agents.push(value.trim().toLowerCase());
      readingAgents = true;
      continue;
    }
    readingAgents = false;
    if (!current) continue;
    if (field === "disallow" && value.trim() === "/") current.disallowAll = true;
    if (field === "allow" && value.trim() === "/") current.allowRoot = true;
  }

  return AI_BOTS.filter((bot) => {
    const own = groups.find((group) => group.agents.includes(bot.toLowerCase()));
    const group = own ?? groups.find((g) => g.agents.includes("*"));
    return Boolean(group && group.disallowAll && !group.allowRoot);
  });
}

function internalLinks(clean: string, base: URL) {
  const found = new Set<string>();
  for (const anchor of tags(clean, "a")) {
    const href = anchor.href;
    if (!href || /^(#|mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    let target: URL;
    try {
      target = new URL(href, base);
    } catch {
      continue;
    }
    if (target.origin !== base.origin || /\.(pdf|jpe?g|png|gif|webp|svg|zip|xml|txt)$/i.test(target.pathname)) continue;
    target.hash = "";
    target.search = "";
    if (target.pathname === base.pathname) continue;
    found.add(target.href);
    if (found.size >= EXTRA_PAGES) break;
  }
  return [...found];
}

function headingProblems(clean: string) {
  const levels = [...clean.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
  const h1 = levels.filter((level) => level === 1).length;
  let skipped = false;
  for (let i = 1; i < levels.length; i++) if (levels[i] - levels[i - 1] > 1) skipped = true;
  return { h1, skipped, any: levels.length > 0 };
}

const VAGUE = /^(click here|here|read more|learn more|more|see more|details|link|this|haz clic aquí|hacé clic acá|click aquí|clic aquí|aquí|acá|leer más|ver más|más|más información|saber más)$/i;

export async function analyzeForLlms(url: URL): Promise<Report> {
  const home = await fetchPublic(url, { timeoutMs: PAGE_TIMEOUT_MS, maxBytes: MAX_HTML_BYTES });
  if (home.status >= 400) throw new Error(`HTTP ${home.status}`);

  const base = home.url;
  const host = base.hostname;
  const origin = base.origin;
  const homeClean = stripNoise(home.body);

  const [robots, llmsTxt, sitemap, extra] = await Promise.all([
    getText(`${origin}/robots.txt`),
    getText(`${origin}/llms.txt`),
    fetchPublic(`${origin}/sitemap.xml`).catch(() => null),
    Promise.all(
      internalLinks(homeClean, base).map((href) =>
        fetchPublic(href, { timeoutMs: PAGE_TIMEOUT_MS, maxBytes: MAX_HTML_BYTES }).catch(() => null),
      ),
    ),
  ]);

  const pages: Page[] = [home, ...extra]
    .filter((page): page is Fetched => Boolean(page && page.status === 200 && /<html|<body/i.test(page.body)))
    .map((page) => ({ path: page.url.pathname || "/", html: page.body, clean: stripNoise(page.body) }));

  const checks: Check[] = [];
  const passed: Passed[] = [];
  const pass = (area: Area, en: string, es: string) => passed.push({ area, title: en, titleEs: es });
  const homePage = pages[0];
  const homeMetas = tags(homePage.clean, "meta");

  // ---------- Crawl access ----------
  const blocked = blockedBots(robots);
  const robotsMeta = `${metaContent(homeMetas, "robots")} ${home.headers.get("x-robots-tag") ?? ""}`.toLowerCase();

  if (blocked.length > 0) {
    checks.push({
      id: "ai-bots-blocked",
      severity: "Critical",
      area: "Crawl access",
      effort: "Low",
      title: { en: "robots.txt blocks AI crawlers", es: "robots.txt bloquea a los rastreadores de IA" },
      why: {
        en: "Blocked assistants can't read your pages, so they won't cite or recommend them in their answers.",
        es: "Los asistentes bloqueados no pueden leer tus páginas, así que no las van a citar ni recomendar en sus respuestas.",
      },
      found: {
        en: `https://${host}/robots.txt blocks: ${blocked.join(", ")}.`,
        es: `https://${host}/robots.txt bloquea a: ${blocked.join(", ")}.`,
      },
      pages: ["/robots.txt"],
      fix: [
        { en: "Remove the Disallow: / rules for the AI agents you want to appear in.", es: "Sacá las reglas Disallow: / de los agentes de IA en los que querés aparecer." },
        { en: "Block only private paths, like /admin or /checkout.", es: "Bloqueá solo rutas privadas, como /admin o /checkout." },
        { en: "Run this analysis again to confirm they have access.", es: "Volvé a correr este análisis para confirmar que tienen acceso." },
      ],
      code: {
        label: { en: "robots.txt", es: "robots.txt" },
        lang: "txt",
        snippet: `User-agent: *\nDisallow: /admin\n\nUser-agent: GPTBot\nUser-agent: ClaudeBot\nUser-agent: PerplexityBot\nAllow: /\n\nSitemap: https://${host}/sitemap.xml`,
      },
    });
  } else {
    pass("Crawl access", "AI crawlers are allowed in robots.txt", "robots.txt deja entrar a los rastreadores de IA");
  }

  if (robotsMeta.includes("noindex") || robotsMeta.includes("noai") || robotsMeta.includes("nosnippet")) {
    checks.push({
      id: "robots-meta-blocks",
      severity: robotsMeta.includes("noindex") ? "Critical" : "Warning",
      area: "Crawl access",
      effort: "Low",
      title: { en: "The page asks bots not to use its content", es: "La página les pide a los bots que no usen su contenido" },
      why: {
        en: "noindex, noai or nosnippet keep search engines and assistants from showing or quoting the page.",
        es: "noindex, noai o nosnippet hacen que buscadores y asistentes no muestren ni citen la página.",
      },
      found: { en: `Robots directives found: "${robotsMeta.trim()}".`, es: `Directivas de robots encontradas: "${robotsMeta.trim()}".` },
      pages: [homePage.path],
      fix: [{ en: "Remove those values from the robots meta tag or the X-Robots-Tag header.", es: "Sacá esos valores de la meta etiqueta robots o del encabezado X-Robots-Tag." }],
    });
  }

  if (!llmsTxt) {
    checks.push({
      id: "no-llms-txt",
      severity: "Minor",
      area: "Crawl access",
      effort: "Low",
      title: { en: "No llms.txt file (experimental)", es: "Falta el archivo llms.txt (experimental)" },
      why: {
        en: "llms.txt is an emerging proposal to give language models a curated map of your key pages. It isn't a standard yet and no AI engine requires it.",
        es: "llms.txt es una propuesta nueva para darles a los modelos de lenguaje un mapa curado de tus páginas clave. Todavía no es un estándar y ningún motor de IA lo exige.",
      },
      found: { en: `https://${host}/llms.txt wasn't found.`, es: `No se encontró https://${host}/llms.txt.` },
      pages: ["/llms.txt"],
      fix: [
        { en: "Create /llms.txt at the root of your site.", es: "Creá /llms.txt en la raíz de tu sitio." },
        { en: "List your key pages with a one-line description each.", es: "Listá tus páginas clave con una descripción de una línea cada una." },
      ],
      code: {
        label: { en: "llms.txt", es: "llms.txt" },
        lang: "md",
        snippet: `# ${host}\n\n> One sentence about what you do and who it's for.\n\n## Main pages\n\n- [Home](https://${host}/): What you offer\n- [Pricing](https://${host}/pricing): Plans and prices\n- [Contact](https://${host}/contact): How to reach you`,
      },
    });
  } else {
    pass("Crawl access", "llms.txt found", "Se encontró llms.txt");
  }

  const sitemapOk =
    (robots && /^\s*sitemap\s*:/im.test(robots)) || (sitemap?.status === 200 && /<(urlset|sitemapindex)\b/i.test(sitemap.body));
  if (!sitemapOk) {
    checks.push({
      id: "no-sitemap",
      severity: "Minor",
      area: "Crawl access",
      effort: "Low",
      title: { en: "No sitemap found", es: "No se encontró sitemap" },
      why: { en: "Crawlers use the sitemap to discover every page of your site.", es: "Los rastreadores usan el sitemap para descubrir todas las páginas de tu sitio." },
      found: { en: "No /sitemap.xml and no Sitemap: line in robots.txt.", es: "No hay /sitemap.xml ni una línea Sitemap: en robots.txt." },
      pages: ["/sitemap.xml"],
      fix: [{ en: "Generate /sitemap.xml and add a Sitemap: line to robots.txt.", es: "Generá /sitemap.xml y agregá una línea Sitemap: en robots.txt." }],
    });
  } else {
    pass("Crawl access", "Sitemap found", "Se encontró el sitemap");
  }

  if (base.protocol === "https:") pass("Crawl access", "Served over HTTPS", "Se sirve por HTTPS");

  // ---------- JavaScript ----------
  const thin = pages.filter((page) => wordCount(page.clean) < 80);
  if (thin.length > 0) {
    const words = wordCount(homePage.clean);
    checks.push({
      id: "client-only-content",
      severity: thin.some((page) => page.path === homePage.path) ? "Critical" : "Warning",
      area: "JavaScript",
      effort: "High",
      title: {
        en: "Main content only appears after JavaScript runs",
        es: "El contenido principal aparece recién después de ejecutar JavaScript",
      },
      why: {
        en: "Most AI crawlers read the HTML without running JavaScript. They see an almost empty page.",
        es: "La mayoría de los rastreadores de IA leen el HTML sin ejecutar JavaScript. Ven una página casi vacía.",
      },
      found: {
        en: `${thin.length} of ${pages.length} pages have fewer than 80 words in their raw HTML (home page: ${words}).`,
        es: `${thin.length} de ${pages.length} páginas tienen menos de 80 palabras en su HTML (página principal: ${words}).`,
      },
      pages: thin.map((page) => page.path),
      fix: [
        { en: "Render the main content on the server (SSR) or at build time (static generation).", es: "Renderizá el contenido principal en el servidor (SSR) o al compilar (generación estática)." },
        { en: "Use client-side JavaScript for interactivity, not to load the text.", es: "Usá JavaScript del lado del cliente para la interactividad, no para cargar el texto." },
        { en: "Check with “View source”: the text has to be there.", es: "Revisalo con “Ver código fuente”: el texto tiene que estar ahí." },
      ],
    });
  } else {
    pass("JavaScript", "Content is readable without JavaScript", "El contenido se lee sin JavaScript");
  }

  const jsNavigation = pages.filter((page) => tags(page.clean, "a").filter((a) => a.href).length < 3 && /onclick\s*=/i.test(page.clean));
  if (jsNavigation.length > 0) {
    checks.push({
      id: "js-navigation",
      severity: "Minor",
      area: "JavaScript",
      effort: "Medium",
      title: { en: "Navigation uses click handlers instead of links", es: "La navegación usa clics de JavaScript en lugar de links" },
      why: { en: "Crawlers follow <a href> links. Buttons with onclick lead nowhere for them.", es: "Los rastreadores siguen links <a href>. Los botones con onclick no los llevan a ningún lado." },
      found: { en: "Few real links and several onclick handlers in the HTML.", es: "Pocos links reales y varios onclick en el HTML." },
      pages: jsNavigation.map((page) => page.path),
      fix: [{ en: "Use <a href=\"/page\"> for anything that takes the visitor to another page.", es: "Usá <a href=\"/pagina\"> para todo lo que lleve al visitante a otra página." }],
      code: { label: { en: "Before → after", es: "Antes → después" }, lang: "html", snippet: `<div onclick="go('/pricing')">Pricing</div>\n\n<a href="/pricing">Pricing</a>` },
    });
  }

  // ---------- HTML structure ----------
  const badHeadings = pages.filter((page) => {
    const h = headingProblems(page.clean);
    return h.h1 !== 1 || h.skipped;
  });
  if (badHeadings.length > 0) {
    checks.push({
      id: "heading-hierarchy",
      severity: "Warning",
      area: "HTML structure",
      effort: "Medium",
      title: { en: "Broken heading hierarchy", es: "Jerarquía de títulos rota" },
      why: {
        en: "Assistants use headings to understand what each part of the page is about. One h1, then h2, h3… in order.",
        es: "Los asistentes usan los títulos para entender de qué trata cada parte. Un h1 y después h2, h3… en orden.",
      },
      found: {
        en: `${badHeadings.length} page${badHeadings.length === 1 ? " has" : "s have"} no single h1 or skip heading levels.`,
        es: `${badHeadings.length} ${badHeadings.length === 1 ? "página no tiene" : "páginas no tienen"} un único h1 o saltean niveles de títulos.`,
      },
      pages: badHeadings.map((page) => page.path),
      fix: [
        { en: "Use exactly one <h1> per page with its main topic.", es: "Usá un solo <h1> por página con su tema principal." },
        { en: "Don't skip levels: after an h2 comes an h3, not an h4.", es: "No saltees niveles: después de un h2 va un h3, no un h4." },
      ],
      code: {
        label: { en: "Recommended structure", es: "Estructura recomendada" },
        lang: "html",
        snippet: `<h1>What the page is about</h1>\n  <h2>First section</h2>\n    <h3>Detail</h3>\n  <h2>Second section</h2>`,
      },
    });
  } else {
    pass("HTML structure", "Headings are in order", "Los títulos están en orden");
  }

  const noLandmarks = pages.filter((page) => !/<main\b/i.test(page.clean));
  if (noLandmarks.length > 0) {
    checks.push({
      id: "no-landmarks",
      severity: "Minor",
      area: "HTML structure",
      effort: "Medium",
      title: { en: "Content wrapped in generic <div>s", es: "Contenido dentro de <div> genéricos" },
      why: {
        en: "Tags like <main>, <article> and <nav> tell crawlers which part is the real content and which is navigation.",
        es: "Etiquetas como <main>, <article> y <nav> les dicen a los rastreadores qué parte es el contenido y cuál la navegación.",
      },
      found: {
        en: `${noLandmarks.length} page${noLandmarks.length === 1 ? "" : "s"} without a <main> element.`,
        es: `${noLandmarks.length} ${noLandmarks.length === 1 ? "página" : "páginas"} sin el elemento <main>.`,
      },
      pages: noLandmarks.map((page) => page.path),
      fix: [{ en: "Wrap the main content in <main>, articles in <article> and menus in <nav>.", es: "Poné el contenido principal en <main>, los artículos en <article> y los menús en <nav>." }],
      code: {
        label: { en: "Semantic layout", es: "Estructura semántica" },
        lang: "html",
        snippet: `<header>…</header>\n<nav>…</nav>\n<main>\n  <article>…</article>\n</main>\n<footer>…</footer>`,
      },
    });
  } else {
    pass("HTML structure", "Pages use a <main> element", "Las páginas usan el elemento <main>");
  }

  // ---------- Metadata ----------
  const titles = pages.map((page) => textOf(page.clean.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""));
  const missingMeta = pages.filter((page, index) => !titles[index] || !metaContent(tags(page.clean, "meta"), "description"));
  const duplicated = titles.filter((title, index) => title && titles.indexOf(title) !== index).length;
  if (missingMeta.length > 0 || duplicated > 0) {
    checks.push({
      id: "metadata",
      severity: "Warning",
      area: "Metadata",
      effort: "Low",
      title: { en: "Missing or duplicated titles and descriptions", es: "Títulos y descripciones faltantes o repetidos" },
      why: {
        en: "Titles and descriptions are the summary assistants and search engines use to decide if a page answers a question.",
        es: "El título y la descripción son el resumen que usan asistentes y buscadores para decidir si una página responde una pregunta.",
      },
      found: {
        en: `${missingMeta.length} page${missingMeta.length === 1 ? "" : "s"} missing a title or description, ${duplicated} repeated title${duplicated === 1 ? "" : "s"}.`,
        es: `${missingMeta.length} ${missingMeta.length === 1 ? "página" : "páginas"} sin título o descripción, ${duplicated} ${duplicated === 1 ? "título repetido" : "títulos repetidos"}.`,
      },
      pages: (missingMeta.length > 0 ? missingMeta : pages).map((page) => page.path),
      fix: [
        { en: "Give every page its own <title> (30–60 characters).", es: "Dale a cada página su propio <title> (de 30 a 60 caracteres)." },
        { en: "Add a meta description of 140–160 characters that summarizes the page.", es: "Agregá una meta descripción de 140 a 160 caracteres que resuma la página." },
      ],
      code: {
        label: { en: "Example", es: "Ejemplo" },
        lang: "html",
        snippet: `<title>Pricing · ${host}</title>\n<meta name="description" content="Plans and prices, with what each one includes." />`,
      },
    });
  } else {
    pass("Metadata", "Every page has its own title and description", "Cada página tiene su propio título y descripción");
  }

  const noLang = !tags(homePage.clean, "html")[0]?.lang;
  const noCanonical = !tags(homePage.clean, "link").some((link) => (link.rel ?? "").toLowerCase() === "canonical");
  if (noLang || noCanonical) {
    const missing = [noLang && "lang", noCanonical && "canonical"].filter(Boolean).join(", ");
    checks.push({
      id: "lang-canonical",
      severity: "Minor",
      area: "Metadata",
      effort: "Low",
      title: { en: "Missing lang attribute or canonical URL", es: "Falta el atributo lang o la URL canónica" },
      why: {
        en: "lang tells models which language the page is in; canonical tells them which URL is the original.",
        es: "lang les dice a los modelos en qué idioma está la página; canonical, cuál es la URL original.",
      },
      found: { en: `Missing on the home page: ${missing}.`, es: `Falta en la página principal: ${missing}.` },
      pages: [homePage.path],
      fix: [
        { en: "Add the language to the html tag, like <html lang=\"en\">.", es: "Agregá el idioma en la etiqueta html, por ejemplo <html lang=\"es\">." },
        { en: "Add <link rel=\"canonical\" href=\"…\"> with the page's main address.", es: "Agregá <link rel=\"canonical\" href=\"…\"> con la dirección principal de la página." },
      ],
    });
  } else {
    pass("Metadata", "Language and canonical URL set", "Idioma y URL canónica configurados");
  }

  if (metaContent(homeMetas, "og:title") && metaContent(homeMetas, "og:description")) {
    pass("Metadata", "Open Graph tags present", "Tiene etiquetas Open Graph");
  }

  // ---------- Structured data ----------
  const withJsonLd = pages.filter((page) => /<script[^>]+type\s*=\s*["']?application\/ld\+json/i.test(page.html));
  if (withJsonLd.length === 0) {
    checks.push({
      id: "no-structured-data",
      severity: "Warning",
      area: "Structured data",
      effort: "Medium",
      title: { en: "No structured data (JSON-LD)", es: "No tiene datos estructurados (JSON-LD)" },
      why: {
        en: "JSON-LD states facts about your business (name, what you sell, prices, contact) in a format machines read without guessing.",
        es: "JSON-LD declara datos de tu negocio (nombre, qué vendés, precios, contacto) en un formato que las máquinas leen sin adivinar.",
      },
      found: { en: `None of the ${pages.length} pages analyzed has JSON-LD.`, es: `Ninguna de las ${pages.length} páginas analizadas tiene JSON-LD.` },
      pages: pages.map((page) => page.path),
      fix: [
        { en: "Add an Organization or LocalBusiness block to the home page.", es: "Agregá un bloque Organization o LocalBusiness en la página principal." },
        { en: "Use Product, Article or FAQPage on the pages where they apply.", es: "Usá Product, Article o FAQPage en las páginas donde correspondan." },
        { en: "Validate it with Google's Rich Results Test.", es: "Validalo con la prueba de resultados enriquecidos de Google." },
      ],
      code: {
        label: { en: "JSON-LD for the home page", es: "JSON-LD para la página principal" },
        lang: "html",
        snippet: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Your company",\n  "url": "https://${host}/",\n  "logo": "https://${host}/logo.png"\n}\n</script>`,
      },
    });
  } else {
    pass("Structured data", "JSON-LD structured data found", "Se encontraron datos estructurados JSON-LD");
  }

  // ---------- Content ----------
  const vagueCount = pages.reduce(
    (sum, page) => sum + [...page.clean.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)].filter((m) => VAGUE.test(textOf(m[1]))).length,
    0,
  );
  if (vagueCount > 0) {
    checks.push({
      id: "vague-links",
      severity: "Minor",
      area: "Content",
      effort: "Low",
      title: { en: "Vague link text", es: "Textos de link poco claros" },
      why: {
        en: "Link text describes the target page. “Click here” gives no context about what it contains.",
        es: "El texto del link describe la página de destino. “Hacé clic acá” no da ninguna pista de qué contiene.",
      },
      found: {
        en: `${vagueCount} link${vagueCount === 1 ? " says" : "s say"} things like “click here”, “read more” or “learn more”.`,
        es: `${vagueCount} ${vagueCount === 1 ? "link dice" : "links dicen"} cosas como “clic acá”, “leer más” o “ver más”.`,
      },
      pages: pages.filter((page) => [...page.clean.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)].some((m) => VAGUE.test(textOf(m[1])))).map((page) => page.path),
      fix: [{ en: "Rewrite the text to describe the destination, e.g. “See pricing plans”.", es: "Reescribí el texto para que describa el destino, por ejemplo “Ver los planes y precios”." }],
    });
  } else {
    pass("Content", "Link texts describe where they go", "Los textos de los links describen a dónde llevan");
  }

  const longParagraphs = pages.filter(
    (page) => [...page.clean.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].filter((m) => textOf(m[1]).split(" ").length > 120).length >= 2,
  );
  if (longParagraphs.length > 0) {
    checks.push({
      id: "long-paragraphs",
      severity: "Minor",
      area: "Content",
      effort: "Medium",
      title: { en: "Key answers are buried in long paragraphs", es: "Las respuestas clave están enterradas en párrafos largos" },
      why: {
        en: "Assistants quote short, direct passages. Long blocks of text are harder to extract an answer from.",
        es: "Los asistentes citan fragmentos cortos y directos. De un bloque de texto largo cuesta más sacar una respuesta.",
      },
      found: {
        en: `${longParagraphs.length} page${longParagraphs.length === 1 ? " has" : "s have"} several paragraphs over 120 words.`,
        es: `${longParagraphs.length} ${longParagraphs.length === 1 ? "página tiene" : "páginas tienen"} varios párrafos de más de 120 palabras.`,
      },
      pages: longParagraphs.map((page) => page.path),
      fix: [
        { en: "Start each section with a one or two sentence answer.", es: "Empezá cada sección con una respuesta de una o dos oraciones." },
        { en: "Split long text into short paragraphs, lists or a FAQ.", es: "Dividí el texto largo en párrafos cortos, listas o preguntas frecuentes." },
      ],
    });
  }

  const noAlt = pages.reduce((sum, page) => sum + tags(page.clean, "img").filter((img) => !("alt" in img)).length, 0);
  if (noAlt > 0) {
    checks.push({
      id: "images-no-alt",
      severity: "Minor",
      area: "Content",
      effort: "Low",
      title: { en: "Images without a description", es: "Imágenes sin descripción" },
      why: {
        en: "Models can't see images. Without alt text, anything they show is invisible to them.",
        es: "Los modelos no ven las imágenes. Sin texto alternativo, lo que muestran es invisible para ellos.",
      },
      found: { en: `${noAlt} image${noAlt === 1 ? "" : "s"} without alt text.`, es: `${noAlt} ${noAlt === 1 ? "imagen" : "imágenes"} sin texto alternativo.` },
      pages: pages.filter((page) => tags(page.clean, "img").some((img) => !("alt" in img))).map((page) => page.path),
      fix: [{ en: "Add a short alt=\"…\" describing each image, and keep important text out of images.", es: "Agregá un alt=\"…\" corto a cada imagen y no pongas texto importante dentro de imágenes." }],
    });
  }

  const articlesWithoutDates = pages.filter((page) => /<article\b/i.test(page.clean) && !/<time\b/i.test(page.clean));
  if (articlesWithoutDates.length > 0) {
    checks.push({
      id: "no-dates",
      severity: "Minor",
      area: "Content",
      effort: "Low",
      title: { en: "Articles have no visible dates", es: "Los artículos no muestran fecha" },
      why: {
        en: "Assistants prefer recent, attributable sources. A date tells them how fresh the content is.",
        es: "Los asistentes prefieren fuentes recientes y con autor. La fecha les dice qué tan actualizado está el contenido.",
      },
      found: { en: "Pages with <article> but no <time> element.", es: "Páginas con <article> pero sin el elemento <time>." },
      pages: articlesWithoutDates.map((page) => page.path),
      fix: [
        { en: "Show the publish and update dates in a <time datetime=\"…\"> element.", es: "Mostrá la fecha de publicación y de actualización en un elemento <time datetime=\"…\">." },
        { en: "Show the author's name, linked to their page.", es: "Mostrá el nombre del autor con un link a su página." },
      ],
    });
  }

  // ---------- Entities, trust and answers (GEO) ----------
  const ORG_TYPES = /"@type"\s*:\s*\[?\s*"(Organization|Corporation|LocalBusiness|OnlineStore|Store|Restaurant|ProfessionalService|MedicalBusiness|EducationalOrganization|NGO|Person)"/;
  if (withJsonLd.length > 0 && !ORG_TYPES.test(homePage.html)) {
    checks.push({
      id: "no-entity",
      severity: "Warning",
      area: "Structured data",
      effort: "Low",
      title: { en: "Your business isn't described as an entity", es: "Tu negocio no está descripto como entidad" },
      why: {
        en: "Without Organization or LocalBusiness data, AI has to guess who you are, what you do and where you are.",
        es: "Sin datos de Organization o LocalBusiness, la IA tiene que adivinar quién sos, qué hacés y dónde estás.",
      },
      found: { en: "The home page has JSON-LD, but no Organization or LocalBusiness.", es: "La página principal tiene JSON-LD, pero no Organization ni LocalBusiness." },
      pages: [homePage.path],
      fix: [{ en: "Add an Organization (or LocalBusiness) block with name, URL, logo, contact and sameAs links to your profiles.", es: "Agregá un bloque Organization (o LocalBusiness) con nombre, URL, logo, contacto y links sameAs a tus perfiles." }],
    });
  } else if (withJsonLd.length > 0) {
    pass("Structured data", "Business described as an entity", "El negocio está descripto como entidad");
  }

  const allHtml = pages.map((page) => page.html).join("\n");
  const hrefs = pages.flatMap((page) => tags(page.clean, "a").map((a) => (a.href ?? "").toLowerCase()));
  const hasContact = /href\s*=\s*["'](tel:|mailto:)/i.test(allHtml) || /<address\b/i.test(allHtml) || /"(telephone|email)"\s*:/.test(allHtml) || hrefs.some((h) => /contact|contacto/.test(h));
  if (!hasContact) {
    checks.push({
      id: "no-contact",
      severity: "Warning",
      area: "Content",
      effort: "Low",
      title: { en: "No contact information found", es: "No se encontró información de contacto" },
      why: {
        en: "Visible contact details are a basic trust signal: AI assistants prefer sources that clearly say who is behind them.",
        es: "Los datos de contacto visibles son una señal básica de confianza: los asistentes de IA prefieren fuentes que dicen claramente quién está detrás.",
      },
      found: { en: `No phone, email, address or contact page in the ${pages.length} pages analyzed.`, es: `No hay teléfono, email, dirección ni página de contacto en las ${pages.length} páginas analizadas.` },
      pages: [homePage.path],
      fix: [{ en: "Add a contact page and show your email, phone or address with tel: and mailto: links.", es: "Agregá una página de contacto y mostrá tu email, teléfono o dirección con links tel: y mailto:." }],
    });
  } else {
    pass("Content", "Contact information found", "Se encontró información de contacto");
  }

  if (!hrefs.some((h) => /(about|nosotros|quienes-somos|sobre-nosotros|acerca|empresa|company|team|equipo)/.test(h))) {
    checks.push({
      id: "no-about",
      severity: "Minor",
      area: "Content",
      effort: "Low",
      title: { en: "No \"About us\" page found", es: "No se encontró una página \"Nosotros\"" },
      why: {
        en: "Explaining who is behind the site helps AI describe your business correctly and trust it.",
        es: "Explicar quién está detrás del sitio ayuda a que la IA describa bien tu negocio y confíe en él.",
      },
      found: { en: "No link to an About page was found.", es: "No se encontró un link a una página Nosotros." },
      pages: [homePage.path],
      fix: [{ en: "Create an About page (who you are, since when, where) and link it from the menu or footer.", es: "Creá una página Nosotros (quiénes son, desde cuándo, dónde) y enlazala desde el menú o el pie." }],
    });
  }

  const hasFaq = /"FAQPage"/.test(allHtml) || (allHtml.match(/<details\b/gi) ?? []).length >= 2 || /(preguntas frecuentes|frequently asked|>\s*faq\s*<)/i.test(allHtml) || hrefs.some((h) => /(faq|preguntas)/.test(h));
  if (!hasFaq) {
    checks.push({
      id: "no-faq",
      severity: "Minor",
      area: "Content",
      effort: "Medium",
      title: { en: "No frequently asked questions", es: "No hay preguntas frecuentes" },
      why: {
        en: "Short, direct question-and-answer content is what AI assistants quote most in conversational answers.",
        es: "El contenido de pregunta y respuesta corta y directa es lo que más citan los asistentes de IA en sus respuestas.",
      },
      found: { en: "No FAQ section, FAQPage data or question list was found.", es: "No se encontró una sección de preguntas frecuentes, datos FAQPage ni una lista de preguntas." },
      pages: [homePage.path],
      fix: [
        { en: "Add a FAQ with the real questions your customers ask, each with a one or two sentence answer.", es: "Agregá preguntas frecuentes con las preguntas reales de tus clientes, cada una con una respuesta de una o dos oraciones." },
        { en: "Mark it up with FAQPage JSON-LD.", es: "Marcala con JSON-LD FAQPage." },
      ],
    });
  } else {
    pass("Content", "Frequently asked questions found", "Se encontraron preguntas frecuentes");
  }

  // ---------- Scores ----------
  const findings = checks.map(finding);
  const areaScores = AREAS.map((area) => {
    const items = findings.filter((item) => item.area === area);
    const lost = items.reduce((sum, item) => sum + penalty[item.severity], 0);
    return { area, score: Math.max(20, 100 - lost), findings: items.length };
  });

  return {
    url: base.href,
    host,
    analyzedAt: new Date().toISOString(),
    pages: pages.length,
    score: Math.round(areaScores.reduce((sum, { score }) => sum + score, 0) / areaScores.length),
    areaScores,
    findings,
    passed,
  };
}
