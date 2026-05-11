"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface AppSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title?: React.ReactNode;
  description?: React.ReactNode;
  headerRight?: React.ReactNode;

  /** Default: right */
  side?: "top" | "right" | "bottom" | "left";
  /** Default: sm:max-w-lg */
  contentClassName?: string;
  /** Default: calc(100vh - 72px) */
  scrollAreaClassName?: string;

  children: React.ReactNode;
}

export function AppSheet({
  open,
  onOpenChange,
  title,
  description,
  headerRight,
  side = "right",
  contentClassName,
  scrollAreaClassName,
  children,
}: AppSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={cn("p-0 sm:max-w-lg", contentClassName)}>
        {(title || description || headerRight) && (
          <SheetHeader className="border-b">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {title != null && <SheetTitle className="truncate">{title}</SheetTitle>}
                {description != null && (
                  <SheetDescription className="truncate">{description}</SheetDescription>
                )}
              </div>
              {headerRight ? (
                <div className="flex shrink-0 items-center gap-2">{headerRight}</div>
              ) : (
                <div className="flex shrink-0 items-center gap-2" />
              )}
            </div>
          </SheetHeader>
        )}

        <ScrollArea className={cn("h-[calc(100vh-72px)] p-4", scrollAreaClassName)}>
          {children}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

