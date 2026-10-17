import type { ReactNode } from "react";
import { Sora } from "next/font/google";
import { Dashboard } from "./dashboard";
import { LoginDialog } from "./login-dialog";
import { SmoothScroll } from "./smooth-scroll";
import { Steps } from "./steps";

const pulse = Sora({
  weight: ["300", "400", "600"],
  subsets: ["latin"],
});

const navLink =
  "relative inline-block pb-0.5 text-neutral-500 transition-colors duration-300 hover:text-[#4c2882] after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-[#4c2882] after:transition-transform after:duration-500 after:ease-out after:content-[''] hover:after:scale-x-100";

const primaryButton =
  "inline-flex shrink-0 origin-center items-center gap-2 rounded-full bg-[#4c2882] px-5 py-2.5 font-mono text-xs font-medium uppercase tracking-[0.08em] text-white shadow-[0_6px_16px_rgba(76,40,130,0.28)] transition-transform duration-300 ease-out hover:scale-105";

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
      className={`pointer-events-none w-full ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <path d="M0 96 C 240 40, 420 140, 720 92 S 1200 30, 1440 84 V160 H0Z" fill="#4c2882" opacity="0.05" />
      <path d="M0 118 C 300 70, 520 150, 820 110 S 1260 70, 1440 112 V160 H0Z" fill="#4c2882" opacity="0.06" />
      <path d="M0 136 C 260 110, 560 160, 880 132 S 1280 112, 1440 134 V160 H0Z" fill="#ffffff" />
    </svg>
  );
}

function UrlForm({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`flex w-full max-w-md items-center gap-2 rounded-full p-1.5 pl-6 ${
        dark
          ? "bg-white"
          : "bg-white shadow-[0_1px_2px_rgba(15,26,46,0.06),0_10px_30px_rgba(15,26,46,0.08)]"
      }`}
    >
      <label htmlFor={dark ? "url-bottom" : "url-top"} className="sr-only">
        Your website
      </label>
      <input
        id={dark ? "url-bottom" : "url-top"}
        type="text"
        placeholder="yourwebsite.com"
        className="min-w-0 flex-1 bg-transparent font-mono text-sm text-[#0f1a2e] outline-none placeholder:text-[#9aa1b2]"
      />
      <a href="#probar" className={primaryButton}>
        Try for free
        <span aria-hidden="true">»</span>
      </a>
    </div>
  );
}

export default function Home() {
  return (
    <div className={`${pulse.className} bg-[#f6f7fb] text-[#0f1a2e]`}>
      <SmoothScroll />

      <header className="fixed inset-x-0 top-4 z-20 px-4">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-6 rounded-full border border-[#4c2882] bg-transparent px-5 py-2 text-sm text-black shadow-[0_2px_8px_rgba(76,40,130,0.12)]">
          <a href="#inicio" className="text-base font-semibold tracking-tight text-[#4c2882]">
            Pulse
          </a>
          <nav className="flex items-center gap-6 text-sm text-neutral-600">
            <a href="#que-es" className={navLink}>
              What is it?
            </a>
            <a href="#planes" className={navLink}>
              Plans
            </a>
            <a href="#nosotros" className={navLink}>
              About
            </a>
            <a href="#contacto" className={navLink}>
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <LoginDialog className={navLink} />
            <a
              href="#probar"
              className="inline-flex shrink-0 origin-center items-center gap-2 rounded-full bg-[#4c2882] px-5 py-2 text-xs font-medium text-white shadow-[0_2px_6px_rgba(76,40,130,0.28)] transition-transform duration-300 ease-out hover:scale-110"
            >
              Try for free
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </header>

      <main id="inicio" className="relative overflow-hidden pt-20">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-6 pt-14 pb-24 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div>
            <Eyebrow>Website health checker</Eyebrow>
            <h1 className="mt-6 text-5xl leading-[1.08] font-light tracking-[-0.03em] sm:text-[3.5rem]">
              The <Squiggle>health</Squiggle> of your digital product, in one place.
            </h1>
            <p className="mt-7 max-w-lg text-[17px] leading-7 text-[#4a5368]">
              Pulse checks availability, performance, SEO, analytics, tracking tools and broken
              links, then shows you{" "}
              <span className="rounded bg-[#4c2882]/10 px-1 text-[#4c2882]">what needs attention</span>.
            </p>
            <div className="mt-9">
              <UrlForm />
            </div>
            <p className="mt-4 font-mono text-[11px] text-[#8a91a3]">
              Paste a URL to run your first scan.
            </p>
          </div>
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-10 -z-0 rounded-[3rem] bg-[radial-gradient(ellipse_at_center,rgba(76,40,130,0.12),transparent_70%)]"
            />
            <div className="relative">
              <Dashboard />
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-2 px-6 pb-16">
          {["Availability", "Performance", "SEO", "Tracking", "Broken links"].map((label) => (
            <span
              key={label}
              className="rounded-md border border-[#e3e6ef] bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#5b6478]"
            >
              {label}
            </span>
          ))}
        </div>
        <Waves className="h-28" />
      </main>

      <section id="que-es" className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-28">
          <div className="grid items-end gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <Eyebrow>What is it?</Eyebrow>
              <h2 className="mt-6 text-4xl leading-[1.1] font-light tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]">
                Every check.
                <br />
                <Squiggle>One</Squiggle> simple dashboard.
              </h2>
            </div>
            <p className="max-w-md text-[15px] leading-7 text-[#5b6478]">
              Instead of jumping between different platforms, Pulse brings everything together so you
              can quickly see what is working, what needs attention and what has changed over time.
            </p>
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-[#e3e6ef] bg-[#fbfbfd] p-8">
              <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.16em]">
                <span className="text-[#5b6478]">View / 01</span>
                <span className="text-[#4c2882]">Overview</span>
              </div>
              <h3 className="mt-8 text-[1.75rem] leading-tight tracking-tight">
                Your whole site, at a glance.
              </h3>
              <p className="mt-4 max-w-md text-sm leading-6 text-[#5b6478]">
                Pulse continuously checks the most important parts of your website and puts the
                results in one view.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  { label: "Uptime", value: "99.9%" },
                  { label: "Load", value: "1.2s" },
                  { label: "SEO", value: "92" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-[#e3e6ef] bg-white p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#9aa1b2]">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-2xl tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-[#e3e6ef] bg-[#fbfbfd] p-8">
              <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.16em]">
                <span className="text-[#5b6478]">Score / 02</span>
                <span className="text-[#4c2882]">Pulse Score</span>
              </div>
              <h3 className="mt-8 text-[1.75rem] leading-tight tracking-tight">
                One number for your site&apos;s health.
              </h3>
              <p className="mt-4 max-w-md text-sm leading-6 text-[#5b6478]">
                See your Pulse Score and spot SEO, performance, tracking and technical issues before
                they cost you visitors.
              </p>
              <div className="mt-8 flex items-center gap-6 rounded-xl border border-[#e3e6ef] bg-white p-5">
                <div className="relative grid size-20 place-items-center">
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
                      strokeDasharray="83 100"
                      pathLength="100"
                    />
                  </svg>
                  <span className="text-xl font-semibold">83</span>
                </div>
                <ul className="space-y-2 text-[13px] text-[#5b6478]">
                  <li>✓ Performance looks good</li>
                  <li className="text-amber-700">! 3 pages missing meta tags</li>
                  <li>✓ Tracking tools detected</li>
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-[#f6f7fb]">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-12 px-6 py-28 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <Eyebrow>Beyond uptime</Eyebrow>
            <h2 className="mt-6 text-4xl leading-[1.1] font-light tracking-[-0.03em] sm:text-5xl">
              Online doesn&apos;t mean <Squiggle>healthy</Squiggle>.
            </h2>
            <p className="mt-6 max-w-sm text-[15px] leading-7 text-[#5b6478]">
              A green dot misses slow pages, missing tags and links that quietly broke. Pulse looks
              at all of it.
            </p>
          </div>
          <div className="rounded-2xl border border-[#e3e6ef] bg-white p-6 shadow-[0_10px_30px_rgba(15,26,46,0.05)]">
            <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-[#5b6478]">
              <span>What Pulse checks</span>
              <span>Every scan</span>
            </div>
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-3">
              {checks.map((check) => (
                <li
                  key={check}
                  className="flex items-center gap-2.5 rounded-lg border border-[#eef0f5] px-3.5 py-3 text-[13px]"
                >
                  <span className="text-[#4c2882]">✓</span>
                  {check}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="pasos" className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 pt-28 pb-24">
          <div className="grid items-end gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <Eyebrow>How it works</Eyebrow>
              <h2 className="mt-6 text-4xl leading-[1.1] font-light tracking-[-0.03em] sm:text-5xl">
                How to <Squiggle>use</Squiggle>
              </h2>
            </div>
            <p className="max-w-md text-[15px] leading-7 text-[#5b6478]">
              Five steps, from adding your site to monitoring it over time.
            </p>
          </div>
        </div>
        <div className="px-6 pb-28">
          <Steps />
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
        <div id="planes" className="mx-auto grid w-full max-w-6xl scroll-mt-10 items-center gap-14 px-6 pt-40 pb-24 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Eyebrow dark>Plans</Eyebrow>
            <h2 className="mt-6 text-4xl leading-[1.1] font-light tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]">
              One plan.
              <br />
              Every <Squiggle color="#a98bd6">check</Squiggle>.
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-7 text-white/65">
              Everything Pulse does, in a single plan. No feature tiers and no add-ons.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-8 text-[#0f1a2e] shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-10">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em]">
              <span className="text-[#5b6478]">Pulse plan</span>
              <span className="rounded-full bg-[#4c2882]/10 px-2.5 py-1 text-[#4c2882]">All included</span>
            </div>
            <p className="mt-8 flex items-end gap-2">
              <span className="text-7xl leading-none font-light tracking-[-0.04em]">$9.99</span>
              <span className="pb-2 font-mono text-xs uppercase text-[#5b6478]">USD / month</span>
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
                  {item}
                </li>
              ))}
            </ul>
            <a href="#probar" className={`${primaryButton} mt-8 w-full justify-center py-3.5`}>
              Try for free
              <span aria-hidden="true">»</span>
            </a>
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-6 pb-28">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#17233b,#0f1a2e_60%)] p-10 sm:p-14">
            <div
              aria-hidden="true"
              className="absolute -top-24 -right-24 size-80 rounded-full bg-[#4c2882]/40 blur-3xl"
            />
            <div className="relative grid items-end gap-10 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <Eyebrow dark>Get started</Eyebrow>
                <h2 className="mt-6 text-4xl leading-[1.1] font-light tracking-[-0.03em] sm:text-5xl">
                  Know how your site is doing, <Squiggle color="#a98bd6">today</Squiggle>.
                </h2>
                <p className="mt-6 text-[15px] text-white/65">
                  Add your site, run a scan and see what needs attention.
                </p>
              </div>
              <div className="lg:justify-self-end">
                <UrlForm dark />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#0f1a2e] text-white/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 border-t border-white/10 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xl font-semibold text-white">Pulse</span>
          <nav className="flex flex-wrap gap-6 font-mono text-xs">
            <a href="#que-es" className="hover:text-white">
              What is it?
            </a>
            <a href="#planes" className="hover:text-white">
              Plans
            </a>
            <a href="#nosotros" className="hover:text-white">
              About
            </a>
            <a href="#contacto" className="hover:text-white">
              Contact
            </a>
          </nav>
          <span className="font-mono text-xs">© 2026 Pulse</span>
        </div>
      </footer>
    </div>
  );
}
