import type * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-xl border border-[var(--line-strong)] bg-white px-3.5 text-sm font-semibold text-[var(--ink)] outline-none placeholder:font-medium placeholder:text-[var(--muted)] focus:border-[var(--teal)]",
        className,
      )}
      {...props}
    />
  );
}
