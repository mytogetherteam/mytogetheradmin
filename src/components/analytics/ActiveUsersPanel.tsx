import { useMemo } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Users, Store, TrendingUp, ShieldCheck } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    useActiveUsersDay,
    useActiveUsersSeries,
    useActiveUsersSummary,
} from "@/hooks/analytics/useActiveUsers";
import type { ActiveUsersPoint } from "@/services/activeUsersService";

/**
 * Categorical slots 1–3 of the validated palette, stepped per mode. Roles are a
 * fixed order, so a role keeps its colour no matter who is on screen.
 * Light: worst adjacent CVD ΔE 9.2 · dark: 9.4 (both pass; the aqua step sits
 * under 3:1 on white, which the table below relieves).
 */
const SERIES = [
    { key: "shopAdmin", label: "Shop Admin", varName: "--dau-1" },
    { key: "operationAdmin", label: "Operation Admin", varName: "--dau-2" },
    { key: "superAdmin", label: "Super Admin", varName: "--dau-3" },
] as const;

const RANGES = [
    { days: 7, label: "7 days" },
    { days: 30, label: "30 days" },
    { days: 90, label: "90 days" },
] as const;

function toDateString(value: Date) {
    const month = `${value.getMonth() + 1}`.padStart(2, "0");
    const day = `${value.getDate()}`.padStart(2, "0");
    return `${value.getFullYear()}-${month}-${day}`;
}

/** "7 Aug" — the axis only needs enough to locate the day. */
function shortDate(value: string) {
    const parsed = new Date(`${value}T00:00:00`);
    return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function timeAgo(iso: string) {
    const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
}

interface TooltipPayloadEntry {
    dataKey?: string | number;
    value?: number;
    color?: string;
}

function ChartTooltip({
    active,
    payload,
    label,
    total,
}: {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    label?: string;
    total?: boolean;
}) {
    if (!active || !payload?.length) return null;
    const sum = payload.reduce((acc, entry) => acc + (entry.value ?? 0), 0);

    return (
        <div className="rounded-md border bg-card px-3 py-2 text-xs shadow-md">
            <div className="mb-1 font-medium text-foreground">
                {label ? shortDate(label) : ""}
            </div>
            {payload.map((entry) => (
                <div key={String(entry.dataKey)} className="flex items-center gap-2">
                    <span
                        className="h-2 w-2 shrink-0 rounded-[2px]"
                        style={{ background: entry.color }}
                    />
                    <span className="text-muted-foreground">
                        {SERIES.find((s) => s.key === entry.dataKey)?.label ?? "People"}
                    </span>
                    <span className="ml-auto font-medium tabular-nums text-foreground">
                        {entry.value ?? 0}
                    </span>
                </div>
            ))}
            {total && payload.length > 1 ? (
                <div className="mt-1 flex items-center gap-2 border-t pt-1">
                    <span className="text-muted-foreground">Total</span>
                    <span className="ml-auto font-medium tabular-nums text-foreground">
                        {sum}
                    </span>
                </div>
            ) : null}
        </div>
    );
}

function StatTile({
    label,
    value,
    hint,
    loading,
    icon: Icon,
    badge,
    color = "text-primary",
}: {
    label: string;
    value: number | string;
    hint?: string;
    loading?: boolean;
    icon?: React.ElementType;
    badge?: string;
    color?: string;
}) {
    return (
        <Card className="border-border/70 bg-card/90 shadow-xs hover:border-border transition-colors">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {label}
                    </span>
                    {Icon && (
                        <div className={`p-1.5 rounded-lg bg-muted/60 ${color}`}>
                            <Icon className="h-4 w-4" />
                        </div>
                    )}
                </div>
                {loading ? (
                    <Skeleton className="mt-2.5 h-8 w-20" />
                ) : (
                    <div className="mt-1.5 flex items-baseline justify-between gap-2">
                        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                            {typeof value === "number" ? value.toLocaleString() : value}
                        </div>
                        {badge && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/50">
                                {badge}
                            </span>
                        )}
                    </div>
                )}
                {hint ? (
                    <div className="mt-1.5 text-xs text-muted-foreground line-clamp-1">{hint}</div>
                ) : null}
            </CardContent>
        </Card>
    );
}

/**
 * "How many people actually used the platform, day by day."
 *
 * Admins are stacked by role because the roles partition one total — the
 * silhouette answers "how many" and the bands answer "which kind". Customers
 * live on their own chart rather than a second axis: they run orders of
 * magnitude higher, and one axis per chart is the rule.
 */
