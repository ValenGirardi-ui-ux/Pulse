import type { Lang } from "../../i18n";
import type { Report } from "./data";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export const suggestions = [
  "What should I fix first?",
  "Write an llms.txt for this site",
  "Create the JSON-LD for my home page",
  "Explain my score in simple words",
];

// Connect the AI model here. It receives the whole conversation, the current report as context and the
// language the user picked, and must return the assistant's reply in that language. The UI doesn't need to change.
export async function askAssistant(messages: ChatMessage[], report: Report | null, lang: Lang = "en"): Promise<string> {
  void messages;
  void report;
  await new Promise((resolve) => setTimeout(resolve, 900));
  return lang === "es"
    ? "El modelo de IA todavía no está conectado. Cuando lo esté, voy a responder acá usando este informe como contexto."
    : "The AI model isn't connected yet. Once it is, I'll answer here using this report as context.";
}
