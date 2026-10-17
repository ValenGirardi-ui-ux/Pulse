import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Segmented, Toggle } from "../controls";
import { inputClass as input, primaryButtonClass, secondaryButtonClass as secondaryButton } from "../styles";

export const metadata: Metadata = {
  title: "Settings · Pulse",
};

const alerts = [
  { label: "New critical issues", hint: "Sent right away.", on: true },
  { label: "New warnings", hint: "Grouped once a day.", on: true },
  { label: "Weekly summary", hint: "Every Monday morning.", on: false },
];

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-[13px] text-[#8a91a3]">Manage tivvo.com, your alerts and your account.</p>
      </div>

      <div className="mt-8 divide-y divide-[#ececf1] border-t border-[#ececf1]">
        <Section title="Site" description="The website Pulse checks.">
          <Field label="Name" htmlFor="site-name">
            <input id="site-name" defaultValue="Tivvo" className={input} />
          </Field>
          <Field label="URL" htmlFor="site-url">
            <div className="flex h-9 overflow-hidden rounded-lg border border-[#e3e6ef] transition-colors focus-within:border-[#4c2882]/50 focus-within:ring-4 focus-within:ring-[#4c2882]/[0.08]">
              <span className="flex items-center border-r border-[#ececf1] bg-[#fafafb] px-3 font-mono text-xs text-[#8a91a3]">
                https://
              </span>
              <input
                id="site-url"
                defaultValue="tivvo.com"
                className="min-w-0 flex-1 px-3 font-mono text-[13px] outline-none"
              />
            </div>
          </Field>
        </Section>

        <Section title="Scanning" description="When Pulse checks your site on its own.">
          <Row label="Automatic scans" hint="Pulse scans every page and tells you what changed.">
            <Toggle label="Automatic scans" defaultOn />
          </Row>
          <Row label="Frequency" hint="Next scan in 11h 35m.">
            <Segmented label="Scan frequency" options={["6h", "12h", "24h"]} defaultValue="12h" />
          </Row>
        </Section>

        <Section title="Alerts" description="What Pulse emails you about.">
          <Field label="Send alerts to" htmlFor="alert-email">
            <input id="alert-email" type="email" placeholder="you@company.com" className={input} />
          </Field>
          {alerts.map((alert) => (
            <Row key={alert.label} label={alert.label} hint={alert.hint}>
              <Toggle label={alert.label} defaultOn={alert.on} />
            </Row>
          ))}
        </Section>

        <Section title="Ask Pulse" description="AI credits are used each time you ask a question.">
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-[13px] font-medium">
                120 <span className="font-normal text-[#8a91a3]">of 200 credits left</span>
              </p>
              <span className="text-xs text-[#8a91a3]">Resets Nov 1</span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#f1f2f6]">
              <div className="h-full w-[60%] rounded-full bg-[#4c2882]" />
            </div>
          </div>
        </Section>

        <Section title="Plan" description="Every check is included.">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-[#ececf1] p-4">
            <div>
              <p className="text-[13px] font-medium">Pulse plan</p>
              <p className="mt-0.5 text-xs text-[#8a91a3]">
                <span className="font-mono">$9.99</span> USD / month · Renews Nov 1
              </p>
            </div>
            <button type="button" className={secondaryButton}>
              Manage billing
            </button>
          </div>
        </Section>

        <Section title="Danger zone" description="This can't be undone.">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 p-4">
            <div>
              <p className="text-[13px] font-medium">Remove tivvo.com</p>
              <p className="mt-0.5 text-xs text-[#8a91a3]">Deletes the site, its scans and its history.</p>
            </div>
            <button
              type="button"
              className="inline-flex h-8 shrink-0 items-center rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-600 transition-colors hover:border-red-600 hover:bg-red-600 hover:text-white"
            >
              Remove site
            </button>
          </div>
        </Section>
      </div>

      <div className="sticky bottom-0 mt-2 flex justify-end gap-2 border-t border-[#ececf1] bg-white/90 py-4 backdrop-blur">
        <button type="button" className={secondaryButton}>
          Cancel
        </button>
        <button type="button" className={primaryButtonClass}>
          Save changes
        </button>
      </div>
    </main>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
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

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-[#3c4558]">
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <p className="text-[13px] font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-[#8a91a3]">{hint}</p>
      </div>
      {children}
    </div>
  );
}
