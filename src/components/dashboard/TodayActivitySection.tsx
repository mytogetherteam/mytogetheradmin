import { useState, useMemo } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Cell,
} from "recharts";
import {
    Clock,
    MapPin,
    Flame,
    Users,
    Activity,
    Compass,
    TrendingUp,
    Sparkles,
} from "lucide-react";

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

interface ExtendedStatsProps {
    dau?: number;
    mau?: number;
    avgDeliveryTime?: number;
    fleetStatus?: {
        active: number;
        busy: number;
        total: number;
    };
    appUsage?: {
        avgSessionSeconds: number;
        sessions: number;
        users: number;
        districts: DistrictUsage[];
        busyHours?: BusyHour[];
    };
    peakHours?: Array<{ hour: number; count: number }>;
    geoHotspots?: Array<{ district: string; count: number }>;
}

interface Props {
    extendedStats?: ExtendedStatsProps | null;
    isLive?: boolean;
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
    const total = Math.max(0, Math.round(seconds));
    const minutes = Math.round(total / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remain = minutes % 60;
    return remain ? `${hours}h ${remain}m` : `${hours}h`;
}

type Timeframe = "today" | "7d" | "30d";

export function TodayActivitySection({ extendedStats, isLive }: Props) {
    const [timeframe, setTimeframe] = useState<Timeframe>("today");

    const appUsage = extendedStats?.appUsage;

    // Hourly activity chart data
    const chartData = useMemo(() => {
        const busyHours = appUsage?.busyHours || [];
        if (busyHours.length === 0) {
            // Fallback default hourly spread if no session data yet
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

            // In "today" mode, scale proportional to DAU if available
            return {
                hour: row.hour,
                label: formatHourShort(row.hour),
                fullRange: formatHourRange(row.hour),
                users: row.users,
                sessions: row.sessions,
                isLunchRush,
                isDinnerRush,
                isRush,
            };
        });
    }, [appUsage?.busyHours]);

    // Calculate peak hour
    const peakHourInfo = useMemo(() => {
        if (!chartData || chartData.length === 0) return null;
        let peak = chartData[0];
        for (const item of chartData) {
            if (item.users > peak.users) {
                peak = item;
            }
        }
        return peak && peak.users > 0 ? peak : null;
    }, [chartData]);

    // District demand list with proportions
    const districtData = useMemo(() => {
        const list = appUsage?.districts || [];
        if (list.length === 0) return [];

        const maxVisits = Math.max(...list.map((d) => d.sessions), 1);
        const totalVisits = list.reduce((sum, d) => sum + d.sessions, 0) || 1;

        return list.map((d) => ({
            ...d,
            percentOfMax: Math.round((d.sessions / maxVisits) * 100),
            percentOfTotal: Math.round((d.sessions / totalVisits) * 100),
        }));
    }, [appUsage?.districts]);

