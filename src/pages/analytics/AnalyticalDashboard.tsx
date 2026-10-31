import { useEffect, useState, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { analyticsService, RevenueData, SessionSummary, LocationData, PopularShop, CategoryStats, FeedSectionStats, DeviceStats, UserGrowthData, CancellationRateData, FeatureUsageData } from "@/services/analyticsService";
import { ApiError } from "@/services/apiClient";
import { getBangkokDateString } from "@/utils/bangkokTime";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TrendingUp, Users, MapPin, BarChart2, Smartphone, Activity, FileSpreadsheet, Search, UserCheck } from "lucide-react";
import { exportService } from "@/services/exportService";
import { ShopService, Shop } from "@/services/shopService";
import { ActiveUsersPanel } from "@/components/analytics/ActiveUsersPanel";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#14b8a6"];
const FEED_TYPES = ["FOR_YOU", "TRENDING_NEARBY", "HOT_DEALS", "NEW_SHOPS", "POPULAR_DISHES"];

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

function getDefaultDates() {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 86_400_000);
    return {
        start: getBangkokDateString(start),
        end: getBangkokDateString(end),
    };
}

/** `YYYY-MM-DD` is a Bangkok calendar day, so parse it as a local date. */
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

const CANCEL_COLORS: Record<string, string> = {
    USER: "#f59e0b",
    SHOP: "#6366f1",
    ADMIN: "#ec4899",
    SYSTEM: "#14b8a6",
    UNSPECIFIED: "#94a3b8",
};

