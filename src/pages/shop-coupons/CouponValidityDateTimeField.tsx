"use client";

import { useEffect, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, X, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { AnalogClockTimePicker } from "@/components/common/AnalogClockTimePicker";

interface Props {
  value: Date | null;
  onChange: (v: Date | null) => void;
  label: string;
  error?: string;
}

function isMidnight(date: Date): boolean {
  return (
    date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0
  );
}

/** Date picker with optional time — defaults to 12:00 AM when time is skipped. */
export function CouponValidityDateTimeField({
  value,
  onChange,
  label,
  error,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"date" | "time">("date");
  const [hasCustomTime, setHasCustomTime] = useState(false);

  useEffect(() => {
    if (!value) {
      setHasCustomTime(false);
      return;
    }
    setHasCustomTime(!isMidnight(value));
  }, [value]);

  const clearDateTime = () => {
    onChange(null);
    setHasCustomTime(false);
    setTab("date");
    setOpen(false);
  };

  const displayValue = value
    ? hasCustomTime
      ? format(value, "PPP hh:mm a")
      : format(value, "PPP")
    : "Pick date (time optional)";

  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Button
              variant="outline"
              type="button"
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
                  onClick={(e) => {
                    e.stopPropagation();
                    clearDateTime();
                  }}
                  className="ml-2 mr-1 flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-gray-200 p-1 text-gray-800 transition duration-300 hover:bg-red-50 hover:text-red-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-red-200 dark:hover:text-gray-900"
                >
                  <X className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-auto min-w-[20rem] p-0" align="start">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              if (v === "time" && !value) return;
              setTab(v as "date" | "time");
            }}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="date">Date</TabsTrigger>
              <TabsTrigger
                value="time"
                disabled={!value}
                className={!value ? "pointer-events-none opacity-50" : ""}
              >
                Time
              </TabsTrigger>
            </TabsList>

            <TabsContent value="date" className="mt-0 space-y-3 p-3">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={value ?? undefined}
                  onSelect={(d) => {
                    if (!d) return;
                    const nd = new Date(value ?? new Date());
                    nd.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                    if (!hasCustomTime) {
                      nd.setHours(0, 0, 0, 0);
                    }
                    onChange(nd);
                  }}
                  required={false}
                />
              </div>

              <div className="grid gap-2">
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    if (!value) return;
                    const nd = new Date(value);
                    nd.setHours(0, 0, 0, 0);
                    onChange(nd);
                    setHasCustomTime(false);
                    setOpen(false);
                  }}
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
            </TabsContent>

            <TabsContent value="time" className="space-y-3 border-t p-3">
              <AnalogClockTimePicker
                value={value}
                onChange={(d) => {
                  onChange(d);
                  setHasCustomTime(true);
                }}
                useAmPm
                label="Select Time"
              />
              <Button className="w-full" onClick={() => setOpen(false)}>
                Confirm
              </Button>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
