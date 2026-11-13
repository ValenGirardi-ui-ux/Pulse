import type { Metadata } from "next";
import { LlmOptimizationView } from "./llm-optimization-view";

export const metadata: Metadata = {
  title: "LLM Optimization · Pulse",
};

export default function LlmOptimizationPage() {
  return <LlmOptimizationView />;
}
