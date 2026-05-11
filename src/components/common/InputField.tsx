"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";

    const inputElement = (
      <Input
        ref={ref}
        type={isPassword ? (showPassword ? "text" : "password") : type}
        className={cn(
          error && "border-red-500",
          isPassword && "pr-10",
          className
        )}
        {...props}
      />
    );

    return (
      <div className="flex flex-col gap-1">
        <Label htmlFor={props.id}>{label}</Label>
        {isPassword ? (
          <div className="relative">
            {inputElement}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4 text-muted-foreground" />
              ) : (
                <Eye className="size-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        ) : (
          inputElement
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

InputField.displayName = "InputField";
