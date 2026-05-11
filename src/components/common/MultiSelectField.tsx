"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Label } from "../ui/label";
interface Option {
  label: string;
  value: string;
}

export function MultiSelectField({
  label,
  options,
  values,
  onChange,
  placeholder = "Select...",
  maxDisplay = 3,
  showSearch = true,
  error,
}: {
  label: string;
  options: Option[];
  values: string[];
  onChange: (val: string[]) => void;
  placeholder?: string;
  maxDisplay?: number;
  showSearch?: boolean;
  error?: string;
}) {
  const [query, setQuery] = React.useState("");

  const toggle = (v: string) => {
    onChange(
      values.includes(v)
        ? values.filter((x) => x !== v)
        : [...values, v]
    );
  };

  const filtered = React.useMemo(() => {
    if (!query) return options;
    const lowerQuery = query.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(lowerQuery)
    );
  }, [options, query]);

  const displayValues = values.slice(0, maxDisplay);
  const remaining = values.length - maxDisplay;

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>

      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className={cn("justify-start text-left flex-wrap h-auto min-h-[2.5rem]", error && "border-red-500")} >
            {values.length ? (
              <div className="flex flex-wrap gap-1 items-center">
                {displayValues.map((v) => {
                  const opt = options.find(o => o.value === v);
                  return (
                    <Badge key={v} variant="default" className="flex items-center gap-1">
                      {opt?.label}
                    </Badge>
                  );
                })}

                {remaining > 0 && (
                  <Badge variant="default" className="text-xs">
                    +{remaining} more
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
          <Command shouldFilter={false}>
            {showSearch && (
              <CommandInput
                placeholder="Search..."
                value={query}
                onValueChange={setQuery}
              />
            )}
            <CommandList>
              {filtered.length === 0 ? (
                <CommandEmpty>No results found.</CommandEmpty>
              ) : (
                <>
                  {filtered.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      onSelect={() => toggle(opt.value)}
                      className="cursor-pointer"
                    >
                      <span>{opt.label}</span>
                      {values.includes(opt.value) && (
                        <span className="ml-auto text-primary">
                          <Check className="ml-auto h-4 w-4 text-primary" />
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
