import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentSite } from "@/lib/sites";
import { LlmOptimizationView } from "./llm-optimization-view";

export const metadata: Metadata = {
  title: "LLM Optimization · Pulse",
};

async function ViewForCurrentSite() {
  const site = await getCurrentSite();
  return <LlmOptimizationView key={site?.id ?? "none"} site={site?.url ?? null} />;
}

export default function LlmOptimizationPage() {
  return (
    <Suspense fallback={<LlmOptimizationView />}>
      <ViewForCurrentSite />
    </Suspense>
  );
}
