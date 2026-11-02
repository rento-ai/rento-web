import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-[18px] border border-[var(--line)] bg-white p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}
