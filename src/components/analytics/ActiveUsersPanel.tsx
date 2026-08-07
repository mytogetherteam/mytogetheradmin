import { useMemo } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Users } from "lucide-react";

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
}: {
    label: string;
    value: number | string;
    hint?: string;
    loading?: boolean;
}) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                </div>
                {loading ? (
                    <Skeleton className="mt-2 h-8 w-16" />
                ) : (
                    <div className="mt-1 text-3xl font-semibold tabular-nums">{value}</div>
                )}
                {hint ? (
                    <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
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
    const registeredAdmins = summary?.registered.admins ?? 0;
    const todayAdmins = summary?.today.admins ?? 0;
    const sharePercent =
        registeredAdmins > 0 ? Math.round((todayAdmins / registeredAdmins) * 100) : null;

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
                        label="Admins today"
                        value={todayAdmins}
                        hint={
                            summary
                                ? `${summary.today.shopAdmin} shop · ${summary.today.operationAdmin} operation · ${summary.today.superAdmin} super${sharePercent !== null ? ` — ${sharePercent}% of ${registeredAdmins} accounts` : ""}`
                                : undefined
                        }
                        loading={summaryLoading}
                    />
                    <StatTile
                        label="Admins yesterday"
                        value={summary?.yesterday.admins ?? 0}
                        hint={
                            summary
                                ? `${summary.yesterday.shopAdmin} shop · ${summary.yesterday.operationAdmin} operation`
                                : undefined
                        }
                        loading={summaryLoading}
                    />
                    <StatTile
                        label="Admins, last 7 days"
                        value={summary?.last7Days.admins ?? 0}
                        hint="distinct people"
                        loading={summaryLoading}
                    />
                    <StatTile
                        label="Customers today"
                        value={summary?.today.customers ?? 0}
                        hint={
                            summary
                                ? `${summary.last30Days.customers} in the last 30 days`
                                : undefined
                        }
                        loading={summaryLoading}
                    />
                </div>

                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <CardTitle className="text-base">
                                Daily active admins by role
                            </CardTitle>
                            <CardDescription>
                                One person counts once per day, whatever they did.
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
                                <p>No activity recorded in this range yet.</p>
                                <p className="text-xs">
                                    Counting starts from the day this was switched on — history
                                    before that does not exist.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Legend first: identity must never rest on colour alone. */}
                                <div className="mb-3 flex flex-wrap items-center gap-4">
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
                                <ResponsiveContainer width="100%" height={280}>
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
                                                // A 2px gap in the surface colour keeps stacked
                                                // bands legible where they meet.
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

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Daily active customers</CardTitle>
                            <CardDescription>
                                Charted apart from admins — a shared axis would flatten one of them.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {seriesLoading ? (
                                <Skeleton className="h-[220px] w-full" />
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart
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
                                            content={<ChartTooltip />}
                                            cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="customers"
                                            stroke="var(--dau-customers)"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--dau-surface)" }}
                                            isAnimationActive={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                {isToday ? "Who was on today" : `Who was on ${shortDate(to)}`}
                                {day?.total ? (
                                    <Badge variant="secondary" className="ml-2">
                                        {day.total}
                                    </Badge>
                                ) : null}
                            </CardTitle>
                            <CardDescription>
                                Admins only, most recent first. Scroll for more.
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
