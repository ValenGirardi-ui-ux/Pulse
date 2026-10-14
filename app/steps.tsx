"use client";

import { useState } from "react";

const steps = [
  {
    n: "01",
    title: "Create your account and add your site",
    body: "Sign up, create a project, and enter the URL you want to analyze.",
  },
  {
    n: "02",
    title: "Run a scan",
    body: "Pulse automatically checks the overall status of your site.",
  },
  {
    n: "03",
    title: "Review the results",
    body: "See your Pulse Score and spot SEO, performance, tracking, and technical issues.",
  },
  {
    n: "04",
    title: "Fix and verify",
    body: "Make the changes you need and scan again to confirm everything looks right.",
  },
  {
    n: "05",
    title: "Monitor your site",
    body: "Pulse keeps the history and can notify you if a new issue appears.",
  },
];

export function Steps() {
  const [open, setOpen] = useState(0);

  return (
    <div className="w-full overflow-x-auto px-6">
      <div className="mx-auto flex h-[28rem] w-max gap-3">
        {steps.map((step, index) => {
          const active = open === index;

          return (
            <article
              key={step.n}
              onClick={() => setOpen(index)}
              className={`flex h-full shrink-0 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-white/25 bg-black p-6 transition-[width] duration-500 ease-out ${
                active ? "w-[24rem]" : "w-[10.5rem]"
              }`}
            >
              <div>
                <p className="text-xs tracking-wide text-neutral-500">{step.n}</p>
                <h2
                  className={`mt-3 transition-[font-size,line-height,color] duration-500 ease-out ${
                    active
                      ? "w-[calc(24rem-3rem-2px)] text-3xl font-semibold leading-tight text-white"
                      : "w-[calc(10.5rem-3rem-2px)] text-lg font-normal leading-snug text-neutral-500"
                  }`}
                >
                  {step.title}
                </h2>
              </div>
              <div className="relative">
                <p
                  className={`text-sm leading-6 text-neutral-300 transition-[opacity,transform] duration-500 ease-out ${
                    active
                      ? "mb-10 w-[calc(24rem-3rem-2px)] translate-y-0 opacity-100"
                      : "pointer-events-none h-0 w-full translate-y-2 overflow-hidden opacity-0"
                  }`}
                >
                  {step.body}
                </p>
                <span
                  className={`grid size-4 place-items-center rounded-full border ${
                    active ? "border-cyan-400" : "border-neutral-600"
                  }`}
                  aria-hidden="true"
                >
                  <span
                    className={`size-2 rounded-full ${
                      active ? "bg-cyan-400 shadow-[0_0_8px_#22d3ee]" : "bg-transparent"
                    }`}
                  />
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
