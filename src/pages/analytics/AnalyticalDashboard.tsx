import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { analyticsService, RevenueData, SessionSummary, LocationData, PopularShop, CategoryStats, FeedSectionStats, DeviceStats, UserGrowthData, CancellationRateData, FeatureUsageData } from "@/services/analyticsService";
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
import { TrendingUp, Users, MapPin, BarChart2, Smartphone, Activity, FileSpreadsheet, Search } from "lucide-react";
import { exportService } from "@/services/exportService";
import { ShopService, Shop } from "@/services/shopService";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#14b8a6"];
const FEED_TYPES = ["FOR_YOU", "TRENDING_NEARBY", "HOT_DEALS", "NEW_SHOPS", "POPULAR_DISHES"];

function LoadingSkeleton() {
    return <Skeleton className="w-full h-[300px]" />;
}

function getDefaultDates() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
    };
}

export default function AnalyticalDashboard() {
    const defaults = getDefaultDates();
    const [startDate, setStartDate] = useState(defaults.start);
    const [endDate, setEndDate] = useState(defaults.end);
    const [activeTab, setActiveTab] = useState("revenue");

    const [revenue, setRevenue] = useState<RevenueData[]>([]);
    const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
    const [locations, setLocations] = useState<LocationData[]>([]);
    const [popularShops, setPopularShops] = useState<PopularShop[]>([]);
    const [categories, setCategories] = useState<CategoryStats[]>([]);
    const [feedSections, setFeedSections] = useState<FeedSectionStats[]>([]);
    const [deviceStats, setDeviceStats] = useState<DeviceStats[]>([]);
    const [overallCtr, setOverallCtr] = useState<number | null>(null);
    const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
    const [orderVolume, setOrderVolume] = useState<RevenueData[]>([]);
    const [cancellationRate, setCancellationRate] = useState<CancellationRateData | null>(null);
    const [featureUsage, setFeatureUsage] = useState<FeatureUsageData[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedShopId, setSelectedShopId] = useState<string>("");
    const [shopRevenue, setShopRevenue] = useState<RevenueData[]>([]);
    const [shopOrders, setShopOrders] = useState<RevenueData[]>([]);
    const [loading, setLoading] = useState(true);
    const [shopLoading, setShopLoading] = useState(false);

    const loadTab = useCallback(async (tab: string) => {
        setLoading(true);
        try {
            switch (tab) {
                case "revenue": {
                    const [rev, orders, cancel] = await Promise.all([
                        analyticsService.getRevenueAnalytics(startDate, endDate).catch(() => []),
                        analyticsService.getOrderVolumeChart(startDate, endDate).catch(() => []),
                        analyticsService.getCancellationRate(startDate, endDate).catch(() => null),
                    ]);
                    setRevenue(rev);
                    setOrderVolume(orders);
                    setCancellationRate(cancel);
                    break;
                }
                case "users": {
                    const [sess, growth, devices, features] = await Promise.all([
                        analyticsService.getSessionAnalytics().catch(() => null),
                        analyticsService.getUserGrowth(startDate, endDate).catch(() => []),
                        analyticsService.getDeviceStats().catch(() => []),
                        analyticsService.getFeatureUsage().catch(() => []),
                    ]);
                    if (sess && !Array.isArray(sess)) setSessionSummary(sess);
                    setUserGrowth(growth);
                    setDeviceStats(devices);
                    setFeatureUsage(features);
                    break;
                }
                case "shops": {
                    const [popular, cats, allShops] = await Promise.all([
                        analyticsService.getPopularShops().catch(() => []),
                        analyticsService.getCategoryStats().catch(() => []),
                        ShopService.getAllShops(0, 100).catch(() => ({ content: [] as Shop[], totalElements: 0, totalPages: 0, number: 0, size: 0 })),
                    ]);
                    setPopularShops(popular);
                    setCategories(cats);
                    setShops(allShops?.content || []);
                    break;
                }
                case "locations": {
                    const locs = await analyticsService.getLocationAnalytics().catch(() => []);
                    setLocations(locs);
                    break;
                }
                case "feed": {
                    const [feedPerf, ...sections] = await Promise.all([
                        analyticsService.getFeedPerformance().catch(() => null),
                        ...FEED_TYPES.map((t) => analyticsService.getFeedSectionStats(t).catch(() => ({ type: t, impressions: 0, clicks: 0, ctr: 0 })))
                    ]);
                    setOverallCtr(feedPerf?.overallCtr ?? null);
                    setFeedSections(sections);
                    break;
                }
            }
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        loadTab(activeTab);
    }, [activeTab, loadTab]);

    const loadShopAnalytics = useCallback(async (shopId: string) => {
        if (!shopId) return;
        setShopLoading(true);
        try {
            const [rev, ord] = await Promise.all([
                analyticsService.getShopRevenue(Number(shopId), startDate, endDate).catch(() => []),
                analyticsService.getShopOrders(Number(shopId), startDate, endDate).catch(() => []),
            ]);
            setShopRevenue(Array.isArray(rev) ? rev : []);
            setShopOrders(Array.isArray(ord) ? ord : []);
        } finally {
            setShopLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        if (selectedShopId) loadShopAnalytics(selectedShopId);
    }, [selectedShopId, loadShopAnalytics]);

    const revenueChartData = revenue.map((r) => ({
        date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        Revenue: r.amount ?? 0,
    }));

    const userGrowthData = userGrowth.map((g) => ({
        date: new Date(g.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        Signups: g.newUsers ?? 0,
    }));

    const orderVolumeData = orderVolume.map((o) => ({
        date: new Date(o.date as string).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        Orders: o.count ?? 0,
    }));

    const shopRevenueData = shopRevenue.map((r) => ({
        date: new Date(r.date as string).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        Revenue: r.amount ?? 0,
    }));

    const shopOrdersData = shopOrders.map((o) => ({
        date: new Date(o.date as string).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
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

            <Tabs defaultValue="revenue" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="revenue" className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Revenue</TabsTrigger>
                    <TabsTrigger value="users" className="flex items-center gap-2"><Users className="h-4 w-4" /> Users & Sessions</TabsTrigger>
                    <TabsTrigger value="shops" className="flex items-center gap-2"><BarChart2 className="h-4 w-4" /> Shops & Categories</TabsTrigger>
                    <TabsTrigger value="locations" className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Locations</TabsTrigger>
                    <TabsTrigger value="feed" className="flex items-center gap-2"><Activity className="h-4 w-4" /> Feed Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="revenue" className="mt-6 space-y-4">
                    {cancellationRate && (
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Total Orders</p>
                                    <p className="text-2xl font-bold">{cancellationRate.totalOrders.toLocaleString()}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-destructive/5 border-destructive/20">
                                <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Cancelled</p>
                                    <p className="text-2xl font-bold text-destructive">{cancellationRate.cancelledOrders.toLocaleString()}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-amber-500/5 border-amber-500/20">
                                <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Cancellation Rate</p>
                                    <p className="text-2xl font-bold text-amber-600">{cancellationRate.cancellationRatePercent.toFixed(2)}%</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div><CardTitle>Platform Revenue</CardTitle><CardDescription>Revenue generated across the platform.</CardDescription></div>
                                    <Button variant="outline" size="sm" className="gap-2" onClick={() => exportService.exportRevenue(startDate, endDate)}><FileSpreadsheet className="h-4 w-4" /> Export</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? <LoadingSkeleton /> : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <AreaChart data={revenueChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="date" fontSize={10} tickLine={false} />
                                            <YAxis fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}`} />
                                            <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                                            <Area type="monotone" dataKey="Revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Platform Order Volume</CardTitle><CardDescription>Orders placed over time.</CardDescription></CardHeader>
                            <CardContent>
                                {loading ? <LoadingSkeleton /> : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <AreaChart data={orderVolumeData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="date" fontSize={10} tickLine={false} />
                                            <YAxis fontSize={10} tickLine={false} />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="Orders" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="users" className="mt-6 space-y-4">
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
                                {loading ? <LoadingSkeleton /> : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <AreaChart data={userGrowthData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="date" fontSize={10} tickLine={false} />
                                            <YAxis fontSize={10} tickLine={false} />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="Signups" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Device & Platform</CardTitle><CardDescription>Platform distribution (OS).</CardDescription></CardHeader>
                            <CardContent>
                                {loading ? <LoadingSkeleton /> : deviceStats.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie data={deviceStats} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}>
                                                {deviceStats.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Legend /><Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data</div>}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader><CardTitle>Most Used Features</CardTitle><CardDescription>Popular app interactions.</CardDescription></CardHeader>
                        <CardContent>
                            {loading ? <LoadingSkeleton /> : featureUsage.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={featureUsage.sort((a, b) => b.usageCount - a.usageCount)} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis type="number" fontSize={10} tickLine={false} />
                                        <YAxis type="category" dataKey="feature" fontSize={10} tickLine={false} width={120} />
                                        <Tooltip formatter={(v: number) => [v.toLocaleString(), "Usage"]} />
                                        <Bar dataKey="usageCount" fill="#ec4899" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data</div>}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="shops" className="mt-6 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader><CardTitle>Top Shops by Views</CardTitle><CardDescription>Most viewed shops in the platform.</CardDescription></CardHeader>
                            <CardContent>
                                {loading ? <LoadingSkeleton /> : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={popularShops.map(s => ({ name: s.shopName || "Unknown", rev: s.viewCount || 0 })).slice(0, 8)} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis type="number" fontSize={10} tickLine={false} />
                                            <YAxis type="category" dataKey="name" fontSize={10} tickLine={false} width={100} />
                                            <Tooltip formatter={(v: number) => [v.toLocaleString(), "Views"]} />
                                            <Bar dataKey="rev" fill="#6366f1" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Category Performance</CardTitle><CardDescription>Views by category.</CardDescription></CardHeader>
                            <CardContent>
                                {loading ? <LoadingSkeleton /> : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie data={categories.slice(0, 6)} dataKey="viewCount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}>
                                                {categories.slice(0, 6).map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Legend /><Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-primary/20">
                        <CardHeader className="bg-primary/5 pb-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div><CardTitle className="text-primary flex items-center gap-2"><Search className="h-4 w-4" /> Shop Drill-down</CardTitle><CardDescription>Select a shop for detailed performance.</CardDescription></div>
                                <div className="min-w-[300px]"><Select value={selectedShopId || ""} onValueChange={setSelectedShopId}><SelectTrigger><SelectValue placeholder="Select a shop..." /></SelectTrigger><SelectContent>{shops.length > 0 ? shops.map((s) => (<SelectItem key={s.id} value={String(s.id)}>{s.nameEn || s.name}</SelectItem>)) : <div className="p-2 text-xs text-muted-foreground text-center">No shops found</div>}</SelectContent></Select></div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {!selectedShopId ? <div className="h-48 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg"><BarChart2 className="h-8 w-8 mb-2 opacity-20" /><p>Select a shop to view analytics.</p></div> : shopLoading ? <div className="space-y-4"><Skeleton className="h-8 w-1/3" /><div className="grid gap-4 md:grid-cols-2"><LoadingSkeleton /><LoadingSkeleton /></div></div> : (
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
                        <CardContent>{loading ? <LoadingSkeleton /> : <ResponsiveContainer width="100%" height={400}><BarChart data={locations} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis type="number" fontSize={12} /><YAxis type="category" dataKey="district" fontSize={11} width={120} /><Tooltip /><Bar dataKey="activityCount" fill="#10b981" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>}</CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="feed" className="mt-6 space-y-4">
                    {overallCtr !== null && (
                        <Card className="bg-primary/5 border-primary/20"><CardContent className="flex items-center gap-4 p-4"><Activity className="h-5 w-5 text-primary" /><div><p className="text-sm font-medium">Overall Feed Click-Through Rate</p><p className="text-2xl font-bold">{(overallCtr * 100).toFixed(2)}%</p></div></CardContent></Card>
                    )}
                    <Card>
                        <CardHeader><CardTitle>Algorithm Performance</CardTitle><CardDescription>CTR breakdown by feed section.</CardDescription></CardHeader>
                        <CardContent className="p-0">
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
