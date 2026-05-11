"use client";

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AnalogClockTimePicker } from "./AnalogClockTimePicker";

interface TimePickerFieldProps {
  label?: string;
  value: Date | null;
  onChange: (d: Date | null) => void;
  error?: string;
  useAmPm?: boolean;
}

export function TimePickerField({
  label = "Select Time",
  value,
  onChange,
  error,
  useAmPm = true,
}: TimePickerFieldProps) {
  const [open, setOpen] = useState(false);

  const clearTime = () => {
    onChange(null);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1">
      {label && <Label>{label}</Label>}

      <Popover modal={false} open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-between text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-red-500"
            )}
          >
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {value ? format(value, "hh:mm a") : "Pick time"}
            </span>

            {value && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear time"
                onClick={(e) => {
                  e.stopPropagation();
                  clearTime();
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

        <PopoverContent className="p-4 w-[18rem]">
          <AnalogClockTimePicker
            value={value}
            onChange={(d) => onChange(d)}
            useAmPm={useAmPm}
          />

          {/* Confirm */}
          <Button
            type="button"
            className="w-full mt-3"
            onClick={() => setOpen(false)}
          >
            Confirm
          </Button>
        </PopoverContent>
      </Popover>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
