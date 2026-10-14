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
    Store,
    Eye,
    ShoppingBag,
    Heart,
    Search,
    X,
    Star,
    MapPin,
    ArrowUpRight,
    RotateCcw,
    Sparkles,
} from "lucide-react";
import { analyticsService, type TrendingShopItem } from "@/services/analyticsService";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialTab?: "viewed" | "ordered" | "liked";
}

type TabType = "viewed" | "ordered" | "liked";

export function TopTrendingShopsModal({
    open,
    onOpenChange,
    initialTab = "viewed",
}: Props) {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    const [search, setSearch] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

    // Telemetry items from real API
    const [mostViewed, setMostViewed] = useState<TrendingShopItem[]>([]);
    const [mostOrdered, setMostOrdered] = useState<TrendingShopItem[]>([]);
    const [mostLiked, setMostLiked] = useState<TrendingShopItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Pagination
    const PAGE_CHUNK = 16;
    const [visibleCount, setVisibleCount] = useState<number>(PAGE_CHUNK);

    // Sync tab when opening
    useEffect(() => {
        if (open) {
            setActiveTab(initialTab);
            setVisibleCount(PAGE_CHUNK);
        }
    }, [open, initialTab]);

    // Fetch real telemetry from backend DB
    const fetchShops = useCallback(async () => {
        setLoading(true);
        try {
            const res = await analyticsService.getTopTrendingShops({ limit: 80 }).catch(() => null);
            if (res) {
                setMostViewed(res.mostViewed || []);
                setMostOrdered(res.mostOrdered || []);
                setMostLiked(res.mostLiked || []);
            }
        } catch (err) {
            console.error("Failed to load trending shops:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            fetchShops();
        }
    }, [open, fetchShops]);

    // Active dataset based on tab
    const currentDataset = useMemo(() => {
        if (activeTab === "viewed") return mostViewed;
        if (activeTab === "ordered") return mostOrdered;
        return mostLiked;
    }, [activeTab, mostViewed, mostOrdered, mostLiked]);

    // Extract unique categories
    const categories = useMemo(() => {
        const set = new Set<string>();
        currentDataset.forEach((s) => {
            if (s.category && s.category.trim()) {
                set.add(s.category.trim());
            }
        });
        return Array.from(set).sort();
    }, [currentDataset]);

    // Filter by search & category
    const filteredShops = useMemo(() => {
        let list = currentDataset;

        if (selectedCategory !== "ALL") {
            list = list.filter((s) => s.category?.toLowerCase() === selectedCategory.toLowerCase());
        }

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((s) => {
                const name = (s.name || s.nameEn || "").toLowerCase();
                const cat = (s.category || "").toLowerCase();
                const dist = (s.district || "").toLowerCase();
                return name.includes(q) || cat.includes(q) || dist.includes(q);
            });
        }

        return list;
    }, [currentDataset, selectedCategory, search]);

    const paginatedShops = useMemo(() => {
        return filteredShops.slice(0, visibleCount);
    }, [filteredShops, visibleCount]);

    const hasMore = visibleCount < filteredShops.length;

    const handleReset = () => {
        setSearch("");
        setSelectedCategory("ALL");
        setVisibleCount(PAGE_CHUNK);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl w-[96vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl">
                {/* ── Dialog Header ────────────────────────────────────────── */}
                <DialogHeader className="p-4 sm:p-5 border-b border-border/50 bg-muted/20 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-0.5">
                            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                                <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <Store className="h-4.5 w-4.5" />
                                </span>
                                <span>Top Trending Restaurants &amp; Shops</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Real database telemetry across restaurants &amp; partner shops • {filteredShops.length} venues mapped
                            </DialogDescription>
                        </div>

                        {/* Segment Tab Switcher */}
                        <div className="flex items-center bg-muted/80 p-0.5 rounded-xl border border-border/70 text-xs shrink-0 self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab("viewed");
                                    setVisibleCount(PAGE_CHUNK);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    activeTab === "viewed"
                                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-xs"
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
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    activeTab === "ordered"
                                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-xs"
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
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    activeTab === "liked"
                                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-xs"
                                        : "text-muted-foreground hover:text-foreground font-medium"
                                }`}
                            >
                                <Heart className="h-3.5 w-3.5" />
                                <span>Most Liked</span>
                            </button>
                        </div>
                    </div>

                    {/* Filter Strip: Search Input & Category Pills */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-border/40">
                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search by restaurant name, category, district..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 h-8 text-xs bg-background/80"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Category Selector & Reset */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/50 text-[11px]">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCategory("ALL")}
                                    className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
                                        selectedCategory === "ALL"
                                            ? "bg-background text-foreground font-bold shadow-2xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    All Categories
                                </button>
                                {categories.slice(0, 4).map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-2 py-0.5 rounded-md cursor-pointer transition-all truncate max-w-[100px] ${
                                            selectedCategory === cat
                                                ? "bg-background text-foreground font-bold shadow-2xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {(search || selectedCategory !== "ALL") && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReset}
                                    className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
                                    title="Reset Filters"
                                >
                                    <RotateCcw className="h-3 w-3" />
                                    <span>Reset</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {/* ── Dialog Body: Ranked Shops Grid ────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-h-[380px] max-h-[60vh]">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="p-3.5 rounded-xl border border-border/50 flex items-center gap-3 bg-muted/20"
                                >
                                    <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : paginatedShops.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                            <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                                <Store className="h-6 w-6" />
                            </div>
                            <p className="font-semibold text-foreground text-sm">No venues matched your criteria</p>
                            <p className="text-xs text-muted-foreground max-w-sm">
                                Try clearing your search keyword or switching categories to see more restaurants.
                            </p>
                            <Button variant="outline" size="sm" onClick={handleReset} className="mt-2 text-xs">
                                Clear Filters
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {paginatedShops.map((shop, index) => {
                                const rank = index + 1;
                                const rankBadgeStyle =
                                    rank === 1
                                        ? "bg-amber-500 text-slate-950 font-black shadow-xs ring-1 ring-amber-400"
                                        : rank === 2
                                        ? "bg-slate-300 text-slate-900 font-bold"
                                        : rank === 3
                                        ? "bg-amber-700/80 text-amber-100 font-bold"
                                        : "bg-muted text-muted-foreground font-semibold";

                                return (
                                    <div
                                        key={shop.id}
                                        onClick={() => {
                                            onOpenChange(false);
                                            navigate(`/shops/${shop.id}`);
                                        }}
                                        className="group relative p-3.5 rounded-2xl border border-border/70 bg-card/80 hover:bg-muted/30 hover:border-emerald-500/40 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md"
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Rank Badge */}
                                            <div
                                                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shrink-0 font-mono ${rankBadgeStyle}`}
                                            >
                                                #{rank}
                                            </div>

                                            {/* Logo / Thumbnail */}
                                            <div className="relative h-13 w-13 rounded-xl overflow-hidden bg-muted/60 shrink-0 border border-border/50">
                                                {shop.logoUrl || shop.coverUrl ? (
                                                    <img
                                                        src={shop.logoUrl || shop.coverUrl!}
                                                        alt={shop.name}
                                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => {
                                                            (e.target as HTMLElement).style.display = "none";
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-muted/40">
                                                        <Store className="h-5 w-5" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-emerald-500 transition-colors">
                                                    {shop.name}
                                                </h4>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[9px] px-1.5 py-0 h-4 bg-muted/70 text-muted-foreground font-medium truncate max-w-[110px]"
                                                    >
                                                        {shop.category}
                                                    </Badge>
                                                    {shop.ratingAvg > 0 && (
                                                        <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-0.5">
                                                            <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                                                            {shop.ratingAvg.toFixed(1)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 truncate">
                                                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                                                    <span className="truncate">{shop.district || "Bangkok"}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Bottom Metric Strip */}
                                        <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-2">
                                                {activeTab === "viewed" && (
                                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                                        <Eye className="h-3 w-3" />
                                                        {shop.viewCount.toLocaleString()} views
                                                    </span>
                                                )}
                                                {activeTab === "ordered" && (
                                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                                        <ShoppingBag className="h-3 w-3" />
                                                        {shop.orderCount.toLocaleString()} orders
                                                    </span>
                                                )}
                                                {activeTab === "liked" && (
                                                    <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                                                        <Heart className="h-3 w-3 fill-rose-500/30" />
                                                        {shop.likeCount.toLocaleString()} likes
                                                    </span>
                                                )}
                                            </div>

                                            <span className="text-[10px] text-muted-foreground group-hover:text-emerald-500 transition-colors flex items-center gap-0.5 font-medium">
                                                <span>View Shop</span>
                                                <ArrowUpRight className="h-3 w-3" />
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Load More Button */}
                    {hasMore && !loading && (
                        <div className="mt-4 flex justify-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setVisibleCount((prev) => prev + PAGE_CHUNK)}
                                className="text-xs gap-1.5 border-border/70 cursor-pointer hover:border-emerald-500/40"
                            >
                                <Sparkles className="h-3 w-3 text-emerald-500" />
                                <span>Load More ({filteredShops.length - visibleCount} remaining)</span>
                            </Button>
                        </div>
                    )}
                </div>

                {/* ── Dialog Footer ────────────────────────────────────────── */}
                <div className="p-3 px-5 border-t border-border/50 bg-muted/15 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                        Showing <strong>{Math.min(visibleCount, filteredShops.length)}</strong> of <strong>{filteredShops.length}</strong> real ranked venues
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-7 text-xs">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
