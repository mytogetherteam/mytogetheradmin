import { useState, useMemo } from "react";
import {
    Clock,
    Flame,
    Users,
    Activity,
    Compass,
} from "lucide-react";
import { ActiveUserDistributionPieCard, type DistrictDemandItem } from "./ActiveUserDistributionPieCard";
import { OrdersVelocityGraphCard } from "./OrdersVelocityGraphCard";

import type { ActiveUsersSummary } from "@/services/activeUsersService";

interface DistrictUsage {
    district: string;
    users: number;
    sessions: number;
    avgSessionSeconds: number;
}

interface BusyHour {
    hour: number;
    users: number;
    sessions: number;
}

export interface UsagePeriod {
    avgSessionSeconds: number;
    sessions: number;
    users: number;
    districts: DistrictUsage[];
    busyHours?: BusyHour[];
}

interface ExtendedStatsProps {
    dau?: number;
    mau?: number;
    avgDeliveryTime?: number;
    fleetStatus?: {
        active: number;
        busy: number;
        total: number;
    };
    appUsage?: UsagePeriod & {
        today?: UsagePeriod;
        last7Days?: UsagePeriod;
        last30Days?: UsagePeriod;
    };
    peakHours?: Array<{ hour: number; count: number }>;
    geoHotspots?: Array<{ district: string; count: number }>;
}

interface Props {
    extendedStats?: ExtendedStatsProps | null;
    isLive?: boolean;
    activeUsersSummary?: ActiveUsersSummary | null;
}

function formatHourRange(hour: number) {
    const start = ((hour % 24) + 24) % 24;
    const end = (start + 1) % 24;
    const label = (value: number) => {
        const suffix = value < 12 ? "AM" : "PM";
        const clock = value % 12 === 0 ? 12 : value % 12;
        return `${clock} ${suffix}`;
    };
    return `${label(start)} – ${label(end)}`;
}

function formatHourShort(hour: number) {
    const h = ((hour % 24) + 24) % 24;
    const suffix = h < 12 ? "AM" : "PM";
    const clock = h % 12 === 0 ? 12 : h % 12;
    return `${clock}${suffix}`;
}

