// What a scan can find, how bad it is, and how to explain it in English and Spanish.
// Scans store only the rule id plus a few values; the text lives here so it can be translated and improved later.

export type Severity = "Critical" | "Warning" | "Minor";
export type Category = "Development" | "SEO" | "Marketing" | "Performance";
export type Lang = "en" | "es";

export type FoundIssue = {
  rule: RuleId;
  /** The page or file the issue is on, like "/" or "/robots.txt". */
  page: string;
  /** How many times it happens, for issues like broken links. */
  count?: number;
  /** A short value to show in the title, like "3.2 s" or "404". */
  detail?: string;
};

type Text = { en: string; es: string };
type Rule = { severity: Severity; category: Category; title: Text; impact: Text; fix: Text[] };

const rules = {
  site_down: {
    severity: "Critical",
    category: "Development",
    title: { en: "Your site isn't responding", es: "Tu sitio no responde" },
    impact: { en: "Visitors can't open your site right now.", es: "Ahora mismo nadie puede abrir tu sitio." },
    fix: [
      { en: "Open your site in a browser to confirm it's down.", es: "Abrí tu sitio en un navegador para confirmar que está caído." },
      { en: "Check your hosting dashboard and your domain's DNS settings.", es: "Revisá el panel de tu hosting y la configuración DNS de tu dominio." },
      { en: "Run a new scan once it's back.", es: "Hacé un nuevo escaneo cuando vuelva a funcionar." },
    ],
  },
  http_error: {
    severity: "Critical",
    category: "Development",
    title: { en: "Your home page returns an error ({detail})", es: "Tu página principal devuelve un error ({detail})" },
    impact: { en: "Visitors and Google see an error instead of your site.", es: "Los visitantes y Google ven un error en lugar de tu sitio." },
    fix: [
      { en: "Open the page and check what error it shows.", es: "Abrí la página y fijate qué error muestra." },
      { en: "Look at your server or hosting logs for the cause.", es: "Revisá los logs de tu servidor o hosting para encontrar la causa." },
    ],
  },
  no_https: {
    severity: "Critical",
    category: "Development",
    title: { en: "Your site doesn't use HTTPS", es: "Tu sitio no usa HTTPS" },
    impact: { en: "Browsers mark it as \"Not secure\" and Google ranks it lower.", es: "Los navegadores lo marcan como \"No seguro\" y Google lo posiciona peor." },
    fix: [
      { en: "Turn on a free SSL certificate in your hosting (most offer Let's Encrypt).", es: "Activá un certificado SSL gratis en tu hosting (la mayoría ofrece Let's Encrypt)." },
      { en: "Redirect every http:// address to https://.", es: "Redirigí todas las direcciones http:// a https://." },
    ],
  },
  no_https_redirect: {
    severity: "Warning",
    category: "Development",
    title: { en: "http:// doesn't redirect to https://", es: "http:// no redirige a https://" },
    impact: { en: "People who type your address without https land on an insecure version.", es: "Quien escribe tu dirección sin https entra a una versión no segura." },
    fix: [
      { en: "Add a permanent (301) redirect from http:// to https:// in your hosting or server.", es: "Agregá una redirección permanente (301) de http:// a https:// en tu hosting o servidor." },
    ],
  },
  missing_hsts: {
    severity: "Minor",
    category: "Development",
    title: { en: "HSTS header missing", es: "Falta el encabezado HSTS" },
    impact: { en: "Browsers aren't told to always use the secure version of your site.", es: "No se le indica al navegador que use siempre la versión segura de tu sitio." },
    fix: [
      { en: "Add the header Strict-Transport-Security: max-age=31536000 in your server or hosting settings.", es: "Agregá el encabezado Strict-Transport-Security: max-age=31536000 en tu servidor o hosting." },
    ],
  },
  mixed_content: {
    severity: "Warning",
    category: "Development",
    title: { en: "{count} insecure resources on a secure page", es: "{count} recursos no seguros en una página segura" },
    impact: { en: "Browsers may block them or show a security warning.", es: "Los navegadores pueden bloquearlos o mostrar un aviso de seguridad." },
    fix: [
      { en: "Change the http:// links of images, scripts and styles to https://.", es: "Cambiá los links http:// de imágenes, scripts y estilos a https://." },
    ],
  },
  missing_viewport: {
    severity: "Warning",
    category: "Development",
    title: { en: "Not set up for phones", es: "No está preparado para celulares" },
    impact: { en: "On phones the page shows tiny, zoomed-out text.", es: "En el celular la página se ve chiquita y alejada." },
    fix: [
      { en: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> inside <head>.", es: "Agregá <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> dentro de <head>." },
    ],
  },
  missing_lang: {
    severity: "Minor",
    category: "Development",
    title: { en: "Page language not set", es: "No está indicado el idioma de la página" },
    impact: { en: "Screen readers and translators may read it in the wrong language.", es: "Los lectores de pantalla y traductores pueden leerla en el idioma equivocado." },
    fix: [{ en: "Add the language to the html tag, like <html lang=\"es\">.", es: "Agregá el idioma en la etiqueta html, por ejemplo <html lang=\"es\">." }],
  },
  broken_links: {
    severity: "Warning",
    category: "Development",
    title: { en: "{count} broken links", es: "{count} links rotos" },
    impact: { en: "Visitors who click them land on an error page. First one: {detail}", es: "Quien los toca termina en una página de error. El primero: {detail}" },
    fix: [
      { en: "Open the page and find the links that point to missing pages.", es: "Abrí la página y buscá los links que apuntan a páginas que no existen." },
      { en: "Fix the address or remove the link.", es: "Corregí la dirección o sacá el link." },
    ],
  },
  noindex: {
    severity: "Critical",
    category: "SEO",
    title: { en: "Your home page tells Google not to index it", es: "Tu página principal le pide a Google que no la indexe" },
    impact: { en: "It won't show up in Google search results.", es: "No va a aparecer en los resultados de Google." },
    fix: [
      { en: "Remove the robots meta tag with \"noindex\" (or the X-Robots-Tag header).", es: "Sacá la meta etiqueta robots con \"noindex\" (o el encabezado X-Robots-Tag)." },
      { en: "In WordPress, uncheck \"Discourage search engines\" under Settings → Reading.", es: "En WordPress, destildá \"Disuadir a los motores de búsqueda\" en Ajustes → Lectura." },
    ],
  },
  missing_title: {
    severity: "Warning",
    category: "SEO",
    title: { en: "Page title missing", es: "Falta el título de la página" },
    impact: { en: "Google and browser tabs have no name to show for your site.", es: "Google y las pestañas del navegador no tienen un nombre para mostrar." },
    fix: [{ en: "Add a <title> of 30–60 characters that says what the page is about.", es: "Agregá un <title> de 30 a 60 caracteres que diga de qué se trata la página." }],
  },
  title_length: {
    severity: "Minor",
    category: "SEO",
    title: { en: "Page title is {detail} characters long", es: "El título de la página tiene {detail} caracteres" },
    impact: { en: "Titles that are too short or too long show up worse in Google.", es: "Los títulos muy cortos o muy largos se ven peor en Google." },
    fix: [{ en: "Keep the title between 30 and 60 characters.", es: "Dejá el título entre 30 y 60 caracteres." }],
  },
  missing_description: {
    severity: "Warning",
    category: "SEO",
    title: { en: "Meta description missing", es: "Falta la meta descripción" },
    impact: { en: "Google shows a random snippet instead of your summary.", es: "Google muestra un texto cualquiera en lugar de tu resumen." },
    fix: [
      { en: "Write a 140–160 character summary of the page.", es: "Escribí un resumen de la página de 140 a 160 caracteres." },
      { en: "Add it as <meta name=\"description\" content=\"…\"> in <head>.", es: "Agregalo como <meta name=\"description\" content=\"…\"> en <head>." },
    ],
  },
  missing_h1: {
    severity: "Warning",
    category: "SEO",
    title: { en: "No main heading (h1)", es: "No tiene título principal (h1)" },
    impact: { en: "Google has a harder time understanding what the page is about.", es: "A Google le cuesta más entender de qué trata la página." },
    fix: [{ en: "Add one <h1> with the main topic of the page.", es: "Agregá un <h1> con el tema principal de la página." }],
  },
  multiple_h1: {
    severity: "Minor",
    category: "SEO",
    title: { en: "{count} main headings (h1)", es: "{count} títulos principales (h1)" },
    impact: { en: "Several h1 tags make the main topic less clear.", es: "Varios h1 hacen menos claro cuál es el tema principal." },
    fix: [{ en: "Keep one <h1> and turn the others into <h2>.", es: "Dejá un solo <h1> y pasá los demás a <h2>." }],
  },
  missing_canonical: {
    severity: "Minor",
    category: "SEO",
    title: { en: "Canonical link missing", es: "Falta el link canónico" },
    impact: { en: "Google may treat versions of the same page as duplicates.", es: "Google puede tomar versiones de la misma página como duplicadas." },
    fix: [{ en: "Add <link rel=\"canonical\" href=\"https://yoursite.com/\"> in <head>.", es: "Agregá <link rel=\"canonical\" href=\"https://tusitio.com/\"> en <head>." }],
  },
  images_without_alt: {
    severity: "Minor",
    category: "SEO",
    title: { en: "{count} images without alt text", es: "{count} imágenes sin texto alternativo" },
    impact: { en: "Google and screen readers can't tell what they show.", es: "Google y los lectores de pantalla no saben qué muestran." },
    fix: [{ en: "Add a short alt=\"…\" describing each image.", es: "Agregá un alt=\"…\" corto que describa cada imagen." }],
  },
  missing_robots: {
    severity: "Minor",
    category: "SEO",
    title: { en: "robots.txt missing", es: "Falta robots.txt" },
    impact: { en: "Search engines get no instructions about what to crawl.", es: "Los buscadores no reciben instrucciones sobre qué revisar." },
    fix: [{ en: "Create /robots.txt with at least: User-agent: * and a Sitemap: line.", es: "Creá /robots.txt con al menos: User-agent: * y una línea Sitemap:." }],
  },
  missing_sitemap: {
    severity: "Minor",
    category: "SEO",
    title: { en: "Sitemap missing", es: "Falta el sitemap" },
    impact: { en: "Google may take longer to find all your pages.", es: "Google puede tardar más en encontrar todas tus páginas." },
    fix: [
      { en: "Create /sitemap.xml (most CMSs and SEO plugins do it for you).", es: "Creá /sitemap.xml (la mayoría de los CMS y plugins de SEO lo hacen solos)." },
      { en: "Submit it in Google Search Console.", es: "Cargalo en Google Search Console." },
    ],
  },
  slow_response: {
    severity: "Warning",
    category: "Performance",
    title: { en: "Slow response ({detail})", es: "Respuesta lenta ({detail})" },
    impact: { en: "Visitors wait several seconds before anything appears.", es: "Los visitantes esperan varios segundos antes de ver algo." },
    fix: [
      { en: "Turn on caching in your hosting or CMS.", es: "Activá la caché en tu hosting o CMS." },
      { en: "Use a CDN, and check for slow plugins or database queries.", es: "Usá una CDN y revisá plugins o consultas a la base de datos que sean lentas." },
    ],
  },
  slightly_slow: {
    severity: "Minor",
    category: "Performance",
    title: { en: "Response could be faster ({detail})", es: "La respuesta podría ser más rápida ({detail})" },
    impact: { en: "Every extra second makes more visitors leave.", es: "Cada segundo de más hace que se vayan más visitantes." },
    fix: [{ en: "Turn on caching or a CDN so the page is served faster.", es: "Activá caché o una CDN para que la página se sirva más rápido." }],
  },
  heavy_page: {
    severity: "Minor",
    category: "Performance",
    title: { en: "Heavy page ({detail} of HTML)", es: "Página pesada ({detail} de HTML)" },
    impact: { en: "It takes longer to load, especially on phones.", es: "Tarda más en cargar, sobre todo en celulares." },
    fix: [{ en: "Remove inline code and content that isn't needed on the first view.", es: "Sacá código en línea y contenido que no hace falta en la primera vista." }],
  },
  no_compression: {
    severity: "Minor",
    category: "Performance",
    title: { en: "Compression not enabled", es: "La compresión no está activada" },
    impact: { en: "Pages travel larger than they need to.", es: "Las páginas viajan más pesadas de lo necesario." },
    fix: [{ en: "Enable gzip or Brotli compression in your server or hosting.", es: "Activá la compresión gzip o Brotli en tu servidor o hosting." }],
  },
  missing_social_preview: {
    severity: "Minor",
    category: "Marketing",
    title: { en: "No preview when shared on social media", es: "No tiene vista previa al compartir en redes" },
    impact: { en: "Links to your site show up without an image or title on WhatsApp, Facebook or LinkedIn.", es: "Los links a tu sitio aparecen sin imagen ni título en WhatsApp, Facebook o LinkedIn." },
    fix: [
      { en: "Add og:title, og:description and og:image meta tags in <head>.", es: "Agregá las meta etiquetas og:title, og:description y og:image en <head>." },
    ],
  },
  no_analytics: {
    severity: "Minor",
    category: "Marketing",
    title: { en: "No analytics detected", es: "No se detectó ninguna herramienta de analítica" },
    impact: { en: "You can't see how many people visit or where they come from.", es: "No podés ver cuánta gente entra ni de dónde viene." },
    fix: [
      { en: "Add Google Analytics, Plausible or a similar tool.", es: "Agregá Google Analytics, Plausible o una herramienta similar." },
      { en: "Run a new scan to confirm Pulse detects it.", es: "Hacé un nuevo escaneo para confirmar que Pulse la detecta." },
    ],
  },
  missing_favicon: {
    severity: "Minor",
    category: "Marketing",
    title: { en: "Favicon missing", es: "Falta el favicon" },
    impact: { en: "Your site has no icon in browser tabs and bookmarks.", es: "Tu sitio no tiene ícono en las pestañas y favoritos del navegador." },
    fix: [{ en: "Add a favicon.ico or <link rel=\"icon\" href=\"…\"> in <head>.", es: "Agregá un favicon.ico o <link rel=\"icon\" href=\"…\"> en <head>." }],
  },
} satisfies Record<string, Rule>;

export type RuleId = keyof typeof rules;

export const severityOrder: Record<Severity, number> = { Critical: 0, Warning: 1, Minor: 2 };
const penalty: Record<Severity, number> = { Critical: 30, Warning: 10, Minor: 3 };

export function ruleOf(issue: FoundIssue): Rule {
  return rules[issue.rule];
}

function fill(text: string, issue: FoundIssue) {
  return text.replaceAll("{count}", String(issue.count ?? "")).replaceAll("{detail}", issue.detail ?? "");
}

/** The issue's title, impact and fix steps in one language. */
export function describe(issue: FoundIssue, lang: Lang) {
  const rule = ruleOf(issue);
  return {
    title: fill(rule.title[lang], issue),
    impact: fill(rule.impact[lang], issue),
    fix: rule.fix.map((step) => fill(step[lang], issue)),
  };
}

/** 100 minus a penalty per issue. Pass a category to score only that part. */
export function scoreOf(issues: FoundIssue[], category?: Category) {
  const total = issues
    .filter((issue) => !category || ruleOf(issue).category === category)
    .reduce((sum, issue) => sum + penalty[ruleOf(issue).severity], 0);
  return Math.max(0, 100 - total);
}

export function isRuleId(value: unknown): value is RuleId {
  return typeof value === "string" && value in rules;
}