export default function AnalyticalDashboard() {
    const defaults = getDefaultDates();
    const [startDate, setStartDate] = useState(defaults.start);
    const [endDate, setEndDate] = useState(defaults.end);
    const [activeTab, setActiveTab] = useState("active");

    const [revenue, setRevenue] = useState<RevenueData[]>([]);
    const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
    const [locations, setLocations] = useState<LocationData[]>([]);
    const [popularShops, setPopularShops] = useState<PopularShop[]>([]);
    const [categories, setCategories] = useState<CategoryStats[]>([]);
    const [feedSections, setFeedSections] = useState<FeedSectionStats[]>([]);
    const [deviceStats, setDeviceStats] = useState<DeviceStats[]>([]);
    const [overallCtr, setOverallCtr] = useState<number | null>(null);
    const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
    const [cancellationRate, setCancellationRate] = useState<CancellationRateData | null>(null);
    const [featureUsage, setFeatureUsage] = useState<FeatureUsageData[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedShopId, setSelectedShopId] = useState<string>("");
    const [shopRevenue, setShopRevenue] = useState<RevenueData[]>([]);
    const [shopOrders, setShopOrders] = useState<RevenueData[]>([]);
    const [loading, setLoading] = useState(true);
    const [shopLoading, setShopLoading] = useState(false);
    const [loadErrors, setLoadErrors] = useState<Record<string, string>>({});
    const [shopError, setShopError] = useState<string | null>(null);
    const loadGeneration = useRef(0);
    const shopGeneration = useRef(0);

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

    const loadTab = useCallback(async (tab: string) => {
        const generation = ++loadGeneration.current;
        setLoading(true);
        const current = () => loadGeneration.current === generation;
        try {
            switch (tab) {
                case "revenue": {
                    const [rev, cancel] = await Promise.all([
                        readRequest(analyticsService.getRevenueAnalytics(startDate, endDate)),
                        readRequest(analyticsService.getCancellationRate(startDate, endDate)),
                    ]);
                    if (!current()) return;
                    setRevenue(Array.isArray(rev.value) ? rev.value : []);
                    setCancellationRate(cancel.value);
                    rememberErrors(["revenue", "cancellations"], { revenue: rev.error, cancellations: cancel.error });
                    break;
                }
                case "users": {
                    const [sess, growth, devices, features] = await Promise.all([
                        readRequest(analyticsService.getSessionAnalytics()),
                        readRequest(analyticsService.getUserGrowth(startDate, endDate)),
                        readRequest(analyticsService.getDeviceStats()),
                        readRequest(analyticsService.getFeatureUsage()),
                    ]);
                    if (!current()) return;
                    setSessionSummary(sess.value && !Array.isArray(sess.value) ? sess.value : null);
                    setUserGrowth(Array.isArray(growth.value) ? growth.value : []);
                    setDeviceStats(Array.isArray(devices.value) ? devices.value : []);
                    setFeatureUsage(Array.isArray(features.value) ? features.value : []);
                    rememberErrors(["sessions", "signups", "devices", "features"], {
                        sessions: sess.error,
                        signups: growth.error,
                        devices: devices.error,
                        features: features.error,
                    });
                    break;
                }
                case "shops": {
                    const [popular, cats, allShops] = await Promise.all([
                        readRequest(analyticsService.getPopularShops()),
                        readRequest(analyticsService.getCategoryStats()),
                        readRequest(ShopService.getAllShops(0, 100)),
                    ]);
                    if (!current()) return;
                    setPopularShops(Array.isArray(popular.value) ? popular.value : []);
                    setCategories(Array.isArray(cats.value) ? cats.value : []);
                    setShops(allShops.value?.content || []);
                    rememberErrors(["popular", "categories", "shopList"], {
                        popular: popular.error,
                        categories: cats.error,
                        shopList: allShops.error,
                    });
                    break;
                }
                case "locations": {
                    const locs = await readRequest(analyticsService.getLocationAnalytics());
                    if (!current()) return;
                    setLocations(Array.isArray(locs.value) ? locs.value : []);
                    rememberErrors(["locations"], { locations: locs.error });
                    break;
                }
                case "feed": {
                    const [feedPerf, ...sections] = await Promise.all([
                        readRequest(analyticsService.getFeedPerformance()),
                        ...FEED_TYPES.map((type) => readRequest(analyticsService.getFeedSectionStats(type))),
                    ]);
                    if (!current()) return;
                    setOverallCtr(feedPerf.value?.overallCtr ?? null);
                    setFeedSections(sections.flatMap((section) => section.value ? [section.value] : []));
                    rememberErrors(["feed"], {
                        feed: feedPerf.error || sections.find((section) => section.error)?.error || null,
                    });
                    break;
                }
            }
        } finally {
            if (current()) setLoading(false);
        }
    }, [startDate, endDate, rememberErrors]);

    useEffect(() => {
        loadTab(activeTab);
    }, [activeTab, loadTab]);

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
    const revenueChartData = revenue.map((r) => {
        const orders = r.count ?? 0;
        const amount = r.amount ?? 0;
        return {
            date: formatDayLabel(r.date, showChartYear),
            Revenue: amount,
            Orders: orders,
            Aov: orders > 0 ? Math.round(amount / orders) : 0,
        };
    });

    const userGrowthData = userGrowth.map((g) => ({
        date: formatDayLabel(g.date, showChartYear),
        Signups: g.newUsers ?? 0,
    }));

    const shopRevenueData = shopRevenue.map((r) => ({
        date: formatDayLabel(String(r.date), showChartYear),
        Revenue: r.amount ?? 0,
    }));

    const shopOrdersData = shopOrders.map((o) => ({
        date: formatDayLabel(String(o.date), showChartYear),
        Orders: o.count ?? 0,
    }));

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BarChart2 className="h-6 w-6 text-primary" />
                    <h1 className="text-lg font-semibold md:text-2xl">Analytics</h1>
                </div>

                <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36 h-8 text-xs" />
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36 h-8 text-xs" />
                    <Button size="sm" variant="outline" onClick={() => loadTab(activeTab)}>Apply</Button>
                </div>
            </div>

            <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="active" className="flex items-center gap-2"><UserCheck className="h-4 w-4" /> Daily Active</TabsTrigger>
                    <TabsTrigger value="revenue" className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Revenue</TabsTrigger>
                    <TabsTrigger value="users" className="flex items-center gap-2"><Users className="h-4 w-4" /> Users & Sessions</TabsTrigger>
                    <TabsTrigger value="shops" className="flex items-center gap-2"><BarChart2 className="h-4 w-4" /> Shops & Categories</TabsTrigger>
                    <TabsTrigger value="locations" className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Locations</TabsTrigger>
                    <TabsTrigger value="feed" className="flex items-center gap-2"><Activity className="h-4 w-4" /> Feed Performance</TabsTrigger>
                </TabsList>

                {/* Mounted only while selected: its three queries should not run
                    behind a tab nobody opened. */}
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

                <TabsContent value="revenue" className="mt-6 space-y-4">
                    {loading ? (
                        <div className="grid gap-4 md:grid-cols-3">
                            <Skeleton className="h-[76px]" />
                            <Skeleton className="h-[76px]" />
                            <Skeleton className="h-[76px]" />
                        </div>
                    ) : loadErrors.cancellations ? (
                        <ChartMessage label={loadErrors.cancellations} failed />
                    ) : cancellationRate ? (
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Total Orders</p>
                                    <p className="text-2xl font-bold">{(cancellationRate.totalOrders ?? 0).toLocaleString()}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-destructive/5 border-destructive/20">
                                <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Cancelled</p>
                                    <p className="text-2xl font-bold text-destructive">{(cancellationRate.cancelledOrders ?? 0).toLocaleString()}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-amber-500/5 border-amber-500/20">
                                <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Cancellation Rate</p>
                                    <p className="text-2xl font-bold text-amber-600">{Number(cancellationRate.cancellationRatePercent ?? 0).toFixed(2)}%</p>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <ChartMessage label="Cancellation data is unavailable for this range." />
                    )}

                    {(loading || cancellationRate) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Cancellations by who</CardTitle>
                            <CardDescription>Customer, shop, admin, and system cancellations in this range.</CardDescription>
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
                                        <Tooltip formatter={(value: number) => [value.toLocaleString(), "Cancelled orders"]} />
                                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                                            {cancelBars.map((row) => (
                                                <Cell key={row.actor} fill={CANCEL_COLORS[row.actor] ?? "#94a3b8"} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <ChartMessage label="No canceled orders in this range." />
                            )}
                        </CardContent>
                    </Card>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Platform Revenue</CardTitle>
                                        <CardDescription>Sales from orders that were not canceled.</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" className="gap-2" onClick={() => exportService.exportRevenue(startDate, endDate)}><FileSpreadsheet className="h-4 w-4" /> Export</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? <LoadingSkeleton /> : loadErrors.revenue ? (
                                    <ChartMessage label={loadErrors.revenue} failed />
                                ) : revenueChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <AreaChart data={revenueChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `฿${v}`} />
                                            <Tooltip formatter={(v: number) => [formatBaht(v), "Revenue"]} />
                                            <Area type="monotone" dataKey="Revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : <ChartMessage label="No sales in this range." />}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Average Order Value</CardTitle>
                                <CardDescription>Daily sales divided by orders included in revenue.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? <LoadingSkeleton /> : loadErrors.revenue ? (
                                    <ChartMessage label={loadErrors.revenue} failed />
                                ) : revenueChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <AreaChart data={revenueChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `฿${v}`} />
                                            <Tooltip formatter={(v: number) => [formatBaht(v), "Average order"]} />
                                            <Area type="monotone" dataKey="Aov" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : <ChartMessage label="No sales in this range." />}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Platform Order Volume</CardTitle>
                            <CardDescription>Orders included in revenue for the selected dates.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <LoadingSkeleton /> : loadErrors.revenue ? (
                                <ChartMessage label={loadErrors.revenue} failed />
                            ) : revenueChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={revenueChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip formatter={(v: number) => [v.toLocaleString(), "Orders"]} />
                                        <Area type="monotone" dataKey="Orders" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : <ChartMessage label="No orders in this range." />}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users" className="mt-6 space-y-4">
                    {loadErrors.sessions ? <ChartMessage label={loadErrors.sessions} failed /> : null}
                    {sessionSummary && (
                        <div className="grid gap-2 md:grid-cols-6">
                            <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase font-bold">Total Sessions</p><p className="text-lg font-bold">{sessionSummary.totalSessions.toLocaleString()}</p></CardContent></Card>
                            <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase font-bold">Avg. Duration</p><p className="text-lg font-bold">{Math.round(sessionSummary.averageDurationSeconds / 60)}m</p></CardContent></Card>
                            <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase font-bold">Actions/Sess</p><p className="text-lg font-bold">{sessionSummary.averageActivitiesPerSession.toFixed(1)}</p></CardContent></Card>
                            <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase font-bold">Shops Viewed</p><p className="text-lg font-bold">{sessionSummary.averageShopsViewed.toFixed(1)}</p></CardContent></Card>
                            <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase font-bold">Searches</p><p className="text-lg font-bold">{sessionSummary.averageSearches.toFixed(1)}</p></CardContent></Card>
                            <Card className="bg-primary/5 border-primary/20"><CardContent className="p-3"><p className="text-[10px] text-primary uppercase font-bold">Active Now</p><p className="text-lg font-bold text-primary">{sessionSummary.activeSessions.toLocaleString()}</p></CardContent></Card>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader><CardTitle>User Signup Growth</CardTitle><CardDescription>New registrations.</CardDescription></CardHeader>
                            <CardContent>
                                {loading ? <LoadingSkeleton /> : loadErrors.signups ? (
                                    <ChartMessage label={loadErrors.signups} failed />
                                ) : userGrowthData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <AreaChart data={userGrowthData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="date" fontSize={10} tickLine={false} />
                                            <YAxis fontSize={10} tickLine={false} />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="Signups" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : <ChartMessage label="No signups in this range." />}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Device & Platform</CardTitle><CardDescription>Platform distribution (OS).</CardDescription></CardHeader>
                            <CardContent>
                                {loading ? <LoadingSkeleton /> : loadErrors.devices ? (
                                    <ChartMessage label={loadErrors.devices} failed />
                                ) : deviceStats.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie data={deviceStats} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}>
                                                {deviceStats.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Legend /><Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <ChartMessage label="No device data." />}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader><CardTitle>Most Used Features</CardTitle><CardDescription>Popular app interactions.</CardDescription></CardHeader>
                        <CardContent>
                            {loading ? <LoadingSkeleton /> : loadErrors.features ? (
                                <ChartMessage label={loadErrors.features} failed />
                            ) : featureUsage.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={[...featureUsage].sort((a, b) => b.usageCount - a.usageCount)} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis type="number" fontSize={10} tickLine={false} />
                                        <YAxis type="category" dataKey="feature" fontSize={10} tickLine={false} width={120} />
                                        <Tooltip formatter={(v: number) => [v.toLocaleString(), "Usage"]} />
                                        <Bar dataKey="usageCount" fill="#ec4899" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <ChartMessage label="No feature usage in this range." />}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="shops" className="mt-6 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Popular shops</CardTitle>
                                <CardDescription>Ranked by delivered orders. Views are shop profile views. Unique viewers are distinct signed-in customers. Revenue is the delivered order total.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {loading ? <div className="p-6"><LoadingSkeleton /></div> : loadErrors.popular ? (
                                    <ChartMessage label={loadErrors.popular} failed />
                                ) : popularShops.length === 0 ? (
                                    <ChartMessage label="No delivered orders yet." />
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Shop</TableHead>
                                                <TableHead className="text-right">Views</TableHead>
                                                <TableHead className="text-right">Unique viewers</TableHead>
                                                <TableHead className="text-right">Delivered orders</TableHead>
                                                <TableHead className="text-right">Revenue</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {popularShops.map((shop) => (
                                                <TableRow key={shop.shopId}>
                                                    <TableCell className="font-medium">{shop.shopName || "Unknown shop"}</TableCell>
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
                            <CardHeader><CardTitle>Category Performance</CardTitle><CardDescription>Views by category.</CardDescription></CardHeader>
                            <CardContent>
                                {loading ? <LoadingSkeleton /> : loadErrors.categories ? (
                                    <ChartMessage label={loadErrors.categories} failed />
                                ) : categories.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie data={categories.slice(0, 6)} dataKey="viewCount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}>
                                                {categories.slice(0, 6).map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Legend /><Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <ChartMessage label="No category views yet." />}
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-primary/20">
                        <CardHeader className="bg-primary/5 pb-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div><CardTitle className="text-primary flex items-center gap-2"><Search className="h-4 w-4" /> Shop Drill-down</CardTitle><CardDescription>Select a shop for detailed performance.</CardDescription></div>
                                <div className="min-w-[300px]"><Select value={selectedShopId || ""} onValueChange={setSelectedShopId}><SelectTrigger><SelectValue placeholder="Select a shop..." /></SelectTrigger><SelectContent>{loadErrors.shopList ? <div className="p-2 text-xs text-destructive text-center">{loadErrors.shopList}</div> : shops.length > 0 ? shops.map((s) => (<SelectItem key={s.id} value={String(s.id)}>{s.nameEn || s.name}</SelectItem>)) : <div className="p-2 text-xs text-muted-foreground text-center">No shops found</div>}</SelectContent></Select></div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {!selectedShopId ? <div className="h-48 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg"><BarChart2 className="h-8 w-8 mb-2 opacity-20" /><p>Select a shop to view analytics.</p></div> : shopLoading ? <div className="space-y-4"><Skeleton className="h-8 w-1/3" /><div className="grid gap-4 md:grid-cols-2"><LoadingSkeleton /><LoadingSkeleton /></div></div> : shopError ? <ChartMessage label={shopError} failed /> : (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b pb-2"><h3 className="font-semibold text-lg">{shops.find(s => String(s.id) === selectedShopId)?.name} Analytics</h3></div>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div><h4 className="text-sm font-medium mb-4 flex items-center gap-2"><TrendingUp className="h-3 w-3 text-primary" /> Shop Revenue</h4><ResponsiveContainer width="100%" height={220}><AreaChart data={shopRevenueData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" fontSize={10} /><YAxis fontSize={10} tickFormatter={(v) => `$${v}`} /><Tooltip /><Area type="monotone" dataKey="Revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
                                        <div><h4 className="text-sm font-medium mb-4 flex items-center gap-2"><FileSpreadsheet className="h-3 w-3 text-primary" /> Shop Orders</h4><ResponsiveContainer width="100%" height={220}><BarChart data={shopOrdersData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Bar dataKey="Orders" fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="locations" className="mt-6 space-y-4">
                    <Card><CardHeader><CardTitle>Activity by District</CardTitle><CardDescription>District-wise interaction volume.</CardDescription></CardHeader>
                        <CardContent>{loading ? <LoadingSkeleton /> : loadErrors.locations ? <ChartMessage label={loadErrors.locations} failed /> : locations.length > 0 ? <ResponsiveContainer width="100%" height={400}><BarChart data={locations} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis type="number" fontSize={12} /><YAxis type="category" dataKey="district" fontSize={11} width={120} /><Tooltip /><Bar dataKey="activityCount" fill="#10b981" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer> : <ChartMessage label="No location activity in this range." />}</CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="feed" className="mt-6 space-y-4">
                    {overallCtr !== null && (
                        <Card className="bg-primary/5 border-primary/20"><CardContent className="flex items-center gap-4 p-4"><Activity className="h-5 w-5 text-primary" /><div><p className="text-sm font-medium">Overall Feed Click-Through Rate</p><p className="text-2xl font-bold">{(overallCtr * 100).toFixed(2)}%</p></div></CardContent></Card>
                    )}
                    <Card>
                        <CardHeader><CardTitle>Algorithm Performance</CardTitle><CardDescription>CTR breakdown by feed section.</CardDescription></CardHeader>
                        <CardContent className="p-0">
                            {loadErrors.feed ? <ChartMessage label={loadErrors.feed} failed /> : null}
                            <Table><TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Impressions</TableHead><TableHead>Clicks</TableHead><TableHead>CTR</TableHead></TableRow></TableHeader>
                                <TableBody>{loading ? [...Array(5)].map((_, i) => (<TableRow key={i}>{[...Array(4)].map((__, j) => (<TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>))}</TableRow>)) : feedSections.map((s, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium text-sm">{(s.type || s.sectionType || "Unknown").replace(/_/g, " ")}</TableCell>
                                        <TableCell className="text-sm">{(s.impressions ?? s.totalViews ?? 0).toLocaleString()}</TableCell>
                                        <TableCell className="text-sm">{(s.clicks ?? s.totalClicks ?? 0).toLocaleString()}</TableCell>
                                        <TableCell className="text-sm font-medium">{((s.ctr ?? s.clickThroughRate ?? 0) * 100).toFixed(2)}%</TableCell>
                                    </TableRow>
                                ))}</TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
