"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useLang, useT } from "../../i18n";
import { IconArrow, IconSpark } from "../icons";
import { askAssistant, suggestions as defaultSuggestions, type ChatMessage } from "./assistant";
import type { Report } from "./data";

export function useAssistant(report: Report | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const lang = useLang();
  const t = useT();

  async function send(text: string) {
    const content = text.trim();
    if (!content || thinking) return;

    const history = [...messages, { id: crypto.randomUUID(), role: "user" as const, content }];
    setMessages(history);
    setThinking(true);
    try {
      const reply = await askAssistant(history, report, lang);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
    } catch {
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: t("Something went wrong. Try again in a moment.", "Algo salió mal. Probá de nuevo en un momento.") },
      ]);
    } finally {
      setThinking(false);
    }
  }

  return { messages, thinking, send, reset: () => setMessages([]) };
}

export function AssistantPanel({
  host = null,
  analyzing = false,
  subtitle,
  greeting,
  suggestions = defaultSuggestions,
  closeClassName = "lg:hidden",
  inputId = "assistant-input",
  messages,
  thinking,
  onSend,
  onClose,
}: {
  host?: string | null;
  analyzing?: boolean;
  subtitle?: string;
  greeting?: string;
  suggestions?: string[];
  closeClassName?: string;
  inputId?: string;
  messages: ChatMessage[];
  thinking: boolean;
  onSend: (text: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const t = useT();
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!draft.trim() || thinking) return;
    onSend(draft);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_8px_24px_rgba(15,26,46,0.08)]">
      <div className="flex items-center gap-2.5 border-b border-[#f1f2f6] px-4 py-3">
        <span className="flex size-7 items-center justify-center rounded-full bg-[#4c2882] text-white">
          <IconSpark className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium">{t("Pulse Assistant", "Asistente de Pulse")}</p>
          <p className="truncate text-[11px] text-[#8a91a3]">
            {subtitle ??
              (analyzing
                ? t("Reading the analysis…", "Leyendo el análisis…")
                : host
                  ? t(`Helping you optimize ${host}`, `Te ayudo a optimizar ${host}`)
                  : t("Ready to help", "Listo para ayudar"))}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("Close assistant", "Cerrar asistente")}
          className={`rounded-full px-2 py-1 text-xs text-[#8a91a3] transition-colors hover:bg-black/[0.04] hover:text-[#0f1a2e] ${closeClassName}`}
        >
          {t("Close", "Cerrar")}
        </button>
      </div>

      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="rounded-2xl rounded-tl-md bg-[#f4f5f8] px-3.5 py-2.5 text-[13px] leading-5 text-[#3c4558]">
              {greeting ??
                t(
                  "Hi! I can explain your findings, tell you what to fix first and give you ready-to-paste code like llms.txt or JSON-LD.",
                  "¡Hola! Puedo explicarte los hallazgos, decirte qué arreglar primero y darte código listo para pegar, como llms.txt o JSON-LD.",
                )}
            </div>
            <div>
              <p className="mb-2 text-[11px] text-[#9aa1b2]">{t("Try asking", "Probá preguntar")}</p>
              <div className="flex flex-col items-start gap-1.5">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={thinking}
                    onClick={() => onSend(t(suggestion))}
                    className="rounded-full border border-[#4c2882]/15 bg-[#4c2882]/[0.04] px-3 py-1.5 text-left text-xs text-[#4c2882] transition-colors hover:border-[#4c2882]/30 hover:bg-[#4c2882]/[0.08] disabled:opacity-50"
                  >
                    {t(suggestion)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap px-3.5 py-2.5 text-[13px] leading-5 ${
                  message.role === "user"
                    ? "rounded-2xl rounded-tr-md bg-[#4c2882] text-white"
                    : "rounded-2xl rounded-tl-md bg-[#f4f5f8] text-[#3c4558]"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}

        {thinking && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-tl-md bg-[#f4f5f8] px-3.5 py-3" aria-label={t("Pulse Assistant is typing", "El asistente está escribiendo")}>
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="size-1.5 animate-bounce rounded-full bg-[#9aa1b2]"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="border-t border-[#f1f2f6] p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-black/[0.08] bg-white px-3 py-2 transition-colors focus-within:border-[#4c2882]/50 focus-within:ring-4 focus-within:ring-[#4c2882]/[0.08]">
          <label htmlFor={inputId} className="sr-only">
            {t("Message Pulse Assistant", "Mensaje para el asistente")}
          </label>
          <textarea
            id={inputId}
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("Ask how to improve your site…", "Preguntá cómo mejorar tu sitio…")}
            className="max-h-32 min-h-6 flex-1 resize-none bg-transparent text-[13px] leading-6 outline-none [field-sizing:content] placeholder:text-[#9aa1b2]"
          />
          <button
            type="submit"
            disabled={!draft.trim() || thinking}
            aria-label={t("Send message", "Enviar mensaje")}
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#4c2882] text-white transition-colors hover:bg-[#5a3196] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconArrow className="size-3.5" />
          </button>
        </div>
        <p className="mt-1.5 px-1 text-[10px] text-[#9aa1b2]">
          {t("Enter to send · Shift + Enter for a new line", "Enter para enviar · Shift + Enter para un salto de línea")}
        </p>
      </form>
    </div>
  );
}
