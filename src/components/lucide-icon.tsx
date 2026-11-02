import type { LucideIcon as LucideIconType } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LucideIcon({
  icon: Icon,
  className,
}: {
  icon: LucideIconType;
  className?: string;
}) {
  return <Icon className={cn("size-5", className)} strokeWidth={1.8} />;
}