function formatStay(seconds: number) {
    if (!seconds || seconds <= 0) return "0s";
    const total = Math.max(0, Math.round(seconds));
    const minutes = Math.round(total / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remain = minutes % 60;
    return remain ? `${hours}h ${remain}m` : `${hours}h`;
}

type Timeframe = "today" | "7d" | "30d";

export function TodayActivitySection({ extendedStats, isLive, activeUsersSummary }: Props) {
    const [timeframe, setTimeframe] = useState<Timeframe>("today");

    const appUsage = extendedStats?.appUsage;

    // Pick the usage stats corresponding to the selected timeframe
    const currentUsage: UsagePeriod | null = useMemo(() => {
        if (!appUsage) return null;
        if (timeframe === "today") return appUsage.today ?? appUsage;
        if (timeframe === "7d") return appUsage.last7Days ?? appUsage;
        return appUsage.last30Days ?? appUsage;
    }, [appUsage, timeframe]);

    // Responsive KPI 1: Active Users Count & Label (Strictly real DB counts)
    const activeUsersCount = useMemo(() => {
        if (timeframe === "today") {
            if (activeUsersSummary?.today?.customers != null && activeUsersSummary.today.customers > 0) {
                return activeUsersSummary.today.customers;
            }
            if (currentUsage?.users != null) {
                return currentUsage.users;
            }
            return extendedStats?.dau ?? 0;
        }
        if (timeframe === "7d") {
            return activeUsersSummary?.last7Days?.customers ?? currentUsage?.users ?? 0;
        }
        return activeUsersSummary?.last30Days?.customers ?? extendedStats?.mau ?? currentUsage?.users ?? 0;
    }, [timeframe, activeUsersSummary, currentUsage?.users, extendedStats?.dau, extendedStats?.mau]);

    const activeUsersLabel = useMemo(() => {
        if (timeframe === "today") return "Customers active today";
        if (timeframe === "7d") return "Unique customers (past 7 days)";
        return "Monthly active customers (MAU)";
    }, [timeframe]);

    // Responsive KPI 2: Average Session Duration (Strictly real DB average for selected timeframe)
    const avgSessionSeconds = useMemo(() => {
        return currentUsage?.avgSessionSeconds || 0;
    }, [currentUsage?.avgSessionSeconds]);

    const avgSessionLabel = useMemo(() => {
        if (timeframe === "today") return "Today's session duration";
        if (timeframe === "7d") return "7-day average session";
        return "30-day average session";
    }, [timeframe]);

    // Hourly activity chart data (Strictly unscaled real DB data for selected timeframe)
    const chartData = useMemo(() => {
        const busyHours = currentUsage?.busyHours || [];
        const peakHours = extendedStats?.peakHours || [];

        // If 30-day mode and we have real peakHours (from order history)
        if (timeframe === "30d" && peakHours.length > 0) {
            const sortedPeak = [...peakHours].sort((a, b) => a.hour - b.hour);
            return sortedPeak.map((row) => {
                const isLunchRush = row.hour >= 11 && row.hour <= 13;
                const isDinnerRush = row.hour >= 17 && row.hour <= 19;
                const isRush = isLunchRush || isDinnerRush;

                return {
                    hour: row.hour,
                    label: formatHourShort(row.hour),
                    fullRange: formatHourRange(row.hour),
                    users: row.count,
                    sessions: row.count,
                    orders: row.count,
                    isLunchRush,
                    isDinnerRush,
                    isRush,
                };
            });
        }

        if (busyHours.length === 0) {
            return Array.from({ length: 14 }, (_, i) => {
                const hour = i + 9; // 9 AM to 10 PM
                const isLunchRush = hour >= 11 && hour <= 13;
                const isDinnerRush = hour >= 17 && hour <= 19;
                return {
                    hour,
                    label: formatHourShort(hour),
                    fullRange: formatHourRange(hour),
                    users: 0,
                    sessions: 0,
                    orders: 0,
                    isLunchRush,
                    isDinnerRush,
                    isRush: isLunchRush || isDinnerRush,
                };
            });
        }

        // Sort by chronological hour (0 to 23)
        const sorted = [...busyHours].sort((a, b) => a.hour - b.hour);

        return sorted.map((row) => {
            const isLunchRush = row.hour >= 11 && row.hour <= 13;
            const isDinnerRush = row.hour >= 17 && row.hour <= 19;
            const isRush = isLunchRush || isDinnerRush;

            return {
                hour: row.hour,
                label: formatHourShort(row.hour),
                fullRange: formatHourRange(row.hour),
                users: row.users,
                sessions: row.sessions,
                orders: row.users,
                isLunchRush,
                isDinnerRush,
                isRush,
            };
        });
    }, [timeframe, currentUsage?.busyHours, extendedStats?.peakHours]);

    // Calculate peak hour dynamically from chartData
    const peakHourInfo = useMemo(() => {
        if (!chartData || chartData.length === 0) return null;
        let peak: (typeof chartData)[0] | null = null;
        for (const item of chartData) {
            if (item.users > 0 && (!peak || item.users > peak.users)) {
                peak = item;
            }
        }
        return peak;
    }, [chartData]);

    // Responsive KPI 3: Peak Activity Text
    const peakActivityText = useMemo(() => {
        if (!peakHourInfo) return timeframe === "today" ? "No activity yet today" : "No peak activity recorded";
        if (timeframe === "today") return `${peakHourInfo.users.toLocaleString()} users active`;
        if (timeframe === "7d") return `${peakHourInfo.users.toLocaleString()} peak users / hr`;
        return `${peakHourInfo.users.toLocaleString()} peak order hour`;
    }, [timeframe, peakHourInfo]);

    // District demand list (Strictly real DB telemetry, dynamic per timeframe)
    const districtData: DistrictDemandItem[] = useMemo(() => {
        const list = currentUsage?.districts || [];
        const hotspots = timeframe === "30d" ? (extendedStats?.geoHotspots || []) : [];

        if (list.length === 0 && hotspots.length === 0) return [];

        const combined: Array<{
            district: string;
            users: number;
            sessions: number;
            avgSessionSeconds: number;
        }> = list.map((d: DistrictUsage) => ({
            district: d.district,
            users: d.users,
            sessions: d.sessions,
            avgSessionSeconds: d.avgSessionSeconds,
        }));

        if (hotspots.length > 0) {
            hotspots.forEach((h: { district: string; count: number }) => {
                const existing = combined.find((c) => c.district.toLowerCase() === h.district?.toLowerCase());
                if (existing) {
                    existing.sessions = Math.max(existing.sessions, h.count);
                    existing.users = Math.max(existing.users, h.count);
                } else if (h.district && h.district !== "Unknown") {
                    combined.push({
                        district: h.district,
                        users: h.count,
                        sessions: h.count,
                        avgSessionSeconds: 0,
                    });
                }
            });
        }

        // Sort descending by users / sessions
        combined.sort((a, b) => b.users - a.users || b.sessions - a.sessions);

        const maxVisits = Math.max(...combined.map((d) => d.users || d.sessions), 1);
        const totalVisits = combined.reduce((sum: number, d) => sum + (d.users || d.sessions), 0) || 1;

        return combined.map((d) => ({
            ...d,
            percentOfMax: Math.round(((d.users || d.sessions) / maxVisits) * 100),
            percentOfTotal: Math.round(((d.users || d.sessions) / totalVisits) * 100),
        }));
    }, [currentUsage?.districts, extendedStats?.geoHotspots, timeframe]);

    // Responsive KPI 4: Active Locations Count (Strictly real DB count)
    const activeLocationsCount = useMemo(() => {
        return districtData.length;
    }, [districtData.length]);

    const activeLocationsLabel = useMemo(() => {
        if (timeframe === "today") return "Districts active today";
        if (timeframe === "7d") return "Districts active this week";
        return "Districts active this month";
    }, [timeframe]);

    // Section title & description based on timeframe
    const sectionTitle = useMemo(() => {
        if (timeframe === "today") return "Today's Live Demand & Activity";
        if (timeframe === "7d") return "Past 7 Days Demand & Activity";
        return "Past 30 Days Demand & Activity";
    }, [timeframe]);

    const sectionDescription = useMemo(() => {
        if (timeframe === "today") return "Real-time customer traffic, peak ordering hours, and area demand from live database telemetry";
        if (timeframe === "7d") return "Weekly customer traffic trends, peak ordering hours, and regional distribution";
        return "Monthly aggregate traffic, peak ordering hours, and top district hotspots";
    }, [timeframe]);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
            {/* Header Control Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-500 flex items-center justify-center border border-indigo-500/30 shadow-xs">
                        <Activity className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                            {sectionTitle}
                            {timeframe === "today" ? (
                                isLive && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold border border-emerald-500/20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Live Telemetry
                                    </span>
                                )
                            ) : timeframe === "7d" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500 text-[10px] font-semibold border border-sky-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                    7-Day Window
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-semibold border border-indigo-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    30-Day Window
                                </span>
                            )}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {sectionDescription}
                        </p>
                    </div>
                </div>

                {/* Timeframe Filter Pill with Bangkok Time Indicator */}
                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-semibold border border-border/70 bg-card/80 text-muted-foreground shadow-2xs">
                        <Clock className="h-3 w-3 text-indigo-500" />
                        <span>Bangkok Time (ICT)</span>
                    </div>

                    <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/70 text-xs backdrop-blur-xs shadow-xs">
                        <button
                            type="button"
                            onClick={() => setTimeframe("today")}
                            className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                                timeframe === "today"
                                    ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={() => setTimeframe("7d")}
                            className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                                timeframe === "7d"
                                    ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            7 Days
                        </button>
                        <button
                            type="button"
                            onClick={() => setTimeframe("30d")}
                            className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                                timeframe === "30d"
                                    ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            30 Days
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-border/70 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/40 hover:shadow-xs group">
                    <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                        <span className="font-medium">Active Users</span>
                        <div className="h-6 w-6 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
                            <Users className="h-3.5 w-3.5" />
                        </div>
                    </div>
                    <div className="text-xl font-bold text-foreground">
                        {activeUsersCount.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                        {activeUsersLabel}
                    </span>
                </div>

                <div className="p-3.5 rounded-xl border border-border/70 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-pink-500/40 hover:shadow-xs group">
                    <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                        <span className="font-medium">Avg. Session Time</span>
                        <div className="h-6 w-6 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center">
                            <Clock className="h-3.5 w-3.5" />
                        </div>
                    </div>
                    <div className="text-xl font-bold text-foreground">
                        {formatStay(avgSessionSeconds)}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                        {avgSessionLabel}
                    </span>
                </div>

                <div className="p-3.5 rounded-xl border border-border/70 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-orange-500/40 hover:shadow-xs group">
                    <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                        <span className="font-medium">Peak Activity</span>
                        <div className="h-6 w-6 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                            <Flame className="h-3.5 w-3.5" />
                        </div>
                    </div>
                    <div className="text-xl font-bold text-foreground truncate">
                        {peakHourInfo ? formatHourShort(peakHourInfo.hour) : "—"}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                        {peakActivityText}
                    </span>
                </div>

                <div className="p-3.5 rounded-xl border border-border/70 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/40 hover:shadow-xs group">
                    <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                        <span className="font-medium">Active Locations</span>
                        <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <Compass className="h-3.5 w-3.5" />
                        </div>
                    </div>
                    <div className="text-xl font-bold text-foreground">
                        {activeLocationsCount}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                        {activeLocationsLabel}
                    </span>
                </div>
            </div>

            {/* Graphs Grid: 2 Balanced Columns (Orders Velocity Graph & Active User Distribution Pie Circle Chart) */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Graph 1: Orders Velocity & Fulfillment Trends: Today Hourly / Date Filter / Month Filter / Status Filter */}
                <OrdersVelocityGraphCard />

                {/* Graph 2: Active User Distribution (Pie Circle Chart with Today / Day / Month filters) */}
                <ActiveUserDistributionPieCard
                    districtData={districtData}
                    timeframe={timeframe}
                    totalVisitsCount={currentUsage?.users || districtData.reduce((s: number, r: DistrictDemandItem) => s + r.users, 0)}
                    highestDistrictName={districtData[0]?.district}
                />
            </div>
        </div>
    );
}