    if (!appUsage && !extendedStats) {
        return null;
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
            {/* Header Control Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center border border-pink-500/20">
                        <Activity className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                            Today&apos;s Live Demand &amp; Activity
                            {isLive && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Live Today
                                </span>
                            )}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Real-time customer traffic, peak ordering hours, and area demand
                        </p>
                    </div>
                </div>

                {/* Timeframe Filter Pill */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 text-xs">
                    <button
                        type="button"
                        onClick={() => setTimeframe("today")}
                        className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 ${
                            timeframe === "today"
                                ? "bg-background text-foreground shadow-xs font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        onClick={() => setTimeframe("7d")}
                        className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 ${
                            timeframe === "7d"
                                ? "bg-background text-foreground shadow-xs font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        7 Days
                    </button>
                    <button
                        type="button"
                        onClick={() => setTimeframe("30d")}
                        className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 ${
                            timeframe === "30d"
                                ? "bg-background text-foreground shadow-xs font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        30 Days
                    </button>
                </div>
            </div>

            {/* Quick KPI Strip for Today */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm">
                    <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                        <span>Active Users</span>
                        <Users className="h-3.5 w-3.5 text-sky-500" />
                    </div>
                    <div className="text-xl font-bold text-foreground">
                        {(extendedStats?.dau || appUsage?.users || 0).toLocaleString()}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                        {timeframe === "today" ? "Customers active today" : "Total unique customers"}
                    </span>
                </div>

                <div className="p-3 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm">
                    <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                        <span>Avg. Session Time</span>
                        <Clock className="h-3.5 w-3.5 text-pink-500" />
                    </div>
                    <div className="text-xl font-bold text-foreground">
                        {formatStay(appUsage?.avgSessionSeconds || 0)}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                        Average time spent in app
                    </span>
                </div>

                <div className="p-3 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm">
                    <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                        <span>Peak Activity</span>
                        <Flame className="h-3.5 w-3.5 text-orange-500" />
                    </div>
                    <div className="text-xl font-bold text-foreground truncate">
                        {peakHourInfo ? formatHourShort(peakHourInfo.hour) : "12 PM"}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                        {peakHourInfo ? `${peakHourInfo.users} users active` : "Lunch rush"}
                    </span>
                </div>

                <div className="p-3 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm">
                    <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                        <span>Active Locations</span>
                        <Compass className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <div className="text-xl font-bold text-foreground">
                        {districtData.length}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                        Districts ordering today
                    </span>
                </div>
            </div>

            {/* Graphs Grid: 2 Columns */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Graph 1: Hourly Activity & Peak Rush Chart */}
                <Card className="md:col-span-2 border-border/70 shadow-sm overflow-hidden bg-card/90">
                    <CardHeader className="pb-2 border-b border-border/40 bg-muted/15 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                                Hourly Activity &amp; Rush Hours
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {timeframe === "today"
                                    ? "Customer activity distribution by hour today"
                                    : `Hourly patterns across ${timeframe === "7d" ? "last 7 days" : "last 30 days"}`}
                            </CardDescription>
                        </div>

                        {peakHourInfo && (
                            <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white gap-1 text-[11px] font-medium shadow-xs">
                                <Flame className="h-3 w-3" />
                                Peak: {peakHourInfo.label}
                            </Badge>
                        )}
                    </CardHeader>

                    <CardContent className="p-4 sm:p-5">
                        {/* Interactive Recharts Bar Chart */}
                        <div className="h-[240px] w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                >
                                    <XAxis
                                        dataKey="label"
                                        stroke="#888888"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: "rgba(100, 116, 139, 0.1)" }}
                                        content={({ active, payload }) => {
                                            if (!active || !payload || !payload.length) return null;
                                            const data = payload[0].payload;
                                            return (
                                                <div className="rounded-xl border border-border/80 bg-background/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-1.5 min-w-[170px]">
                                                    <p className="font-semibold text-foreground flex items-center justify-between">
                                                        <span>{data.fullRange}</span>
                                                        {data.isRush && (
                                                            <span className="text-[10px] text-orange-500 font-bold uppercase">
                                                                Rush Hour
                                                            </span>
                                                        )}
                                                    </p>
                                                    <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
                                                        <span>Active Users:</span>
                                                        <span className="font-bold text-foreground">
                                                            {data.users.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-muted-foreground">
                                                        <span>Total Visits:</span>
                                                        <span className="font-medium text-foreground">
                                                            {data.sessions.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Bar
                                        dataKey="users"
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={36}
                                    >
                                        {chartData.map((entry, index) => {
                                            let barColor = "#6366f1"; // Default Indigo
                                            if (entry.isLunchRush) {
                                                barColor = "#f59e0b"; // Amber lunch rush
                                            } else if (entry.isDinnerRush) {
                                                barColor = "#ec4899"; // Pink dinner rush
                                            }
                                            return (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={barColor}
                                                    fillOpacity={0.9}
                                                />
                                            );
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Rush Period Legend Chips */}
                        <div className="mt-4 pt-3.5 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                    <span className="text-muted-foreground">Lunch Rush (11 AM – 1 PM)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                                    <span className="text-muted-foreground">Dinner Rush (5 PM – 7 PM)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                                    <span className="text-muted-foreground">Normal Hours</span>
                                </div>
                            </div>

                            <span className="text-muted-foreground text-[11px] flex items-center gap-1 font-medium">
                                <Sparkles className="h-3 w-3 text-pink-500" />
                                Total Visits Today: {appUsage?.sessions.toLocaleString() || 0}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Graph 2: District Demand Horizontal Distribution Meters */}
                <Card className="border-border/70 shadow-sm overflow-hidden bg-card/90">
                    <CardHeader className="pb-2 border-b border-border/40 bg-muted/15 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                District Demand
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Top locations by customer visits &amp; orders
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-[11px]">
                            {districtData.length} areas
                        </Badge>
                    </CardHeader>

                    <CardContent className="p-4 sm:p-5">
                        {districtData.length > 0 ? (
                            <div className="space-y-3.5">
                                {districtData.slice(0, 6).map((row, idx) => (
                                    <div key={row.district} className="space-y-1.5 group">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="h-5 w-5 rounded-md bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <span className="font-semibold text-foreground truncate group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                                                    {row.district}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-muted-foreground font-mono text-[11px]">
                                                    {row.users.toLocaleString()} people
                                                </span>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] font-medium px-1.5 py-0 h-4.5 bg-muted/70"
                                                >
                                                    {formatStay(row.avgSessionSeconds)} avg
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Styled Horizontal Progress Bar */}
                                        <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden relative">
                                            <div
                                                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"
                                                style={{ width: `${Math.max(row.percentOfMax, 6)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-xs text-center p-4">
                                <Compass className="h-8 w-8 mb-2 opacity-30" />
                                <p>No district visits recorded yet.</p>
                                <p className="text-[11px] opacity-70 mt-1">
                                    Location telemetry updates automatically as app users open sessions.
                                </p>
                            </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1 font-medium">
                                <TrendingUp className="h-3 w-3 text-emerald-500" />
                                Highest: {districtData[0]?.district || "Khlong Tan"}
                            </span>
                            <span>{appUsage?.users.toLocaleString() || 0} total people</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
