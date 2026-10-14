import type { ReactNode } from "react";
import { Sora } from "next/font/google";
import { SmoothScroll } from "./smooth-scroll";
import { Steps } from "./steps";

const pulse = Sora({
  weight: ["400", "600"],
  subsets: ["latin"],
});

function Mark({ children }: { children: ReactNode }) {
  return (
    <span className="inline rounded-[0.28em] bg-[#0b2e5c] px-[0.18em] py-[0.02em] leading-[1.25] text-white [box-decoration-break:clone]">
      {children}
    </span>
  );
}

const sectionLink =
  "relative inline-block pb-0.5 text-neutral-300 transition-colors duration-300 hover:text-white after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-500 after:ease-out after:content-[''] hover:after:scale-x-100";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <header className={`${pulse.className} fixed inset-x-0 top-4 z-20 px-4`}>
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-6 rounded-full border border-white bg-transparent px-5 py-2 text-sm text-white shadow-[0_2px_8px_rgba(255,255,255,0.12)]">
          <a href="#inicio" className="text-base font-semibold tracking-tight">
            Pulse
          </a>
          <nav className="flex items-center gap-6 text-sm text-neutral-300">
            <a href="#que-es" className={sectionLink}>
              What is it?
            </a>
            <a href="#planes" className={sectionLink}>
              Plans
            </a>
            <a href="#nosotros" className={sectionLink}>
              About
            </a>
            <a href="#contacto" className={sectionLink}>
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <a href="#iniciar-sesion" className={sectionLink}>
              Log in
            </a>
            <a
              href="#probar"
              className="inline-flex shrink-0 origin-center items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-medium text-black shadow-[0_2px_6px_rgba(255,255,255,0.16)] transition-transform duration-300 ease-out hover:scale-110"
            >
              Try for free
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </header>
      <main
        id="inicio"
        data-screen
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[40%] h-[36rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.16),rgba(255,255,255,0.05)_38%,transparent_68%)]"
        />
        <div
          className={`${pulse.className} relative z-10 -translate-y-[8vh] flex max-w-3xl flex-col items-center text-center`}
        >
          <h1 className="origin-center text-7xl font-semibold leading-none tracking-[-0.045em] transition-transform duration-300 ease-out hover:scale-110 sm:text-[9rem]">
            Pulse
          </h1>
          <p className="mt-8 max-w-md text-lg font-normal leading-7 text-neutral-300 sm:text-xl">
            Pulse, the health of your digital product in one place.
          </p>
        </div>
      </main>
      <section
        id="que-es"
        data-screen
        className={`${pulse.className} flex min-h-screen items-center bg-black px-6 py-24`}
      >
        <div className="mx-auto max-w-2xl -translate-y-2 space-y-6 text-xl font-normal leading-8 text-neutral-300 sm:text-2xl sm:leading-9">
          <p>
            <Mark>Pulse</Mark> helps you understand the <Mark>health of your digital product</Mark>{" "}
            at a glance.
          </p>
          <p>
            It continuously checks the most important parts of your website, including
            availability, performance, SEO, analytics, tracking tools, broken links and key
            technical issues.
          </p>
          <p>
            Instead of jumping between different platforms, <Mark>Pulse</Mark> brings everything
            together in <Mark>one simple dashboard</Mark> so you can quickly see{" "}
            <Mark>what is working, what needs attention and what has changed over time</Mark>.
          </p>
        </div>
      </section>
      <section
        id="pasos"
        data-screen
        className={`${pulse.className} flex min-h-screen items-center bg-black`}
      >
        <Steps />
      </section>
      <section
        id="control"
        data-screen
        className={`${pulse.className} flex min-h-screen items-center bg-black px-6 py-10`}
      >
        <div className="mx-auto grid min-h-[32rem] w-full max-w-6xl items-center gap-12 rounded-[2rem] bg-white px-8 py-12 text-black sm:px-12 lg:grid-cols-2 lg:px-16 lg:py-16">
          <div>
            <h2 className="text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Your site.
              <br />
              All under control.
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-neutral-800">
              Check performance, SEO, tracking, and technical errors from one place.
            </p>
            <a
              href="#probar"
              className="mt-8 inline-flex origin-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-transform duration-300 ease-out hover:scale-110"
            >
              Try for free
            </a>
          </div>
          <div className="min-h-72 w-full self-stretch bg-neutral-100 lg:min-h-[28rem]" />
        </div>
      </section>
    </>
  );
}
