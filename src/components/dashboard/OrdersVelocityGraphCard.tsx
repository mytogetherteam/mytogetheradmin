import { useState, useEffect, useMemo, useCallback } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
    ShoppingBag,
    CheckCircle2,
    XCircle,
    Flame,
    RotateCcw,
    Sparkles,
    Calendar,
} from "lucide-react";
import { orderService, Order } from "@/services/orderService";

type StatusFilter = "ALL" | "DELIVERED" | "CANCELED";
type TimeMode = "TODAY" | "CUSTOM_DATE" | "MONTH";

interface ChartBarPoint {
    key: string;
    label: string;
    fullLabel: string;
    delivered: number;
    canceled: number;
    other: number;
    total: number;
    value: number; // The active metric value based on status filter
}

function getTodayString(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function getCurrentMonthString(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}

function getLocalDateString(isoString?: string | null): string {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function getLocalMonthString(isoString?: string | null): string {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}

function formatHourLabel(h: number): string {
    const hour = ((h % 24) + 24) % 24;
    const suffix = hour < 12 ? "AM" : "PM";
    const clock = hour % 12 === 0 ? 12 : hour % 12;
    return `${clock} ${suffix}`;
}

function isTestingOrder(ord: Order): boolean {
    const sName = (
        ord.shopName ||
        (ord as any).shop?.nameEn ||
        (ord as any).shop?.nameMm ||
        ""
    ).toLowerCase().replace(/\s+/g, "");
    return sName.includes("mytogethertesting") || sName.includes("testingshop");
}

export function OrdersVelocityGraphCard() {
    // Mode & Filters
    const [timeMode, setTimeMode] = useState<TimeMode>("TODAY");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

    // Dates in local timezone
    const todayStr = useMemo(() => getTodayString(), []);
    const currentMonthStr = useMemo(() => getCurrentMonthString(), []);
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);
    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

    // Orders state
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch orders with multi-page support to ensure all historical records are retrieved
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const [ordersRes, activeRes] = await Promise.all([
                orderService.getOrders({ size: 100 }).catch(() => null),
                orderService.getActiveOrders({ size: 100 }).catch(() => null),
            ]);

            let loaded: Order[] = [
                ...(ordersRes?.content || []),
                ...(activeRes?.content || []),
            ];

            // If there are more pages, fetch next 4 pages to cover up to 500 recent orders
            if (ordersRes && ordersRes.totalPages > 1) {
                const maxPagesToFetch = Math.min(ordersRes.totalPages, 5);
                const extraPromises = [];
                for (let p = 1; p < maxPagesToFetch; p++) {
                    extraPromises.push(
                        orderService.getOrders({ page: p, size: 100 }).catch(() => null)
                    );
                }
                const extraResults = await Promise.all(extraPromises);
                extraResults.forEach((res) => {
                    if (res?.content) {
                        loaded = loaded.concat(res.content);
                    }
                });
            }

            // Deduplicate and filter out test shop orders
            const seen = new Set<string | number>();
            const unique = loaded.filter((ord) => {
                if (!ord.id || seen.has(ord.id)) return false;
                seen.add(ord.id);
                return !isTestingOrder(ord);
            });

            setOrders(unique);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // ── Strictly Filter Orders by Active Timeframe ──────────────────────────────
    const relevantOrders = useMemo(() => {
        const targetDay = timeMode === "TODAY" ? todayStr : selectedDate || todayStr;
        const targetMonth = selectedMonth || currentMonthStr;

        return orders.filter((ord) => {
            if (!ord.createdAt) return false;
            if (timeMode === "TODAY" || timeMode === "CUSTOM_DATE") {
                return getLocalDateString(ord.createdAt) === targetDay;
            }
            if (timeMode === "MONTH") {
                return getLocalMonthString(ord.createdAt) === targetMonth;
            }
            return false;
        });
    }, [orders, timeMode, todayStr, selectedDate, selectedMonth, currentMonthStr]);

    // ── Build Chart Dataset & Metrics Strictly from Relevant Orders ────────────
    const { chartData, totals, peakInfo } = useMemo(() => {
        let totalCount = 0;
        let deliveredCount = 0;
        let canceledCount = 0;
        let otherCount = 0;

        for (const ord of relevantOrders) {
            totalCount += 1;
            const st = String(ord.status || "").toUpperCase();
            if (st === "DELIVERED" || st === "PICKED_UP") {
                deliveredCount += 1;
            } else if (st === "CANCELED" || st === "CANCELLED") {
                canceledCount += 1;
            } else {
                otherCount += 1;
            }
        }

        let points: ChartBarPoint[] = [];

        if (timeMode === "MONTH") {
            const [yStr, mStr] = (selectedMonth || currentMonthStr).split("-");
            const y = parseInt(yStr, 10);
            const m = parseInt(mStr, 10);
            const daysInMonth = new Date(y, m, 0).getDate();

            const dayBuckets: Record<
                number,
                { delivered: number; canceled: number; other: number; total: number }
            > = {};
            for (let d = 1; d <= daysInMonth; d++) {
                dayBuckets[d] = { delivered: 0, canceled: 0, other: 0, total: 0 };
            }

            for (const ord of relevantOrders) {
                if (!ord.createdAt) continue;
                const dObj = new Date(ord.createdAt);
                if (isNaN(dObj.getTime())) continue;
                const dayNum = dObj.getDate();
                if (dayBuckets[dayNum]) {
                    const st = String(ord.status || "").toUpperCase();
                    dayBuckets[dayNum].total += 1;
                    if (st === "DELIVERED" || st === "PICKED_UP") {
                        dayBuckets[dayNum].delivered += 1;
                    } else if (st === "CANCELED" || st === "CANCELLED") {
                        dayBuckets[dayNum].canceled += 1;
                    } else {
                        dayBuckets[dayNum].other += 1;
                    }
                }
            }

            points = Object.keys(dayBuckets).map((k) => {
                const day = parseInt(k, 10);
                const b = dayBuckets[day];
                let val = b.total;
                if (statusFilter === "DELIVERED") val = b.delivered;
                if (statusFilter === "CANCELED") val = b.canceled;

                return {
                    key: `day-${day}`,
                    label: `${day}`,
                    fullLabel: `${selectedMonth || currentMonthStr}-${String(day).padStart(2, "0")}`,
                    delivered: b.delivered,
                    canceled: b.canceled,
                    other: b.other,
                    total: b.total,
                    value: val,
                };
            });
        } else {
            // Group by operating hours (8 AM to 11 PM)
            const hoursToShow = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
            const hourBuckets: Record<
                number,
                { delivered: number; canceled: number; other: number; total: number }
            > = {};

            for (const h of hoursToShow) {
                hourBuckets[h] = { delivered: 0, canceled: 0, other: 0, total: 0 };
            }

            for (const ord of relevantOrders) {
                if (!ord.createdAt) continue;
                const dObj = new Date(ord.createdAt);
                if (isNaN(dObj.getTime())) continue;
                const h = dObj.getHours();
                if (hourBuckets[h]) {
                    const st = String(ord.status || "").toUpperCase();
                    hourBuckets[h].total += 1;
                    if (st === "DELIVERED" || st === "PICKED_UP") {
                        hourBuckets[h].delivered += 1;
                    } else if (st === "CANCELED" || st === "CANCELLED") {
                        hourBuckets[h].canceled += 1;
                    } else {
                        hourBuckets[h].other += 1;
                    }
                }
            }

            const dateLabel = timeMode === "TODAY" ? "Today" : selectedDate || todayStr;

            points = hoursToShow.map((h) => {
                const b = hourBuckets[h];
                let val = b.total;
                if (statusFilter === "DELIVERED") val = b.delivered;
                if (statusFilter === "CANCELED") val = b.canceled;

                return {
                    key: `hour-${h}`,
                    label: formatHourLabel(h),
                    fullLabel: `${dateLabel} ${formatHourLabel(h)}`,
                    delivered: b.delivered,
                    canceled: b.canceled,
                    other: b.other,
                    total: b.total,
                    value: val,
                };
            });
        }

        // Determine peak strictly from active points with > 0 orders
        let peak: ChartBarPoint | null = null;
        for (const pt of points) {
            if (pt.value > 0 && (!peak || pt.value > peak.value)) {
                peak = pt;
            }
        }

        return {
            chartData: points,
            totals: {
                total: totalCount,
                delivered: deliveredCount,
                canceled: canceledCount,
                other: otherCount,
                deliveredPercent:
                    totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 0,
                canceledPercent:
                    totalCount > 0 ? Math.round((canceledCount / totalCount) * 100) : 0,
            },
            peakInfo: peak && peak.value > 0 ? peak : null,
        };
    }, [relevantOrders, timeMode, selectedMonth, currentMonthStr, selectedDate, todayStr, statusFilter]);

    // Bar fill color according to status filter
    const getBarColor = (entry: ChartBarPoint) => {
        if (statusFilter === "DELIVERED") return "#10b981"; // Emerald
        if (statusFilter === "CANCELED") return "#f43f5e"; // Rose
        if (entry.delivered > 0 && entry.canceled === 0) return "#10b981";
        if (entry.canceled > 0 && entry.delivered === 0) return "#f43f5e";
        return "#6366f1"; // Indigo default for total orders
    };

    const periodDescription = useMemo(() => {
        if (timeMode === "TODAY") return "Hourly order dispatch distribution for today";
        if (timeMode === "CUSTOM_DATE") return `Hourly order dispatch distribution for ${selectedDate}`;
        return `Daily order trajectory across ${selectedMonth}`;
    }, [timeMode, selectedDate, selectedMonth]);

    return (
        <Card className="border-border/70 shadow-sm overflow-hidden bg-card/90 flex flex-col justify-between h-full">
            {/* ── Card Header ─────────────────────────────────────────────── */}
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/15 flex flex-col gap-3 space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                <ShoppingBag className="h-4 w-4" />
                            </span>
                            Order Velocity &amp; Fulfillment Trends
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {periodDescription}
                        </CardDescription>
                    </div>

                    {/* Peak Badge */}
                    {peakInfo ? (
                        <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white gap-1 text-[11px] font-medium shadow-xs self-start sm:self-auto">
                            <Flame className="h-3 w-3" />
                            Peak: {peakInfo.label} ({peakInfo.value} orders)
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground self-start sm:self-auto font-mono">
                            {totals.total === 0 ? "0 orders in period" : "Even distribution"}
                        </Badge>
                    )}
                </div>

                {/* ── Controls Strip: Status Filter, Time Mode & Date/Month Pickers ── */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                    {/* Status Filter Pills: ALL | DELIVERED | CANCELED */}
                    <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 text-xs">
                        <button
                            type="button"
                            onClick={() => setStatusFilter("ALL")}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-all duration-200 cursor-pointer ${
                                statusFilter === "ALL"
                                    ? "bg-background text-foreground shadow-xs font-bold"
                                    : "text-muted-foreground hover:text-foreground font-medium"
                            }`}
                        >
                            <ShoppingBag className="h-3 w-3" />
                            <span>All Orders</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("DELIVERED")}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-all duration-200 cursor-pointer ${
                                statusFilter === "DELIVERED"
                                    ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-xs font-bold"
                                    : "text-muted-foreground hover:text-emerald-500 font-medium"
                            }`}
                        >
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            <span>Delivered</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("CANCELED")}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-all duration-200 cursor-pointer ${
                                statusFilter === "CANCELED"
                                    ? "bg-background text-rose-600 dark:text-rose-400 shadow-xs font-bold"
                                    : "text-muted-foreground hover:text-rose-500 font-medium"
                            }`}
                        >
                            <XCircle className="h-3 w-3 text-rose-500" />
                            <span>Canceled</span>
                        </button>
                    </div>

                    {/* Time Mode & Date/Month Filter Controls */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Preset Buttons */}
                        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/50 text-xs">
                            <button
                                type="button"
                                onClick={() => {
                                    setTimeMode("TODAY");
                                    setSelectedDate(todayStr);
                                }}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                                    timeMode === "TODAY"
                                        ? "bg-orange-500 text-white font-bold shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={() => setTimeMode("CUSTOM_DATE")}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                                    timeMode === "CUSTOM_DATE"
                                        ? "bg-orange-500 text-white font-bold shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Date Filter
                            </button>
                            <button
                                type="button"
                                onClick={() => setTimeMode("MONTH")}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                                    timeMode === "MONTH"
                                        ? "bg-orange-500 text-white font-bold shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Month Filter
                            </button>
                        </div>

                        {/* Interactive Picker Inputs */}
                        {timeMode === "CUSTOM_DATE" && (
                            <div className="flex items-center gap-1">
                                <Input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="h-7 text-xs w-34 px-1.5 bg-background border-border/70"
                                />
                                {selectedDate !== todayStr && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedDate(todayStr)}
                                        className="h-7 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                                        title="Reset to Today"
                                    >
                                        <RotateCcw className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        )}

                        {timeMode === "MONTH" && (
                            <div className="flex items-center gap-1">
                                <Input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="h-7 text-xs w-32 px-1.5 bg-background border-border/70"
                                />
                                {selectedMonth !== currentMonthStr && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedMonth(currentMonthStr)}
                                        className="h-7 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                                        title="Reset to Current Month"
                                    >
                                        <RotateCcw className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>

            {/* ── Card Content: Interactive Order Volume Chart ─────────────── */}
            <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                {/* Metric Summary Counters Strictly for Filtered Orders */}
                <div className="grid grid-cols-3 gap-2.5 mb-3">
                    <div className="p-2.5 rounded-xl border border-border/50 bg-background/60">
                        <span className="text-[10px] text-muted-foreground block font-medium">
                            Total Orders
                        </span>
                        <span className="text-base font-bold font-mono text-foreground">
                            {totals.total.toLocaleString()}
                        </span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                Delivered
                            </span>
                            <span className="text-[10px] font-mono text-emerald-600 font-bold">
                                {totals.deliveredPercent}%
                            </span>
                        </div>
                        <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {totals.delivered.toLocaleString()}
                        </span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5">
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-rose-600 dark:text-rose-400 font-medium">
                                Canceled
                            </span>
                            <span className="text-[10px] font-mono text-rose-600 font-bold">
                                {totals.canceledPercent}%
                            </span>
                        </div>
                        <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">
                            {totals.canceled.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Recharts Bar Chart */}
                <div className="h-[210px] w-full pt-1 relative">
                    {loading ? (
                        <div className="h-full flex items-center justify-center space-x-2">
                            <Skeleton className="h-full w-full rounded-xl" />
                        </div>
                    ) : (
                        <>
                            {totals.total === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                                    <div className="px-3 py-1.5 rounded-lg bg-background/90 border border-border/70 backdrop-blur-xs text-xs text-muted-foreground font-medium flex items-center gap-1.5 shadow-xs">
                                        <Calendar className="h-3.5 w-3.5 text-orange-500" />
                                        <span>No orders recorded for this {timeMode === "MONTH" ? "month" : "day"}</span>
                                    </div>
                                </div>
                            )}
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
                                >
                                    <XAxis
                                        dataKey="label"
                                        stroke="#888888"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={timeMode === "MONTH" ? 2 : 1}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: "rgba(100, 116, 139, 0.1)" }}
                                        content={({ active, payload }) => {
                                            if (!active || !payload || !payload.length) return null;
                                            const d = payload[0].payload as ChartBarPoint;
                                            return (
                                                <div className="rounded-xl border border-border/80 bg-background/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-1.5 min-w-[170px]">
                                                    <p className="font-semibold text-foreground flex items-center justify-between">
                                                        <span>{d.fullLabel}</span>
                                                        <span className="text-[10px] text-orange-500 font-mono font-bold">
                                                            {d.total} Orders
                                                        </span>
                                                    </p>
                                                    <div className="pt-1 border-t border-border/40 space-y-1 text-[11px]">
                                                        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                                                            <span className="flex items-center gap-1">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                Delivered:
                                                            </span>
                                                            <span className="font-mono font-bold">
                                                                {d.delivered}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-medium">
                                                            <span className="flex items-center gap-1">
                                                                <XCircle className="h-3 w-3" />
                                                                Canceled:
                                                            </span>
                                                            <span className="font-mono font-bold">
                                                                {d.canceled}
                                                            </span>
                                                        </div>
                                                        {d.other > 0 && (
                                                            <div className="flex items-center justify-between text-muted-foreground">
                                                                <span>In Flight / Cooking:</span>
                                                                <span className="font-mono font-bold text-foreground">
                                                                    {d.other}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Bar
                                        dataKey="value"
                                        radius={[5, 5, 0, 0]}
                                        maxBarSize={timeMode === "MONTH" ? 18 : 28}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={getBarColor(entry)}
                                                fillOpacity={entry.value > 0 ? 0.9 : 0.15}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </>
                    )}
                </div>

                {/* Footer Legend & Indicator */}
                <div className="mt-3 pt-2.5 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3 text-[11px]">
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            <span className="text-muted-foreground">Delivered</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                            <span className="text-muted-foreground">Canceled</span>
                        </div>
                        {statusFilter === "ALL" && (
                            <div className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                                <span className="text-muted-foreground">All Orders</span>
                            </div>
                        )}
                    </div>

                    <span className="text-muted-foreground text-[11px] flex items-center gap-1 font-medium">
                        <Sparkles className="h-3 w-3 text-orange-500" />
                        Reflects verified orders from PostgreSQL database
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
