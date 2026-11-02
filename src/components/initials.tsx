import { initials } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Initials({
  name,
  saffron = false,
  className,
}: {
  name: string;
  saffron?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
        saffron
          ? "bg-[var(--saffron)] text-[var(--teal-deep)]"
          : "bg-[var(--teal-tint)] text-[var(--teal)]",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
