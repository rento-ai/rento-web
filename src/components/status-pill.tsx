import type { ReactNode } from "react";
import type { DuesToneEnum } from "@/enums/pg.enum";
import { cn } from "@/lib/utils";

const tones: Record<DuesToneEnum, string> = {
  late: "bg-[var(--red-tint)] text-[var(--red)]",
  part: "bg-[var(--amber-tint)] text-[var(--amber)]",
  soon: "bg-[var(--blue-tint)] text-[var(--blue)]",
  paid: "bg-[var(--green-tint)] text-[var(--green)]",
  gy: "bg-[var(--gray-tint)] text-[var(--gray)]",
};

export function StatusPill({
  tone,
  children,
}: {
  tone: DuesToneEnum;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
