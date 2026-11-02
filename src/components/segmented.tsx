"use client";

import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div
      className="inline-flex flex-wrap gap-1 rounded-xl bg-[var(--bg)] p-1"
      role="group"
      aria-label={label}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            "h-9 rounded-[9px] px-3.5 text-[13px] font-semibold text-[var(--muted)]",
            value === option.value &&
              "bg-white font-bold text-[var(--ink)] shadow-sm",
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
