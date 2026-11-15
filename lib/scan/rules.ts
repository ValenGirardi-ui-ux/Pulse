// What an audit can find, how bad it is, and how to explain and fix it, in English and Spanish.
// Scans store only the rule id plus a few values; the text lives here so it can be translated and improved.

export type Severity = "Critical" | "High" | "Warning" | "Minor";
export type Category =
  | "Technical"
  | "OnPage"
  | "GEO"
  | "Performance"
  | "StructuredData"
  | "Architecture"
  | "Accessibility"
  | "Security";
export type Effort = "Low" | "Medium" | "High";
export type Lang = "en" | "es";

export type FoundIssue = {
  rule: RuleId;
  /** The main page or file the issue is on, like "/" or "/robots.txt". */
  page: string;
  /** How many times it happens (links, pages, images…). */
  count?: number;
  /** A short value shown in the title, like "3.2 s" or "404". */
  detail?: string;
  /** Technical evidence: the exact value, header or rule that was found. */
  evidence?: string;
  /** Every affected URL (paths), when the issue spans several pages. */
  pages?: string[];
};

type Text = { en: string; es: string };
type Rule = {
  severity: Severity;
  category: Category;
  effort: Effort;
  title: Text;
  impact: Text;
  fix: Text[];
  verify: Text;
  code?: string;
};

export const categories: Category[] = [
  "Technical",
  "OnPage",
  "GEO",
  "Performance",
  "StructuredData",
  "Architecture",
  "Accessibility",
  "Security",
];

export const categoryLabels: Record<Category | "Authority" | "Overall", Text> = {
  Technical: { en: "Technical SEO", es: "SEO técnico" },
  OnPage: { en: "On-page SEO", es: "SEO on-page" },
  GEO: { en: "GEO readiness", es: "Preparación GEO" },
  Performance: { en: "Performance", es: "Rendimiento" },
  StructuredData: { en: "Structured data", es: "Datos estructurados" },
  Architecture: { en: "Architecture & links", es: "Arquitectura y enlaces" },
  Accessibility: { en: "Mobile & accessibility", es: "Mobile y accesibilidad" },
  Security: { en: "Security & infrastructure", es: "Seguridad e infraestructura" },
  Authority: { en: "Authority & backlinks", es: "Autoridad y backlinks" },
  Overall: { en: "Overall SEO", es: "SEO general" },
};

export const severityLabels: Record<Severity, Text> = {
  Critical: { en: "Critical", es: "Crítica" },
  High: { en: "High", es: "Alta" },
  Warning: { en: "Medium", es: "Media" },
  Minor: { en: "Low", es: "Baja" },
};

export const effortLabels: Record<Effort, Text> = {
  Low: { en: "Low effort", es: "Esfuerzo bajo" },
  Medium: { en: "Medium effort", es: "Esfuerzo medio" },
  High: { en: "High effort", es: "Esfuerzo alto" },
};

const T = (en: string, es: string): Text => ({ en, es });
const rule = (
  severity: Severity,
  category: Category,
  effort: Effort,
  title: Text,
  impact: Text,
  fix: Text[],
  verify: Text,
  code?: string,
): Rule => ({ severity, category, effort, title, impact, fix, verify, code });

const rescan = T("Run a new scan: the issue should disappear.", "Hacé un nuevo escaneo: el problema tiene que desaparecer.");

