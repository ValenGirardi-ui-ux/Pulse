"use client";

import { useState } from "react";

export function Toggle({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => setOn(!on)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
        on ? "bg-[#4c2882]" : "bg-[#dfe2ea]"
      }`}
    >
      <span
        className={`size-4 rounded-full bg-white shadow-[0_1px_2px_rgba(15,26,46,0.2)] transition-transform duration-200 ${
          on ? "translate-x-[1.125rem]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function Segmented<T extends string>({
  label,
  options,
  defaultValue,
  value: controlled,
  onChange,
}: {
  label: string;
  options: readonly T[];
  defaultValue?: T;
  value?: T;
  onChange?: (value: T) => void;
}) {
  const [internal, setInternal] = useState<T>(defaultValue ?? options[0]);
  const value = controlled ?? internal;

  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-[#f4f5f8] p-0.5">
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              setInternal(option);
              onChange?.(option);
            }}
            className={`h-7 rounded-md px-3 text-xs transition-colors ${
              active
                ? "bg-white font-medium text-[#0f1a2e] shadow-[0_1px_2px_rgba(15,26,46,0.08)]"
                : "text-[#5b6478] hover:text-[#0f1a2e]"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