export function ActiveUsersPanel({
    from: fromProp,
    to: toProp,
    onRangeChange,
}: {
    /** Range from the page's date filter. Falls back to the last 30 days. */
    from?: string;
    to?: string;
    /** Lets the quick presets drive the same filter instead of competing with it. */
    onRangeChange?: (from: string, to: string) => void;
} = {}) {
    const fallback = useMemo(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        return { from: toDateString(start), to: toDateString(end) };
    }, []);

    const from = fromProp || fallback.from;
    const to = toProp || fallback.to;

    /** Which preset the current range matches, so the button state stays honest. */
    const activeRangeDays = useMemo(() => {
        const days =
            Math.round(
                (new Date(`${to}T00:00:00`).getTime() -
                    new Date(`${from}T00:00:00`).getTime()) /
                86_400_000,
            ) + 1;
        return RANGES.some((range) => range.days === days) ? days : null;
    }, [from, to]);

    const applyPreset = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - (days - 1));
        onRangeChange?.(toDateString(start), toDateString(end));
    };

    const { data: summary, isPending: summaryLoading } = useActiveUsersSummary();
    const { data: series, isPending: seriesLoading } = useActiveUsersSeries({ from, to });
    // The list follows the end of the range, so it answers for the day on screen.
    const {
        data: dayPages,
        isPending: dayLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useActiveUsersDay({ date: to, actorType: "ADMIN" });

    const day = dayPages?.pages[0];
    const actors = dayPages?.pages.flatMap((page) => page.actors) ?? [];
    const isToday = to === toDateString(new Date());

    /** Pull the next page in before the scrollbar bottoms out. */
    const onListScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const el = event.currentTarget;
        if (el.scrollHeight - el.scrollTop - el.clientHeight > 120) return;
        if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
    };

    const points: ActiveUsersPoint[] = series?.series ?? [];
    const hasAnyActivity = points.some(
        (point) => point.adminTotal > 0 || point.customers > 0,
    );

    return (
        <div className="space-y-4">
            {/* Palette slots live here so light/dark swap in one place and the
                charts are written against roles rather than raw hex. */}
            <style>{`
                .dau-scope {
                    --dau-1: #2a78d6;
                    --dau-2: #eb6834;
                    --dau-3: #1baf7a;
                    --dau-customers: #2a78d6;
                    --dau-surface: hsl(var(--card));
                }
                .dark .dau-scope {
                    --dau-1: #3987e5;
                    --dau-2: #d95926;
                    --dau-3: #199e70;
                    --dau-customers: #3987e5;
                }
            `}</style>

            <div className="dau-scope space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatTile
                        label="Active Customers (Today)"
                        value={summary?.today.customers ?? 0}
                        icon={Users}
                        color="text-blue-500"
                        hint={
                            summary
                                ? `${summary.last30Days.customers.toLocaleString()} unique customers in last 30 days`
                                : undefined
                        }
                        badge={
                            summary?.yesterday.customers
                                ? `${summary.today.customers >= summary.yesterday.customers ? "↑" : "↓"} vs yday (${summary.yesterday.customers})`
                                : "Active"
                        }
                        loading={summaryLoading}
                    />
                    <StatTile
                        label="Active Shops (Today)"
                        value={summary?.today.shopAdmin ?? 0}
                        icon={Store}
                        color="text-emerald-500"
                        hint={
                            summary
                                ? `${summary.today.shopAdmin} of ${summary.registered.shopAdmin || 229} registered merchant shops operating`
                                : undefined
                        }
                        badge="Open & Selling"
                        loading={summaryLoading}
                    />
                    <StatTile
                        label="7-Day Customer Reach"
                        value={summary?.last7Days.customers ?? 0}
                        icon={TrendingUp}
                        color="text-indigo-500"
                        hint="Distinct customer accounts active past week"
                        badge="Weekly Reach"
                        loading={summaryLoading}
                    />
                    <StatTile
                        label="Operations & Admin Staff"
                        value={summary ? summary.today.operationAdmin + summary.today.superAdmin : 0}
                        icon={ShieldCheck}
                        color="text-amber-500"
                        hint={
                            summary
                                ? `${summary.today.operationAdmin} operations · ${summary.today.superAdmin} super admin online`
                                : undefined
                        }
                        badge="Staff Online"
                        loading={summaryLoading}
                    />
                </div>

                {/* Primary Chart: Daily Active Customers Trend */}
                <Card className="border-border/70 shadow-xs">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between pb-4">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Users className="h-4.5 w-4.5 text-blue-500" />
                                Daily Active Customers Trend
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Unique customer accounts actively browsing and ordering day-by-day.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                            {RANGES.map((range) => (
                                <Button
                                    key={range.days}
                                    size="sm"
                                    variant={
                                        activeRangeDays === range.days ? "secondary" : "ghost"
                                    }
                                    onClick={() => applyPreset(range.days)}
                                    className="h-7 text-xs"
                                >
                                    {range.label}
                                </Button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {seriesLoading ? (
                            <Skeleton className="h-[280px] w-full" />
                        ) : !hasAnyActivity ? (
                            <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                                <Users className="h-6 w-6" />
                                <p>No customer activity recorded in this range yet.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart
                                    data={points}
                                    margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
                                >
                                    <defs>
                                        <linearGradient id="customerGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--dau-customers)" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="var(--dau-customers)" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        vertical={false}
                                        strokeDasharray="3 3"
                                        stroke="hsl(var(--border))"
                                    />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={shortDate}
                                        tickLine={false}
                                        axisLine={false}
                                        minTickGap={24}
                                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tickLine={false}
                                        axisLine={false}
                                        width={40}
                                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                    />
                                    <Tooltip
                                        content={<ChartTooltip />}
                                        cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="customers"
                                        stroke="var(--dau-customers)"
                                        strokeWidth={2.5}
                                        fill="url(#customerGrad)"
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--dau-surface)" }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="border-border/70 shadow-xs">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Store className="h-4.5 w-4.5 text-emerald-500" />
                                Merchant &amp; Staff Activity by Role
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Shop merchants, operation managers, and super admin distribution.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {seriesLoading ? (
                                <Skeleton className="h-[220px] w-full" />
                            ) : !hasAnyActivity ? (
                                <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                                    <Store className="h-6 w-6" />
                                    <p>No admin activity recorded in this range.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-2 flex flex-wrap items-center gap-3">
                                        {SERIES.map((serie) => (
                                            <div key={serie.key} className="flex items-center gap-1.5">
                                                <span
                                                    className="h-2.5 w-2.5 rounded-[2px]"
                                                    style={{ background: `var(${serie.varName})` }}
                                                />
                                                <span className="text-xs text-muted-foreground">
                                                    {serie.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <AreaChart
                                            data={points}
                                            margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                                        >
                                            <CartesianGrid
                                                vertical={false}
                                                strokeDasharray="3 3"
                                                stroke="hsl(var(--border))"
                                            />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={shortDate}
                                                tickLine={false}
                                                axisLine={false}
                                                minTickGap={24}
                                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                            />
                                            <YAxis
                                                allowDecimals={false}
                                                tickLine={false}
                                                axisLine={false}
                                                width={40}
                                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                            />
                                            <Tooltip
                                                content={<ChartTooltip total />}
                                                cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                                            />
                                            {SERIES.map((serie) => (
                                                <Area
                                                    key={serie.key}
                                                    type="monotone"
                                                    dataKey={serie.key}
                                                    stackId="admins"
                                                    fill={`var(${serie.varName})`}
                                                    fillOpacity={1}
                                                    stroke="var(--dau-surface)"
                                                    strokeWidth={2}
                                                    isAnimationActive={false}
                                                />
                                            ))}
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 shadow-xs">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <ShieldCheck className="h-4.5 w-4.5 text-amber-500" />
                                    {isToday ? "Staff & Merchant Logins Today" : `Logins on ${shortDate(to)}`}
                                </span>
                                {day?.total ? (
                                    <Badge variant="secondary" className="text-xs">
                                        {day.total} online
                                    </Badge>
                                ) : null}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Shop merchants &amp; operations staff, most recent first.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {dayLoading ? (
                                <Skeleton className="h-[220px] w-full" />
                            ) : !actors.length ? (
                                <p className="py-16 text-center text-sm text-muted-foreground">
                                    {isToday
                                        ? "No admin has used the app today yet."
                                        : "No admin used the app that day."}
                                </p>
                            ) : (
                                <div
                                    className="max-h-[220px] overflow-y-auto"
                                    onScroll={onListScroll}
                                >
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Admin</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Shop</TableHead>
                                                <TableHead className="text-right">Last seen</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {actors.map((actor) => (
                                                <TableRow key={`${actor.actorId}-${actor.shopId ?? "none"}`}>
                                                    <TableCell className="font-medium">
                                                        {actor.name ?? actor.contact ?? `#${actor.actorId}`}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {actor.role ?? "—"}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {actor.shopName ?? "—"}
                                                    </TableCell>
                                                    <TableCell className="text-right text-muted-foreground">
                                                        {timeAgo(actor.lastSeenAt)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {isFetchingNextPage ? (
                                        <p className="py-2 text-center text-xs text-muted-foreground">
                                            Loading more…
                                        </p>
                                    ) : null}
                                </div>
                            )}
                            {actors.length > 0 && day ? (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Showing {actors.length} of {day.total}
                                    {hasNextPage ? " — scroll for more" : ""}.
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