const rules = {
  // ---------------------------------------------------------------- Technical SEO: crawling & indexing
  site_down: rule(
    "Critical", "Technical", "Medium",
    T("Your site isn't responding", "Tu sitio no responde"),
    T("Nobody can open your site, and search engines can't crawl it.", "Nadie puede abrir tu sitio y los buscadores no lo pueden rastrear."),
    [T("Open your site in a browser to confirm it's down.", "Abrí tu sitio en un navegador para confirmar que está caído."), T("Check your hosting dashboard and your domain's DNS settings.", "Revisá el panel de tu hosting y la configuración DNS de tu dominio.")],
    T("Your home page loads in the browser and a new scan finds it.", "Tu página principal carga en el navegador y un nuevo escaneo la encuentra."),
  ),
  http_error: rule(
    "Critical", "Technical", "Medium",
    T("Your home page returns an error ({detail})", "Tu página principal devuelve un error ({detail})"),
    T("Visitors and search engines see an error instead of your site.", "Los visitantes y los buscadores ven un error en lugar de tu sitio."),
    [T("Open the page and check what error it shows.", "Abrí la página y fijate qué error muestra."), T("Look at your server or hosting logs for the cause.", "Revisá los logs de tu servidor o hosting para encontrar la causa.")],
    T("The home page answers with HTTP 200.", "La página principal responde con HTTP 200."),
  ),
  page_errors_5xx: rule(
    "Critical", "Technical", "Medium",
    T("{count} pages return server errors (5xx)", "{count} páginas devuelven errores del servidor (5xx)"),
    T("These pages fail for every visitor and search engines drop them if it keeps happening.", "Estas páginas fallan para todos y los buscadores las sacan si el error sigue."),
    [T("Open each URL listed and check your server logs at that time.", "Abrí cada URL de la lista y revisá los logs del servidor en ese momento."), T("Fix the code or configuration that throws the error.", "Corregí el código o la configuración que produce el error.")],
    T("Each URL answers with HTTP 200 in the browser and in a new scan.", "Cada URL responde con HTTP 200 en el navegador y en un nuevo escaneo."),
  ),
  redirect_loop: rule(
    "Critical", "Technical", "Medium",
    T("Redirect loop on {count} URLs", "Bucle de redirecciones en {count} URLs"),
    T("The page never loads: the browser keeps bouncing between addresses.", "La página nunca carga: el navegador rebota entre direcciones sin parar."),
    [T("Check the redirect rules in your server, CDN or CMS for rules that point to each other.", "Revisá las reglas de redirección del servidor, la CDN o el CMS que se apuntan entre sí."), T("Leave one final destination per URL.", "Dejá un único destino final por URL.")],
    T("Opening the URL ends on a page with HTTP 200.", "Al abrir la URL terminás en una página con HTTP 200."),
  ),
  redirect_chains: rule(
    "Warning", "Technical", "Low",
    T("{count} URLs go through a chain of redirects", "{count} URLs pasan por una cadena de redirecciones"),
    T("Each extra hop slows the page down and search engines may stop following the chain.", "Cada salto extra hace más lenta la página y los buscadores pueden dejar de seguir la cadena."),
    [T("Point the first redirect straight to the final URL.", "Hacé que la primera redirección apunte directo a la URL final."), T("Update internal links to use the final URL.", "Actualizá los links internos para que usen la URL final.")],
    rescan,
  ),
  temporary_redirects: rule(
    "Minor", "Technical", "Low",
    T("{count} temporary redirects (302/307)", "{count} redirecciones temporales (302/307)"),
    T("Temporary redirects tell search engines the move isn't final, so they may keep the old URL.", "Las redirecciones temporales les dicen a los buscadores que el cambio no es definitivo, así que pueden quedarse con la URL vieja."),
    [T("If the move is permanent, use 301 or 308.", "Si el cambio es definitivo, usá 301 o 308.")],
    rescan,
  ),
  noindex: rule(
    "Critical", "Technical", "Low",
    T("Your home page tells search engines not to index it", "Tu página principal les pide a los buscadores que no la indexen"),
    T("It won't show up in Google or other search engines.", "No va a aparecer en Google ni en otros buscadores."),
    [T("Remove \"noindex\" from the robots meta tag or the X-Robots-Tag header.", "Sacá \"noindex\" de la meta etiqueta robots o del encabezado X-Robots-Tag."), T("In WordPress, uncheck \"Discourage search engines\" under Settings → Reading.", "En WordPress, destildá \"Disuadir a los motores de búsqueda\" en Ajustes → Lectura.")],
    T("The page source has no \"noindex\" and the response has no X-Robots-Tag: noindex.", "El código de la página no tiene \"noindex\" y la respuesta no trae X-Robots-Tag: noindex."),
  ),
  noindex_pages: rule(
    "Minor", "Technical", "Low",
    T("{count} pages are set to noindex", "{count} páginas están marcadas como noindex"),
    T("They won't appear in search results. Fine for private pages, a problem for public ones.", "No van a aparecer en los buscadores. Está bien para páginas privadas, es un problema para las públicas."),
    [T("Check the list: remove noindex from the pages that should be found in search.", "Revisá la lista: sacá el noindex de las páginas que deberían aparecer en los buscadores.")],
    rescan,
  ),
  noindex_in_sitemap: rule(
    "High", "Technical", "Low",
    T("{count} noindex pages are listed in the sitemap", "{count} páginas con noindex están en el sitemap"),
    T("The sitemap asks search engines to index pages that refuse indexing: mixed signals waste crawl time.", "El sitemap pide indexar páginas que lo rechazan: señales contradictorias que hacen perder tiempo de rastreo."),
    [T("Remove those URLs from the sitemap, or remove their noindex if they should be indexed.", "Sacá esas URLs del sitemap, o sacales el noindex si tienen que indexarse.")],
    rescan,
  ),
  blocked_by_robots: rule(
    "High", "Technical", "Low",
    T("{count} pages are blocked by robots.txt", "{count} páginas están bloqueadas por robots.txt"),
    T("Search engines can't read these pages even though you link to them or list them in the sitemap.", "Los buscadores no pueden leer estas páginas aunque las enlazás o están en el sitemap."),
    [T("Check the Disallow rules in robots.txt and remove the ones that block public pages.", "Revisá las reglas Disallow de robots.txt y sacá las que bloquean páginas públicas.")],
    T("Test the URL in Google Search Console's robots.txt report or URL inspection.", "Probá la URL en el informe de robots.txt o en la inspección de URLs de Google Search Console."),
  ),
  missing_robots: rule(
    "Minor", "Technical", "Low",
    T("robots.txt missing", "Falta robots.txt"),
    T("Search engines get no crawling instructions and no pointer to your sitemap.", "Los buscadores no reciben instrucciones de rastreo ni la ubicación de tu sitemap."),
    [T("Create /robots.txt with at least a User-agent line and a Sitemap line.", "Creá /robots.txt con al menos una línea User-agent y una línea Sitemap.")],
    T("Opening /robots.txt shows plain text, not an error page.", "Al abrir /robots.txt se ve texto plano, no una página de error."),
    "User-agent: *\nAllow: /\n\nSitemap: https://yoursite.com/sitemap.xml",
  ),
  missing_sitemap: rule(
    "Minor", "Technical", "Low",
    T("Sitemap missing", "Falta el sitemap"),
    T("Search engines may take longer to find all your pages.", "Los buscadores pueden tardar más en encontrar todas tus páginas."),
    [T("Create /sitemap.xml (most CMSs and SEO plugins do it for you).", "Creá /sitemap.xml (la mayoría de los CMS y plugins de SEO lo hacen solos)."), T("Add it to robots.txt and submit it in Google Search Console.", "Agregalo a robots.txt y envialo en Google Search Console.")],
    T("Opening /sitemap.xml shows a list of your URLs.", "Al abrir /sitemap.xml se ve la lista de tus URLs."),
  ),
  sitemap_bad_urls: rule(
    "High", "Technical", "Low",
    T("{count} URLs in the sitemap don't load correctly", "{count} URLs del sitemap no cargan bien"),
    T("The sitemap should only list final, working pages. Errors and redirects waste crawl time.", "El sitemap solo debería tener páginas finales que funcionan. Los errores y redirecciones hacen perder tiempo de rastreo."),
    [T("Remove broken URLs from the sitemap and replace redirected ones with their final address.", "Sacá del sitemap las URLs rotas y reemplazá las redirigidas por su dirección final.")],
    rescan,
  ),
  canonical_missing: rule(
    "Minor", "Technical", "Low",
    T("{count} pages have no canonical link", "{count} páginas no tienen link canónico"),
    T("Search engines have to guess the main version of each page, for example with or without parameters.", "Los buscadores tienen que adivinar cuál es la versión principal de cada página, por ejemplo con o sin parámetros."),
    [T("Add a canonical link to each page pointing to its own clean URL.", "Agregá a cada página un link canonical que apunte a su propia URL limpia.")],
    rescan,
    "<link rel=\"canonical\" href=\"https://yoursite.com/page\" />",
  ),
  canonical_multiple: rule(
    "High", "Technical", "Low",
    T("{count} pages declare more than one canonical", "{count} páginas declaran más de un canonical"),
    T("With several canonicals, search engines ignore all of them.", "Con varios canonicals, los buscadores los ignoran todos."),
    [T("Leave a single <link rel=\"canonical\"> per page. Check your theme and SEO plugins: often both add one.", "Dejá un solo <link rel=\"canonical\"> por página. Revisá el tema y los plugins de SEO: muchas veces los dos agregan uno.")],
    rescan,
  ),
  canonical_to_error: rule(
    "High", "Technical", "Low",
    T("{count} canonicals point to broken or redirected URLs", "{count} canonicals apuntan a URLs rotas o redirigidas"),
    T("A canonical must point to a final page that loads. Otherwise search engines ignore it.", "El canonical tiene que apuntar a una página final que carga. Si no, los buscadores lo ignoran."),
    [T("Point each canonical to the final URL that answers with HTTP 200.", "Hacé que cada canonical apunte a la URL final que responde con HTTP 200.")],
    rescan,
  ),
  canonical_noindex_conflict: rule(
    "Warning", "Technical", "Low",
    T("{count} pages combine noindex with a canonical to another URL", "{count} páginas combinan noindex con un canonical hacia otra URL"),
    T("The two signals contradict each other: one says \"don't index\", the other \"index that one instead\".", "Las dos señales se contradicen: una dice \"no indexes\" y la otra \"indexá esa otra\"."),
    [T("Use one or the other: canonical for duplicates, noindex for pages that shouldn't appear at all.", "Usá una sola: canonical para duplicados, noindex para páginas que no deben aparecer.")],
    rescan,
  ),
  soft_404: rule(
    "High", "Technical", "Low",
    T("{count} \"not found\" pages answer with HTTP 200 (soft 404)", "{count} páginas de \"no encontrado\" responden con HTTP 200 (soft 404)"),
    T("Search engines may index error pages as if they were real content.", "Los buscadores pueden indexar páginas de error como si fueran contenido real."),
    [T("Make missing pages answer with HTTP 404 or 410.", "Hacé que las páginas inexistentes respondan con HTTP 404 o 410.")],
    T("Open the URL with your browser's network tab: the status must be 404.", "Abrí la URL con la pestaña de red del navegador: el estado tiene que ser 404."),
  ),
  duplicate_content: rule(
    "High", "Technical", "Medium",
    T("{count} pages have exactly the same content", "{count} páginas tienen exactamente el mismo contenido"),
    T("Search engines pick one and ignore the rest, which may not be the one you want.", "Los buscadores eligen una e ignoran el resto, que puede no ser la que querés."),
    [T("Merge the duplicates with 301 redirects, or point them to the main one with a canonical.", "Uní los duplicados con redirecciones 301, o apuntalos a la principal con un canonical.")],
    rescan,
  ),
  near_duplicate_content: rule(
    "Minor", "Technical", "Medium",
    T("{count} pages are almost identical", "{count} páginas son casi idénticas"),
    T("Very similar pages compete with each other and dilute your rankings.", "Las páginas muy parecidas compiten entre sí y reparten tu posicionamiento."),
    [T("Make each page clearly different, or merge them into one stronger page.", "Hacé cada página claramente distinta, o unilas en una sola más fuerte.")],
    rescan,
  ),
  thin_content: rule(
    "Warning", "Technical", "Medium",
    T("{count} pages have very little text", "{count} páginas tienen muy poco texto"),
    T("Pages with almost no content rarely rank and can lower the perceived quality of the site.", "Las páginas casi sin contenido rara vez posicionan y pueden bajar la calidad percibida del sitio."),
    [T("Add useful text to these pages, or noindex them if they're utility pages (login, cart…).", "Agregá texto útil a estas páginas, o ponelas en noindex si son páginas de servicio (login, carrito…).")],
    rescan,
  ),
  js_dependent_content: rule(
    "High", "Technical", "High",
    T("{count} pages show their content only after JavaScript runs", "{count} páginas muestran su contenido recién después de ejecutar JavaScript"),
    T("The raw HTML is almost empty. Many crawlers, and most AI crawlers, don't run JavaScript.", "El HTML inicial está casi vacío. Muchos rastreadores, y la mayoría de los de IA, no ejecutan JavaScript."),
    [T("Render the main content on the server (SSR) or at build time (SSG).", "Renderizá el contenido principal en el servidor (SSR) o al compilar (SSG)."), T("Use client-side JavaScript for interactivity, not to load the text.", "Usá JavaScript en el navegador para la interactividad, no para cargar el texto.")],
    T("Use \"View page source\" in the browser: the main text must be there.", "Usá \"Ver código fuente\" en el navegador: el texto principal tiene que estar ahí."),
  ),
  url_issues: rule(
    "Minor", "Technical", "Medium",
    T("{count} URLs have problematic characters or parameters", "{count} URLs tienen caracteres o parámetros problemáticos"),
    T("Uppercase letters, underscores, spaces, session IDs or tracking parameters create duplicate URLs and look untrustworthy.", "Mayúsculas, guiones bajos, espacios, IDs de sesión o parámetros de seguimiento crean URLs duplicadas y se ven poco confiables."),
    [T("Use short lowercase URLs with hyphens, without session or tracking parameters in internal links.", "Usá URLs cortas, en minúsculas y con guiones, sin parámetros de sesión ni de seguimiento en los links internos.")],
    rescan,
  ),
  trailing_slash: rule(
    "Minor", "Technical", "Low",
    T("{count} URLs are linked both with and without a trailing slash", "{count} URLs se enlazan con y sin barra final"),
    T("/page and /page/ count as two URLs: duplicate content and wasted crawl.", "/pagina y /pagina/ cuentan como dos URLs: contenido duplicado y rastreo desperdiciado."),
    [T("Pick one format, redirect the other with 301 and use it in every internal link.", "Elegí un formato, redirigí el otro con 301 y usalo en todos los links internos.")],
    rescan,
  ),
  host_inconsistency: rule(
    "High", "Technical", "Low",
    T("Both www and non-www versions load", "Cargan las versiones con y sin www"),
    T("Two copies of your whole site exist, which splits rankings and creates duplicate content.", "Existen dos copias de todo tu sitio: se reparte el posicionamiento y se duplica el contenido."),
    [T("Redirect one version to the other with a permanent 301 redirect.", "Redirigí una versión a la otra con una redirección permanente 301.")],
    T("Opening the other version ({detail}) redirects to your main domain.", "Al abrir la otra versión ({detail}) te redirige a tu dominio principal."),
  ),
  hreflang_issues: rule(
    "Warning", "Technical", "Medium",
    T("hreflang problems on {count} pages", "Problemas de hreflang en {count} páginas"),
    T("Search engines may show the wrong language version to your visitors.", "Los buscadores pueden mostrar la versión en el idioma equivocado."),
    [T("Use valid codes (es, es-AR, en-US, x-default), include a self-reference, and make every pair reciprocal.", "Usá códigos válidos (es, es-AR, en-US, x-default), incluí la propia página y hacé que cada par sea recíproco.")],
    rescan,
  ),
  ua_inconsistency: rule(
    "High", "Technical", "Medium",
    T("Your site answers Googlebot differently ({detail})", "Tu sitio le responde distinto a Googlebot ({detail})"),
    T("A firewall, CDN or plugin may be blocking search engines without you knowing.", "Un firewall, una CDN o un plugin puede estar bloqueando a los buscadores sin que lo sepas."),
    [T("Check bot protection rules in your CDN or firewall (Cloudflare, Sucuri…) and allow verified search engine bots.", "Revisá las reglas contra bots de tu CDN o firewall (Cloudflare, Sucuri…) y permití los bots verificados de buscadores.")],
    T("Use Google Search Console's URL inspection: Google must see the same page as you.", "Usá la inspección de URLs de Google Search Console: Google tiene que ver la misma página que vos."),
  ),

  // ---------------------------------------------------------------- On-page SEO
  missing_title: rule(
    "High", "OnPage", "Low",
    T("{count} pages have no title", "{count} páginas no tienen título"),
    T("The title is what Google shows as the blue link. Without it, it makes one up.", "El título es lo que Google muestra como link azul. Sin él, inventa uno."),
    [T("Add a unique <title> of 30–60 characters to each page.", "Agregá un <title> único de 30 a 60 caracteres a cada página.")],
    rescan,
  ),
  duplicate_title: rule(
    "Warning", "OnPage", "Low",
    T("{count} pages share the same title", "{count} páginas comparten el mismo título"),
    T("Search engines can't tell the pages apart and they compete with each other.", "Los buscadores no distinguen las páginas y compiten entre sí."),
    [T("Write a different title for each page, describing what's on it.", "Escribí un título distinto para cada página, que describa lo que tiene.")],
    rescan,
  ),
  title_length: rule(
    "Minor", "OnPage", "Low",
    T("{count} titles are too short or too long", "{count} títulos son muy cortos o muy largos"),
    T("Long titles get cut in search results; very short ones waste space to describe the page.", "Los títulos largos se cortan en los resultados; los muy cortos desaprovechan espacio."),
    [T("Keep titles between 30 and 60 characters.", "Dejá los títulos entre 30 y 60 caracteres.")],
    rescan,
  ),
  missing_description: rule(
    "Warning", "OnPage", "Low",
    T("{count} pages have no meta description", "{count} páginas no tienen meta descripción"),
    T("Google shows a random snippet instead of your summary, which usually lowers clicks.", "Google muestra un fragmento cualquiera en lugar de tu resumen, y eso suele bajar los clics."),
    [T("Write a 70–160 character summary for each page.", "Escribí un resumen de 70 a 160 caracteres para cada página.")],
    rescan,
    "<meta name=\"description\" content=\"What this page offers, in one or two sentences.\" />",
  ),
  duplicate_description: rule(
    "Minor", "OnPage", "Low",
    T("{count} pages share the same meta description", "{count} páginas comparten la misma meta descripción"),
    T("Identical summaries make your pages look the same in search results.", "Los resúmenes idénticos hacen que tus páginas se vean iguales en los resultados."),
    [T("Write a specific description for each page.", "Escribí una descripción específica para cada página.")],
    rescan,
  ),
  description_length: rule(
    "Minor", "OnPage", "Low",
    T("{count} meta descriptions are too short or too long", "{count} meta descripciones son muy cortas o muy largas"),
    T("Long descriptions get cut; very short ones don't convince anyone to click.", "Las descripciones largas se cortan; las muy cortas no convencen a nadie de entrar."),
    [T("Keep descriptions between 70 and 160 characters.", "Dejá las descripciones entre 70 y 160 caracteres.")],
    rescan,
  ),
  missing_h1: rule(
    "Warning", "OnPage", "Low",
    T("{count} pages have no main heading (h1)", "{count} páginas no tienen título principal (h1)"),
    T("The h1 tells search engines and readers what the page is about.", "El h1 les dice a los buscadores y a los lectores de qué trata la página."),
    [T("Add one <h1> with the main topic of each page.", "Agregá un <h1> con el tema principal de cada página.")],
    rescan,
  ),
  multiple_h1: rule(
    "Minor", "OnPage", "Low",
    T("{count} pages have more than one h1", "{count} páginas tienen más de un h1"),
    T("Several h1 tags make the main topic less clear.", "Varios h1 hacen menos claro cuál es el tema principal."),
    [T("Keep one <h1> per page and turn the others into <h2>.", "Dejá un solo <h1> por página y pasá los demás a <h2>.")],
    rescan,
  ),
  heading_hierarchy: rule(
    "Minor", "OnPage", "Low",
    T("{count} pages skip heading levels", "{count} páginas saltean niveles de títulos"),
    T("Jumping from h2 to h4 breaks the outline that search engines and screen readers follow.", "Saltar de h2 a h4 rompe el esquema que siguen los buscadores y los lectores de pantalla."),
    [T("Use headings in order: h1, then h2, then h3…", "Usá los títulos en orden: h1, después h2, después h3…")],
    rescan,
  ),
  empty_headings: rule(
    "Minor", "OnPage", "Low",
    T("{count} empty headings", "{count} títulos vacíos"),
    T("Empty headings confuse the page structure for readers and crawlers.", "Los títulos vacíos confunden la estructura de la página."),
    [T("Remove them or give them text.", "Sacalos o poneles texto.")],
    rescan,
  ),
  title_h1_mismatch: rule(
    "Minor", "OnPage", "Low",
    T("{count} pages have a title and h1 about different things", "{count} páginas tienen título y h1 que hablan de cosas distintas"),
    T("When the title and the main heading don't share words, the topic of the page is less clear.", "Cuando el título y el encabezado principal no comparten palabras, el tema de la página queda menos claro."),
    [T("Make the title and the h1 describe the same topic, with the same key words.", "Hacé que el título y el h1 describan el mismo tema, con las mismas palabras clave.")],
    rescan,
  ),
  generic_anchors: rule(
    "Minor", "OnPage", "Low",
    T("{count} links say things like \"click here\"", "{count} links dicen cosas como \"clic acá\""),
    T("The link text tells search engines and AI what the target page is about. \"Click here\" says nothing.", "El texto del link les dice a buscadores e IA de qué trata la página de destino. \"Clic acá\" no dice nada."),
    [T("Rewrite the text to describe the destination, like \"See pricing plans\".", "Reescribí el texto para que describa el destino, como \"Ver planes y precios\".")],
    rescan,
  ),
  empty_anchors: rule(
    "Warning", "OnPage", "Low",
    T("{count} links have no text", "{count} links no tienen texto"),
    T("Search engines and screen readers can't tell where these links go.", "Los buscadores y lectores de pantalla no saben a dónde llevan estos links."),
    [T("Add text, or an aria-label, or an alt to the image inside the link.", "Agregá texto, o un aria-label, o un alt a la imagen dentro del link.")],
    rescan,
  ),
  head_duplicates: rule(
    "Warning", "OnPage", "Low",
    T("{count} pages repeat tags in the <head>", "{count} páginas repiten etiquetas en el <head>"),
    T("Two titles or two descriptions on the same page send mixed signals; search engines pick one at random.", "Dos títulos o dos descripciones en la misma página mandan señales mezcladas; los buscadores eligen uno al azar."),
    [T("Leave one <title> and one meta description per page. Often a theme and a plugin both add them.", "Dejá un solo <title> y una sola meta descripción por página. Muchas veces los agregan el tema y un plugin a la vez.")],
    rescan,
  ),
  social_preview: rule(
    "Minor", "OnPage", "Low",
    T("Incomplete preview for social media ({detail})", "Vista previa incompleta para redes sociales ({detail})"),
    T("Links to your site show up without image or title on WhatsApp, Facebook, LinkedIn or X.", "Los links a tu sitio aparecen sin imagen o sin título en WhatsApp, Facebook, LinkedIn o X."),
    [T("Add Open Graph and Twitter Card tags in <head>.", "Agregá las etiquetas Open Graph y Twitter Card en <head>.")],
    T("Paste your URL in the Facebook Sharing Debugger or LinkedIn Post Inspector.", "Pegá tu URL en el Sharing Debugger de Facebook o en el Post Inspector de LinkedIn."),
    "<meta property=\"og:title\" content=\"…\" />\n<meta property=\"og:description\" content=\"…\" />\n<meta property=\"og:image\" content=\"https://yoursite.com/preview.jpg\" />\n<meta name=\"twitter:card\" content=\"summary_large_image\" />",
  ),
  missing_favicon: rule(
    "Minor", "OnPage", "Low",
    T("Favicon missing", "Falta el favicon"),
    T("Your site has no icon in tabs, bookmarks and some search results.", "Tu sitio no tiene ícono en pestañas, favoritos y algunos resultados de búsqueda."),
    [T("Add a favicon and link it in <head>.", "Agregá un favicon y enlazalo en <head>.")],
    rescan,
    "<link rel=\"icon\" href=\"/favicon.ico\" />",
  ),
  long_paragraphs: rule(
    "Minor", "OnPage", "Medium",
    T("{count} pages have long blocks of text", "{count} páginas tienen bloques de texto largos"),
    T("Long paragraphs are hard to read and hard for search engines and AI to quote.", "Los párrafos largos cuestan de leer y de citar para buscadores e IA."),
    [T("Split them into short paragraphs, lists or tables, and start each section with the key answer.", "Dividilos en párrafos cortos, listas o tablas, y empezá cada sección con la respuesta clave.")],
    rescan,
  ),

  // ---------------------------------------------------------------- GEO readiness
  ai_bots_blocked: rule(
    "Critical", "GEO", "Low",
    T("robots.txt blocks AI crawlers ({detail})", "robots.txt bloquea a rastreadores de IA ({detail})"),
    T("Blocked AI assistants can't read your pages, so they can't cite or recommend them.", "Los asistentes de IA bloqueados no pueden leer tus páginas, así que no las pueden citar ni recomendar."),
    [T("Remove the Disallow: / rules for the AI agents you want to appear in.", "Sacá las reglas Disallow: / de los agentes de IA en los que querés aparecer."), T("Block only private paths, like /admin.", "Bloqueá solo rutas privadas, como /admin.")],
    T("robots.txt no longer has Disallow: / for those agents.", "robots.txt ya no tiene Disallow: / para esos agentes."),
    "User-agent: GPTBot\nUser-agent: ClaudeBot\nUser-agent: PerplexityBot\nUser-agent: Google-Extended\nAllow: /",
  ),
  ai_usage_restricted: rule(
    "Warning", "GEO", "Low",
    T("The page restricts how its content can be used ({detail})", "La página restringe cómo se puede usar su contenido ({detail})"),
    T("Directives like nosnippet or noai keep search engines and AI from quoting the page.", "Directivas como nosnippet o noai impiden que buscadores e IA citen la página."),
    [T("Remove those values from the robots meta tag or the X-Robots-Tag header if you want to be quoted.", "Sacá esos valores de la meta etiqueta robots o del encabezado X-Robots-Tag si querés que te citen.")],
    rescan,
  ),
  llms_txt_missing: rule(
    "Minor", "GEO", "Low",
    T("No llms.txt (experimental)", "No tiene llms.txt (experimental)"),
    T("llms.txt is an emerging proposal to give AI models a curated map of your site. It isn't a standard yet and no engine requires it.", "llms.txt es una propuesta nueva para darles a los modelos de IA un mapa curado de tu sitio. Todavía no es un estándar y ningún motor lo exige."),
    [T("Optionally, create /llms.txt listing your key pages with a one-line description each.", "Si querés, creá /llms.txt con tus páginas clave y una descripción de una línea cada una.")],
    T("Opening /llms.txt shows the file.", "Al abrir /llms.txt se ve el archivo."),
    "# Your company\n\n> One sentence about what you do.\n\n## Main pages\n\n- [Home](https://yoursite.com/): What you offer\n- [Contact](https://yoursite.com/contact): How to reach you",
  ),
  no_entity: rule(
    "Warning", "GEO", "Low",
    T("Your business isn't described as an entity", "Tu negocio no está descripto como entidad"),
    T("Without Organization or LocalBusiness data, search engines and AI have to guess who you are, what you do and where you are.", "Sin datos de Organization o LocalBusiness, buscadores e IA tienen que adivinar quién sos, qué hacés y dónde estás."),
    [T("Add an Organization (or LocalBusiness) JSON-LD block to the home page with your name, URL, logo and contact.", "Agregá un bloque JSON-LD Organization (o LocalBusiness) en la página principal con tu nombre, URL, logo y contacto.")],
    T("Google's Rich Results Test detects the Organization entity.", "La prueba de resultados enriquecidos de Google detecta la entidad Organization."),
    "<script type=\"application/ld+json\">\n{\n  \"@context\": \"https://schema.org\",\n  \"@type\": \"Organization\",\n  \"name\": \"Your company\",\n  \"url\": \"https://yoursite.com/\",\n  \"logo\": \"https://yoursite.com/logo.png\",\n  \"sameAs\": [\"https://www.instagram.com/yourcompany\"]\n}\n</script>",
  ),
  brand_inconsistency: rule(
    "Minor", "GEO", "Low",
    T("Your business name isn't consistent ({detail})", "El nombre de tu negocio no es consistente ({detail})"),
    T("When the name changes between the title, Open Graph and structured data, AI may not connect them as the same business.", "Cuando el nombre cambia entre el título, Open Graph y los datos estructurados, la IA puede no reconocerlos como el mismo negocio."),
    [T("Use exactly the same business name everywhere.", "Usá exactamente el mismo nombre de negocio en todos lados.")],
    rescan,
  ),
  no_contact_info: rule(
    "Warning", "GEO", "Low",
    T("No contact information found", "No se encontró información de contacto"),
    T("Visible contact details (phone, email, address) are a basic trust signal for search engines, AI and visitors.", "Los datos de contacto visibles (teléfono, email, dirección) son una señal básica de confianza para buscadores, IA y visitantes."),
    [T("Add a contact page and show your email, phone or address, linked as tel: and mailto:.", "Agregá una página de contacto y mostrá tu email, teléfono o dirección, con links tel: y mailto:.")],
    rescan,
  ),
  no_about_page: rule(
    "Minor", "GEO", "Low",
    T("No \"About us\" page found", "No se encontró una página \"Nosotros\""),
    T("Explaining who is behind the site helps search engines and AI trust and describe your business.", "Explicar quién está detrás del sitio ayuda a que buscadores e IA confíen en tu negocio y lo describan bien."),
    [T("Create an About page (who you are, since when, where) and link it from the menu or footer.", "Creá una página Nosotros (quiénes son, desde cuándo, dónde) y enlazala desde el menú o el pie.")],
    rescan,
  ),
  no_faq: rule(
    "Minor", "GEO", "Medium",
    T("No frequently asked questions found", "No se encontraron preguntas frecuentes"),
    T("Direct question-and-answer content is what AI assistants quote most in conversational answers.", "El contenido de pregunta y respuesta directa es lo que más citan los asistentes de IA."),
    [T("Add a FAQ section with the real questions your customers ask, each with a short direct answer.", "Agregá una sección de preguntas frecuentes con las preguntas reales de tus clientes, cada una con una respuesta corta y directa.")],
    rescan,
  ),
  no_author_dates: rule(
    "Minor", "GEO", "Low",
    T("{count} articles have no visible date or author", "{count} artículos no muestran fecha ni autor"),
    T("Search engines and AI prefer recent, attributable sources.", "Buscadores e IA prefieren fuentes recientes y con autor."),
    [T("Show the publish date in a <time datetime=\"…\"> element and the author's name.", "Mostrá la fecha en un elemento <time datetime=\"…\"> y el nombre del autor.")],
    rescan,
  ),

  // ---------------------------------------------------------------- Structured data
  no_structured_data: rule(
    "Minor", "StructuredData", "Medium",
    T("No structured data on the home page", "La página principal no tiene datos estructurados"),
    T("Structured data helps search engines understand your site and enables rich results.", "Los datos estructurados ayudan a los buscadores a entender tu sitio y habilitan resultados enriquecidos."),
    [T("Add WebSite and Organization JSON-LD to the home page; Product, Article or FAQPage where they apply.", "Agregá JSON-LD WebSite y Organization en la página principal; Product, Article o FAQPage donde correspondan.")],
    T("Google's Rich Results Test detects at least one item.", "La prueba de resultados enriquecidos de Google detecta al menos un elemento."),
  ),
  invalid_jsonld: rule(
    "High", "StructuredData", "Low",
    T("{count} JSON-LD blocks can't be read", "{count} bloques JSON-LD no se pueden leer"),
    T("A syntax error makes search engines ignore the whole block.", "Un error de sintaxis hace que los buscadores ignoren todo el bloque."),
    [T("Fix the JSON (missing commas, quotes or brackets). A JSON validator shows the exact line.", "Corregí el JSON (comas, comillas o llaves que faltan). Un validador de JSON muestra la línea exacta.")],
    T("Validate it at validator.schema.org.", "Validalo en validator.schema.org."),
  ),
  schema_missing_fields: rule(
    "Warning", "StructuredData", "Low",
    T("{count} structured data items are missing required fields", "A {count} datos estructurados les faltan campos obligatorios"),
    T("Incomplete items aren't eligible for rich results and may be ignored.", "Los elementos incompletos no califican para resultados enriquecidos y pueden ignorarse."),
    [T("Add the fields listed in the evidence for each type.", "Agregá los campos que figuran en la evidencia para cada tipo.")],
    T("Google's Rich Results Test shows no missing field errors.", "La prueba de resultados enriquecidos de Google no muestra campos faltantes."),
  ),
  schema_bad_urls: rule(
    "Minor", "StructuredData", "Low",
    T("{count} structured data URLs aren't absolute", "{count} URLs de datos estructurados no son absolutas"),
    T("Fields like url, logo or image must be full addresses (https://…).", "Campos como url, logo o image tienen que ser direcciones completas (https://…)."),
    [T("Write every URL inside JSON-LD with https:// and your domain.", "Escribí todas las URLs dentro del JSON-LD con https:// y tu dominio.")],
    rescan,
  ),
  schema_duplicate_entities: rule(
    "Minor", "StructuredData", "Low",
    T("Different business names in structured data ({detail})", "Nombres de negocio distintos en los datos estructurados ({detail})"),
    T("Several Organization items with different names confuse search engines about who you are.", "Varios elementos Organization con nombres distintos confunden a los buscadores sobre quién sos."),
    [T("Keep a single Organization entity with one name, and reference it with @id.", "Dejá una sola entidad Organization con un único nombre, y referenciala con @id.")],
    rescan,
  ),

  // ---------------------------------------------------------------- Performance
  slow_response: rule(
    "High", "Performance", "Medium",
    T("Slow server response ({detail})", "Respuesta lenta del servidor ({detail})"),
    T("Visitors wait before anything appears, and slow servers get crawled less.", "Los visitantes esperan antes de ver algo, y los servidores lentos se rastrean menos."),
    [T("Turn on caching in your hosting or CMS and use a CDN.", "Activá la caché en tu hosting o CMS y usá una CDN."), T("Look for slow plugins or database queries.", "Buscá plugins o consultas a la base de datos lentos.")],
    rescan,
  ),
  slightly_slow: rule(
    "Minor", "Performance", "Medium",
    T("Server response could be faster ({detail})", "La respuesta del servidor podría ser más rápida ({detail})"),
    T("Under 0.8 s is ideal; every extra second makes more visitors leave.", "Menos de 0,8 s es lo ideal; cada segundo de más hace que se vayan más visitantes."),
    [T("Turn on caching or a CDN so the page is served faster.", "Activá caché o una CDN para que la página se sirva más rápido.")],
    rescan,
  ),
  heavy_page: rule(
    "Minor", "Performance", "Medium",
    T("{count} pages have very heavy HTML (up to {detail})", "{count} páginas tienen un HTML muy pesado (hasta {detail})"),
    T("Big HTML takes longer to download and parse, especially on phones.", "Un HTML grande tarda más en bajar y procesarse, sobre todo en celulares."),
    [T("Remove inline code, huge inline SVGs and content not needed on first view.", "Sacá código en línea, SVG enormes en línea y contenido que no hace falta en la primera vista.")],
    rescan,
  ),
  no_compression: rule(
    "Warning", "Performance", "Low",
    T("Compression not enabled", "La compresión no está activada"),
    T("Pages travel 3–5 times bigger than they need to.", "Las páginas viajan de 3 a 5 veces más pesadas de lo necesario."),
    [T("Enable Brotli or gzip compression in your server, hosting or CDN.", "Activá la compresión Brotli o gzip en tu servidor, hosting o CDN.")],
    T("The response headers include content-encoding: br or gzip.", "Los encabezados de respuesta incluyen content-encoding: br o gzip."),
  ),
  no_static_cache: rule(
    "Minor", "Performance", "Low",
    T("{count} static files have no cache rules", "{count} archivos estáticos no tienen reglas de caché"),
    T("Returning visitors download the same CSS and JavaScript again on every visit.", "Los visitantes que vuelven descargan el mismo CSS y JavaScript en cada visita."),
    [T("Serve CSS, JS, fonts and images with Cache-Control: public, max-age=31536000 when their names include a version.", "Serví CSS, JS, fuentes e imágenes con Cache-Control: public, max-age=31536000 cuando su nombre incluye una versión.")],
    rescan,
  ),
  render_blocking_scripts: rule(
    "Warning", "Performance", "Medium",
    T("{count} scripts block rendering", "{count} scripts bloquean la carga"),
    T("Scripts in <head> without async or defer stop the page from showing until they download.", "Los scripts en <head> sin async ni defer frenan la página hasta que se descargan."),
    [T("Add defer (or async for independent scripts) or move them to the end of <body>.", "Agregales defer (o async si son independientes) o movelos al final del <body>.")],
    rescan,
    "<script src=\"/app.js\" defer></script>",
  ),
  third_party_scripts: rule(
    "Minor", "Performance", "Medium",
    T("Scripts from {count} external domains", "Scripts de {count} dominios externos"),
    T("Each third-party script adds connections and code you don't control.", "Cada script de terceros suma conexiones y código que no controlás."),
    [T("Remove the tools you no longer use and load the rest with defer or after interaction.", "Sacá las herramientas que ya no usás y cargá el resto con defer o después de la interacción.")],
    rescan,
  ),
  heavy_images: rule(
    "High", "Performance", "Medium",
    T("{count} images weigh more than 300 KB", "{count} imágenes pesan más de 300 KB"),
    T("Heavy images are the most common reason for slow pages and poor LCP.", "Las imágenes pesadas son la causa más común de páginas lentas y de un mal LCP."),
    [T("Resize images to the size they're shown at and compress them (WebP or AVIF).", "Achicá las imágenes al tamaño en que se muestran y comprimilas (WebP o AVIF).")],
    rescan,
  ),
  legacy_image_formats: rule(
    "Minor", "Performance", "Medium",
    T("{count} images use JPEG or PNG instead of WebP/AVIF", "{count} imágenes usan JPEG o PNG en lugar de WebP/AVIF"),
    T("Modern formats weigh 25–50% less with the same quality.", "Los formatos modernos pesan entre 25 y 50% menos con la misma calidad."),
    [T("Serve WebP or AVIF, with <picture> if you need a fallback.", "Serví WebP o AVIF, con <picture> si necesitás una alternativa.")],
    rescan,
  ),
  lcp_image_lazy: rule(
    "Warning", "Performance", "Low",
    T("{count} pages lazy-load their first image", "{count} páginas cargan en diferido su primera imagen"),
    T("The first image is usually the largest element; lazy-loading it delays LCP.", "La primera imagen suele ser el elemento más grande; cargarla en diferido retrasa el LCP."),
    [T("Remove loading=\"lazy\" from the first visible image and add fetchpriority=\"high\".", "Sacá loading=\"lazy\" de la primera imagen visible y agregale fetchpriority=\"high\".")],
    rescan,
  ),
  no_lazy_loading: rule(
    "Minor", "Performance", "Low",
    T("{count} pages load all their images at once", "{count} páginas cargan todas sus imágenes de una vez"),
    T("Images far down the page are downloaded even if nobody scrolls to them.", "Se descargan imágenes de abajo de la página aunque nadie llegue a verlas."),
    [T("Add loading=\"lazy\" to images below the first screen.", "Agregá loading=\"lazy\" a las imágenes que están debajo de la primera pantalla.")],
    rescan,
  ),
  lcp_poor: rule(
    "High", "Performance", "High",
    T("Slow Largest Contentful Paint ({detail})", "Largest Contentful Paint lento ({detail})"),
    T("The main content takes too long to appear. Google uses LCP as a ranking signal; good is under 2.5 s.", "El contenido principal tarda demasiado en aparecer. Google usa el LCP para posicionar; lo bueno es menos de 2,5 s."),
    [T("Optimize the largest image or text block, preload it and reduce server time and blocking scripts.", "Optimizá la imagen o el bloque de texto más grande, precargalo y bajá el tiempo del servidor y los scripts bloqueantes.")],
    T("Run PageSpeed Insights again: LCP under 2.5 s.", "Volvé a correr PageSpeed Insights: LCP menor a 2,5 s."),
  ),
  cls_poor: rule(
    "High", "Performance", "Medium",
    T("Layout shifts while loading (CLS {detail})", "El diseño se mueve mientras carga (CLS {detail})"),
    T("Elements jump around while the page loads. Good is under 0.1.", "Los elementos saltan mientras carga la página. Lo bueno es menos de 0,1."),
    [T("Set width and height on images and videos, and reserve space for ads, embeds and banners.", "Poné width y height en imágenes y videos, y reservá espacio para anuncios, embeds y banners.")],
    T("Run PageSpeed Insights again: CLS under 0.1.", "Volvé a correr PageSpeed Insights: CLS menor a 0,1."),
  ),
  tbt_poor: rule(
    "Warning", "Performance", "High",
    T("The page is busy running JavaScript (TBT {detail})", "La página está ocupada ejecutando JavaScript (TBT {detail})"),
    T("Long JavaScript tasks make the page slow to respond to taps and clicks. Good is under 200 ms.", "Las tareas largas de JavaScript hacen que la página tarde en responder a toques y clics. Lo bueno es menos de 200 ms."),
    [T("Remove unused JavaScript, split large bundles and defer third-party scripts.", "Sacá JavaScript sin usar, dividí los paquetes grandes y diferí los scripts de terceros.")],
    T("Run PageSpeed Insights again: TBT under 200 ms.", "Volvé a correr PageSpeed Insights: TBT menor a 200 ms."),
  ),
  inp_poor: rule(
    "High", "Performance", "High",
    T("Slow response to interactions for real users (INP {detail})", "Respuesta lenta a las interacciones de usuarios reales (INP {detail})"),
    T("Real visitors wait after tapping or clicking. Google's threshold for good is 200 ms.", "Los visitantes reales esperan después de tocar o hacer clic. Lo bueno para Google es menos de 200 ms."),
    [T("Break up long JavaScript tasks and reduce work done on each interaction.", "Dividí las tareas largas de JavaScript y reducí el trabajo de cada interacción.")],
    T("Check the field data in PageSpeed Insights or Search Console after 28 days.", "Revisá los datos de campo en PageSpeed Insights o Search Console después de 28 días."),
  ),
  unused_code: rule(
    "Minor", "Performance", "High",
    T("Unused JavaScript and CSS ({detail})", "JavaScript y CSS sin usar ({detail})"),
    T("The browser downloads code that this page never uses.", "El navegador descarga código que esta página nunca usa."),
    [T("Remove unused libraries and split code per page.", "Sacá las librerías que no usás y dividí el código por página.")],
    T("Run PageSpeed Insights again: the savings should drop.", "Volvé a correr PageSpeed Insights: el ahorro tiene que bajar."),
  ),

  // ---------------------------------------------------------------- Architecture & links
  broken_internal_links: rule(
    "High", "Architecture", "Low",
    T("{count} internal links are broken", "{count} links internos están rotos"),
    T("Visitors land on an error page and search engines waste crawl on dead ends. First one: {detail}", "Los visitantes terminan en una página de error y los buscadores pierden rastreo en callejones sin salida. El primero: {detail}"),
    [T("Fix the address of each link or remove it. The evidence lists which page links where.", "Corregí la dirección de cada link o sacalo. La evidencia muestra qué página enlaza a dónde.")],
    rescan,
  ),
  broken_images: rule(
    "High", "Architecture", "Low",
    T("{count} images don't load", "{count} imágenes no cargan"),
    T("Visitors see empty boxes and search engines can't index the images.", "Los visitantes ven cuadros vacíos y los buscadores no pueden indexar las imágenes."),
    [T("Fix the image address or upload the missing file.", "Corregí la dirección de la imagen o subí el archivo que falta.")],
    rescan,
  ),
  broken_external_links: rule(
    "Minor", "Architecture", "Low",
    T("{count} external links are broken", "{count} links externos están rotos"),
    T("Links to pages that no longer exist hurt the trust of your content.", "Los links a páginas que ya no existen bajan la confianza de tu contenido."),
    [T("Update or remove each broken external link.", "Actualizá o sacá cada link externo roto.")],
    rescan,
  ),
  links_to_redirects: rule(
    "Minor", "Architecture", "Low",
    T("{count} internal links point to redirects", "{count} links internos apuntan a redirecciones"),
    T("Every click goes through an extra hop. Linking the final URL is faster for visitors and crawlers.", "Cada clic pasa por un salto extra. Enlazar la URL final es más rápido para visitantes y rastreadores."),
    [T("Replace each link with the final URL it redirects to.", "Reemplazá cada link por la URL final a la que redirige.")],
    rescan,
  ),
  deep_pages: rule(
    "Minor", "Architecture", "Medium",
    T("{count} pages are more than 3 clicks from the home page", "{count} páginas están a más de 3 clics de la página principal"),
    T("Deep pages get crawled less often and are seen as less important.", "Las páginas profundas se rastrean menos y se consideran menos importantes."),
    [T("Link important pages from the menu, the home page or category pages.", "Enlazá las páginas importantes desde el menú, la página principal o las categorías.")],
    rescan,
  ),
  orphan_pages: rule(
    "Warning", "Architecture", "Low",
    T("{count} pages in the sitemap aren't linked from anywhere", "{count} páginas del sitemap no están enlazadas desde ningún lado"),
    T("Orphan pages are hard to find for visitors and get little importance from search engines.", "Las páginas huérfanas son difíciles de encontrar y los buscadores les dan poca importancia."),
    [T("Link each one from a related page, or remove it from the sitemap if it's obsolete.", "Enlazá cada una desde una página relacionada, o sacala del sitemap si está obsoleta.")],
    rescan,
  ),
  weak_internal_linking: rule(
    "Minor", "Architecture", "Low",
    T("{count} pages receive only one internal link", "{count} páginas reciben un solo link interno"),
    T("Pages with few internal links look unimportant to search engines.", "Las páginas con pocos links internos parecen poco importantes para los buscadores."),
    [T("Add contextual links to them from related content.", "Agregá links contextuales hacia ellas desde contenido relacionado.")],
    rescan,
  ),
  nofollow_internal: rule(
    "Minor", "Architecture", "Low",
    T("{count} internal links are nofollow", "{count} links internos son nofollow"),
    T("nofollow on your own links tells search engines not to pass importance to your pages.", "nofollow en tus propios links les dice a los buscadores que no les pasen importancia a tus páginas."),
    [T("Remove rel=\"nofollow\" from internal links.", "Sacá rel=\"nofollow\" de los links internos.")],
    rescan,
  ),

  // ---------------------------------------------------------------- Mobile & accessibility
  missing_viewport: rule(
    "High", "Accessibility", "Low",
    T("Not set up for phones", "No está preparado para celulares"),
    T("On phones the page shows tiny, zoomed-out text. Google indexes the mobile version.", "En el celular la página se ve chiquita y alejada. Google indexa la versión mobile."),
    [T("Add the viewport meta tag inside <head>.", "Agregá la meta etiqueta viewport dentro de <head>.")],
    rescan,
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />",
  ),
  missing_lang: rule(
    "Minor", "Accessibility", "Low",
    T("{count} pages don't declare their language", "{count} páginas no indican su idioma"),
    T("Screen readers, translators and search engines may read the page in the wrong language.", "Lectores de pantalla, traductores y buscadores pueden leer la página en el idioma equivocado."),
    [T("Add the language to the html tag, like <html lang=\"es\">.", "Agregá el idioma en la etiqueta html, por ejemplo <html lang=\"es\">.")],
    rescan,
  ),
  missing_charset: rule(
    "Minor", "Accessibility", "Low",
    T("Character encoding not declared", "No está declarada la codificación de caracteres"),
    T("Accents and ñ may show up as strange symbols.", "Los acentos y la ñ pueden aparecer como símbolos raros."),
    [T("Add <meta charset=\"utf-8\"> as the first tag in <head>.", "Agregá <meta charset=\"utf-8\"> como primera etiqueta del <head>.")],
    rescan,
  ),
  images_without_alt: rule(
    "Warning", "Accessibility", "Low",
    T("{count} images without alt text", "{count} imágenes sin texto alternativo"),
    T("Screen readers, search engines and AI can't tell what they show.", "Lectores de pantalla, buscadores e IA no saben qué muestran."),
    [T("Add a short alt describing each image; use alt=\"\" only for decorative ones.", "Agregá un alt corto que describa cada imagen; usá alt=\"\" solo en las decorativas.")],
    rescan,
  ),
  images_without_dimensions: rule(
    "Minor", "Accessibility", "Low",
    T("{count} images have no width and height", "{count} imágenes no tienen width y height"),
    T("Without dimensions the layout jumps when the image loads (CLS).", "Sin dimensiones, el diseño salta cuando carga la imagen (CLS)."),
    [T("Add width and height attributes with the image's real proportions.", "Agregá los atributos width y height con las proporciones reales de la imagen.")],
    rescan,
  ),
  form_labels: rule(
    "Warning", "Accessibility", "Low",
    T("{count} form fields have no label", "{count} campos de formulario no tienen etiqueta"),
    T("People using screen readers don't know what to type in each field.", "Quien usa lector de pantalla no sabe qué escribir en cada campo."),
    [T("Give each field a <label for=\"…\"> or an aria-label.", "Dale a cada campo un <label for=\"…\"> o un aria-label.")],
    rescan,
  ),
  buttons_without_name: rule(
    "Warning", "Accessibility", "Low",
    T("{count} buttons have no accessible name", "{count} botones no tienen nombre accesible"),
    T("Icon-only buttons without a label are announced as just \"button\".", "Los botones con solo un ícono y sin etiqueta se anuncian como \"botón\" a secas."),
    [T("Add visible text or an aria-label to each button.", "Agregá texto visible o un aria-label a cada botón.")],
    rescan,
  ),
  missing_manifest: rule(
    "Minor", "Accessibility", "Low",
    T("No web app manifest", "No tiene web app manifest"),
    T("Without a manifest, phones can't add your site to the home screen with its own name and icon.", "Sin manifest, los celulares no pueden agregar tu sitio a la pantalla de inicio con su nombre e ícono."),
    [T("Add a manifest.webmanifest with your name and icons and link it in <head>.", "Agregá un manifest.webmanifest con tu nombre e íconos y enlazalo en <head>.")],
    rescan,
    "<link rel=\"manifest\" href=\"/manifest.webmanifest\" />",
  ),
  a11y_contrast: rule(
    "Warning", "Accessibility", "Medium",
    T("Text with low color contrast", "Texto con poco contraste de color"),
    T("Some text is hard to read, especially on phones in the sun or for people with low vision (WCAG 2.2).", "Algunos textos cuestan de leer, sobre todo en el celular al sol o para personas con baja visión (WCAG 2.2)."),
    [T("Darken the text or lighten the background until the contrast ratio is at least 4.5:1.", "Oscurecé el texto o aclará el fondo hasta lograr un contraste de al menos 4,5:1.")],
    T("Run PageSpeed Insights or Lighthouse: the contrast check passes.", "Corré PageSpeed Insights o Lighthouse: el control de contraste pasa."),
  ),
  a11y_tap_targets: rule(
    "Warning", "Accessibility", "Medium",
    T("Buttons and links too small or too close on phones", "Botones y links muy chicos o muy juntos en el celular"),
    T("People tap the wrong thing on touch screens.", "La gente toca lo que no quería en pantallas táctiles."),
    [T("Make touch targets at least 24×24 px and keep space between them.", "Hacé que los elementos tocables midan al menos 24×24 px y dejá espacio entre ellos.")],
    T("Run PageSpeed Insights: the target size check passes.", "Corré PageSpeed Insights: el control de tamaño de objetivos pasa."),
  ),
  a11y_font_size: rule(
    "Warning", "Accessibility", "Low",
    T("Text too small to read on phones", "Texto demasiado chico para leer en el celular"),
    T("Visitors have to zoom in to read.", "Los visitantes tienen que hacer zoom para leer."),
    [T("Use at least 16 px for body text on mobile.", "Usá al menos 16 px para el texto en mobile.")],
    T("Run PageSpeed Insights: the font size check passes.", "Corré PageSpeed Insights: el control de tamaño de letra pasa."),
  ),
  a11y_other: rule(
    "Minor", "Accessibility", "Medium",
    T("{count} other accessibility checks failed ({detail})", "Fallaron otros {count} controles de accesibilidad ({detail})"),
    T("Automated WCAG checks found issues that affect people using assistive technology.", "Los controles automáticos de WCAG encontraron problemas que afectan a quienes usan tecnologías de asistencia."),
    [T("Open PageSpeed Insights → Accessibility to see each element and how to fix it.", "Abrí PageSpeed Insights → Accesibilidad para ver cada elemento y cómo arreglarlo.")],
    T("Run PageSpeed Insights again: the checks pass.", "Volvé a correr PageSpeed Insights: los controles pasan."),
  ),

  // ---------------------------------------------------------------- Security & infrastructure
  no_https: rule(
    "Critical", "Security", "Medium",
    T("Your site doesn't use HTTPS", "Tu sitio no usa HTTPS"),
    T("Browsers mark it \"Not secure\" and Google ranks it lower.", "Los navegadores lo marcan \"No seguro\" y Google lo posiciona peor."),
    [T("Turn on a free SSL certificate (most hostings offer Let's Encrypt).", "Activá un certificado SSL gratis (la mayoría de los hostings ofrece Let's Encrypt)."), T("Redirect every http:// address to https://.", "Redirigí todas las direcciones http:// a https://.")],
    T("Your site opens with a padlock in the address bar.", "Tu sitio abre con el candado en la barra de direcciones."),
  ),
  no_https_redirect: rule(
    "High", "Security", "Low",
    T("http:// doesn't redirect to https://", "http:// no redirige a https://"),
    T("People who type your address without https land on an insecure copy.", "Quien escribe tu dirección sin https entra a una copia no segura."),
    [T("Add a permanent (301) redirect from http:// to https://.", "Agregá una redirección permanente (301) de http:// a https://.")],
    T("Opening http://yoursite ends on https://yoursite.", "Al abrir http://tusitio terminás en https://tusitio."),
  ),
  cert_expiring: rule(
    "High", "Security", "Low",
    T("SSL certificate expires soon ({detail})", "El certificado SSL vence pronto ({detail})"),
    T("When it expires, browsers block your site with a security warning.", "Cuando vence, los navegadores bloquean tu sitio con un aviso de seguridad."),
    [T("Renew the certificate, or turn on automatic renewal in your hosting.", "Renová el certificado, o activá la renovación automática en tu hosting.")],
    rescan,
  ),
  mixed_content: rule(
    "High", "Security", "Low",
    T("{count} insecure resources on secure pages", "{count} recursos no seguros en páginas seguras"),
    T("Browsers block or warn about http:// images, scripts and styles on https:// pages.", "Los navegadores bloquean o avisan por imágenes, scripts y estilos http:// en páginas https://."),
    [T("Change those http:// addresses to https://.", "Cambiá esas direcciones http:// a https://.")],
    rescan,
  ),
  missing_hsts: rule(
    "Minor", "Security", "Low",
    T("HSTS header missing", "Falta el encabezado HSTS"),
    T("Browsers aren't told to always use the secure version of your site.", "No se le indica al navegador que use siempre la versión segura de tu sitio."),
    [T("Add Strict-Transport-Security: max-age=31536000 in your server or CDN.", "Agregá Strict-Transport-Security: max-age=31536000 en tu servidor o CDN.")],
    rescan,
  ),
  missing_security_headers: rule(
    "Minor", "Security", "Low",
    T("Security headers missing ({detail})", "Faltan encabezados de seguridad ({detail})"),
    T("These headers protect visitors from clickjacking, content sniffing and data leaks.", "Estos encabezados protegen a los visitantes de clickjacking, detección de contenido y fugas de datos."),
    [T("Add the missing headers in your server, hosting or CDN configuration.", "Agregá los encabezados que faltan en la configuración del servidor, hosting o CDN.")],
    rescan,
    "Content-Security-Policy: default-src 'self'\nX-Content-Type-Options: nosniff\nReferrer-Policy: strict-origin-when-cross-origin\nX-Frame-Options: SAMEORIGIN",
  ),
  server_version_exposed: rule(
    "Minor", "Security", "Low",
    T("Your server reveals its software version ({detail})", "Tu servidor muestra la versión de su software ({detail})"),
    T("Publishing exact versions helps attackers find known vulnerabilities.", "Publicar la versión exacta ayuda a encontrar vulnerabilidades conocidas."),
    [T("Hide the version in the Server and X-Powered-By headers.", "Ocultá la versión en los encabezados Server y X-Powered-By.")],
    rescan,
  ),
} satisfies Record<string, Rule>;

