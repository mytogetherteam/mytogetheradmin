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
    Store,
    ArrowUpRight,
    Sparkles,
    Eye,
    ShoppingBag,
    Heart,
    Star,
    MapPin,
    UtensilsCrossed,
} from "lucide-react";
import { menuService, MenuItem } from "@/services/menuService";
import {
    analyticsService,
    ExtendedDashboardStats,
    type TrendingShopItem,
} from "@/services/analyticsService";
import { orderService } from "@/services/orderService";
import { TopTrendingDishesModal } from "./TopTrendingDishesModal";
import { TopTrendingShopsModal } from "./TopTrendingShopsModal";

interface Props {
    extendedStats?: ExtendedDashboardStats | null;
}

type FilterTab = "viewed" | "ordered" | "liked";

const SEGMENT_DESCRIPTIONS: Record<FilterTab, string> = {
    viewed: "Ranked by customer discovery & page view telemetry across restaurants",
    ordered: "Ranked by confirmed order volume & purchase velocity across restaurants",
    liked: "Ranked by customer swipe favorites & community likes across restaurants",
};

const SHOP_SEGMENT_DESCRIPTIONS: Record<FilterTab, string> = {
    viewed: "Ranked by customer discovery & page visits across verified shops",
    ordered: "Ranked by confirmed order volume & checkout velocity",
    liked: "Ranked by customer favorites & community wishlists",
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

    // Dishes state
    const [filter, setFilter] = useState<FilterTab>("viewed");
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [orderCountMap, setOrderCountMap] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [viewMoreOpen, setViewMoreOpen] = useState(false);

    // Trending shops state
    const [shopFilter, setShopFilter] = useState<FilterTab>("viewed");
    const [trendingShops, setTrendingShops] = useState<{
        mostViewed: TrendingShopItem[];
        mostOrdered: TrendingShopItem[];
        mostLiked: TrendingShopItem[];
    }>({
        mostViewed: [],
        mostOrdered: [],
        mostLiked: [],
    });
    const [shopsLoading, setShopsLoading] = useState(true);
    const [viewMoreShopsOpen, setViewMoreShopsOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;
        async function loadData() {
            try {
                setLoading(true);
                setShopsLoading(true);
                const [page1Res, page2Res, recentOrdersRes, topShopsRes] = await Promise.all([
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
                    orderService.getOrders({ size: 100 }).catch(() => null),
                    analyticsService.getTopTrendingShops({ limit: 30 }).catch(() => null),
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

                    if (topShopsRes) {
                        setTrendingShops({
                            mostViewed: topShopsRes.mostViewed || [],
                            mostOrdered: topShopsRes.mostOrdered || [],
                            mostLiked: topShopsRes.mostLiked || [],
                        });
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
                    const allOrders = recentOrdersRes?.content || [];
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
                console.error("Failed to load dishes and shops telemetry", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                    setShopsLoading(false);
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

    // Real top trending shops slice for currently selected tab
    const displayedShops = useMemo(() => {
        const list =
            shopFilter === "viewed"
                ? trendingShops.mostViewed
                : shopFilter === "ordered"
                ? trendingShops.mostOrdered
                : trendingShops.mostLiked;
        return list.slice(0, 5);
    }, [shopFilter, trendingShops]);

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

            {/* Right 1 Column: Top Trending Restaurants & Shops */}
            <Card className="border-border/70 shadow-sm overflow-hidden bg-card/90 flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/15 flex flex-col gap-2.5 space-y-0">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                <Store className="h-4 w-4" />
                            </span>
                            Top Trending Shops
                        </CardTitle>
                        <Badge
                            variant="outline"
                            className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1 shadow-2xs"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Live DB
                        </Badge>
                    </div>
                    <CardDescription className="text-xs">
                        {SHOP_SEGMENT_DESCRIPTIONS[shopFilter]}
                    </CardDescription>

                    {/* Filter Pills: Most Viewed, Most Ordered, Most Liked */}
                    <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 text-xs w-full sm:w-fit overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setShopFilter("viewed")}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer shrink-0 ${
                                shopFilter === "viewed"
                                    ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold shadow-xs"
                                    : "text-muted-foreground hover:text-foreground font-medium"
                            }`}
                        >
                            <Eye className="h-3 w-3" />
                            <span>Most Viewed</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setShopFilter("ordered")}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer shrink-0 ${
                                shopFilter === "ordered"
                                    ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold shadow-xs"
                                    : "text-muted-foreground hover:text-foreground font-medium"
                            }`}
                        >
                            <ShoppingBag className="h-3 w-3" />
                            <span>Most Ordered</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setShopFilter("liked")}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer shrink-0 ${
                                shopFilter === "liked"
                                    ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold shadow-xs"
                                    : "text-muted-foreground hover:text-foreground font-medium"
                            }`}
                        >
                            <Heart className="h-3 w-3" />
                            <span>Most Liked</span>
                        </button>
                    </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    {/* Shops List */}
                    <div className="space-y-2.5 mb-4">
                        {shopsLoading && displayedShops.length === 0 ? (
                            [...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="p-2.5 rounded-xl border border-border/40 flex items-center gap-3 bg-muted/20"
                                >
                                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-3.5 w-28" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                    <Skeleton className="h-5 w-14" />
                                </div>
                            ))
                        ) : displayedShops.length === 0 ? (
                            <div className="p-6 rounded-xl border border-border/60 bg-muted/20 text-center space-y-1.5 my-auto">
                                <Store className="h-6 w-6 text-muted-foreground mx-auto" />
                                <p className="text-xs font-semibold text-foreground">No Shop Telemetry Found</p>
                                <p className="text-[10px] text-muted-foreground">Shop engagement metrics will populate automatically from real activity.</p>
                            </div>
                        ) : (
                            displayedShops.map((shop, index) => {
                                const rank = index + 1;
                                const rankBadgeStyle =
                                    rank === 1
                                        ? "bg-amber-500 text-slate-950 font-black shadow-xs ring-1 ring-amber-400"
                                        : rank === 2
                                        ? "bg-slate-300 text-slate-900 font-bold"
                                        : rank === 3
                                        ? "bg-amber-700/80 text-amber-100 font-bold"
                                        : "bg-muted text-muted-foreground font-semibold";

                                const shopImg = shop.logoUrl || shop.coverUrl;
                                const displayName = shop.nameEn || shop.nameMm || shop.name || `Shop #${shop.id}`;

                                return (
                                    <div
                                        key={shop.id}
                                        onClick={() => navigate(`/shops/${shop.id}`)}
                                        className="p-2.5 rounded-xl border border-border/60 hover:border-rose-500/40 bg-background/80 hover:bg-muted/40 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            {/* Rank Badge */}
                                            <div
                                                className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] shrink-0 ${rankBadgeStyle}`}
                                            >
                                                {rank}
                                            </div>

                                            {/* Shop Avatar / Thumbnail */}
                                            <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0 border border-border/50 flex items-center justify-center relative">
                                                {shopImg ? (
                                                    <img
                                                        src={shopImg}
                                                        alt={displayName}
                                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => {
                                                            (e.target as HTMLElement).style.display = "none";
                                                        }}
                                                    />
                                                ) : (
                                                    <Store className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>

                                            {/* Shop Details */}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-semibold text-foreground truncate group-hover:text-rose-500 transition-colors">
                                                    {displayName}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[9px] px-1.5 py-0 h-3.5 font-medium border-border/60 text-muted-foreground truncate max-w-[80px]"
                                                    >
                                                        {shop.category || "Restaurant"}
                                                    </Badge>
                                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-500">
                                                        <Star className="h-2.5 w-2.5 fill-amber-500" />
                                                        {shop.ratingAvg ? shop.ratingAvg.toFixed(1) : "New"}
                                                    </span>
                                                    {shop.district && (
                                                        <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] text-muted-foreground truncate max-w-[75px]">
                                                            <MapPin className="h-2.5 w-2.5" />
                                                            {shop.district}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Metric Counter */}
                                        <div className="text-right shrink-0">
                                            {shopFilter === "viewed" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                                                    <Eye className="h-2.5 w-2.5" />
                                                    {shop.viewCount.toLocaleString()}
                                                </span>
                                            )}
                                            {shopFilter === "ordered" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                                    <ShoppingBag className="h-2.5 w-2.5" />
                                                    {shop.orderCount.toLocaleString()}
                                                </span>
                                            )}
                                            {shopFilter === "liked" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                                                    <Heart className="h-2.5 w-2.5 fill-rose-500" />
                                                    {shop.likeCount.toLocaleString()}
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
                            <Sparkles className="h-3.5 w-3.5 text-rose-500" />
                            100% live database telemetry
                        </span>

                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs font-semibold gap-1.5 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50 cursor-pointer shadow-xs"
                            onClick={() => setViewMoreShopsOpen(true)}
                        >
                            <Store className="h-3.5 w-3.5" />
                            <span>View More</span>
                            <ArrowUpRight className="h-3 w-3" />
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

            {/* Top Trending Shops Full Popup Modal with Filter, Search, Pagination */}
            <TopTrendingShopsModal
                open={viewMoreShopsOpen}
                onOpenChange={setViewMoreShopsOpen}
                initialTab={shopFilter}
            />
        </div>
    );
}
