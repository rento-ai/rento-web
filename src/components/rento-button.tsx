"use client";

import type { VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type * as React from "react";
import { Button, type buttonVariants } from "@/components/button";

interface RentoButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function RentoButton({
  loading,
  children,
  disabled,
  ...props
}: RentoButtonProps) {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading ? <Loader2 className="animate-spin" /> : null}
      {children}
    </Button>
  );
}
