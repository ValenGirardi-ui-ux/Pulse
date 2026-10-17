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
    <div className="w-full overflow-x-auto pb-4">
      <div className="mx-auto flex h-[24rem] w-max gap-3">
        {steps.map((step, index) => {
          const active = open === index;

          return (
            <article
              key={step.n}
              onClick={() => setOpen(index)}
              className={`flex h-full shrink-0 cursor-pointer flex-col justify-between overflow-hidden rounded-xl border bg-white p-6 shadow-[0_1px_2px_rgba(15,26,46,0.04),0_8px_24px_rgba(15,26,46,0.05)] transition-[width,border-color] duration-500 ease-out ${
                active ? "w-[24rem] border-[#4c2882]/40" : "w-[10.5rem] border-[#e3e6ef] hover:border-[#c9cedd]"
              }`}
            >
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#5b6478]">
                  Step / {step.n}
                </p>
                <h3
                  className={`mt-5 tracking-tight transition-[font-size,line-height,color] duration-500 ease-out ${
                    active
                      ? "w-[calc(24rem-3rem-2px)] text-[1.75rem] leading-tight text-[#0f1a2e]"
                      : "w-[calc(10.5rem-3rem-2px)] text-lg leading-snug text-[#8a91a3]"
                  }`}
                >
                  {step.title}
                </h3>
              </div>
              <div className="relative">
                <p
                  className={`text-sm leading-6 text-[#5b6478] transition-[opacity,transform] duration-500 ease-out ${
                    active
                      ? "mb-2 w-[calc(24rem-3rem-2px)] translate-y-0 opacity-100"
                      : "pointer-events-none h-0 w-full translate-y-2 overflow-hidden opacity-0"
                  }`}
                >
                  {step.body}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
