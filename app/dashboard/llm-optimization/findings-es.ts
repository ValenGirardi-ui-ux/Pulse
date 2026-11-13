import type { Lang } from "../../i18n";
import type { Finding } from "./data";

type FindingText = {
  title: string;
  why: string;
  found: (host: string) => string;
  fix: string[];
  codeLabel?: string;
};

// Spanish text for each finding, by id. Code snippets stay as they are.
const es: Record<string, FindingText> = {
  "ai-bots-blocked": {
    title: "robots.txt bloquea a los rastreadores de IA",
    why: "GPTBot, ClaudeBot y PerplexityBot tienen el acceso bloqueado, así que estos asistentes no pueden leer tus páginas ni citarlas en sus respuestas.",
    found: (host) => `https://${host}/robots.txt tiene "Disallow: /" para GPTBot, ClaudeBot y PerplexityBot.`,
    fix: [
      "Quitá las reglas Disallow de los agentes de IA en los que querés aparecer.",
      "Bloqueá solo rutas privadas, como /admin o /checkout.",
      "Volvé a correr el análisis para confirmar que los rastreadores tienen acceso.",
    ],
  },
  "client-only-content": {
    title: "El contenido principal aparece recién después de ejecutar JavaScript",
    why: "La mayoría de los rastreadores de IA leen el HTML sin ejecutar JavaScript. Ven una página casi vacía.",
    found: () =>
      "El HTML de 9 páginas tiene menos de 50 palabras. Después de renderizar, esas mismas páginas tienen más de 600.",
    fix: [
      "Renderizá el contenido principal en el servidor (SSR) o al compilar (generación estática).",
      "Usá JavaScript del lado del cliente solo para la interactividad, no para cargar el texto.",
      "Revisá el resultado con “Ver código fuente”: el texto tiene que verse ahí.",
    ],
    codeLabel: "HTML actual",
  },
  "no-llms-txt": {
    title: "Falta el archivo llms.txt",
    why: "llms.txt les da a los modelos de lenguaje un mapa corto y curado de tus páginas más importantes y de lo que contienen.",
    found: (host) => `https://${host}/llms.txt devuelve 404.`,
    fix: [
      "Creá /llms.txt en la raíz del sitio.",
      "Agregá una línea que describa el negocio y links a las páginas clave, cada uno con un resumen corto.",
    ],
  },
  "heading-hierarchy": {
    title: "Jerarquía de títulos rota",
    why: "Los modelos usan los títulos para dividir la página en temas. Varios H1 o niveles salteados vuelven esa estructura confusa.",
    found: () => "3 páginas tienen más de un <h1>. 7 páginas saltan de <h1> a <h4>.",
    fix: [
      "Usá un solo <h1> por página que diga de qué trata.",
      "Anidá las secciones con <h2> y <h3> en orden, sin saltear niveles.",
      "No uses títulos para dar estilo; usá clases de CSS.",
    ],
    codeLabel: "Estructura recomendada",
  },
  "no-landmarks": {
    title: "Contenido envuelto en <div> genéricos",
    why: "Sin <main>, <article> o <nav>, los rastreadores no distinguen tu contenido de los menús, pies de página y banners.",
    found: () => "No hay elemento <main> en 12 de 14 páginas. Los artículos del blog no usan <article>.",
    fix: [
      "Envolvé el contenido principal de cada página en un único <main>.",
      "Usá <article> para los artículos y <section> con un título para cada bloque.",
      "Usá <nav>, <header> y <footer> para la estructura del sitio.",
    ],
    codeLabel: "Estructura semántica",
  },
  "no-structured-data": {
    title: "Sin datos estructurados (JSON-LD)",
    why: "Los datos de Schema.org declaran hechos como tu nombre, productos, precios y preguntas frecuentes en un formato que las máquinas leen sin adivinar.",
    found: () => "No se encontró JSON-LD en ninguna página.",
    fix: [
      "Agregá un bloque Organization en la página de inicio.",
      "Agregá Product o SoftwareApplication con ofertas en la página de precios.",
      "Agregá FAQPage en las páginas con preguntas y respuestas.",
    ],
    codeLabel: "JSON-LD para la página de inicio",
  },
  "meta-descriptions": {
    title: "Títulos y descripciones faltantes o duplicados",
    why: "El título y la meta description suelen ser el primer resumen que lee un modelo. Si se repiten, las páginas parecen intercambiables.",
    found: () => "6 páginas no tienen meta description. 4 páginas comparten el título “Home”.",
    fix: [
      "Escribí un <title> único de 50–60 caracteres para cada página: primero el tema, al final la marca.",
      "Escribí una meta description de 140–160 caracteres que responda “¿de qué trata esta página?”.",
    ],
    codeLabel: "Ejemplo",
  },
  "buried-answers": {
    title: "Las respuestas clave están escondidas en párrafos largos",
    why: "Los asistentes citan frases cortas y que se entienden solas. Los textos de marketing sin datos claros casi nunca se citan.",
    found: () => "Las páginas arrancan con eslóganes. Los precios, límites y requisitos aparecen recién muy abajo.",
    fix: [
      "Empezá cada página con un resumen de 2–3 oraciones: qué es, para quién es y cuánto cuesta.",
      "Convertí las preguntas que se repiten en una sección de preguntas frecuentes, con una pregunta por título y la respuesta directa abajo.",
      "Usá listas y tablas para especificaciones, planes y comparaciones.",
    ],
  },
  "text-in-images": {
    title: "Texto importante dentro de imágenes",
    why: "El texto dentro de una imagen es invisible para los rastreadores de texto, salvo que se repita en el HTML o en el texto alternativo.",
    found: () => "18 imágenes no tienen texto alternativo. La tabla de precios de /pricing es una sola imagen.",
    fix: [
      "Rehacé la tabla de precios en HTML.",
      "Agregá un texto alternativo descriptivo a cada imagen importante; usá alt=\"\" en las decorativas.",
    ],
  },
  "hidden-content": {
    title: "Contenido que se carga solo al abrir una pestaña o un acordeón",
    why: "Si el texto se inserta al hacer clic, los rastreadores nunca lo ven. El texto oculto pero presente en el HTML sí se puede leer.",
    found: () => "Las respuestas de /faq se descargan cuando se abre el acordeón.",
    fix: ["Poné todo el texto en el HTML y ocultalo con CSS, o usá el elemento nativo <details>."],
    codeLabel: "Acordeón nativo",
  },
  "js-links": {
    title: "La navegación usa clics en lugar de links",
    why: "Los rastreadores siguen los links <a href>. Los botones que navegan con onClick esconden páginas.",
    found: () => "El menú principal y el pie de página usan <div onClick> para 5 páginas internas.",
    fix: ["Reemplazá los <div> y <button> que se usan para navegar por links <a href>."],
    codeLabel: "Antes → después",
  },
  "lang-canonical": {
    title: "Falta el atributo lang y las URL canónicas",
    why: "El idioma y la URL canónica les dicen a los modelos qué versión de la página es la confiable y cómo leerla.",
    found: () => "<html> no tiene atributo lang. 8 páginas no tienen link canónico.",
    fix: [
      "Poné <html lang=\"…\"> con el idioma del contenido.",
      "Agregá <link rel=\"canonical\"> apuntando a la URL preferida de cada página.",
    ],
  },
  "no-dates": {
    title: "Los artículos no muestran fecha ni autor",
    why: "Los modelos prefieren fuentes recientes y con autor. Sin fecha no pueden saber si la información está al día.",
    found: () => "Los artículos del blog no muestran fecha de publicación o actualización, ni autor.",
    fix: [
      "Mostrá la fecha de publicación y la de última actualización en un elemento <time datetime=\"…\">.",
      "Mostrá el nombre del autor con un link a su página.",
    ],
  },
  "vague-links": {
    title: "Textos de link poco claros",
    why: "El texto del link describe la página de destino. “Hacé clic acá” no da ninguna pista de qué contiene.",
    found: () => "23 links dicen “click here”, “read more” o “learn more”.",
    fix: ["Reescribí el texto del link para que describa el destino, por ejemplo “Ver los planes y precios”."],
  },
};

/** Returns the finding in the chosen language. English is the source, so it's returned as is. */
export function localizeFinding(finding: Finding, lang: Lang, host: string): Finding {
  const text = lang === "es" ? es[finding.id] : undefined;
  if (!text) return finding;
  return {
    ...finding,
    title: text.title,
    why: text.why,
    found: text.found(host),
    fix: text.fix,
    code: finding.code && text.codeLabel ? { ...finding.code, label: text.codeLabel } : finding.code,
  };
}
