/**
 * Bangkok Timezone Utilities (Asia/Bangkok, ICT, UTC+07:00)
 * Ensures all dashboard telemetry, charts, and date filters operate strictly on Bangkok local time.
 */

export const BANGKOK_TIMEZONE = "Asia/Bangkok";
export const BANGKOK_OFFSET_HOURS = 7;
export const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Returns "YYYY-MM-DD" for a date in Bangkok timezone.
 */
/** Move a Bangkok calendar day by a number of days. `isoDate` is `YYYY-MM-DD`. */
export function shiftBangkokDate(isoDate: string, days: number): string {
    const [year, month, day] = isoDate.split("-").map(Number);
    const utc = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
    utc.setUTCDate(utc.getUTCDate() + days);
    const y = utc.getUTCFullYear();
    const m = String(utc.getUTCMonth() + 1).padStart(2, "0");
    const d = String(utc.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/** Inclusive Bangkok range ending today. */
export function lastBangkokDays(days: number): { start: string; end: string } {
    const end = getBangkokDateString(new Date());
    return { start: shiftBangkokDate(end, -(Math.max(1, days) - 1)), end };
}

export type BangkokPreset = "today" | "yesterday" | "week" | "month";

/** Today, yesterday, this week (Monday–today), or this month, in Bangkok. */
export function bangkokPreset(preset: BangkokPreset): { start: string; end: string } {
    const today = getBangkokDateString(new Date());
    if (preset === "today") return { start: today, end: today };
    if (preset === "yesterday") {
        const day = shiftBangkokDate(today, -1);
        return { start: day, end: day };
    }
    if (preset === "week") {
        const weekday = new Intl.DateTimeFormat("en-US", {
            timeZone: BANGKOK_TIMEZONE,
            weekday: "short",
        }).format(new Date());
        const offset: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
        return { start: shiftBangkokDate(today, -(offset[weekday] ?? 0)), end: today };
    }
    return { start: `${today.slice(0, 7)}-01`, end: today };
}

export function getBangkokDateString(date: Date | string | number = new Date()): string {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: BANGKOK_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(d);
}

/**
 * Returns "YYYY-MM" for a date in Bangkok timezone.
 */
export function getBangkokMonthString(date: Date | string | number = new Date()): string {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: BANGKOK_TIMEZONE,
        year: "numeric",
        month: "2-digit",
    }).formatToParts(d);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    return `${y}-${m}`;
}

/**
 * Returns the hour (0 - 23) in Bangkok timezone.
 */
export function getBangkokHour(date: Date | string | number): number {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    if (isNaN(d.getTime())) return 0;
    const hourStr = new Intl.DateTimeFormat("en-US", {
        timeZone: BANGKOK_TIMEZONE,
        hour: "numeric",
        hour12: false,
    }).format(d);
    const h = parseInt(hourStr, 10);
    return h === 24 ? 0 : h;
}

/**
 * Returns the day of month (1 - 31) in Bangkok timezone.
 */
export function getBangkokDayOfMonth(date: Date | string | number): number {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    if (isNaN(d.getTime())) return 1;
    const dayStr = new Intl.DateTimeFormat("en-US", {
        timeZone: BANGKOK_TIMEZONE,
        day: "numeric",
    }).format(d);
    return parseInt(dayStr, 10) || 1;
}

/**
 * Checks if a given timestamp falls on "Today" in Bangkok.
 */
export function isTodayBangkok(date: Date | string | number | null | undefined): boolean {
    if (!date) return false;
    const dStr = getBangkokDateString(date);
    const todayStr = getBangkokDateString(new Date());
    return !!dStr && dStr === todayStr;
}

/**
 * Format time in Bangkok timezone (e.g. "04:39 AM")
 */
export function formatBangkokTime(
    date: Date | string | number | null | undefined,
    options?: Intl.DateTimeFormatOptions,
): string {
    if (!date) return "—";
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("en-US", {
        timeZone: BANGKOK_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        ...options,
    }).format(d);
}

/**
 * Format full date & time in Bangkok timezone (e.g. "Oct 15, 2026, 04:39 AM")
 */
export function formatBangkokDateTime(
    date: Date | string | number | null | undefined,
    options?: Intl.DateTimeFormatOptions,
): string {
    if (!date) return "—";
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("en-US", {
        timeZone: BANGKOK_TIMEZONE,
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        ...options,
    }).format(d);
}

/**
 * Format short date in Bangkok (e.g. "Oct 15")
 */
export function formatBangkokDate(
    date: Date | string | number | null | undefined,
    options?: Intl.DateTimeFormatOptions,
): string {
    if (!date) return "—";
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("en-US", {
        timeZone: BANGKOK_TIMEZONE,
        month: "short",
        day: "numeric",
        ...options,
    }).format(d);
}
