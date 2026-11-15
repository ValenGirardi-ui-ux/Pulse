import { T } from "./i18n";

// A small, static picture of the Pulse dashboard for the landing hero. Purely decorative.

const stats = [
  { label: { en: "Pulse Score", es: "Puntaje Pulse" }, value: "84", note: { en: "+3 since last scan", es: "+3 desde el último" }, noteClass: "text-emerald-600" },
  { label: { en: "Website Status", es: "Estado del sitio" }, value: null, note: { en: "Responded in 0.5 s", es: "Respondió en 0.5 s" }, noteClass: "text-[#8a91a3]" },
  { label: { en: "Issues", es: "Problemas" }, value: "3", note: { en: "0 critical", es: "0 críticos" }, noteClass: "text-[#8a91a3]" },
  { label: { en: "Last Scan", es: "Último escaneo" }, value: { en: "2 min ago", es: "hace 2 min" }, note: { en: "16 pages checked", es: "16 páginas revisadas" }, noteClass: "text-[#8a91a3]" },
];

const categories = [
  { name: { en: "Technical SEO", es: "SEO técnico" }, score: 100, note: { en: "No issues", es: "Sin problemas" } },
  { name: { en: "On-page SEO", es: "SEO on-page" }, score: 90, note: { en: "1 issue", es: "1 problema" } },
  { name: { en: "GEO readiness", es: "Preparación GEO" }, score: 94, note: { en: "2 issues", es: "2 problemas" } },
  { name: { en: "Performance", es: "Rendimiento" }, score: 100, note: { en: "No issues", es: "Sin problemas" } },
];

const issues = [
  { dot: "bg-amber-500", title: { en: "No main heading (h1)", es: "No tiene título principal (h1)" } },
  { dot: "bg-[#c9cedd]", title: { en: "No preview when shared on social media", es: "No tiene vista previa al compartir en redes" } },
  { dot: "bg-[#c9cedd]", title: { en: "No analytics detected", es: "No se detectó analítica" } },
];

export function HeroDashboard() {
  return (
    <div
      aria-hidden="true"
      className="relative origin-center overflow-hidden rounded-2xl border border-black/[0.07] bg-white text-[#0f1a2e] shadow-[0_1px_2px_rgba(15,26,46,0.06),0_24px_60px_rgba(15,26,46,0.12)] transition-transform duration-500 ease-out hover:scale-[1.03]"
    >
      <div className="space-y-4 p-4 lg:p-5">
        <div className="grid grid-cols-4 divide-x divide-[#ececf1]">
          {stats.map((stat, index) => (
            <div key={stat.label.en} className={index === 0 ? "pr-2.5" : "px-2.5"}>
              <p className="truncate text-[9px] text-[#8a91a3]">
                <T en={stat.label.en} es={stat.label.es} />
              </p>
              <p className="mt-1 truncate text-[15px] font-semibold tracking-tight lg:text-lg">
                {stat.value === null ? (
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
                    <T en="Online" es="En línea" />
                  </span>
                ) : typeof stat.value === "string" ? (
                  stat.value
                ) : (
                  <T en={stat.value.en} es={stat.value.es} />
                )}
              </p>
              <p className={`mt-0.5 truncate text-[9px] ${stat.noteClass}`}>
                <T en={stat.note.en} es={stat.note.es} />
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {categories.map((category) => (
            <div key={category.name.en} className="rounded-xl border border-black/[0.06] px-2.5 py-2 shadow-[0_4px_12px_rgba(15,26,46,0.05)]">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-[10px] font-medium">
                  <T en={category.name.en} es={category.name.es} />
                </span>
                <span className="font-mono text-[11px] font-medium">{category.score}</span>
              </div>
              <p className="mt-0.5 flex items-center gap-1 truncate text-[9px] text-[#8a91a3]">
                <span className="size-1 shrink-0 rounded-full bg-emerald-500" />
                <T en={category.note.en} es={category.note.es} />
              </p>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[11px] font-medium">
              <T en="Current Issues" es="Problemas actuales" />
            </p>
            <p className="text-[9px] text-[#8a91a3]">
              <T en="View all 3" es="Ver los 3" />
            </p>
          </div>
          <ul className="overflow-hidden rounded-xl border border-black/[0.06]">
            {issues.map((issue) => (
              <li key={issue.title.en} className="flex items-center gap-2 border-b border-[#f1f2f6] px-3 py-2 last:border-b-0">
                <span className={`size-1.5 shrink-0 rounded-full ${issue.dot}`} />
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                  <T en={issue.title.en} es={issue.title.es} />
                </span>
                <span className="font-mono text-[9px] text-[#8a91a3]">/</span>
                <span className="text-[10px] text-[#c9cedd]">›</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <span className="hero-card-sheen pointer-events-none absolute inset-0" />
    </div>
  );
}
