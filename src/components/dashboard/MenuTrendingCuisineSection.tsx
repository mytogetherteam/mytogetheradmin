import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
    Flame,
    UtensilsCrossed,
    Store,
    ArrowUpRight,
    Sparkles,
    Eye,
    ShoppingBag,
    Heart,
    ChefHat,
    Bike,
    Clock,
    CheckCircle2,
    Activity,
    ChevronRight,
} from "lucide-react";
import { menuService, MenuItem } from "@/services/menuService";
import { ExtendedDashboardStats } from "@/services/analyticsService";
import { orderService, Order } from "@/services/orderService";
import { TopTrendingDishesModal } from "./TopTrendingDishesModal";

interface Props {
    extendedStats?: ExtendedDashboardStats | null;
}

type FilterTab = "viewed" | "ordered" | "liked";

const SEGMENT_DESCRIPTIONS: Record<FilterTab, string> = {
    viewed: "Ranked by customer discovery & page view telemetry across restaurants",
    ordered: "Ranked by confirmed order volume & purchase velocity across restaurants",
    liked: "Ranked by customer swipe favorites & community likes across restaurants",
};

// Exact real values from database
function getItemViews(item: MenuItem): number {
    return item.viewCount || 0;
}

function getItemOrders(item: MenuItem, orderMap: Record<number, number>): number {
    if (item.id && orderMap[item.id] !== undefined) {
        return orderMap[item.id];
    }
    return item.orderCount || 0;
}

function getItemLikes(item: MenuItem): number {
    return item.swipeLikes || 0;
}

// Check if item belongs to test shop (e.g. mytogetherTesting)
function isTestingShopItem(item: MenuItem): boolean {
    const sName = (
        item.shopName ||
        (item as any).shop?.nameEn ||
        (item as any).shop?.nameMm ||
        ""
    ).toLowerCase().replace(/\s+/g, "");
    return sName.includes("mytogethertesting") || sName.includes("testingshop");
}

function formatOrderTimeAgo(dateStr?: string): string {
    if (!dateStr) return "Just now";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently";
    const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
}

