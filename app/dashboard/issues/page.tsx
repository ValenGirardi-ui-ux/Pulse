import type { Metadata } from "next";
import { issues, resolved } from "../data";
import { IconCheck } from "../icons";
import { T } from "../../i18n";
import { IssuesList } from "./issues-list";

export const metadata: Metadata = {
  title: "Issues · Pulse",
};

export default function IssuesPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          <T en="Issues" es="Problemas" />
        </h1>
        <p className="mt-1 text-[13px] text-[#8a91a3]">
          <T
            en={`${issues.length} open, sorted by what to fix first. Click one to see how to fix it.`}
            es={`${issues.length} abiertos, ordenados por qué arreglar primero. Tocá uno para ver cómo arreglarlo.`}
          />
        </p>
      </div>

      <IssuesList />

      <section>
        <h2 className="mb-2.5 text-xs font-medium text-[#5b6478]">
          <T en="Recently fixed" es="Resueltos hace poco" />
        </h2>
        <ul className="space-y-2.5">
          {resolved.map((item) => (
            <li key={item.title} className="flex items-center gap-3 text-[13px] text-[#8a91a3]">
              <IconCheck className="size-3.5 shrink-0 text-emerald-500" />
              <span className="flex-1 truncate">
                <T en={item.title} />
              </span>
              <span className="hidden text-xs sm:block">
                <T en={item.category} />
              </span>
              <span className="w-14 text-right font-mono text-[11px] text-[#9aa1b2]">
                <T en={item.when} />
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
