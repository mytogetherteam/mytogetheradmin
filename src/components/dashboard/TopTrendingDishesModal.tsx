import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Flame,
    UtensilsCrossed,
    Store,
    ArrowUpRight,
    Eye,
    ShoppingBag,
    Heart,
    Calendar,
    Search,
    ChevronDown,
    Loader2,
    X,
    RotateCcw,
    Sparkles,
} from "lucide-react";
import { menuService, MenuItem } from "@/services/menuService";
import { orderService } from "@/services/orderService";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialTab?: "viewed" | "ordered" | "liked";
}

type TabType = "viewed" | "ordered" | "liked";
type DatePreset = "ALL_TIME" | "TODAY" | "WEEK" | "MONTH" | "CUSTOM";

function isTestingShopItem(item: MenuItem): boolean {
    const sName = (
        item.shopName ||
        (item as any).shop?.nameEn ||
        (item as any).shop?.nameMm ||
        ""
    ).toLowerCase().replace(/\s+/g, "");
    return sName.includes("mytogethertesting") || sName.includes("testingshop");
}

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

export function TopTrendingDishesModal({
    open,
    onOpenChange,
    initialTab = "viewed",
}: Props) {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    const [datePreset, setDatePreset] = useState<DatePreset>("ALL_TIME");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [search, setSearch] = useState<string>("");

    // Raw loaded items & orders
    const [rawMenuItems, setRawMenuItems] = useState<MenuItem[]>([]);
    const [orderMap, setOrderMap] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(false);

    // Pagination "Load More" state
    const PAGE_CHUNK = 20;
    const [visibleCount, setVisibleCount] = useState<number>(PAGE_CHUNK);
    const [loadingMore, setLoadingMore] = useState(false);

    // Sync tab when opening
    useEffect(() => {
        if (open) {
            setActiveTab(initialTab);
            setVisibleCount(PAGE_CHUNK);
        }
    }, [open, initialTab]);

    // Handle Date Presets
    const handleSetPreset = (preset: DatePreset) => {
        setDatePreset(preset);
        const now = new Date();

        if (preset === "ALL_TIME") {
            setStartDate("");
            setEndDate("");
        } else if (preset === "TODAY") {
            const todayStr = now.toISOString().split("T")[0];
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (preset === "WEEK") {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            setStartDate(weekAgo.toISOString().split("T")[0]);
            setEndDate(now.toISOString().split("T")[0]);
        } else if (preset === "MONTH") {
            const monthAgo = new Date();
            monthAgo.setDate(now.getDate() - 30);
            setStartDate(monthAgo.toISOString().split("T")[0]);
            setEndDate(now.toISOString().split("T")[0]);
        }
        setVisibleCount(PAGE_CHUNK);
    };

    // Load full catalog items & orders matching date filter
    const loadData = useCallback(async () => {
        if (!open) return;
        setLoading(true);
        try {
            // Fetch comprehensive menu items pool (up to 300 items across shops)
            const [page1Res, page2Res, page3Res, ordersRes, activeOrdersRes] = await Promise.all([
                menuService.getAllMenuItems(1, 100, "", undefined, undefined, undefined, {
                    isAvailable: true,
                }).catch(() => null),
                menuService.getAllMenuItems(2, 100, "", undefined, undefined, undefined, {
                    isAvailable: true,
                }).catch(() => null),
                menuService.getAllMenuItems(3, 100, "", undefined, undefined, undefined, {
                    isAvailable: true,
                }).catch(() => null),
                orderService.getOrders({
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                    size: 100,
                }).catch(() => null),
                orderService.getActiveOrders({ size: 100 }).catch(() => null),
            ]);

            // Unique menu items excluding test shop
            const raw = [
                ...(page1Res?.content || []),
                ...(page2Res?.content || []),
                ...(page3Res?.content || []),
            ];
            const seen = new Set<number>();
            const uniqueItems = raw.filter((it) => {
                if (!it.id || seen.has(it.id)) return false;
                seen.add(it.id);
                return !isTestingShopItem(it);
            });
            setRawMenuItems(uniqueItems);

            // Compute order counts for dishes from orders within date filter
            const countMap: Record<number, number> = {};
            const isTestingOrder = (ord: any): boolean => {
                const sName = (
                    ord.shopName ||
                    ord.shop?.nameEn ||
                    ord.shop?.nameMm ||
                    ""
                ).toLowerCase().replace(/\s+/g, "");
                return sName.includes("mytogethertesting") || sName.includes("testingshop");
            };

            const allOrders = [
                ...(ordersRes?.content || []),
                ...(activeOrdersRes?.content || []),
            ];

            const seenOrderIds = new Set<string | number>();
            for (const ord of allOrders) {
                if (ord.id && !seenOrderIds.has(ord.id)) {
                    seenOrderIds.add(ord.id);
                    if (isTestingOrder(ord)) continue;

                    // If date range is active, check order date
                    if (startDate || endDate) {
                        const ordDate = ord.createdAt ? ord.createdAt.split("T")[0] : "";
                        if (startDate && ordDate < startDate) continue;
                        if (endDate && ordDate > endDate) continue;
                    }

                    if (Array.isArray(ord.items)) {
                        for (const it of ord.items) {
                            const mId = it.menuItemId || (it as any).id;
                            if (mId && typeof mId === "number") {
                                countMap[mId] = (countMap[mId] || 0) + (it.quantity || 1);
                            }
                        }
                    }
                }
            }
            setOrderMap(countMap);
        } finally {
            setLoading(false);
        }
    }, [open, startDate, endDate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filter, sort and rank the items for the current active tab
    const allRankedItems = useMemo(() => {
        let pool = [...rawMenuItems];

        // Search query filter
        if (search.trim()) {
            const q = search.toLowerCase();
            pool = pool.filter((it) => {
                const name = (it.name || it.nameEn || it.nameMm || "").toLowerCase();
                const shop = (it.shopName || (it as any).shop?.nameEn || "").toLowerCase();
                return name.includes(q) || shop.includes(q);
            });
        }

        // Sorting according to active tab
        if (activeTab === "viewed") {
            pool.sort((a, b) => getItemViews(b) - getItemViews(a));
        } else if (activeTab === "ordered") {
            pool.sort((a, b) => getItemOrders(b, orderMap) - getItemOrders(a, orderMap));
        } else if (activeTab === "liked") {
            pool.sort((a, b) => getItemLikes(b) - getItemLikes(a));
        }

        return pool;
    }, [rawMenuItems, activeTab, orderMap, search]);

    // Paginated slice: starts at top 20, expands by 20 on "Load More"
    const displayedItems = useMemo(() => {
        return allRankedItems.slice(0, visibleCount);
    }, [allRankedItems, visibleCount]);

    const hasMore = visibleCount < allRankedItems.length;

    const handleLoadMore = () => {
        setLoadingMore(true);
        setTimeout(() => {
            setVisibleCount((prev) => prev + PAGE_CHUNK);
            setLoadingMore(false);
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-[96vw] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border/80 shadow-2xl">
                {/* ── Header ─────────────────────────────────────────────── */}
                <DialogHeader className="p-5 pb-3 border-b border-border/50 bg-muted/20 shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                                <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                    <Flame className="h-5 w-5 fill-orange-500" />
                                </span>
                                Top Trending Dishes &amp; Best Sellers (Ranked View)
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                Customer discovery telemetry, confirmed orders &amp; customer favorites across restaurants
                            </DialogDescription>
                        </div>

                        {/* Total Count Badge */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                                <Sparkles className="h-3 w-3" />
                                {allRankedItems.length} Dishes Ranked
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground bg-muted">
                                {datePreset === "ALL_TIME" ? "All Time" : "Date Filtered"}
                            </span>
                        </div>
                    </div>

                    {/* ── Tabs & Date Filter Controls Strip ─────────────────── */}
                    <div className="mt-3.5 space-y-3">
                        {/* Row 1: 3 Main Tabs (Most Viewed, Most Ordered, Most Liked) */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/70 border border-border/60 text-xs">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveTab("viewed");
                                        setVisibleCount(PAGE_CHUNK);
                                    }}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all duration-200 cursor-pointer ${
                                        activeTab === "viewed"
                                            ? "bg-background text-sky-600 dark:text-sky-400 shadow-xs font-bold"
                                            : "text-muted-foreground hover:text-foreground font-medium"
                                    }`}
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>Most Viewed</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveTab("ordered");
                                        setVisibleCount(PAGE_CHUNK);
                                    }}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all duration-200 cursor-pointer ${
                                        activeTab === "ordered"
                                            ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-xs font-bold"
                                            : "text-muted-foreground hover:text-foreground font-medium"
                                    }`}
                                >
                                    <ShoppingBag className="h-3.5 w-3.5" />
                                    <span>Most Ordered</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveTab("liked");
                                        setVisibleCount(PAGE_CHUNK);
                                    }}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all duration-200 cursor-pointer ${
                                        activeTab === "liked"
                                            ? "bg-background text-rose-600 dark:text-rose-400 shadow-xs font-bold"
                                            : "text-muted-foreground hover:text-foreground font-medium"
                                    }`}
                                >
                                    <Heart className={`h-3.5 w-3.5 ${activeTab === "liked" ? "fill-rose-500 text-rose-500" : ""}`} />
                                    <span>Most Liked</span>
                                </button>
                            </div>

                            {/* Search Box */}
                            <div className="relative flex-1 sm:w-56 min-w-[150px]">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setVisibleCount(PAGE_CHUNK);
                                    }}
                                    placeholder="Search dish or restaurant..."
                                    className="pl-8 h-8 text-xs bg-background/80"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Row 2: Date Filter (From Date to To Date, Default = All Time) */}
                        <div className="p-2.5 rounded-xl border border-border/60 bg-background/50 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                            {/* Preset Buttons */}
                            <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-[11px] font-medium text-muted-foreground mr-1 flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5 text-orange-500" />
                                    Date Filter:
                                </span>
                                {(
                                    [
                                        { key: "ALL_TIME", label: "All Time (Default)" },
                                        { key: "TODAY", label: "Today" },
                                        { key: "WEEK", label: "Last 7 Days" },
                                        { key: "MONTH", label: "Last 30 Days" },
                                    ] as const
                                ).map((p) => (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() => handleSetPreset(p.key)}
                                        className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                                            datePreset === p.key
                                                ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/30"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Date Pickers */}
                            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <span>From</span>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            setDatePreset("CUSTOM");
                                            setVisibleCount(PAGE_CHUNK);
                                        }}
                                        className="h-7 text-xs w-32 px-1.5 bg-background"
                                    />
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <span>To</span>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => {
                                            setEndDate(e.target.value);
                                            setDatePreset("CUSTOM");
                                            setVisibleCount(PAGE_CHUNK);
                                        }}
                                        className="h-7 text-xs w-32 px-1.5 bg-background"
                                    />
                                </div>
                                {(startDate || endDate) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSetPreset("ALL_TIME")}
                                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                                        title="Reset to All Time"
                                    >
                                        <RotateCcw className="h-3 w-3" />
                                        <span>Reset</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                {/* ── Content: Scrollable Top Dishes Grid (Load More Style) ─ */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 min-h-[350px]">
                    {loading && rawMenuItems.length === 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="p-3 rounded-xl border border-border/40 flex items-center gap-3"
                                >
                                    <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                    <Skeleton className="h-5 w-14" />
                                </div>
                            ))}
                        </div>
                    ) : displayedItems.length === 0 ? (
                        <div className="py-14 text-center text-muted-foreground border border-dashed border-border/70 rounded-xl bg-muted/10">
                            <UtensilsCrossed className="h-9 w-9 mx-auto mb-2 opacity-40 text-muted-foreground" />
                            <p className="text-xs font-semibold">No dishes found matching filter</p>
                            <p className="text-[11px] opacity-75 mt-0.5">
                                Try selecting "All Time" date filter or clear your search query.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {displayedItems.map((item, index) => {
                                const rankColors = [
                                    "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 font-black",
                                    "bg-slate-400/20 text-slate-600 dark:text-slate-300 border-slate-400/40 font-black",
                                    "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/40 font-black",
                                ];
                                const rankBadge =
                                    index < 3
                                        ? rankColors[index]
                                        : "bg-muted text-muted-foreground border-border/60 font-semibold";

                                const displayName = item.name || item.nameEn || item.nameMm || "Dish";
                                const shopName =
                                    item.shopName ||
                                    (item as any).shop?.nameEn ||
                                    (item as any).shop?.nameMm ||
                                    "Partner Restaurant";
                                const rawPrice = item.price ?? (item as any).originalPrice ?? item.mediumPrice;
                                const formattedPrice =
                                    rawPrice != null && rawPrice > 0 ? `฿${rawPrice.toLocaleString()}` : "—";

                                return (
                                    <div
                                        key={item.id || index}
                                        onClick={() => {
                                            onOpenChange(false);
                                            navigate(`/menu/items?search=${encodeURIComponent(displayName)}`);
                                        }}
                                        className="group relative p-3 rounded-xl border border-border/70 hover:border-orange-500/50 bg-background/90 hover:bg-muted/30 transition-all duration-200 cursor-pointer shadow-xs flex items-center gap-3"
                                    >
                                        {/* Rank Badge */}
                                        <div
                                            className={`h-6 w-6 rounded-full flex items-center justify-center text-xs border shrink-0 ${rankBadge}`}
                                        >
                                            {index + 1}
                                        </div>

                                        {/* Thumbnail */}
                                        <div className="h-14 w-14 rounded-xl bg-muted/60 border border-border/60 overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
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
                                                <UtensilsCrossed className="h-6 w-6 text-muted-foreground/50" />
                                            )}
                                        </div>

                                        {/* Info */}
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
                                                <span className="truncate">{shopName}</span>
                                            </div>
                                        </div>

                                        {/* Price & Metric Badge */}
                                        <div className="text-right shrink-0">
                                            <span className="text-xs font-bold font-mono text-foreground block">
                                                {formattedPrice}
                                            </span>

                                            {activeTab === "viewed" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded-md mt-1">
                                                    <Eye className="h-2.5 w-2.5" />
                                                    {getItemViews(item).toLocaleString()} views
                                                </span>
                                            )}
                                            {activeTab === "ordered" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md mt-1">
                                                    <ShoppingBag className="h-2.5 w-2.5" />
                                                    {getItemOrders(item, orderMap).toLocaleString()} orders
                                                </span>
                                            )}
                                            {activeTab === "liked" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md mt-1">
                                                    <Heart className="h-2.5 w-2.5 fill-rose-500" />
                                                    {getItemLikes(item).toLocaleString()} likes
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Pagination Load More Button ───────────────────────── */}
                    {!loading && allRankedItems.length > 0 && (
                        <div className="pt-3 pb-1 text-center">
                            {hasMore ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="w-full sm:w-auto px-6 h-9 text-xs font-semibold gap-2 border-border/80 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-all cursor-pointer shadow-xs"
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            <span>Loading next 20 dishes...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="h-3.5 w-3.5 text-orange-500" />
                                            <span>
                                                Load More Dishes ({displayedItems.length} of {allRankedItems.length})
                                            </span>
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <div className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 py-2">
                                    <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                                    <span>
                                        Showing all {allRankedItems.length} dishes in this category • All ranked dishes loaded
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Modal Footer ───────────────────────────────────────── */}
                <div className="p-4 border-t border-border/50 bg-muted/15 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Flame className="h-3.5 w-3.5 text-orange-500" />
                        <span>
                            Displaying {displayedItems.length} of {allRankedItems.length} ranked dishes (100% Real Database Telemetry)
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-medium cursor-pointer"
                            onClick={() => onOpenChange(false)}
                        >
                            Close
                        </Button>

                        <Button
                            variant="default"
                            size="sm"
                            className="h-8 text-xs font-semibold gap-1 bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
                            onClick={() => {
                                onOpenChange(false);
                                navigate("/menu/items");
                            }}
                        >
                            <span>Manage Full Menu Catalog</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
