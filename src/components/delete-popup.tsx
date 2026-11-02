"use client";

import { type ReactNode, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/alert-dialog";
import { RentoButton } from "@/components/rento-button";

interface DeletePopupProps {
  onOpenChange: (open: boolean) => void;
  title: string;
  subHeader?: string;
  onSubmit: () => Promise<void>;
  deleteButtonText?: string;
  heading?: ReactNode;
  description?: ReactNode;
}

export function DeletePopup({
  onOpenChange,
  title,
  subHeader,
  onSubmit,
  deleteButtonText = "Delete",
  heading,
  description,
}: DeletePopupProps) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      await onSubmit();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{heading ?? `Delete ${title}?`}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ??
              `Are you sure you want to delete the ${subHeader ?? title}?`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <RentoButton type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </RentoButton>
          <RentoButton
            type="button"
            variant="danger"
            loading={loading}
            onClick={handleDelete}
          >
            {deleteButtonText}
          </RentoButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
