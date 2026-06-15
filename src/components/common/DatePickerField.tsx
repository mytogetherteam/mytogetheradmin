"use client";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DatePickerFieldProps {
  className?: string;
  label: string;
  hideLabel?: boolean;
  triggerId?: string;
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  error?: string;
  showYearDropdown?: boolean;
  showMonthDropdown?: boolean;
}

export function DatePickerField({
  className,
  label,
  hideLabel = false,
  triggerId,
  value,
  onChange,
  placeholder = "Pick a date",
  error,
  showYearDropdown,
  showMonthDropdown,
}: DatePickerFieldProps) {
  const validDate = value instanceof Date && !isNaN(value.getTime()) ? value : null;
  const clearDate = () => {
    onChange(null);
  }
  return (
    <div className="flex flex-col gap-1">
      {!hideLabel ? <Label>{label}</Label> : null}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={triggerId}
            variant="outline"
            type="button"
            aria-label={hideLabel ? label : undefined}
            className={cn(
              "w-full justify-start text-left font-normal",
              className,
              !validDate && "text-muted-foreground",
              error && "border-red-500"
            )}
          >
            <span className="flex items-center gap-2">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {validDate ? format(validDate, "PPP") : placeholder}
            </span>
            {validDate && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear time"
                onClick={(e) => {
                  e.stopPropagation();
                  clearDate();
                }}
                className="
                          flex 
                          items-center 
                          justify-center 
                          ml-auto 
                          mr-1 
                          bg-gray-200 
                          text-gray-800 
                          dark:bg-gray-700 
                          dark:text-gray-300 
                          dark:hover:bg-red-200 
                          dark:hover:text-gray-900 
                          hover:text-red-500 
                          hover:bg-red-50 
                          transition 
                          duration-300 
                          p-1 
                          cursor-pointer 
                          rounded-full 
                          "
              >
                <X className="h-4 w-4 " />
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="p-0 w-auto min-w-[20rem]" align="start">
          <Calendar
            mode="single"
            selected={validDate ?? undefined}
            onSelect={(d) => onChange(d ?? null)}
            required={false}
            captionLayout={
              showYearDropdown && showMonthDropdown
                ? "dropdown"
                : showYearDropdown
                  ? "dropdown-years"
                  : showMonthDropdown
                    ? "dropdown-months"
                    : "label"
            }
            startMonth={showYearDropdown ? new Date(1900, 0) : undefined}
            endMonth={showYearDropdown ? new Date(new Date().getFullYear() + 10, 11) : undefined}
          />

        </PopoverContent>
      </Popover>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
