"use client";

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
}

export function DateTimePickerField({ value, onChange, label = "Select Date & Time", error }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"date" | "time">("date");
  const [timeEnabled, setTimeEnabled] = useState(false);

  const selected = value;

  const clearDateTime = () => {
    onChange(null);
    setTimeEnabled(false);
    setTab("date");
    setOpen(false);
  };

  const useCurrentDateTime = () => {
    const now = new Date();
    onChange(now);
    setTimeEnabled(true);
    setTab("time");
  };

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
                error && "border-red-500"
              )}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">
                  {value ? format(value, "PPP hh:mm a") : "Pick date & time"}
                </span>
              </span>
              {value && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Clear time"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearDateTime();
                  }}
                  className="
                          flex 
                          items-center 
                          justify-center 
                          ml-2
                          mr-1 
                          shrink-0
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

          </div>
        </PopoverTrigger>

        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              if (v === "time" && !timeEnabled) return;
              setTab(v as "date" | "time");
            }}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="date">Date</TabsTrigger>
              <TabsTrigger
                value="time"
                disabled={!timeEnabled}
                className={!timeEnabled ? "pointer-events-none opacity-50" : ""}
              >
                Time
              </TabsTrigger>
            </TabsList>

            {/* DATE TAB */}
            <TabsContent value="date" className="p-3 space-y-3">
              <Calendar
                mode="single"
                selected={value ?? undefined}
                onSelect={(d) => {
                  if (!d) return;
                  const nd = new Date(value ?? new Date());
                  nd.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                  onChange(nd);
                  setTimeEnabled(true);
                  setTab("time");
                }}
                required={false}
              />

              {/* ✅ Use Now Button */}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={useCurrentDateTime}
              >
                <Clock className="h-4 w-4" /> Use Current Date & Time
              </Button>
            </TabsContent>

            {/* TIME TAB */}
            <TabsContent value="time" className="p-3 border-t space-y-3">
              <AnalogClockTimePicker
                value={selected}
                onChange={(d) => onChange(d)}
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
