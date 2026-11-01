"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root {...props} />;
}

function DialogContent({
  className,
  children,
  wide = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { wide?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgba(8,16,15,0.55)]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-40px)] w-[calc(100%-40px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-auto rounded-[22px] bg-white p-[22px] outline-none max-md:top-auto max-md:bottom-0 max-md:w-full max-md:max-h-[92vh] max-md:translate-y-0 max-md:rounded-b-none",
          wide ? "max-w-[720px]" : "max-w-[560px]",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex items-center gap-3", className)} {...props} />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("flex-1 text-[19px] font-extrabold", className)}
      {...props}
    />
  );
}

function DialogClose({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-white",
        className,
      )}
      aria-label="Close"
      {...props}
    >
      <X className="size-5" />
    </DialogPrimitive.Close>
  );
}

export { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle };
