import { useEffect, useState, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import {
    analyticsService,
    RevenueData,
    LocationData,
    PopularShop,
    CancellationRateData,
    OrderValueTotals,
} from "@/services/analyticsService";
import { ApiError } from "@/services/apiClient";
import { bangkokPreset, BangkokPreset, lastBangkokDays } from "@/utils/bangkokTime";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BarChart2, MapPin, TrendingUp, UserCheck, Store } from "lucide-react";
import { ShopService, Shop } from "@/services/shopService";
import { ActiveUsersPanel } from "@/components/analytics/ActiveUsersPanel";

const PRESETS: Array<{ id: BangkokPreset; label: string }> = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "week", label: "This week" },
    { id: "month", label: "This month" },
];

const CANCEL_COLORS: Record<string, string> = {
    USER: "#f59e0b",
    SHOP: "#6366f1",
    ADMIN: "#ec4899",
    SYSTEM: "#14b8a6",
    UNSPECIFIED: "#94a3b8",
};

function LoadingSkeleton() {
    return <Skeleton className="w-full h-[300px]" />;
}

function ChartMessage({ label, failed = false }: { label: string; failed?: boolean }) {
    return (
        <div className={`flex h-[260px] items-center justify-center px-6 text-center text-sm ${failed ? "text-destructive" : "text-muted-foreground"}`}>
            {label}
        </div>
    );
}

function loadError(error: unknown) {
    if (error instanceof ApiError && error.message) return error.message;
    if (error instanceof Error && error.message) return error.message;
    return "Could not load this data.";
}

async function readRequest<T>(request: Promise<T>) {
    try {
        return { value: await request, error: null as string | null };
    } catch (error) {
        return { value: null as T | null, error: loadError(error) };
    }
}

function formatDayLabel(value: string, withYear: boolean) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) return value;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.toLocaleDateString("en-US", withYear
        ? { month: "short", day: "numeric", year: "numeric" }
        : { month: "short", day: "numeric" });
}

function formatBaht(value: number) {
    return `฿${Math.round(value).toLocaleString()}`;
}

function shopLabel(shop: Shop) {
    return shop.nameEn || shop.name || `Restaurant ${shop.id}`;
}

function isTestingRestaurant(shop: Shop) {
    const compact = [shop.nameEn, shop.name, shop.nameMm].filter(Boolean).join(" ").toLowerCase().replace(/\s/g, "");
    return compact.includes("mytogethertesting") || compact.includes("testingshop");
}

function rangeProblem(start: string, end: string) {
    if (!start || !end) return "Choose a from and to date.";
    if (start > end) return "From must be on or before To.";
    const days = Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1;
    if (days > 366) return "Date range cannot exceed 366 days.";
    return null;
}

