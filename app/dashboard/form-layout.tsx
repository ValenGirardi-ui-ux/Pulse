import type { ReactNode } from "react";

export function Section({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 py-8 md:grid-cols-[14rem_1fr] md:gap-10">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-[#8a91a3]">{description}</p>
      </div>
      <div className="max-w-xl space-y-5">{children}</div>
    </section>
  );
}

export function Field({ label, htmlFor, children }: { label: ReactNode; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-[#3c4558]">
        {label}
      </label>
      {children}
    </div>
  );
}
