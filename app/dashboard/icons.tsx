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
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconUser({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <circle cx="8" cy="8" r="6.25" />
      <circle cx="8" cy="6.5" r="2.25" />
      <path d="M4.2 12.9a4.5 4.5 0 0 1 7.6 0" />
    </Svg>
  );
}

export function IconLogout({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M6.5 2.5H4a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 4 13.5h2.5M10.5 11 13.5 8l-3-3M13.5 8H6" />
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

export function IconBot({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <rect x="2.5" y="5" width="11" height="8" rx="2" />
      <path d="M8 5V2.5M6 9h.01M10 9h.01M1 8.5v2M15 8.5v2" />
    </Svg>
  );
}

export function IconDownload({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M8 2v8M4.5 6.5 8 10l3.5-3.5M2.5 13.5h11" />
    </Svg>
  );
}

export function IconCopy({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
      <path d="M10.5 5.5V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
    </Svg>
  );
}
