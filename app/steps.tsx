"use client";

import { useState } from "react";
import { useT } from "./i18n";

const steps = [
  {
    n: "01",
    title: "Create your account and add your site",
    titleEs: "Creá tu cuenta y agregá tu sitio",
    body: "Sign up, create a project, and enter the URL you want to analyze.",
    bodyEs: "Registrate, creá un proyecto e ingresá la URL que querés analizar.",
  },
  {
    n: "02",
    title: "Run a scan",
    titleEs: "Hacé un escaneo",
    body: "Pulse automatically checks the overall status of your site.",
    bodyEs: "Pulse revisa automáticamente el estado general de tu sitio.",
  },
  {
    n: "03",
    title: "Review the results",
    titleEs: "Revisá los resultados",
    body: "See your Pulse Score and spot SEO, performance, tracking, and technical issues.",
    bodyEs: "Mirá tu Puntaje Pulse y detectá problemas de SEO, rendimiento, seguimiento y técnicos.",
  },
  {
    n: "04",
    title: "Fix and verify",
    titleEs: "Arreglá y verificá",
    body: "Make the changes you need and scan again to confirm everything looks right.",
    bodyEs: "Hacé los cambios que necesites y volvé a escanear para confirmar que todo está bien.",
  },
  {
    n: "05",
    title: "Monitor your site",
    titleEs: "Monitoreá tu sitio",
    body: "Pulse keeps the history and can notify you if a new issue appears.",
    bodyEs: "Pulse guarda el historial y te puede avisar si aparece un problema nuevo.",
  },
];

export function Steps() {
  const [open, setOpen] = useState(0);
  const t = useT();

  return (
    <div className="w-full md:overflow-x-auto md:pb-4">
      <div className="mx-auto flex max-w-xl flex-col gap-3 md:h-[24rem] md:w-max md:max-w-none md:flex-row">
        {steps.map((step, index) => {
          const active = open === index;

          return (
            <article
              key={step.n}
              onClick={() => setOpen(index)}
              className={`flex shrink-0 cursor-pointer flex-col justify-between overflow-hidden rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(15,26,46,0.04),0_8px_24px_rgba(15,26,46,0.05)] transition-[width,border-color] duration-500 ease-out md:h-full md:p-6 ${
                active ? "border-[#4c2882]/40 md:w-[24rem]" : "border-[#e3e6ef] md:w-[10.5rem]"
              }`}
            >
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#5b6478]">
                  {t("Step", "Paso")} / {step.n}
                </p>
                <h3
                  className={`mt-3 tracking-tight transition-[font-size,line-height,color] duration-500 ease-out md:mt-5 ${
                    active
                      ? "text-xl leading-tight text-[#0f1a2e] md:w-[calc(24rem-3rem-2px)] md:text-[1.75rem]"
                      : "text-base leading-snug text-[#8a91a3] md:w-[calc(10.5rem-3rem-2px)] md:text-lg"
                  }`}
                >
                  {t(step.title, step.titleEs)}
                </h3>
              </div>
              <div className="relative">
                <p
                  className={`text-sm leading-6 text-[#5b6478] transition-[opacity,transform] duration-500 ease-out ${
                    active
                      ? "mt-2 translate-y-0 opacity-100 md:mt-0 md:mb-2 md:w-[calc(24rem-3rem-2px)]"
                      : "pointer-events-none h-0 w-full translate-y-2 overflow-hidden opacity-0"
                  }`}
                >
                  {t(step.body, step.bodyEs)}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
