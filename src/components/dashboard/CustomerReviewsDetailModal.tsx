import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
    Star,
    MessageSquare,
    Search,
    ArrowUpRight,
    Loader2,
    ThumbsUp,
    Store,
    Utensils,
    Calendar,
    ShieldCheck,
    Image as ImageIcon,
    ChevronDown,
    X,
    Sparkles,
} from "lucide-react";
import { reviewService, Review, ReviewType } from "@/services/reviewService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    totalReviewsCount?: number;
}

type ReviewCategoryTab = "ALL" | "SHOPS" | "ITEMS";
type RatingFilter = "ALL" | 5 | 4 | 3 | 2 | 1;

export function CustomerReviewsDetailModal({
    open,
    onOpenChange,
    totalReviewsCount = 0,
}: Props) {
    const navigate = useNavigate();

    // Data state
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalElements, setTotalElements] = useState(totalReviewsCount);

    // Filters
    const [categoryTab, setCategoryTab] = useState<ReviewCategoryTab>("ALL");
    const [ratingFilter, setRatingFilter] = useState<RatingFilter>("ALL");
    const [search, setSearch] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const PAGE_SIZE = 10;

    // Fetch reviews helper with pagination load more support
    const fetchReviewsData = useCallback(
        async (
            targetPage: number,
            cat: ReviewCategoryTab,
            rating: RatingFilter,
            query: string,
            isLoadMore = false
        ) => {
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }

            try {
                const filters = {
                    search: query.trim() || undefined,
                    rating: rating !== "ALL" ? rating : undefined,
                };

                let fetchedList: Review[] = [];
                let total = 0;

                if (cat === "ALL") {
                    // Fetch both shop and item reviews in parallel
                    const [shopRes, itemRes] = await Promise.all([
                        reviewService
                            .getReviews("SHOPS", targetPage, Math.ceil(PAGE_SIZE / 2), filters)
                            .catch(() => ({ content: [], totalElements: 0, totalPages: 0, number: 0 })),
                        reviewService
                            .getReviews("ITEMS", targetPage, Math.ceil(PAGE_SIZE / 2), filters)
                            .catch(() => ({ content: [], totalElements: 0, totalPages: 0, number: 0 })),
                    ]);

                    const combined = [...(shopRes.content || []), ...(itemRes.content || [])];
                    combined.sort((a, b) => {
                        const dateA = new Date(a.createdAt || 0).getTime();
                        const dateB = new Date(b.createdAt || 0).getTime();
                        return dateB - dateA;
                    });
                    fetchedList = combined;
                    total = (shopRes.totalElements || 0) + (itemRes.totalElements || 0);
                    setHasMore(targetPage + 1 < Math.max(shopRes.totalPages || 0, itemRes.totalPages || 0));
                } else {
                    const res = await reviewService.getReviews(
                        cat as ReviewType,
                        targetPage,
                        PAGE_SIZE,
                        filters
                    );
                    fetchedList = res.content || [];
                    total = res.totalElements || 0;
                    setHasMore(targetPage + 1 < (res.totalPages || 0));
                }

                if (isLoadMore) {
                    setReviews((prev) => {
                        const seenIds = new Set(prev.map((r) => r.id));
                        const uniqueNew = fetchedList.filter((r) => !seenIds.has(r.id));
                        return [...prev, ...uniqueNew];
                    });
                } else {
                    setReviews(fetchedList);
                }

                setTotalElements(total);
                setPage(targetPage);
            } catch (err) {
                handleApiError(err, "Failed to load customer reviews");
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        []
    );

    // Initial load and filter change trigger
    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(() => {
            fetchReviewsData(0, categoryTab, ratingFilter, search, false);
        }, 200);
        return () => clearTimeout(timer);
    }, [open, categoryTab, ratingFilter, search, fetchReviewsData]);

    // Handle "Load More" click
    const handleLoadMore = () => {
        if (loadingMore || !hasMore) return;
        fetchReviewsData(page + 1, categoryTab, ratingFilter, search, true);
    };

    // Handle visibility toggle directly in modal
    const handleToggleVisibility = async (review: Review) => {
        const reviewType: ReviewType = review.itemName ? "ITEMS" : "SHOPS";
        const newVisible = !review.isVisible;
        try {
            await reviewService.toggleVisibility(reviewType, review.id, newVisible);
            setReviews((prev) =>
                prev.map((r) => (r.id === review.id ? { ...r, isVisible: newVisible } : r))
            );
            toast.success(
                newVisible ? "Review is now publicly visible" : "Review hidden from customers"
            );
        } catch (err) {
            handleApiError(err, "Failed to update review visibility");
        }
    };

    // Calculate rating distribution summary from current pool
    const ratingStats = useMemo(() => {
        const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let sum = 0;
        let count = 0;

        for (const r of reviews) {
            const stars = Math.max(1, Math.min(5, Math.round(r.rating || 5)));
            counts[stars] = (counts[stars] || 0) + 1;
            sum += r.rating || 5;
            count += 1;
        }

        const avg = count > 0 ? (sum / count).toFixed(1) : "5.0";
        return { counts, avg, count };
    }, [reviews]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-[96vw] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border/80 shadow-2xl">
                {/* ── Header ─────────────────────────────────────────────── */}
                <DialogHeader className="p-5 pb-3 border-b border-border/50 bg-muted/20 shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                                <span className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                    <Star className="h-5 w-5 fill-yellow-500" />
                                </span>
                                Customer Reviews &amp; Rating Breakdown
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                Verified diner feedback, satisfaction ratings &amp; customer comments
                            </DialogDescription>
                        </div>

                        {/* Top Summary Badges */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
                                <Star className="h-3.5 w-3.5 fill-yellow-500" />
                                {ratingStats.avg} Avg Score
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground bg-muted">
                                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                {totalElements || totalReviewsCount} Total Verified
                            </span>
                        </div>
                    </div>

                    {/* ── Rating Score & Sentiment Summary Strip ─────────────── */}
                    <div className="mt-3 p-3 rounded-xl border border-border/60 bg-background/60 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        {/* Overall Big Score */}
                        <div className="sm:col-span-3 flex items-center sm:flex-col sm:justify-center text-center gap-3 sm:gap-1 sm:border-r border-border/60 sm:pr-3">
                            <div className="text-3xl font-black font-mono text-foreground flex items-center gap-1">
                                {ratingStats.avg}
                                <span className="text-sm font-normal text-muted-foreground">/ 5</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`h-3.5 w-3.5 ${
                                            star <= Math.round(Number(ratingStats.avg))
                                                ? "text-yellow-500 fill-yellow-500"
                                                : "text-muted-foreground/30"
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                                Verified diner sentiment
                            </span>
                        </div>

                        {/* Star Progress Bars (5★ to 1★) */}
                        <div className="sm:col-span-6 space-y-1 sm:px-2">
                            {[5, 4, 3, 2, 1].map((s) => {
                                const count = ratingStats.counts[s] || 0;
                                const percent =
                                    ratingStats.count > 0
                                        ? Math.round((count / ratingStats.count) * 100)
                                        : 0;
                                return (
                                    <div key={s} className="flex items-center gap-2 text-[11px]">
                                        <span className="w-6 font-mono text-muted-foreground flex items-center gap-0.5 shrink-0">
                                            {s} <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
                                        </span>
                                        <div className="flex-1 h-1.5 rounded-full bg-muted/80 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-yellow-500 transition-all duration-500"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                        <span className="w-8 text-right font-mono text-muted-foreground text-[10px] shrink-0">
                                            {percent}%
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Quick Action Link to Review Moderation */}
                        <div className="sm:col-span-3 flex flex-col justify-center sm:border-l border-border/60 sm:pl-3 gap-1">
                            <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-yellow-500" />
                                Moderation Desk
                            </span>
                            <p className="text-[10px] text-muted-foreground leading-tight">
                                Toggle customer visibility or audit flagged reviews.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    onOpenChange(false);
                                    navigate("/reviews");
                                }}
                                className="h-7 text-xs mt-1 gap-1 justify-between hover:text-yellow-500 hover:border-yellow-500/40"
                            >
                                <span>All Reviews Table</span>
                                <ArrowUpRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    {/* ── Filters & Category Tabs ───────────────────────────── */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3">
                        {/* Review Type Tabs (All, Shops, Items) */}
                        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/60 border border-border/60 self-start">
                            <button
                                type="button"
                                onClick={() => setCategoryTab("ALL")}
                                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                    categoryTab === "ALL"
                                        ? "bg-background text-foreground shadow-xs font-semibold"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                All Reviews
                            </button>
                            <button
                                type="button"
                                onClick={() => setCategoryTab("SHOPS")}
                                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                    categoryTab === "SHOPS"
                                        ? "bg-background text-foreground shadow-xs font-semibold"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <Store className="h-3 w-3 text-amber-500" />
                                Restaurants
                            </button>
                            <button
                                type="button"
                                onClick={() => setCategoryTab("ITEMS")}
                                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                    categoryTab === "ITEMS"
                                        ? "bg-background text-foreground shadow-xs font-semibold"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <Utensils className="h-3 w-3 text-orange-500" />
                                Dishes &amp; Menus
                            </button>
                        </div>

                        {/* Star Rating Pills & Search */}
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            {/* Star Filter Pills */}
                            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/50 text-xs">
                                {(["ALL", 5, 4, 3, 2, 1] as const).map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRatingFilter(star)}
                                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                                            ratingFilter === star
                                                ? "bg-yellow-500 text-yellow-950 font-bold shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {star === "ALL" ? "All" : `${star}★`}
                                    </button>
                                ))}
                            </div>

                            {/* Search Box */}
                            <div className="relative flex-1 sm:w-48 min-w-[140px]">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search feedback..."
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
                    </div>
                </DialogHeader>

                {/* ── Content: Scrollable Review Message Cards with Load More ─ */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 min-h-[300px]">
                    {loading && reviews.length === 0 ? (
                        [...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3"
                            >
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-1.5 flex-1">
                                        <Skeleton className="h-3.5 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        ))
                    ) : reviews.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground border border-dashed border-border/70 rounded-xl bg-muted/10">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
                            <p className="text-xs font-semibold">No reviews found matching criteria</p>
                            <p className="text-[11px] opacity-75 mt-0.5">
                                Try selecting "All" stars or clearing your search term.
                            </p>
                        </div>
                    ) : (
                        reviews.map((item) => {
                            const dateStr = item.createdAt
                                ? new Date(item.createdAt).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                  })
                                : "Recent";

                            const targetName =
                                item.targetName ||
                                item.shopName ||
                                item.itemName ||
                                "Restaurant Partner";

                            const isItemReview = !!item.itemName;

                            return (
                                <div
                                    key={item.id}
                                    className="p-4 rounded-xl border border-border/70 bg-background/90 hover:border-yellow-500/40 transition-all duration-200 shadow-xs space-y-2.5"
                                >
                                    {/* Top Row: User Avatar, Name, Rating & Shop Target */}
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            {/* Avatar initial */}
                                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-yellow-500/20 to-amber-500/30 border border-yellow-500/30 flex items-center justify-center font-bold text-xs text-yellow-600 dark:text-yellow-400 shrink-0">
                                                {(item.reviewerName || "U")[0]?.toUpperCase()}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-bold text-foreground">
                                                        {item.reviewerName || "Verified Customer"}
                                                    </span>
                                                    {item.isVerified && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="h-4 px-1 text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 gap-0.5 font-medium"
                                                        >
                                                            <ShieldCheck className="h-2.5 w-2.5" />
                                                            Verified
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Target Subject: Shop or Menu Item */}
                                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                                                    {isItemReview ? (
                                                        <Utensils className="h-3 w-3 text-orange-500 shrink-0" />
                                                    ) : (
                                                        <Store className="h-3 w-3 text-amber-500 shrink-0" />
                                                    )}
                                                    <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-[300px]">
                                                        {targetName}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                        <Calendar className="h-2.5 w-2.5" />
                                                        {dateStr}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Star Rating & Visibility Switch */}
                                        <div className="flex items-center gap-3">
                                            {/* Star Rating Display */}
                                            <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-md">
                                                <div className="flex items-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`h-3 w-3 ${
                                                                star <= (item.rating || 5)
                                                                    ? "text-yellow-500 fill-yellow-500"
                                                                    : "text-muted-foreground/30"
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-xs font-bold font-mono text-yellow-600 dark:text-yellow-400 ml-1">
                                                    {item.rating || 5}.0
                                                </span>
                                            </div>

                                            {/* Quick Visibility Moderation Switch */}
                                            <div className="flex items-center gap-1.5 pl-2 border-l border-border/50">
                                                <Switch
                                                    checked={item.isVisible}
                                                    onCheckedChange={() => handleToggleVisibility(item)}
                                                    className="data-[state=checked]:bg-emerald-500 scale-75"
                                                />
                                                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                                    {item.isVisible ? "Visible" : "Hidden"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Review Message Text */}
                                    <div className="bg-muted/30 p-2.5 rounded-lg border border-border/40 text-xs text-foreground leading-relaxed">
                                        <p className="whitespace-pre-wrap">
                                            {item.comment || (
                                                <span className="italic text-muted-foreground">
                                                    (No written comment provided with rating)
                                                </span>
                                            )}
                                        </p>

                                        {/* Dual Myanmar Translation if available */}
                                        {item.commentMm && item.commentMm !== item.comment && (
                                            <p className="mt-1.5 pt-1.5 border-t border-border/30 text-[11px] text-muted-foreground whitespace-pre-wrap">
                                                {item.commentMm}
                                            </p>
                                        )}
                                    </div>

                                    {/* Attached Photos if present */}
                                    {((item.photoUrls && item.photoUrls.length > 0) ||
                                        (item.photos && item.photos.length > 0)) && (
                                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mr-1">
                                                <ImageIcon className="h-3 w-3" /> Photos:
                                            </span>
                                            {(item.photoUrls || item.photos?.map((p) => p.url) || []).map(
                                                (url, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setSelectedImage(url)}
                                                        className="h-12 w-12 rounded-lg border border-border/60 overflow-hidden hover:scale-105 transition-transform cursor-pointer shrink-0"
                                                    >
                                                        <img
                                                            src={url}
                                                            alt="Review attachment"
                                                            className="h-full w-full object-cover"
                                                            onError={(e) => {
                                                                (e.currentTarget as HTMLElement).style.display =
                                                                    "none";
                                                            }}
                                                        />
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}

                                    {/* Owner Response Quote if available */}
                                    {item.ownerResponse && (
                                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                                <Store className="h-3 w-3" />
                                                <span>Merchant Response:</span>
                                            </div>
                                            <p className="text-[11px] text-foreground whitespace-pre-wrap">
                                                {item.ownerResponse}
                                            </p>
                                        </div>
                                    )}

                                    {/* Review Footer Stats (Helpful count) */}
                                    {item.helpfulCount > 0 && (
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-0.5">
                                            <ThumbsUp className="h-3 w-3 text-emerald-500" />
                                            <span>
                                                {item.helpfulCount}{" "}
                                                {item.helpfulCount === 1 ? "person" : "people"} found this
                                                helpful
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}

                    {/* ── Pagination Load More Button ───────────────────────── */}
                    {!loading && reviews.length > 0 && (
                        <div className="pt-2 pb-1 text-center">
                            {hasMore ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="w-full sm:w-auto px-6 h-9 text-xs font-semibold gap-2 border-border/80 hover:border-yellow-500/50 hover:bg-yellow-500/10 hover:text-yellow-600 dark:hover:text-yellow-400 transition-all cursor-pointer shadow-xs"
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            <span>Loading more reviews...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="h-3.5 w-3.5 text-yellow-500" />
                                            <span>
                                                Load More Reviews ({reviews.length} of {totalElements})
                                            </span>
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <div className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 py-2">
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                    <span>
                                        Showing all {reviews.length} reviews • Complete verification list loaded
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Modal Footer ───────────────────────────────────────── */}
                <div className="p-4 border-t border-border/50 bg-muted/15 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-yellow-500" />
                        <span>
                            Displaying {reviews.length} of {totalElements || totalReviewsCount} verified reviews
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
                            className="h-8 text-xs font-semibold gap-1 bg-yellow-600 hover:bg-yellow-700 text-white cursor-pointer"
                            onClick={() => {
                                onOpenChange(false);
                                navigate("/reviews");
                            }}
                        >
                            <span>Open Full Moderation Desk</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Image Zoom Modal if user clicks on a review photo */}
                {selectedImage && (
                    <div
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-xl bg-background p-1">
                            <button
                                type="button"
                                onClick={() => setSelectedImage(null)}
                                className="absolute right-3 top-3 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <img
                                src={selectedImage}
                                alt="Expanded review attachment"
                                className="max-h-[80vh] w-auto object-contain rounded-lg"
                            />
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
