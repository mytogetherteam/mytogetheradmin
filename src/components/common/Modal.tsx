"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ButtonLoading } from "./ButtonLoading";
import { Button } from "@/components/ui/button";
import React from "react";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  isDelete?: boolean;
  loading?: boolean;
  title?: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  submitText?: string;
  cancelText?: string;
  width?: string;
  onClose: () => void;
  onSubmit?: () => void;
}

export function Modal({
  open,
  isDelete = false,
  loading = false,
  title = "Dialog",
  description,
  children,
  submitText,
  cancelText,
  width = "",
  onClose,
  onSubmit,
}: ModalProps) {
  const fallbackDescription =
    "Use this dialog to review and submit the provided content.";

  // Set default values with translation
  const finalSubmitText = submitText ?? "Save";
  const finalCancelText = cancelText ?? "Cancel";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-md", width)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription
            className={
              description ? "text-sm text-muted-foreground" : "sr-only"
            }
          >
            {description ?? fallbackDescription}
          </DialogDescription>
        </DialogHeader>
        <Separator orientation="horizontal" />
        <div className="p-2 max-h-[70vh] overflow-y-auto">{children}</div>
        <Separator orientation="horizontal" />

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {finalCancelText}
          </Button>

          {onSubmit && (
            <ButtonLoading
              loading={loading}
              label={isDelete ? "Deleting..." : "Saving..."}
              className={
                isDelete
                  ? "bg-red-600 text-white hover:bg-red-500"
                  : ""
              }
              onClick={onSubmit}
            >
              {finalSubmitText}
            </ButtonLoading>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
