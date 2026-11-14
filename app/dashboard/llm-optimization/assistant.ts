import type { Lang } from "../../i18n";
import { askPulse } from "../assistant-actions";
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

/**
 * Answers the last question with fixed rules on the server (no AI): from the LLM report when there is one,
 * otherwise from the scans of the current site. It replies in the language the user picked.
 */
export async function askAssistant(messages: ChatMessage[], report: Report | null, lang: Lang = "en"): Promise<string> {
  const question = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  return askPulse(question, lang, report);
}