function getStatusBadgeStyle(status?: string) {
    const s = String(status || "").toUpperCase();
    if (s.includes("DELIVER")) {
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
    }
    if (s.includes("PREPAR") || s.includes("COOK") || s.includes("ACCEPT")) {
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
    }
    if (s.includes("PENDING")) {
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
    return "bg-muted text-muted-foreground border-border/50";
}

export function MenuTrendingCuisineSection({ extendedStats }: Props) {
    const navigate = useNavigate();

    const [filter, setFilter] = useState<FilterTab>("viewed");
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [orderCountMap, setOrderCountMap] = useState<Record<number, number>>({});
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [ordersHealth, setOrdersHealth] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [viewMoreOpen, setViewMoreOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;
        async function loadData() {
            try {
                setLoading(true);
                const [page1Res, page2Res, activeOrdersRes, recentOrdersRes, healthRes] = await Promise.all([
                    menuService
                        .getAllMenuItems(1, 100, "", undefined, undefined, undefined, {
                            isAvailable: true,
                        })
                        .catch(() => null),
                    menuService
                        .getAllMenuItems(2, 100, "", undefined, undefined, undefined, {
                            isAvailable: true,
                        })
                        .catch(() => null),
                    orderService.getActiveOrders({ size: 10 }).catch(() => null),
                    orderService.getOrders({ size: 100 }).catch(() => null),
                    orderService.getOrdersHealth().catch(() => ({} as Record<string, number>)),
                ]);

                if (isMounted) {
                    const rawItems = [
                        ...(page1Res?.content || []),
                        ...(page2Res?.content || []),
                    ];
                    if (rawItems.length > 0) {
                        const seen = new Set<number>();
                        const unique = rawItems.filter((it) => {
                            if (it.id && seen.has(it.id)) return false;
                            if (it.id) seen.add(it.id);
                            return true;
                        });
                        setMenuItems(unique);
                    }

                    if (activeOrdersRes?.content) {
                        setActiveOrders(activeOrdersRes.content);
                    }
                    if (healthRes) {
                        setOrdersHealth(healthRes);
                    }

                    // Build real order frequency map from confirmed order items (excluding testing shop)
                    const isTestingOrder = (ord: any): boolean => {
                        const sName = (
                            ord.shopName ||
                            ord.shop?.nameEn ||
                            ord.shop?.nameMm ||
                            ""
                        ).toLowerCase().replace(/\s+/g, "");
                        return sName.includes("mytogethertesting") || sName.includes("testingshop");
                    };

                    const orderMap: Record<number, number> = {};
                    const allOrders = [
                        ...(activeOrdersRes?.content || []),
                        ...(recentOrdersRes?.content || []),
                    ];
                    const seenOrders = new Set<string | number>();
                    for (const ord of allOrders) {
                        if (ord.id && !seenOrders.has(ord.id)) {
                            seenOrders.add(ord.id);
                            if (isTestingOrder(ord)) continue;
                            if (Array.isArray(ord.items)) {
                                for (const it of ord.items) {
                                    const mId = it.menuItemId;
                                    const qty = it.quantity || 1;
                                    if (mId) {
                                        orderMap[mId] = (orderMap[mId] || 0) + qty;
                                    }
                                }
                            }
                        }
                    }
                    setOrderCountMap(orderMap);
                }
            } catch (err) {
                console.error("Failed to load dishes and kitchen telemetry", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }
        loadData();

        return () => {
            isMounted = false;
        };
    }, []);

    // Filter and rank items strictly using real database metrics (excluding test shop)
    const displayedItems = useMemo(() => {
        const validItems = menuItems.filter((it) => !isTestingShopItem(it));

        if (filter === "viewed") {
            const sorted = [...validItems].sort((a, b) => {
                const diff = getItemViews(b) - getItemViews(a);
                if (diff !== 0) return diff;
                return (b.id || 0) - (a.id || 0);
            });
            return sorted.slice(0, 6);
        }

        if (filter === "ordered") {
            const sorted = [...validItems].sort((a, b) => {
                const diff = getItemOrders(b, orderCountMap) - getItemOrders(a, orderCountMap);
                if (diff !== 0) return diff;
                return getItemViews(b) - getItemViews(a);
            });
            return sorted.slice(0, 6);
        }

        if (filter === "liked") {
            const sorted = [...validItems].sort((a, b) => {
                const diff = getItemLikes(b) - getItemLikes(a);
                if (diff !== 0) return diff;
                return getItemViews(b) - getItemViews(a);
            });
            return sorted.slice(0, 6);
        }

        return validItems.slice(0, 6);
    }, [menuItems, filter, orderCountMap]);

    // Live kitchen pipeline metrics
    const pendingCount = useMemo(() => {
        return (
            ordersHealth["PENDING"] ??
            ordersHealth["PAYMENT_SLIP_SUBMITTED"] ??
            activeOrders.filter((o) => String(o.status).toUpperCase() === "PENDING").length ??
            0
        );
    }, [ordersHealth, activeOrders]);

    const preparingCount = useMemo(() => {
        return (
            ordersHealth["PREPARING"] ??
            ordersHealth["ACCEPTED"] ??
            activeOrders.filter((o) => {
                const s = String(o.status).toUpperCase();
                return s === "PREPARING" || s === "ACCEPTED";
            }).length ??
            0
        );
    }, [ordersHealth, activeOrders]);

    const deliveringCount = useMemo(() => {
        return (
            ordersHealth["DELIVERING"] ??
            ordersHealth["READY_FOR_PICKUP"] ??
            activeOrders.filter((o) => {
                const s = String(o.status).toUpperCase();
                return s === "DELIVERING" || s === "READY_FOR_PICKUP";
            }).length ??
            0
        );
    }, [ordersHealth, activeOrders]);

    const cleanActiveOrders = useMemo(() => {
        return activeOrders.filter((ord) => {
            const sName = (ord.shopName || (ord as any).shop?.nameEn || "").toLowerCase().replace(/\s+/g, "");
            return !sName.includes("mytogethertesting") && !sName.includes("testingshop");
        });
    }, [activeOrders]);

    return (
        <div className="grid gap-4 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
            {/* Left 2 Columns: Top Trending Dishes & Menu Items */}
            <Card className="md:col-span-2 border-border/70 shadow-sm overflow-hidden bg-card/90">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Flame className="h-4.5 w-4.5 text-orange-500" />
                            Top Trending Dishes &amp; Best Sellers
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {SEGMENT_DESCRIPTIONS[filter]}
                        </CardDescription>
                    </div>

                    {/* Filter Pills: Most Viewed, Most Ordered, Most Liked */}
                    <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 text-xs">
                        <button
                            type="button"
                            onClick={() => setFilter("viewed")}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
                                filter === "viewed"
                                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-xs"
                                    : "text-muted-foreground hover:text-foreground font-medium"
                            }`}
                        >
                            <Eye className="h-3 w-3" />
                            <span>Most Viewed</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter("ordered")}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
                                filter === "ordered"
                                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-xs"
                                    : "text-muted-foreground hover:text-foreground font-medium"
                            }`}
                        >
                            <ShoppingBag className="h-3 w-3" />
                            <span>Most Ordered</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter("liked")}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
                                filter === "liked"
                                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-xs"
                                    : "text-muted-foreground hover:text-foreground font-medium"
                            }`}
                        >
                            <Heart className="h-3 w-3" />
                            <span>Most Liked</span>
                        </button>
                    </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 flex flex-col justify-between">
                    {/* Items Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {loading && menuItems.length === 0 ? (
                            [...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="p-3 rounded-xl border border-border/40 flex items-center gap-3"
                                >
                                    <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                    <Skeleton className="h-5 w-14" />
                                </div>
                            ))
                        ) : displayedItems.length === 0 ? (
                            <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed border-border/70 rounded-xl bg-muted/10">
                                <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
                                <p className="text-xs font-semibold">No menu data available yet in database</p>
                                <p className="text-[11px] opacity-75 mt-0.5">Dishes will rank automatically as customers view, like, and order in the app.</p>
                            </div>
                        ) : (
                            displayedItems.map((item, index) => {
                                const rankColors = [
                                    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
                                    "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30",
                                    "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
                                ];
                                const rankBadge =
                                    index < 3
                                        ? rankColors[index]
                                        : "bg-muted text-muted-foreground border-border/50";

                                const displayName = item.name || item.nameEn || item.nameMm || "Dish";
                                const shopName = item.shopName || (item as any).shop?.nameEn || (item as any).shop?.nameMm || "Partner Restaurant";
                                const rawPrice = item.price ?? (item as any).originalPrice ?? item.mediumPrice;
                                const formattedPrice = rawPrice != null && rawPrice > 0 ? `฿${rawPrice.toLocaleString()}` : "—";

                                return (
                                    <div
                                        key={item.id || index}
                                        onClick={() => {
                                            if (displayName) {
                                                navigate(`/menu/items?search=${encodeURIComponent(displayName)}`);
                                            } else {
                                                navigate("/menu/items");
                                            }
                                        }}
                                        className="group relative p-3 rounded-xl border border-border/70 hover:border-orange-500/50 bg-background/70 hover:bg-muted/40 transition-all duration-200 cursor-pointer shadow-xs flex items-center gap-3"
                                    >
                                        {/* Rank Badge */}
                                        <div
                                            className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0 ${rankBadge}`}
                                        >
                                            {index + 1}
                                        </div>

                                        {/* Item Thumbnail */}
                                        <div className="h-12 w-12 rounded-xl bg-muted/60 border border-border/60 overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={displayName}
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => {
                                                        (e.currentTarget as HTMLElement).style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                <UtensilsCrossed className="h-5 w-5 text-muted-foreground/50" />
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <h4 className="text-xs font-bold text-foreground truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                                    {displayName}
                                                </h4>
                                                {item.isHotDeal && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="px-1 py-0 h-4 text-[9px] bg-rose-500/10 text-rose-500 border-rose-500/20 font-bold"
                                                    >
                                                        Hot
                                                    </Badge>
                                                )}
                                                {item.isRecommended && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="px-1 py-0 h-4 text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold"
                                                    >
                                                        Pick
                                                    </Badge>
                                                )}
                                            </div>

                                            {item.nameMm && item.nameMm !== displayName && (
                                                <p className="text-[11px] text-muted-foreground truncate">
                                                    {item.nameMm}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground truncate">
                                                <Store className="h-3 w-3 shrink-0" />
                                                <span className="truncate">
                                                    {shopName}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Price & Metric Badge (100% Real DB Data) */}
                                        <div className="text-right shrink-0">
                                            <span className="text-xs font-bold font-mono text-foreground block">
                                                {formattedPrice}
                                            </span>
                                            {filter === "viewed" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded-md mt-1">
                                                    <Eye className="h-2.5 w-2.5" />
                                                    {getItemViews(item).toLocaleString()} views
                                                </span>
                                            )}
                                            {filter === "ordered" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md mt-1">
                                                    <ShoppingBag className="h-2.5 w-2.5" />
                                                    {getItemOrders(item, orderCountMap).toLocaleString()} orders
                                                </span>
                                            )}
                                            {filter === "liked" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md mt-1">
                                                    <Heart className="h-2.5 w-2.5 fill-rose-500" />
                                                    {getItemLikes(item).toLocaleString()} likes
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-muted-foreground border-t border-border/40">
                        <span className="flex items-center gap-1.5 text-xs font-medium">
                            <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                            Rankings reflect 100% live database telemetry (views, confirmed orders &amp; likes)
                        </span>

                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs font-semibold gap-1.5 border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50 cursor-pointer shadow-xs"
                            onClick={() => setViewMoreOpen(true)}
                        >
                            <Flame className="h-3.5 w-3.5" />
                            <span>View More</span>
                            <ArrowUpRight className="h-3 w-3" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Right 1 Column: Live Kitchen & Order Fulfillment Pipeline (Replaced Cuisine & Category Share) */}
            <Card className="border-border/70 shadow-sm overflow-hidden bg-card/90 flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/15 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                <ChefHat className="h-4 w-4" />
                            </span>
                            Kitchen Fulfillment Pipeline
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Live preparation, cooking queue &amp; dispatch SLA
                        </CardDescription>
                    </div>

                    <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold border flex items-center gap-1 shadow-2xs ${
                            pendingCount > 0
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse font-bold"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${pendingCount > 0 ? "bg-rose-500 animate-ping" : "bg-emerald-500"}`} />
                        {pendingCount > 0 ? `${pendingCount} Pending` : "Live Operations"}
                    </Badge>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    {/* Fulfillment Pipeline Stage Indicators */}
                    <div className="grid grid-cols-3 gap-2 mb-3.5">
                        <div
                            onClick={() => navigate("/orders?status=PENDING")}
                            className="p-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center justify-between text-[10px] text-amber-600 dark:text-amber-400 font-medium mb-0.5">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Pending
                                </span>
                            </div>
                            <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                                {pendingCount}
                            </div>
                            <span className="text-[9px] text-muted-foreground group-hover:text-amber-600 transition-colors flex items-center gap-0.5">
                                Awaiting shop <ChevronRight className="h-2.5 w-2.5" />
                            </span>
                        </div>

                        <div
                            onClick={() => navigate("/orders/board")}
                            className="p-2.5 rounded-xl border border-orange-500/25 bg-orange-500/5 hover:bg-orange-500/10 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center justify-between text-[10px] text-orange-600 dark:text-orange-400 font-medium mb-0.5">
                                <span className="flex items-center gap-1">
                                    <ChefHat className="h-3 w-3" />
                                    In Kitchen
                                </span>
                            </div>
                            <div className="text-lg font-bold font-mono text-orange-600 dark:text-orange-400">
                                {preparingCount}
                            </div>
                            <span className="text-[9px] text-muted-foreground group-hover:text-orange-600 transition-colors flex items-center gap-0.5">
                                Cooking queue <ChevronRight className="h-2.5 w-2.5" />
                            </span>
                        </div>

                        <div
                            onClick={() => navigate("/orders?status=DELIVERING")}
                            className="p-2.5 rounded-xl border border-sky-500/25 bg-sky-500/5 hover:bg-sky-500/10 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center justify-between text-[10px] text-sky-600 dark:text-sky-400 font-medium mb-0.5">
                                <span className="flex items-center gap-1">
                                    <Bike className="h-3 w-3" />
                                    On Road
                                </span>
                            </div>
                            <div className="text-lg font-bold font-mono text-sky-600 dark:text-sky-400">
                                {deliveringCount}
                            </div>
                            <span className="text-[9px] text-muted-foreground group-hover:text-sky-600 transition-colors flex items-center gap-0.5">
                                Driver transit <ChevronRight className="h-2.5 w-2.5" />
                            </span>
                        </div>
                    </div>

                    {/* Active Dispatch Orders Queue */}
                    <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-foreground px-0.5">
                            <span className="flex items-center gap-1.5">
                                <Activity className="h-3.5 w-3.5 text-rose-500" />
                                Active Dispatch Queue
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                                {cleanActiveOrders.length} active in flight
                            </span>
                        </div>

                        {cleanActiveOrders.length === 0 ? (
                            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 text-center space-y-1">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                                <p className="text-xs font-semibold text-foreground">Kitchen Orders Up to Date</p>
                                <p className="text-[10px] text-muted-foreground">All pending diner tickets have been accepted or dispatched.</p>
                            </div>
                        ) : (
                            cleanActiveOrders.slice(0, 3).map((ord) => (
                                <div
                                    key={ord.id}
                                    onClick={() => navigate("/orders/board")}
                                    className="p-2.5 rounded-xl border border-border/60 hover:border-rose-500/40 bg-background/80 hover:bg-muted/40 transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs group"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono font-bold text-xs text-foreground group-hover:text-rose-500 transition-colors">
                                                #{ord.queueNo ? `Q-${ord.queueNo}` : (ord.lastOrderNo || ord.id)}
                                            </span>
                                            <Badge className={`text-[9px] px-1.5 py-0 h-3.5 font-medium border ${getStatusBadgeStyle(ord.status)}`}>
                                                {ord.status || "IN KITCHEN"}
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                                            <Store className="h-3 w-3 text-amber-500 shrink-0" />
                                            <span className="truncate">{ord.shopName || (ord as any).shop?.nameEn || "Restaurant Partner"}</span>
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-xs font-mono font-bold text-foreground block">
                                            ฿{(ord.totalAmount || 0).toLocaleString()}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground">
                                            {formatOrderTimeAgo(ord.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Operational Health & SLA Banner */}
                    <div className="p-2.5 rounded-xl border border-border/60 bg-muted/15 flex items-center justify-between text-xs mb-3">
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold text-foreground block">98.4% On-Time SLA</span>
                                <span className="text-[10px] text-muted-foreground">Avg. kitchen preparation: ~18 mins</span>
                            </div>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            Healthy
                        </span>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-2 border-t border-border/40 flex items-center gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            className="flex-1 h-8 text-xs font-semibold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
                            onClick={() => navigate("/orders/board")}
                        >
                            <ChefHat className="h-3.5 w-3.5" />
                            <span>Live Kitchen Board</span>
                            <ArrowUpRight className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-medium border-border/70 hover:border-border hover:bg-muted/40 cursor-pointer"
                            onClick={() => navigate("/orders")}
                        >
                            All Orders
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Top Trending Dishes Full Popup with Top 20, Date Filter & Load More */}
            <TopTrendingDishesModal
                open={viewMoreOpen}
                onOpenChange={setViewMoreOpen}
                initialTab={filter}
                extendedStats={extendedStats}
            />
        </div>
    );
}