export type RuleId = keyof typeof rules;

export const severityOrder: Record<Severity, number> = { Critical: 0, High: 1, Warning: 2, Minor: 3 };
export const effortOrder: Record<Effort, number> = { Low: 0, Medium: 1, High: 2 };

/** Points each issue takes from its category score, before weighting by how many pages it affects. */
export const penalty: Record<Severity, number> = { Critical: 25, High: 15, Warning: 8, Minor: 3 };

/** How much each category weighs in the overall SEO score. */
export const categoryWeights: Record<Category, number> = {
  Technical: 25,
  OnPage: 15,
  GEO: 10,
  Performance: 15,
  StructuredData: 5,
  Architecture: 10,
  Accessibility: 10,
  Security: 10,
};

export function ruleOf(issue: Pick<FoundIssue, "rule">): Rule {
  return rules[issue.rule];
}

function fill(text: string, issue: FoundIssue) {
  return text.replaceAll("{count}", String(issue.count ?? "")).replaceAll("{detail}", issue.detail ?? "");
}

/** The issue's text in one language. */
export function describe(issue: FoundIssue, lang: Lang) {
  const r = ruleOf(issue);
  return {
    title: fill(r.title[lang], issue),
    impact: fill(r.impact[lang], issue),
    fix: r.fix.map((step) => fill(step[lang], issue)),
    verify: fill(r.verify[lang], issue),
    code: r.code,
  };
}

