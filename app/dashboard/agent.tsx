"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useT } from "../i18n";
import { IconChevron, IconSpark } from "./icons";
import { AssistantPanel, useAssistant } from "./llm-optimization/assistant-panel";

const suggestions = [
  "What should I fix first?",
  "Why did my score change?",
  "Explain my critical issue",
  "Is my site slower than last week?",
];

// Pages that have their own assistant. The global agent stays off there so two chats never open at once.
const PAGES_WITH_OWN_ASSISTANT = ["/dashboard/llm-optimization"];

type AgentState = {
  enabled: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  ask: (question: string) => void;
  assistant: ReturnType<typeof useAssistant>;
};

const AgentContext = createContext<AgentState | null>(null);

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) throw new Error("useAgent must be used inside <AgentProvider>");
  return context;
}

export function AgentProvider({ children }: { children: ReactNode }) {
  const [openState, setOpen] = useState(false);
  const pathname = usePathname();
  const enabled = !PAGES_WITH_OWN_ASSISTANT.some((page) => pathname.startsWith(page));
  const open = enabled && openState;
  const toggle = () => setOpen((current) => !current);
  const assistant = useAssistant(null);

  function ask(question: string) {
    setOpen(true);
    assistant.send(question);
  }

  useEffect(() => {
    if (!enabled) return;
    function onKey(event: KeyboardEvent) {
      if (event.key?.toLowerCase() !== "k" || event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;
      if (!typing) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);

  return <AgentContext.Provider value={{ enabled, open, setOpen, toggle, ask, assistant }}>{children}</AgentContext.Provider>;
}

export function AgentToggle() {
  const { enabled, open, toggle } = useAgent();
  const t = useT();

  if (!enabled) return <span className="ml-auto" />;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-controls="pulse-agent"
      aria-label={open ? t("Close Pulse AI", "Cerrar Pulse AI") : t("Ask Pulse AI", "Preguntarle a Pulse AI")}
      className={`ml-auto inline-flex size-9 shrink-0 items-center justify-center gap-2 rounded-full border text-[13px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-colors md:w-auto md:pr-2 md:pl-3.5 ${
        open
          ? "border-[#4c2882]/30 bg-[#4c2882]/[0.06] text-[#4c2882]"
          : "border-black/[0.07] bg-white/80 text-[#0f1a2e] hover:border-[#4c2882]/35"
      }`}
    >
      <IconSpark className="size-3.5 text-[#4c2882]" />
      <span className="hidden font-medium md:inline">{t("Ask Pulse", "Preguntale a Pulse")}</span>
      <kbd className="hidden rounded-full border border-black/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-[#8a91a3] md:block">
        K
      </kbd>
    </button>
  );
}

export function AgentPanel() {
  const { enabled, open, setOpen, toggle, assistant } = useAgent();
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => document.getElementById("pulse-agent-input")?.focus(), 150);
    return () => clearTimeout(timer);
  }, [open]);

  if (!enabled) return null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-[#0f1a2e]/25 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="pulse-agent"
        aria-label="Pulse AI"
        className={`fixed inset-y-3 right-3 z-50 w-[calc(100vw-1.5rem)] transition-[translate,width,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:sticky md:inset-auto md:top-3 md:z-20 md:my-3 md:h-[calc(100vh-1.5rem)] md:shrink-0 ${
          open
            ? "translate-x-0 md:mr-3 md:ml-3 md:w-[22rem]"
            : "translate-x-[calc(100%+1rem)] md:mr-0 md:ml-0 md:w-0 md:translate-x-0"
        }`}
      >
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls="pulse-agent"
          aria-label={open ? t("Close Pulse AI", "Cerrar Pulse AI") : t("Open Pulse AI", "Abrir Pulse AI")}
          className={`group absolute top-1/2 left-0 hidden h-16 -translate-x-full -translate-y-1/2 flex-col items-center justify-center gap-1.5 border border-black/[0.07] bg-white text-[#4c2882] shadow-[0_8px_24px_rgba(15,26,46,0.10)] transition-[width,background-color] duration-200 hover:bg-[#faf8fd] md:flex ${
            open ? "-ml-1.5 w-6 rounded-full" : "w-7 rounded-l-2xl border-r-0 hover:w-8"
          }`}
        >
          {!open && <IconSpark className="size-3" />}
          <IconChevron className={`size-3 transition-transform duration-300 ${open ? "" : "rotate-180"}`} />
        </button>

        <div className="relative h-full overflow-hidden rounded-2xl" inert={!open}>
          <div className="h-full md:absolute md:inset-y-0 md:left-0 md:w-[22rem]">
            <AssistantPanel
              subtitle={t("Your AI agent for tivvo.com", "Tu agente de IA para tivvo.com")}
              greeting={t(
                "Hi! I'm Pulse AI. I know your scans, issues and monitors. Ask me what to fix first, why something changed, or how to solve an issue.",
                "¡Hola! Soy Pulse AI. Conozco tus escaneos, problemas y monitores. Preguntame qué arreglar primero, por qué cambió algo o cómo resolver un problema.",
              )}
              suggestions={suggestions}
              closeClassName=""
              inputId="pulse-agent-input"
              messages={assistant.messages}
              thinking={assistant.thinking}
              onSend={assistant.send}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      </aside>
    </>
  );
}

export function AskPulseButton({
  question,
  className,
  children,
}: {
  question: string;
  className?: string;
  children: ReactNode;
}) {
  const { ask } = useAgent();
  const t = useT();
  return (
    <button type="button" onClick={() => ask(t(question))} className={className}>
      {children}
    </button>
  );
}