export default function AnalyticalDashboard() {
    const defaults = lastBangkokDays(30);
    const [startDate, setStartDate] = useState(defaults.start);
    const [endDate, setEndDate] = useState(defaults.end);
    const [activeTab, setActiveTab] = useState("active");

    const [revenue, setRevenue] = useState<RevenueData[]>([]);
    const [orderTotals, setOrderTotals] = useState<OrderValueTotals | null>(null);
    const [locations, setLocations] = useState<LocationData[]>([]);
    const [popularShops, setPopularShops] = useState<PopularShop[]>([]);
    const [cancellationRate, setCancellationRate] = useState<CancellationRateData | null>(null);
    const [shopQuery, setShopQuery] = useState("");
    const [shopOptions, setShopOptions] = useState<Shop[]>([]);
    const [selectedShopId, setSelectedShopId] = useState("");
    const [selectedShopName, setSelectedShopName] = useState("");
    const [shopRevenue, setShopRevenue] = useState<RevenueData[]>([]);
    const [shopOrders, setShopOrders] = useState<RevenueData[]>([]);
    const [loading, setLoading] = useState(true);
    const [shopLoading, setShopLoading] = useState(false);
    const [shopSearching, setShopSearching] = useState(false);
    const [loadErrors, setLoadErrors] = useState<Record<string, string>>({});
    const [shopError, setShopError] = useState<string | null>(null);
    const loadGeneration = useRef(0);
    const shopGeneration = useRef(0);
    const searchGeneration = useRef(0);

    const rememberErrors = useCallback((keys: string[], found: Record<string, string | null>) => {
        setLoadErrors((current) => {
            const next = { ...current };
            for (const key of keys) {
                if (found[key]) next[key] = found[key] as string;
                else delete next[key];
            }
            return next;
        });
    }, []);

    const dateProblem = rangeProblem(startDate, endDate);

    const loadTab = useCallback(async (tab: string) => {
        if (rangeProblem(startDate, endDate)) {
            loadGeneration.current += 1;
            setLoading(false);
            return;
        }
        const generation = ++loadGeneration.current;
        setLoading(true);
        const current = () => loadGeneration.current === generation;
        try {
            if (tab === "orders") {
                const [rev, cancel] = await Promise.all([
                    readRequest(analyticsService.getRevenueAnalytics(startDate, endDate)),
                    readRequest(analyticsService.getCancellationRate(startDate, endDate)),
                ]);
                if (!current()) return;
                setRevenue(rev.value?.series || []);
                setOrderTotals(rev.value?.totals || null);
                setCancellationRate(cancel.value);
                rememberErrors(["orders", "cancellations"], { orders: rev.error, cancellations: cancel.error });
            } else if (tab === "restaurants") {
                const popular = await readRequest(analyticsService.getPopularShops(startDate, endDate));
                if (!current()) return;
                setPopularShops(Array.isArray(popular.value) ? popular.value : []);
                rememberErrors(["popular"], { popular: popular.error });
            } else if (tab === "locations") {
                const locs = await readRequest(analyticsService.getActiveUserLocations({
                    start: startDate,
                    end: endDate,
                }));
                if (!current()) return;
                const districts = locs.value?.districts || [];
                setLocations(districts.map((district) => ({
                    district: district.district,
                    activityCount: district.users,
                })));
                rememberErrors(["locations"], { locations: locs.error });
            }
        } finally {
            if (current()) setLoading(false);
        }
    }, [startDate, endDate, rememberErrors]);

    useEffect(() => {
        loadTab(activeTab);
    }, [activeTab, loadTab]);

    useEffect(() => {
        if (activeTab !== "restaurants") return;
        const generation = ++searchGeneration.current;
        const handle = window.setTimeout(() => {
            setShopSearching(true);
            ShopService.getAllShops(0, 30, shopQuery)
                .then((page) => {
                    if (searchGeneration.current !== generation) return;
                    setShopOptions((page.content || []).filter((shop) => !isTestingRestaurant(shop)));
                })
                .catch(() => {
                    if (searchGeneration.current !== generation) return;
                    setShopOptions([]);
                })
                .finally(() => {
                    if (searchGeneration.current === generation) setShopSearching(false);
                });
        }, 250);
        return () => window.clearTimeout(handle);
    }, [shopQuery, activeTab]);

    const loadShopAnalytics = useCallback(async (shopId: string) => {
        if (!shopId) return;
        const generation = ++shopGeneration.current;
        setShopLoading(true);
        setShopError(null);
        try {
            const [rev, ord] = await Promise.all([
                readRequest(analyticsService.getShopRevenue(Number(shopId), startDate, endDate)),
                readRequest(analyticsService.getShopOrders(Number(shopId), startDate, endDate)),
            ]);
            if (shopGeneration.current !== generation) return;
            setShopRevenue(Array.isArray(rev.value) ? rev.value : []);
            setShopOrders(Array.isArray(ord.value) ? ord.value : []);
            setShopError(rev.error || ord.error);
        } finally {
            if (shopGeneration.current === generation) setShopLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        if (selectedShopId) loadShopAnalytics(selectedShopId);
    }, [selectedShopId, loadShopAnalytics]);

    const cancelBars = (cancellationRate?.byActor ?? []).filter(
        (row) => row.count > 0 || row.actor !== "UNSPECIFIED",
    );
    const showChartYear = startDate.slice(0, 4) !== endDate.slice(0, 4);
    const revenueChartData = revenue.map((row) => {
        const orders = row.count ?? 0;
        const amount = row.amount ?? 0;
        return {
            date: formatDayLabel(row.date, showChartYear),
            amount,
            Orders: orders,
            average: orders > 0 ? Math.round(amount / orders) : 0,
        };
    });
    const shopRevenueData = shopRevenue.map((row) => ({
        date: formatDayLabel(String(row.date), showChartYear),
        amount: row.amount ?? 0,
    }));
    const shopOrdersData = shopOrders.map((row) => ({
        date: formatDayLabel(String(row.date), showChartYear),
        Orders: row.count ?? 0,
    }));
    const shopHasOrders = shopOrdersData.some((row) => row.Orders > 0) || shopRevenueData.some((row) => row.amount > 0);

    const applyPreset = (preset: BangkokPreset) => {
        const range = bangkokPreset(preset);
        setStartDate(range.start);
        setEndDate(range.end);
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-700">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <BarChart2 className="h-6 w-6 text-primary" />
                    <h1 className="text-lg font-semibold md:text-2xl">Analytics</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {PRESETS.map((preset) => (
                        <Button key={preset.id} size="sm" variant="outline" onClick={() => applyPreset(preset.id)}>
                            {preset.label}
                        </Button>
                    ))}
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-8 w-36 text-xs" />
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-8 w-36 text-xs" />
                </div>
            </div>

            {dateProblem ? (
                <p className="py-16 text-center text-sm text-destructive">{dateProblem}</p>
            ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                    <TabsTrigger value="active" className="flex items-center gap-2"><UserCheck className="h-4 w-4" /> Daily Active</TabsTrigger>
                    <TabsTrigger value="orders" className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Order value</TabsTrigger>
                    <TabsTrigger value="restaurants" className="flex items-center gap-2"><Store className="h-4 w-4" /> Restaurants</TabsTrigger>
                    <TabsTrigger value="locations" className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Locations</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-6">
                    {activeTab === "active" ? (
                        <ActiveUsersPanel
                            from={startDate}
                            to={endDate}
                            onRangeChange={(from, to) => {
                                setStartDate(from);
                                setEndDate(to);
                            }}
                        />
                    ) : null}
                </TabsContent>

                <TabsContent value="orders" className="mt-6 space-y-4">
                    {loading ? (
                        <div className="grid gap-4 md:grid-cols-3">
                            <Skeleton className="h-[76px]" />
                            <Skeleton className="h-[76px]" />
                            <Skeleton className="h-[76px]" />
                        </div>
                    ) : loadErrors.orders ? (
                        <ChartMessage label={loadErrors.orders} failed />
                    ) : orderTotals ? (
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-xs uppercase text-muted-foreground">Completed order value</p>
                                    <p className="text-2xl font-semibold tabular-nums">{formatBaht(orderTotals.completedAmount)}</p>
                                    <p className="text-xs text-muted-foreground">{orderTotals.completedOrders.toLocaleString()} delivered or picked up</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-xs uppercase text-muted-foreground">Still open</p>
                                    <p className="text-2xl font-semibold tabular-nums">{formatBaht(orderTotals.openAmount)}</p>
                                    <p className="text-xs text-muted-foreground">{orderTotals.openOrders.toLocaleString()} orders placed in this period</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-xs uppercase text-muted-foreground">Canceled order value</p>
                                    <p className="text-2xl font-semibold tabular-nums text-destructive">{formatBaht(orderTotals.canceledAmount)}</p>
                                    <p className="text-xs text-muted-foreground">{orderTotals.canceledOrders.toLocaleString()} canceled in this period</p>
                                </CardContent>
                            </Card>
                        </div>
                    ) : null}

                    <Card>
                        <CardHeader>
                            <CardTitle>Cancellations by who</CardTitle>
                            <CardDescription>Counted on the day the order was canceled. Test restaurants are left out.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <LoadingSkeleton /> : loadErrors.cancellations ? (
                                <ChartMessage label={loadErrors.cancellations} failed />
                            ) : cancellationRate && cancellationRate.cancelledOrders > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={cancelBars} layout="vertical" margin={{ left: 8, right: 16 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                                        <XAxis type="number" allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis type="category" dataKey="label" fontSize={12} tickLine={false} axisLine={false} width={90} />
                                        <Tooltip formatter={(value: number) => [value.toLocaleString(), "Canceled orders"]} />
                                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                                            {cancelBars.map((row) => (
                                                <Cell key={row.actor} fill={CANCEL_COLORS[row.actor] ?? "#94a3b8"} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <ChartMessage label="No canceled orders in this period." />
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Completed order value</CardTitle>
                                <CardDescription>Counted on the day the order was delivered or picked up.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? <LoadingSkeleton /> : loadErrors.orders ? (
                                    <ChartMessage label={loadErrors.orders} failed />
                                ) : revenueChartData.some((row) => row.Orders > 0) ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <AreaChart data={revenueChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `฿${value}`} />
                                            <Tooltip formatter={(value: number) => [formatBaht(value), "Completed order value"]} />
                                            <Area type="monotone" dataKey="amount" name="Completed order value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : <ChartMessage label="No completed orders in this period." />}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Average order value</CardTitle>
                                <CardDescription>Completed order value divided by completed orders that day.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? <LoadingSkeleton /> : loadErrors.orders ? (
                                    <ChartMessage label={loadErrors.orders} failed />
                                ) : revenueChartData.some((row) => row.Orders > 0) ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <AreaChart data={revenueChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `฿${value}`} />
                                            <Tooltip formatter={(value: number) => [formatBaht(value), "Average order value"]} />
                                            <Area type="monotone" dataKey="average" name="Average order value" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : <ChartMessage label="No completed orders in this period." />}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Completed orders</CardTitle>
                            <CardDescription>Delivered and picked-up orders, by the day they were completed.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <LoadingSkeleton /> : loadErrors.orders ? (
                                <ChartMessage label={loadErrors.orders} failed />
                            ) : revenueChartData.some((row) => row.Orders > 0) ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={revenueChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip formatter={(value: number) => [value.toLocaleString(), "Completed orders"]} />
                                        <Area type="monotone" dataKey="Orders" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : <ChartMessage label="No completed orders in this period." />}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="restaurants" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Restaurants by completed orders</CardTitle>
                            <CardDescription>Top 20 by delivered and picked-up orders in this period. Test restaurants are left out.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? <div className="p-6"><LoadingSkeleton /></div> : loadErrors.popular ? (
                                <ChartMessage label={loadErrors.popular} failed />
                            ) : popularShops.length === 0 ? (
                                <ChartMessage label="No completed orders in this period." />
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Restaurant</TableHead>
                                            <TableHead className="text-right">Views all time</TableHead>
                                            <TableHead className="text-right">Unique viewers all time</TableHead>
                                            <TableHead className="text-right">Completed orders</TableHead>
                                            <TableHead className="text-right">Completed order value</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {popularShops.map((shop) => (
                                            <TableRow key={shop.shopId}>
                                                <TableCell className="font-medium">{shop.shopName || "Unknown restaurant"}</TableCell>
                                                <TableCell className="text-right tabular-nums">{(shop.viewCount || 0).toLocaleString()}</TableCell>
                                                <TableCell className="text-right tabular-nums">{(shop.uniqueViewers || 0).toLocaleString()}</TableCell>
                                                <TableCell className="text-right tabular-nums">{(shop.orders || 0).toLocaleString()}</TableCell>
                                                <TableCell className="text-right tabular-nums">{formatBaht(shop.revenue || 0)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>One restaurant</CardTitle>
                            <CardDescription>Completed order value and completed orders for the dates above.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input
                                value={shopQuery}
                                onChange={(event) => setShopQuery(event.target.value)}
                                placeholder="Search restaurants"
                                className="max-w-sm"
                            />
                            {shopSearching ? <p className="text-xs text-muted-foreground">Searching…</p> : null}
                            {shopOptions.length > 0 ? (
                                <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                                    {shopOptions.map((shop) => (
                                        <Button
                                            key={shop.id}
                                            size="sm"
                                            variant={selectedShopId === String(shop.id) ? "secondary" : "outline"}
                                            onClick={() => {
                                                setSelectedShopId(String(shop.id));
                                                setSelectedShopName(shopLabel(shop));
                                            }}
                                        >
                                            {shopLabel(shop)}
                                        </Button>
                                    ))}
                                </div>
                            ) : null}
                            {!selectedShopId ? (
                                <ChartMessage label="Search for a restaurant to see its completed orders." />
                            ) : shopLoading ? (
                                <div className="grid gap-4 md:grid-cols-2"><LoadingSkeleton /><LoadingSkeleton /></div>
                            ) : shopError ? (
                                <ChartMessage label={shopError} failed />
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div>
                                        <h4 className="mb-4 text-sm font-medium">{selectedShopName} completed order value</h4>
                                        {!shopHasOrders ? <ChartMessage label="No completed orders in this period." /> : (
                                            <ResponsiveContainer width="100%" height={220}>
                                                <AreaChart data={shopRevenueData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="date" fontSize={10} />
                                                    <YAxis fontSize={10} tickFormatter={(value) => `฿${value}`} />
                                                    <Tooltip formatter={(value: number) => [formatBaht(value), "Completed order value"]} />
                                                    <Area type="monotone" dataKey="amount" name="Completed order value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="mb-4 text-sm font-medium">{selectedShopName} completed orders</h4>
                                        {!shopHasOrders ? <ChartMessage label="No completed orders in this period." /> : (
                                            <ResponsiveContainer width="100%" height={220}>
                                                <BarChart data={shopOrdersData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="date" fontSize={10} />
                                                    <YAxis fontSize={10} allowDecimals={false} />
                                                    <Tooltip formatter={(value: number) => [value.toLocaleString(), "Completed orders"]} />
                                                    <Bar dataKey="Orders" fill="#10b981" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="locations" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Active customers by district</CardTitle>
                            <CardDescription>Customers who used the app between these dates, grouped by district.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <LoadingSkeleton /> : loadErrors.locations ? (
                                <ChartMessage label={loadErrors.locations} failed />
                            ) : locations.length > 0 ? (
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={locations} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis type="number" fontSize={12} allowDecimals={false} label={{ value: "Customers", position: "insideBottom", offset: -2 }} />
                                        <YAxis type="category" dataKey="district" fontSize={11} width={140} />
                                        <Tooltip formatter={(value: number) => [value.toLocaleString(), "Customers"]} />
                                        <Bar dataKey="activityCount" fill="#10b981" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <ChartMessage label="No active customers in this period." />}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            )}
        </div>
    );
}
