"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";
import useUiStore from "@/store/useUi.store";

export function PopupFrame({
  title,
  wide = false,
  children,
}: {
  title: string;
  wide?: boolean;
  children: ReactNode;
}) {
  const closeModal = useUiStore((state) => state.closeModal);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
    >
      <DialogContent wide={wide} aria-label={title}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogClose />
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
