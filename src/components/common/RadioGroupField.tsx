"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function RadioGroupField({
  label,
  value,
  onChange,
  options,
  error,
  direction = "vertical",
}: {
  label: string;
  value?: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  direction?: "vertical" | "horizontal";
}) {
  return (
    <div className="flex flex-col gap-1">
      {!!label && <Label className="mb-1">{label}</Label>}

      <RadioGroup
        value={value}
        onValueChange={onChange}
        className={direction === "horizontal" ? "flex flex-row gap-6" : "grid gap-2"}
      >
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2">
            <RadioGroupItem value={opt.value} id={opt.value} className={error && "border-red-500"} />
            <Label
              htmlFor={opt.value}
              className={cn(
                "mb-0 cursor-pointer font-normal leading-snug",
                error && "text-red-500"
              )}
            >
              {opt.label}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
