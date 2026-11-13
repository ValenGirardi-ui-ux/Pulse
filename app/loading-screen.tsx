import { T } from "./i18n";

type LoadingScreenProps = {
  /** Cover the whole viewport (pages, sign in) or just fill the space it's in (dashboard content). */
  variant?: "screen" | "inline";
  en?: string;
  es?: string;
};

/** Pulse's loading screen: the wordmark with a heartbeat line drawing under it. */
export function LoadingScreen({ variant = "screen", en = "Loading…", es = "Cargando…" }: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`loader-fade flex flex-col items-center justify-center gap-5 bg-white text-[#0f1a2e] ${
        variant === "screen" ? "fixed inset-0 z-[100]" : "min-h-[60vh] flex-1"
      }`}
    >
      <span className="text-2xl font-semibold tracking-tight text-[#4c2882]">Pulse</span>

      <svg viewBox="0 0 120 32" className="h-8 w-32" fill="none" aria-hidden="true">
        <path
          d="M2 16h28l6-10 8 22 7-18 5 6h62"
          stroke="#4c2882"
          strokeOpacity="0.12"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 16h28l6-10 8 22 7-18 5 6h62"
          pathLength={100}
          className="loader-beat"
          stroke="#4c2882"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <p className="text-sm text-[#5b6478]">
        <T en={en} es={es} />
      </p>
    </div>
  );
}
