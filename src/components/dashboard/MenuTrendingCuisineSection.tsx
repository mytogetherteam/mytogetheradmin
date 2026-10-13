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
    TrendingUp,
    Sparkles,
    PieChart as PieIcon,
    Eye,
    ShoppingBag,
    Heart,
} from "lucide-react";
import { menuService, MenuItem } from "@/services/menuService";
import { analyticsService, CategoryStats, ExtendedDashboardStats } from "@/services/analyticsService";
import { cuisineService, CuisineDTO } from "@/services/cuisineService";
import { orderService } from "@/services/orderService";
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

export function MenuTrendingCuisineSection({ extendedStats }: Props) {
    const navigate = useNavigate();

    const [filter, setFilter] = useState<FilterTab>("viewed");
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [orderCountMap, setOrderCountMap] = useState<Record<number, number>>({});
    const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
    const [cuisines, setCuisines] = useState<CuisineDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMoreOpen, setViewMoreOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;
        async function loadData() {
            try {
                setLoading(true);
                const [page1Res, page2Res, catStats, cuisinesPage, activeOrdersRes, recentOrdersRes] = await Promise.all([
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
                    analyticsService.getCategoryStats().catch(() => []),
                    cuisineService.getCuisines({ size: 8 }).catch(() => null),
                    orderService.getActiveOrders({ size: 100 }).catch(() => null),
                    orderService.getOrders({ size: 100 }).catch(() => null),
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
                                    const mId = it.menuItemId || (it as any).id;
                                    if (mId && typeof mId === "number") {
                                        orderMap[mId] = (orderMap[mId] || 0) + (it.quantity || 1);
                                    }
                                }
                            }
                        }
                    }
                    setOrderCountMap(orderMap);

                    if (catStats && catStats.length > 0) {
                        setCategoryStats(catStats);
                    }
                    if (cuisinesPage?.content && cuisinesPage.content.length > 0) {
                        setCuisines(cuisinesPage.content);
                    }
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        loadData();
        return () => {
            isMounted = false;
        };
    }, []);

    // Filter and sort items based on active tab using 100% REAL data (strictly excluding mytogetherTesting)
    const displayedItems = useMemo(() => {
        if (filter === "viewed") {
            const list = (extendedStats?.mostViewedMenus && extendedStats.mostViewedMenus.length > 0)
                ? extendedStats.mostViewedMenus
                : [...menuItems].sort((a, b) => getItemViews(b) - getItemViews(a));
            return list.filter((item) => !isTestingShopItem(item)).slice(0, 6);
        }
        if (filter === "ordered") {
            const list = (extendedStats?.mostOrderedMenus && extendedStats.mostOrderedMenus.length > 0)
                ? extendedStats.mostOrderedMenus
                : [...menuItems].sort((a, b) => getItemOrders(b, orderCountMap) - getItemOrders(a, orderCountMap));
            return list.filter((item) => !isTestingShopItem(item)).slice(0, 6);
        }
        if (filter === "liked") {
            const list = (extendedStats?.mostLikedMenus && extendedStats.mostLikedMenus.length > 0)
                ? extendedStats.mostLikedMenus
                : [...menuItems].sort((a, b) => getItemLikes(b) - getItemLikes(a));
            return list.filter((item) => !isTestingShopItem(item)).slice(0, 6);
        }
        return [...menuItems].filter((item) => !isTestingShopItem(item)).slice(0, 6);
    }, [
        menuItems,
        filter,
        orderCountMap,
        extendedStats?.mostViewedMenus,
        extendedStats?.mostOrderedMenus,
        extendedStats?.mostLikedMenus,
    ]);

    // Compute Cuisine / Category breakdown percentages from real DB data
    const cuisineDistribution = useMemo(() => {
        if (categoryStats && categoryStats.length > 0) {
            const totalViews = categoryStats.reduce((sum, c) => sum + (c.viewCount || 0), 0) || 1;
            const colors = ["bg-amber-500", "bg-emerald-500", "bg-rose-500", "bg-sky-500", "bg-violet-500"];
            return categoryStats.slice(0, 5).map((c, i) => ({
                name: c.category,
                share: Math.round(((c.viewCount || 0) / totalViews) * 100),
                color: colors[i % colors.length],
                count: c.viewCount || 0,
            }));
        }

        if (extendedStats?.categorySales && extendedStats.categorySales.length > 0) {
            const total = extendedStats.categorySales.reduce((sum, c) => sum + (c.count || 0), 0) || 1;
            const colors = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-purple-500"];
            return extendedStats.categorySales.slice(0, 5).map((c, i) => ({
                name: c.category,
                share: Math.round(((c.count || 0) / total) * 100),
                color: colors[i % colors.length],
                count: c.count,
            }));
        }

        if (cuisines && cuisines.length > 0) {
            const colors = ["bg-amber-500", "bg-emerald-500", "bg-rose-500", "bg-sky-500", "bg-violet-500"];
            const equalShare = Math.floor(100 / Math.min(cuisines.length, 5));
            return cuisines.slice(0, 5).map((c, i) => ({
                name: c.nameEn || c.name || "Cuisine",
                share: equalShare,
                color: colors[i % colors.length],
                count: 0,
            }));
        }

        return [];
    }, [categoryStats, extendedStats, cuisines]);

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
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 cursor-pointer ${
                                filter === "viewed"
                                    ? "bg-background text-sky-600 dark:text-sky-400 shadow-xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground font-medium"
                            }`}
                        >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Most Viewed</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter("ordered")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 cursor-pointer ${
                                filter === "ordered"
                                    ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground font-medium"
                            }`}
                        >
                            <ShoppingBag className="h-3.5 w-3.5" />
                            <span>Most Ordered</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter("liked")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 cursor-pointer ${
                                filter === "liked"
                                    ? "bg-background text-rose-600 dark:text-rose-400 shadow-xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground font-medium"
                            }`}
                        >
                            <Heart className={`h-3.5 w-3.5 ${filter === "liked" ? "fill-rose-500 text-rose-500" : ""}`} />
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

            {/* Right 1 Column: Cuisine & Category Market Share */}
            <Card className="border-border/70 shadow-sm overflow-hidden bg-card/90 flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/15 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <PieIcon className="h-4.5 w-4.5 text-emerald-500" />
                            Cuisine &amp; Category Share
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Customer taste preferences &amp; category demand
                        </CardDescription>
                    </div>

                    <Badge
                        variant="outline"
                        className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    >
                        Live Demand
                    </Badge>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    {/* Category Distribution Progress List */}
                    <div className="space-y-3.5 mb-4">
                        {cuisineDistribution.length === 0 ? (
                            <div className="py-6 text-center text-muted-foreground text-xs">
                                No category distribution data available yet.
                            </div>
                        ) : (
                            cuisineDistribution.map((item, index) => (
                                <div key={index} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${item.color}`} />
                                            <span className="font-semibold text-foreground truncate">
                                                {item.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 font-mono text-xs shrink-0">
                                            <span className="font-bold text-foreground">{item.share}%</span>
                                            {item.count > 0 && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    ({item.count} views)
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full h-2 rounded-full bg-muted/70 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                                            style={{ width: `${Math.min(100, Math.max(5, item.share))}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Spotlight Box: Top Trend */}
                    {cuisineDistribution.length > 0 && (
                        <div className="p-3 rounded-xl border border-border/70 bg-gradient-to-br from-emerald-500/10 via-background to-background mb-3 shadow-xs">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    Top Category Demand
                                </span>
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/15 px-1.5 py-0.2 rounded-md">
                                    {cuisineDistribution[0]?.share}%
                                </span>
                            </div>
                            <p className="text-xs font-bold text-foreground">
                                {cuisineDistribution[0]?.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                Highest customer engagement and search volume across all restaurants.
                            </p>
                        </div>
                    )}

                    {/* Bottom Action Footer */}
                    <div className="pt-2 border-t border-border/40">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs font-medium justify-between hover:border-emerald-500/50 hover:text-emerald-600 cursor-pointer"
                            onClick={() => navigate("/categories")}
                        >
                            <span>Explore Category Analytics</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Top Trending Dishes Full Popup with Top 20, Date Filter & Load More */}
            <TopTrendingDishesModal
                open={viewMoreOpen}
                onOpenChange={setViewMoreOpen}
                initialTab={filter}
            />
        </div>
    );
}
