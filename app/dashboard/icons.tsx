import type { ReactNode } from "react";

function Svg({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconGrid({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </Svg>
  );
}

export function IconAlert({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3.5M8 11h.01" />
    </Svg>
  );
}

export function IconPulse({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M1.5 8h3l1.5-4 3 8 1.5-4h4" />
    </Svg>
  );
}

export function IconScan({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M2 5V3a1 1 0 0 1 1-1h2M11 2h2a1 1 0 0 1 1 1v2M14 11v2a1 1 0 0 1-1 1h-2M5 14H3a1 1 0 0 1-1-1v-2M4.5 8h7" />
    </Svg>
  );
}

export function IconGear({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" />
    </Svg>
  );
}

export function IconUpDown({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M5 6l3-3 3 3M5 10l3 3 3-3" />
    </Svg>
  );
}

export function IconChevron({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M6 3.5 10.5 8 6 12.5" />
    </Svg>
  );
}

export function IconArrow({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M3 8h10M9 4l4 4-4 4" />
    </Svg>
  );
}

export function IconCheck({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
    </Svg>
  );
}

export function IconSpark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 1.5c.3 2.9 1.6 4.2 4.5 4.5v.01C9.6 6.3 8.3 7.6 8 10.5 7.7 7.6 6.4 6.3 3.5 6 6.4 5.7 7.7 4.4 8 1.5Z" />
      <path d="M12.5 10c.15 1.3.7 1.85 2 2-1.3.15-1.85.7-2 2-.15-1.3-.7-1.85-2-2 1.3-.15 1.85-.7 2-2Z" />
    </svg>
  );
}
