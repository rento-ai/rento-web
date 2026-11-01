import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border text-sm font-bold transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]/30 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-[var(--line-strong)] bg-white text-[var(--ink)] hover:bg-[var(--sub)]",
        primary:
          "border-[var(--teal)] bg-[var(--teal)] text-white hover:bg-[var(--teal-deep)]",
        success:
          "border-transparent bg-[var(--green-tint)] text-[var(--green)]",
        danger: "border-transparent bg-[var(--red-tint)] text-[var(--red)]",
        ghost: "border-transparent bg-transparent text-white hover:bg-white/10",
      },
      size: {
        default: "h-11 px-[18px]",
        sm: "h-10 rounded-[10px] px-3.5 text-[13px]",
        lg: "h-[50px] px-5 text-[15px]",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
