"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, X, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { AnalogClockTimePicker } from "./AnalogClockTimePicker";

interface Props {
  value: Date | null;
  onChange: (v: Date | null) => void;
  label?: string;
  error?: string;
  /** When true, date defaults to 12:00 AM and time is optional. */
  optionalTime?: boolean;
}

function isMidnight(date: Date): boolean {
  return (
    date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0
  );
}

export function DateTimePickerField({
  value,
  onChange,
  label = "Select Date & Time",
  error,
  optionalTime = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"date" | "time">("date");
  const [timeEnabled, setTimeEnabled] = useState(false);

  const selected = value;

  useEffect(() => {
    if (!value) {
      setTimeEnabled(false);
      return;
    }
    setTimeEnabled(true);
  }, [value]);

  const clearDateTime = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(null);
    setTimeEnabled(false);
    setTab("date");
  };

  const useCurrentDateTime = () => {
    const now = new Date();
    onChange(now);
    setTimeEnabled(true);
    setTab("time");
  };

  const displayValue = value
    ? optionalTime && isMidnight(value)
      ? format(value, "PPP")
      : format(value, "PPP hh:mm a")
    : optionalTime
      ? "Pick date (time optional)"
      : "Pick date & time";

  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <div className="relative">
        <Button
          variant="outline"
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "w-full justify-start text-left font-normal overflow-hidden",
            !value && "text-muted-foreground",
            error && "border-red-500",
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{displayValue}</span>
          </span>
          {value && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear date and time"
              onClick={clearDateTime}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") clearDateTime(e);
              }}
              className="
                flex items-center justify-center ml-2 mr-1 shrink-0
                bg-gray-200 text-gray-800
                dark:bg-gray-700 dark:text-gray-300
                dark:hover:bg-red-200 dark:hover:text-gray-900
                hover:text-red-500 hover:bg-red-50
                transition duration-300 p-1 cursor-pointer rounded-full
              "
            >
              <X className="h-4 w-4" />
            </span>
          )}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="flex max-h-[min(92dvh,40rem)] w-[min(100vw-1.5rem,24rem)] flex-col gap-0 overflow-hidden p-0 sm:rounded-lg"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="shrink-0 border-b px-4 py-3 pr-12 text-left">
            <DialogTitle className="text-base">{label}</DialogTitle>
          </DialogHeader>

          <Tabs
            value={tab}
            onValueChange={(v) => {
              if (v === "time" && !timeEnabled) return;
              setTab(v as "date" | "time");
            }}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <TabsList className="grid h-10 w-full shrink-0 grid-cols-2 rounded-none border-b bg-muted/40 p-0">
              <TabsTrigger value="date" className="rounded-none h-full">
                Date
              </TabsTrigger>
              <TabsTrigger
                value="time"
                disabled={!timeEnabled}
                className={cn(
                  "rounded-none h-full",
                  !timeEnabled && "pointer-events-none opacity-50",
                )}
              >
                Time
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="date"
              className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 space-y-3 data-[state=inactive]:hidden"
            >
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={value ?? undefined}
                  onSelect={(d) => {
                    if (!d) return;
                    const nd = new Date(value ?? new Date());
                    nd.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                    if (optionalTime && !timeEnabled) {
                      nd.setHours(0, 0, 0, 0);
                    }
                    onChange(nd);
                    setTimeEnabled(true);
                    if (!optionalTime) {
                      setTab("time");
                    }
                  }}
                  required={false}
                />
              </div>

              {optionalTime ? (
                <div className="grid gap-2">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => setOpen(false)}
                    disabled={!value}
                  >
                    Done (12:00 AM)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setTab("time")}
                    disabled={!value}
                  >
                    <Clock className="h-4 w-4" /> Set custom time
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  type="button"
                  onClick={useCurrentDateTime}
                >
                  <Clock className="h-4 w-4" /> Use Current Date & Time
                </Button>
              )}
            </TabsContent>

            <TabsContent
              value="time"
              className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
            >
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
                <AnalogClockTimePicker
                  value={selected}
                  onChange={(d) => onChange(d)}
                  useAmPm
                  compact
                  label="Select Time"
                />
              </div>
              <div className="shrink-0 border-t bg-background p-3">
                <Button
                  className="w-full"
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  Confirm
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