/** How much an issue costs: its severity, a bit more when it affects a large share of the crawled pages. */
function cost(issue: FoundIssue, pagesCrawled: number) {
  const affected = issue.pages?.length ?? 1;
  const spread = pagesCrawled > 1 ? Math.min(1, affected / pagesCrawled) : 0;
  return penalty[ruleOf(issue).severity] * (1 + spread);
}

/** 0–100 for one category: 100 minus the cost of its issues. */
export function categoryScore(issues: FoundIssue[], category: Category, pagesCrawled = 1) {
  const lost = issues.filter((issue) => ruleOf(issue).category === category).reduce((sum, issue) => sum + cost(issue, pagesCrawled), 0);
  return Math.max(0, Math.round(100 - lost));
}

/** Weighted average of the evaluated categories. Categories passed as not evaluated are left out. */
export function overallScore(issues: FoundIssue[], pagesCrawled = 1, notEvaluated: Category[] = []) {
  const evaluated = categories.filter((category) => !notEvaluated.includes(category));
  const weight = evaluated.reduce((sum, category) => sum + categoryWeights[category], 0);
  if (weight === 0) return 0;
  const total = evaluated.reduce((sum, category) => sum + categoryScore(issues, category, pagesCrawled) * categoryWeights[category], 0);
  return Math.round(total / weight);
}

/** Kept for older callers: the overall score. */
export function scoreOf(issues: FoundIssue[], category?: Category) {
  return category ? categoryScore(issues, category) : overallScore(issues);
}

export function isRuleId(value: unknown): value is RuleId {
  return typeof value === "string" && value in rules;
}

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (categories as string[]).includes(value);
}
