import { Suspense, type ReactNode } from "react";
import { Montserrat, Sora } from "next/font/google";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { switchAccount } from "./auth/actions";
import { T, TInput } from "./i18n";
import { LanguageToggle } from "./language-switch";
import { MobileMenu } from "./mobile-menu";
import { Reveal } from "./reveal";
import { SiteHeader } from "./site-header";
import { SmoothScroll } from "./smooth-scroll";
import { Steps } from "./steps";
import { ContactForm } from "./contact-form";

const pulse = Sora({
  weight: ["300", "400", "600"],
  subsets: ["latin"],
});

const cta = Montserrat({
  weight: ["500"],
  subsets: ["latin"],
});

const navLink =
  "relative inline-flex items-center bg-transparent p-0 leading-none text-neutral-500 transition-colors duration-300 hover:text-[#4c2882] after:absolute after:top-[calc(100%+3px)] after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-[#4c2882] after:transition-transform after:duration-500 after:ease-out after:content-[''] hover:after:scale-x-100";

const primaryButton =
  `${cta.className} inline-flex shrink-0 origin-center items-center gap-2 rounded-full bg-[#4c2882] px-4 py-2.5 text-xs sm:px-5 font-medium uppercase tracking-[0.08em] text-white shadow-[0_6px_16px_rgba(76,40,130,0.28)] transition-transform duration-300 ease-out hover:scale-105`;

const sectionLinks = [
  { href: "#que-es", label: "What is it?" },
  { href: "#planes", label: "Plans" },
  { href: "#contacto", label: "Contact" },
];

const contactEmail = "hello@pulse.app";

const footerColumns = [
  {
    title: "Product",
    links: [
      { href: "#que-es", label: "What is it?" },
      { href: "#pasos", label: "How it works" },
      { href: "#planes", label: "Plans" },
      { href: "/signup", label: "Try for free" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/login", label: "Log in" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "#", label: "Terms of use" },
      { href: "#", label: "Privacy" },
      { href: "#", label: "Security" },
    ],
  },
];

const checks = [
  "Availability",
  "SEO",
  "Marketing",
  "Tracking",
  "Performance",
  "Technical issues",
  "Forms",
  "Errors",
  "Automatic monitoring",
  "LLM",
];

function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className={`flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] ${
        dark ? "text-white/60" : "text-[#5b6478]"
      }`}
    >
      <span className={`h-px w-7 ${dark ? "bg-[#a98bd6]" : "bg-[#4c2882]/50"}`} />
      {children}
    </p>
  );
}

function Squiggle({ children, color = "#4c2882" }: { children: ReactNode; color?: string }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      {children}
      <svg
        viewBox="0 0 200 16"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -bottom-[0.12em] left-0 h-[0.22em] w-full"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 10 C 30 3, 52 14, 82 8 S 140 4, 168 9 S 192 11, 198 7"
          className="squiggle-path"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          opacity="0.75"
        />
      </svg>
    </span>
  );
}

