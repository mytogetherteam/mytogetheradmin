"use client";

import React, { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";

type Stage = "hour" | "minute";

export interface AnalogClockTimePickerProps {
  label?: string;
  value: Date | null;
  onChange: (d: Date) => void;
  className?: string;
  useAmPm?: boolean;
}

export function AnalogClockTimePicker({
  label,
  value,
  onChange,
  className,
  useAmPm = true,
}: AnalogClockTimePickerProps) {
  const date = value ?? new Date();
  const [stage, setStage] = useState<Stage>("hour");
  const dialRef = useRef<HTMLDivElement>(null);
  const isPM = date.getHours() >= 12;

  const hourDisplay = (date.getHours() % 12) || 12;
  const hourForMath = date.getHours() % 12;
  const minute = date.getMinutes();

  const angle = useMemo(
    () => (stage === "hour" ? hourForMath * 30 + (minute / 60) * 30 : minute * 6),
    [stage, hourForMath, minute]
  );

  const setHour = (h12: number) => {
    const d = new Date(date);
    if (useAmPm) {
      d.setHours(isPM ? (h12 % 12) + 12 : (h12 % 12));
    } else {
      d.setHours(h12 % 12);
    }
    onChange(d);
    setStage("minute");
  };

  const setMinute = (m: number) => {
    const d = new Date(date);
    d.setMinutes(m);
    onChange(d);
  };

  const toggleAMPM = (pm: boolean) => {
    const d = new Date(date);
    const h = d.getHours();
    d.setHours(pm ? (h % 12) + 12 : (h % 12));
    onChange(d);
  };

  const pickFromCoords = (clientX: number, clientY: number) => {
    const dial = dialRef.current;
    if (!dial) return;

    const rect = dial.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = clientX - cx;
    const dy = clientY - cy;

    const radians = Math.atan2(dx, -dy)
    let deg = (radians * 180) / Math.PI;
    if (deg < 0) deg += 360;

    if (stage === "hour") {
      const idx = Math.round(deg / 30) % 12;
      const h = (idx === 0 ? 12 : idx);
      setHour(h);
    } else {
      const idx = Math.round(deg / 6) % 60;
      setMinute(idx);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pickFromCoords(e.clientX, e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).hasPointerCapture?.(e.pointerId)) {
      pickFromCoords(e.clientX, e.clientY);
    }
  };

  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {label && <Label>{label}</Label>}

      {/* Header: time + AM/PM */}
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-1 text-xl font-semibold">
          <button
            type="button"
            className={cn(
              "rounded-md px-3 py-1 transition",
              stage === "hour" ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
            onClick={() => setStage("hour")}
          >
            {String(hourDisplay).padStart(2, "0")}
          </button>
          <span>:</span>
          <button
            type="button"
            className={cn(
              "rounded-md px-3 py-1 transition",
              stage === "minute" ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
            onClick={() => setStage("minute")}
          >
            {String(minute).padStart(2, "0")}
          </button>
        </div>

        {useAmPm && (
          <div className="flex flex-col gap-2 ml-1">
            <button
              type="button"
              className={cn(
                "px-2 py-1 text-xs rounded-md border",
                !isPM ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"
              )}
              onClick={() => toggleAMPM(false)}
            >
              AM
            </button>
            <button
              type="button"
              className={cn(
                "px-2 py-1 text-xs rounded-md border",
                isPM ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"
              )}
              onClick={() => toggleAMPM(true)}
            >
              PM
            </button>
          </div>
        )}
      </div>

      {/* DIAL */}
      <div
        ref={dialRef}
        className={cn(
          "relative w-64 h-64 rounded-full select-none",
          "bg-muted/60 dark:bg-slate-800/60",
          "shadow-inner"
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
      >
        {/* center dot */}
        <div className="absolute left-1/2 top-1/2 -ml-1 -mt-1 w-2 h-2 rounded-full bg-primary z-20" />

        {/* animated hand */}
        <svg className="absolute inset-0" viewBox="0 0 200 200" width="100%" height="100%">
          {(() => {
            const LEN = stage === "hour" ? 68 : 88;
            const cx = 100,
              cy = 100;
            const a = ((angle) * Math.PI) / 180;
            const x2 = cx + Math.sin(a) * LEN;
            const y2 = cy - Math.cos(a) * LEN;
            return (
              <g style={{ transition: "all 180ms ease" }}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={x2}
                  y2={y2}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
                <circle cx={x2} cy={y2} r="6" fill="hsl(var(--primary))" />
              </g>
            );
          })()}
        </svg>

        {/* labels */}
        {stage === "hour"
          ? hours.map((h, i) => {
            const deg = i * 30;
            const r = 88;
            const x = Math.sin((deg * Math.PI) / 180) * r;
            const y = -Math.cos((deg * Math.PI) / 180) * r;
            const selected = h === hourDisplay;
            return (
              <button
                key={h}
                type="button"
                className={cn(
                  "absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full text-sm",
                  "flex items-center justify-center transition",
                  selected ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                )}
                style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setHour(h);
                }}
              >
                {String(h).padStart(2, "0")}
              </button>
            );
          })
          : minutes
            .filter((m) => m % 5 === 0)
            .map((m, i) => {
              const deg = i * 30;
              const r = 88;
              const x = Math.sin((deg * Math.PI) / 180) * r;
              const y = -Math.cos((deg * Math.PI) / 180) * r;
              const selected = m === Math.round(minute / 5) * 5;
              return (
                <button
                  type="button"
                  key={m}
                  className={cn(
                    "absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full text-sm",
                    "flex items-center justify-center transition",
                    selected ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  )}
                  style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMinute(m);
                  }}
                >
                  {String(m).padStart(2, "0")}
                </button>
              );
            })}
      </div>

      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
        <Clock className="h-4 w-4" />
        {stage === "hour" ? "Click or drag to choose an hour" : "Click or drag to choose minutes"}
      </div>
    </div>
  );
}
