"use client";

import { useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn, substringText } from "@/lib/utils";

interface Option {
  value: string | number;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value?: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
  showSearch?: boolean;
  disabled?: boolean;
}

export function SelectField({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Search...",
  error,
  showSearch = true,
  disabled = false,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedOption = options.find((opt) => String(opt.value) === value);

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            disabled={disabled}
            className={cn("justify-between overflow-hidden", error && "!border-red-500")}
            size={"lg"}
          >
            {selectedOption ? substringText(selectedOption.label, 30) : "Select option"}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
          <Command>
            {/* ✅ Hide Search Input if showSearch = false */}
            {showSearch && (
              <CommandInput
                placeholder={placeholder}
                onValueChange={setQuery}
              />
            )}

            {filtered.length === 0 ? (
              <CommandEmpty>No results.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    onSelect={() => {
                      onValueChange(String(opt.value));
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    {opt.label}
                    {value === String(opt.value) && (
                      <Check className="ml-auto h-4 w-4 text-primary" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