function Waves({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      className={`wave-shift pointer-events-none w-full ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <path d="M0 96 C 240 40, 420 140, 720 92 S 1200 30, 1440 84 V160 H0Z" fill="#4c2882" opacity="0.05" />
      <path d="M0 118 C 300 70, 520 150, 820 110 S 1260 70, 1440 112 V160 H0Z" fill="#4c2882" opacity="0.06" />
      <path d="M0 136 C 260 110, 560 160, 880 132 S 1280 112, 1440 134 V160 H0Z" fill="#ffffff" />
    </svg>
  );
}

function IconArrow({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

function UrlForm() {
  return (
    <form
      action="/signup"
      className="flex w-full max-w-md items-center gap-2 rounded-full bg-white p-1.5 pl-4 shadow-[0_1px_2px_rgba(15,26,46,0.06),0_10px_30px_rgba(15,26,46,0.08)] sm:pl-6"
    >
      <label htmlFor="url-top" className="sr-only">
        <T en="Your website" es="Tu sitio web" />
      </label>
      <TInput
        id="url-top"
        name="url"
        type="text"
        placeholder="yourwebsite.com"
        placeholderEs="tusitioweb.com"
        className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-[#0f1a2e] sm:text-sm outline-none placeholder:text-[#9aa1b2]"
      />
      <button type="submit" className={primaryButton}>
        <T en="Try for free" es="Probá gratis" />
        <IconArrow />
      </button>
    </form>
  );
}

/** Log in + Try for free for visitors; Switch account + Go to dashboard for people already signed in. */
function HeaderActions({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="flex items-center gap-3 md:gap-4">
      {signedIn ? (
        <form action={switchAccount} className="max-md:hidden">
          <button type="submit" className={`${navLink} cursor-pointer`}>
            <T en="Switch account" es="Cambiar cuenta" />
          </button>
        </form>
      ) : (
        <Link href="/login" className={`${navLink} max-md:hidden`}>
          <T en="Log in" es="Iniciar sesión" />
        </Link>
      )}
      <Link
        href={signedIn ? "/dashboard" : "/signup"}
        className="inline-flex shrink-0 origin-center items-center gap-2 rounded-full bg-[#4c2882] px-5 py-2 text-xs font-medium text-white shadow-[0_2px_6px_rgba(76,40,130,0.28)] transition-transform duration-300 ease-out hover:scale-110"
      >
        {signedIn ? <T en="Go to dashboard" es="Ir al dashboard" /> : <T en="Try for free" es="Probá gratis" />}
        <IconArrow className="size-3.5" />
      </Link>
      <MobileMenu links={sectionLinks} signedIn={signedIn} />
    </div>
  );
}

async function SessionHeaderActions() {
  let signedIn = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    signedIn = Boolean(data?.claims);
  } catch {
    // Supabase isn't configured: show the signed-out buttons.
  }
  return <HeaderActions signedIn={signedIn} />;
}

export default function Home() {
  return (
    <div className={`${pulse.className} bg-[#f6f7fb] text-[#0f1a2e]`}>
      <SmoothScroll />

      <LanguageToggle />
      <SiteHeader>
        <a href="#inicio" className="text-base font-semibold tracking-tight text-[#4c2882] transition-transform duration-300 hover:scale-105">
          Pulse
        </a>
        <nav className="hidden items-center gap-6 text-sm text-neutral-600 md:flex">
          {sectionLinks.map((link) => (
            <a key={link.href} href={link.href} className={navLink}>
              <T en={link.label} />
            </a>
          ))}
        </nav>
        <Suspense fallback={<HeaderActions signedIn={false} />}>
          <SessionHeaderActions />
        </Suspense>
      </SiteHeader>

      <main id="inicio" className="relative overflow-hidden pt-20">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pt-10 pb-20 sm:gap-14 sm:pt-14 sm:pb-24 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div>
            <Reveal>
              <Eyebrow>
                <T en="Website health checker" es="Revisión de salud de sitios web" />
              </Eyebrow>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 text-[2.5rem] leading-[1.08] font-light tracking-[-0.03em] sm:text-[3.5rem]">
                <T
                  en={<>The <Squiggle>health</Squiggle> of your digital product, in one place.</>}
                  es={<>La <Squiggle>salud</Squiggle> de tu producto digital, en un solo lugar.</>}
                />
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-lg text-base leading-7 sm:mt-7 sm:text-[17px] text-[#4a5368]">
                <T
                  en={
                    <>
                      Pulse checks availability, performance, SEO, analytics, tracking tools and broken links, then
                      shows you{" "}
                      <span className="highlight-mark rounded bg-[#4c2882]/10 px-1 text-[#4c2882]">what needs attention</span>.
                    </>
                  }
                  es={
                    <>
                      Pulse revisa disponibilidad, rendimiento, SEO, analítica, herramientas de seguimiento y links
                      rotos, y te muestra{" "}
                      <span className="highlight-mark rounded bg-[#4c2882]/10 px-1 text-[#4c2882]">qué necesita atención</span>.
                    </>
                  }
                />
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-9">
                <UrlForm />
              </div>
              <p className="mt-4 font-mono text-[11px] text-[#8a91a3]">
                <T en="Paste a URL to run your first scan." es="Pegá una URL para hacer tu primer escaneo." />
              </p>
            </Reveal>
          </div>
          <Reveal delay={180} className="relative max-md:hidden">
            <div
              aria-hidden="true"
              className="absolute -inset-10 -z-0 rounded-[3rem] bg-[radial-gradient(ellipse_at_center,rgba(76,40,130,0.12),transparent_70%)]"
            />
            <div className="relative overflow-visible">
              <div
                className="relative min-h-[15rem] origin-center sm:min-h-[22rem] overflow-hidden rounded-2xl bg-[#e8eaef] transition-transform duration-500 ease-out hover:scale-105"
                aria-hidden="true"
              >
                <span className="hero-card-sheen pointer-events-none absolute inset-0" />
              </div>
            </div>
          </Reveal>
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-2 px-6 pb-16">
          {["Availability", "Performance", "SEO", "Tracking", "Broken links"].map((label, index) => (
            <Reveal key={label} delay={index * 60}>
              <span className="inline-block rounded-md border border-[#e3e6ef] bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#5b6478] transition-[translate,border-color,color] duration-300 ease-out hover:-translate-y-0.5 hover:border-[#4c2882]/30 hover:text-[#4c2882]">
                <T en={label} />
              </span>
            </Reveal>
          ))}
        </div>
        <Waves className="h-28" />
      </main>

      <section id="que-es" className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
          <div className="grid items-end gap-10 lg:grid-cols-[1.3fr_1fr]">
            <Reveal>
              <Eyebrow>
                <T en="What is it?" />
              </Eyebrow>
              <h2 className="mt-6 text-4xl leading-[1.1] font-light tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]">
                <T
                  en={
                    <>
                      Every check.
                      <br />
                      <Squiggle>One</Squiggle> simple dashboard.
                    </>
                  }
                  es={
                    <>
                      Todos los controles.
                      <br />
                      <Squiggle>Un</Squiggle> panel simple.
                    </>
                  }
                />
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="max-w-md text-[15px] leading-7 text-[#5b6478]">
                <T
                  en="Instead of jumping between different platforms, Pulse brings everything together so you can quickly see what is working, what needs attention and what has changed over time."
                  es="En lugar de saltar entre distintas plataformas, Pulse junta todo para que veas rápido qué funciona, qué necesita atención y qué cambió con el tiempo."
                />
              </p>
            </Reveal>
          </div>

          <div className="mt-12 grid gap-5 sm:mt-16 md:grid-cols-2">
            <Reveal>
            <article className="rounded-2xl border border-[#e3e6ef] bg-[#fbfbfd] p-6 transition sm:p-8-[translate,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,26,46,0.08)]">
              <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.16em]">
                <span className="text-[#5b6478]">
                  <T en="View / 01" es="Vista / 01" />
                </span>
                <span className="text-[#4c2882]">
                  <T en="Overview" es="Resumen" />
                </span>
              </div>
              <h3 className="mt-8 text-[1.75rem] leading-tight tracking-tight">
                <T en="Your whole site, at a glance." es="Todo tu sitio, de un vistazo." />
              </h3>
              <p className="mt-4 max-w-md text-sm leading-6 text-[#5b6478]">
                <T
                  en="Pulse continuously checks the most important parts of your website and puts the results in one view."
                  es="Pulse revisa todo el tiempo las partes más importantes de tu sitio y junta los resultados en una sola vista."
                />
              </p>
              <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { label: "Uptime", labelEs: "Disponib.", value: "99.9%" },
                  { label: "Load", labelEs: "Carga", value: "1.2s" },
                  { label: "SEO", labelEs: "SEO", value: "92" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-[#e3e6ef] bg-white p-3 sm:p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#9aa1b2]">
                      <T en={stat.label} es={stat.labelEs} />
                    </p>
                    <p className="mt-2 text-xl tracking-tight sm:text-2xl">{stat.value}</p>
                  </div>
                ))}
              </div>
            </article>
            </Reveal>

            <Reveal delay={80}>
            <article className="rounded-2xl border border-[#e3e6ef] bg-[#fbfbfd] p-6 transition sm:p-8-[translate,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,26,46,0.08)]">
              <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.16em]">
                <span className="text-[#5b6478]">
                  <T en="Score / 02" es="Puntaje / 02" />
                </span>
                <span className="text-[#4c2882]">
                  <T en="Pulse Score" es="Puntaje Pulse" />
                </span>
              </div>
              <h3 className="mt-8 text-[1.75rem] leading-tight tracking-tight">
                <T en="One number for your site's health." es="Un solo número para la salud de tu sitio." />
              </h3>
              <p className="mt-4 max-w-md text-sm leading-6 text-[#5b6478]">
                <T
                  en="See your Pulse Score and spot SEO, performance, tracking and technical issues before they cost you visitors."
                  es="Mirá tu Puntaje Pulse y detectá problemas de SEO, rendimiento, seguimiento y técnicos antes de que te cuesten visitas."
                />
              </p>
              <div className="mt-8 flex items-center gap-4 rounded-xl border border-[#e3e6ef] bg-white p-4 sm:gap-6 sm:p-5">
                <div className="relative grid size-20 shrink-0 place-items-center">
                  <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden="true">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#eee8f6" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="#4c2882"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="score-ring"
                      strokeDasharray="0 100"
                      pathLength="100"
                    />
                  </svg>
                  <span className="text-xl font-semibold">83</span>
                </div>
                <ul className="space-y-2 text-[13px] text-[#5b6478]">
                  <li>
                    ✓ <T en="Performance looks good" es="El rendimiento está bien" />
                  </li>
                  <li className="text-amber-700">
                    ! <T en="3 pages missing meta tags" es="3 páginas sin meta tags" />
                  </li>
                  <li>
                    ✓ <T en="Tracking tools detected" es="Herramientas de seguimiento detectadas" />
                  </li>
                </ul>
              </div>
            </article>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-[#f6f7fb]">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-12 px-6 py-20 sm:py-28 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <Eyebrow>
              <T en="Beyond uptime" es="Más allá de estar en línea" />
            </Eyebrow>
            <h2 className="mt-6 text-4xl leading-[1.1] font-light tracking-[-0.03em] sm:text-5xl">
              <T
                en={
                  <>
                    Online doesn&apos;t mean <span className="whitespace-nowrap"><Squiggle>healthy</Squiggle>.</span>
                  </>
                }
                es={
                  <>
                    Estar en línea no es estar <span className="whitespace-nowrap"><Squiggle>sano</Squiggle>.</span>
                  </>
                }
              />
            </h2>
            <p className="mt-6 max-w-sm text-[15px] leading-7 text-[#5b6478]">
              <T
                en="A green dot misses slow pages, missing tags and links that quietly broke. Pulse looks at all of it."
                es="Un punto verde no muestra páginas lentas, etiquetas que faltan ni links que se rompieron sin avisar. Pulse revisa todo eso."
              />
            </p>
          </Reveal>
          <Reveal delay={80}>
          <div className="rounded-2xl border border-[#e3e6ef] bg-white p-6 shadow-[0_10px_30px_rgba(15,26,46,0.05)] transition-[translate,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,26,46,0.08)]">
            <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-[#5b6478]">
              <span>
                <T en="What Pulse checks" es="Qué revisa Pulse" />
              </span>
              <span>
                <T en="Every scan" es="En cada escaneo" />
              </span>
            </div>
            <ul className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {checks.map((check) => (
                <li
                  key={check}
                  className="flex items-center gap-2.5 rounded-lg border border-[#eef0f5] px-3 py-3 text-[13px] sm:px-3.5 transition-[translate,border-color,background-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-[#4c2882]/20 hover:bg-[#4c2882]/[0.03]"
                >
                  <span className="text-[#4c2882]">✓</span>
                  <T en={check} />
                </li>
              ))}
            </ul>
          </div>
          </Reveal>
        </div>
      </section>

      <section id="pasos" className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="grid items-end gap-10 lg:grid-cols-[1.3fr_1fr]">
            <Reveal>
              <Eyebrow>
                <T en="How it works" es="Cómo funciona" />
              </Eyebrow>
              <h2 className="mt-6 text-4xl leading-[1.1] font-light tracking-[-0.03em] sm:text-5xl">
                <T en={<>How to <Squiggle>use</Squiggle></>} es={<>Cómo <Squiggle>usarlo</Squiggle></>} />
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="max-w-md text-[15px] leading-7 text-[#5b6478]">
                <T
                  en="Five steps, from adding your site to monitoring it over time."
                  es="Cinco pasos, desde agregar tu sitio hasta monitorearlo con el tiempo."
                />
              </p>
            </Reveal>
          </div>
        </div>
        <div className="px-6 pb-20 sm:pb-28">
          <Reveal>
            <Steps />
          </Reveal>
        </div>
      </section>

      <section className="relative bg-[#0f1a2e] text-white">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="absolute inset-x-0 -top-px h-20 w-full"
          fill="none"
          aria-hidden="true"
        >
          <path d="M0 0 H1440 V40 C 1180 110, 900 20, 640 70 S 180 100, 0 50Z" fill="#ffffff" />
        </svg>
        <div id="planes" className="mx-auto grid w-full max-w-6xl scroll-mt-10 items-center gap-12 px-6 pt-32 pb-20 sm:gap-14 sm:pt-40 sm:pb-24 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <Eyebrow dark>
              <T en="Plans" es="Planes" />
            </Eyebrow>
            <h2 className="mt-6 text-4xl leading-[1.1] font-light tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]">
              <T
                en={
                  <>
                    One plan.
                    <br />
                    Every <span className="whitespace-nowrap"><Squiggle color="#a98bd6">check</Squiggle>.</span>
                  </>
                }
                es={
                  <>
                    Un plan.
                    <br />
                    Todos los <span className="whitespace-nowrap"><Squiggle color="#a98bd6">controles</Squiggle>.</span>
                  </>
                }
              />
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-7 text-white/65">
              <T
                en="Everything Pulse does, in a single plan. No feature tiers and no add-ons."
                es="Todo lo que hace Pulse, en un solo plan. Sin niveles de funciones ni extras."
              />
            </p>
          </Reveal>
          <Reveal delay={90}>
          <div className="rounded-2xl bg-white p-6 text-[#0f1a2e] shadow-[0_30px_80px_rgba(0,0,0,0.35)] transition-[translate,box-shadow] duration-500 ease-out hover:-translate-y-1 sm:p-10">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em]">
              <span className="text-[#5b6478]">
                <T en="Pulse plan" es="Plan Pulse" />
              </span>
              <span className="rounded-full bg-[#4c2882]/10 px-2.5 py-1 text-[#4c2882]">
                <T en="All included" es="Todo incluido" />
              </span>
            </div>
            <p className="mt-8 flex flex-wrap items-end gap-x-2 gap-y-1">
              <span className="text-6xl leading-none font-light sm:text-7xl tracking-[-0.04em]">$9.99</span>
              <span className="pb-2 font-mono text-xs uppercase text-[#5b6478]">
                <T en="USD / month" es="USD / mes" />
              </span>
            </p>
            <ul className="mt-8 grid gap-3 border-t border-[#eef0f5] pt-6 text-sm sm:grid-cols-2">
              {[
                "Every check included",
                "Pulse Score",
                "Change history",
                "Alerts on new issues",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="text-[#4c2882]">✓</span>
                  <T en={item} />
                </li>
              ))}
            </ul>
            <Link href="/signup" className={`${primaryButton} mt-8 w-full justify-center py-3.5`}>
              <T en="Try for free" es="Probá gratis" />
              <IconArrow />
            </Link>
          </div>
          </Reveal>
        </div>
      </section>

      <section id="contacto" className="scroll-mt-10 bg-[#0f1a2e] text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-12 border-t border-white/10 px-6 py-20 sm:py-28 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <Reveal>
            <Eyebrow dark>
              <T en="Contact" es="Contacto" />
            </Eyebrow>
            <h2 className="mt-6 text-4xl leading-[1.1] font-light tracking-[-0.03em] sm:text-5xl">
              <T
                en={<>Write to <Squiggle color="#a98bd6">us</Squiggle></>}
                es={<><Squiggle color="#a98bd6">Escribinos</Squiggle></>}
              />
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-7 text-white/65">
              <T
                en="Questions about Pulse or about your site? Send us a message and we'll get back to you."
                es="¿Dudas sobre Pulse o sobre tu sitio? Mandanos un mensaje y te respondemos."
              />
            </p>
          </Reveal>
          <Reveal delay={90}>
            <ContactForm buttonClass={primaryButton} />
          </Reveal>
        </div>
      </section>

      <footer className="overflow-hidden bg-[#0f1a2e] text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-14 border-t border-white/10 px-6 pt-16 sm:pt-20 lg:grid-cols-[1.25fr_1fr] lg:gap-10">
          <div>
            <p className="text-sm text-white/50">
              <T en="Questions about your site?" es="¿Preguntas sobre tu sitio?" />
            </p>
            <a
              href="#contacto"
              className="group mt-4 inline-flex max-w-full items-center gap-4 sm:gap-5"
            >
              <span className="min-w-0 break-all text-[1.75rem] leading-tight font-semibold tracking-[-0.03em] transition-colors duration-300 group-hover:text-[#c9b3ec] sm:text-[2.6rem]">
                {contactEmail}
              </span>
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-white/20 transition-[background-color,border-color,rotate] duration-300 group-hover:rotate-45 group-hover:border-[#a98bd6] group-hover:bg-[#4c2882] sm:size-14">
                <IconArrow className="size-4 -rotate-45 sm:size-5" />
              </span>
            </a>
            <div className="mt-8 flex flex-wrap gap-2.5 text-[13px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2.5 text-white/60">
                <span className="relative flex size-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
                  <span className="relative size-2 rounded-full bg-emerald-400" />
                </span>
                <T
                  en={
                    <>
                      All systems <span className="font-semibold text-white">operational</span>
                    </>
                  }
                  es={
                    <>
                      Todos los sistemas <span className="font-semibold text-white">funcionando</span>
                    </>
                  }
                />
              </span>
              <a
                href="#inicio"
                className="group inline-flex items-center gap-3 rounded-full border border-white/12 py-1.5 pr-1.5 pl-4 transition-colors duration-300 hover:border-white/30"
              >
                <T en="Back to top" es="Volver arriba" />
                <span className="grid size-7 place-items-center rounded-full bg-white/10 transition-transform duration-300 group-hover:-translate-y-0.5">
                  <IconArrow className="size-3 -rotate-90" />
                </span>
              </a>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3" aria-label="Footer">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="text-sm text-white/40">
                  <T en={column.title} />
                </p>
                <ul className="mt-5 space-y-3.5 text-[15px]">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("/") ? (
                        <Link href={link.href} className="transition-colors duration-300 hover:text-[#c9b3ec]">
                          <T en={link.label} />
                        </Link>
                      ) : (
                        <a href={link.href} className="transition-colors duration-300 hover:text-[#c9b3ec]">
                          <T en={link.label} />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="relative mx-auto mt-16 flex w-full max-w-[1600px] items-start justify-center px-4 sm:mt-24">
          <span
            aria-hidden="true"
            className="block select-none text-[30vw] leading-[0.78] font-semibold tracking-[-0.07em] text-[#f3f1f7] [mask-image:linear-gradient(to_bottom,black_55%,transparent)] min-[1600px]:text-[480px]"
          >
            Pulse
          </span>
          <span
            aria-hidden="true"
            className="relative mt-[4vw] ml-[1vw] grid size-[11vw] shrink-0 place-items-center rounded-full bg-[#a98bd6] text-[#0f1a2e] shadow-[0_0_60px_rgba(169,139,214,0.45)] min-[1600px]:mt-16 min-[1600px]:size-44"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-[#a98bd6]/30 [animation-duration:2.4s]" />
            <svg viewBox="0 0 48 24" fill="none" className="relative w-[62%]">
              <path
                d="M2 12h10l4-8 6 16 5-12 3 4h16"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        <div className="mx-auto flex w-full max-w-6xl justify-between px-6 pt-6 pb-8 font-mono text-[11px] text-white/40">
          <span>© 2026 Pulse</span>
          <span>
            <T en="Website health checker" es="Revisión de salud de sitios web" />
          </span>
        </div>
      </footer>
    </div>
  );
}
