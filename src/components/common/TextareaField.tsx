"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import React from "react";

interface TextareaFieldProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const TextareaField = React.forwardRef<
  HTMLTextAreaElement,
  TextareaFieldProps
>(({ label, error, className, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={props.id}>{label}</Label>
      <Textarea
        ref={ref}
        className={cn(error && "border-red-500", className)}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

TextareaField.displayName = "TextareaField";
