import type * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-xl border border-[var(--line-strong)] bg-white px-3.5 py-3 text-sm font-medium text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--teal)]",
        className,
      )}
      {...props}
    />
  );
}
