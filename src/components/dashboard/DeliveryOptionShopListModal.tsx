import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Search,
    Store,
    Bike,
    ExternalLink,
    MapPin,
    Tag,
    X,
} from "lucide-react";
import type { AdminShopProfileListItem } from "@/services/shopService";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    shops: AdminShopProfileListItem[];
    initialTab?: "ALL" | "ON" | "OFF";
}

export function DeliveryOptionShopListModal({
    open,
    onOpenChange,
    shops,
    initialTab = "ALL",
}: Props) {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState<"ALL" | "ON" | "OFF">(initialTab);

    // Keep active tab in sync when opened with a specific initial tab
    React.useEffect(() => {
        if (open) {
            setTab(initialTab);
        }
    }, [open, initialTab]);

    const deliveryOnShops = useMemo(
        () => shops.filter((s) => s.deliveryEnabled !== false),
        [shops]
    );
    const deliveryOffShops = useMemo(
        () => shops.filter((s) => s.deliveryEnabled === false),
        [shops]
    );

    const onCount = deliveryOnShops.length;
    const offCount = deliveryOffShops.length;
    const allCount = shops.length;

    // Filter by tab then search
    const filteredShops = useMemo(() => {
        let base = shops;
        if (tab === "ON") base = deliveryOnShops;
        if (tab === "OFF") base = deliveryOffShops;

        if (!search.trim()) return base;
        const q = search.trim().toLowerCase();

        return base.filter((s) => {
            const nameEn = s.nameEn?.toLowerCase() || "";
            const nameMm = s.nameMm?.toLowerCase() || "";
            const nameTh = s.nameTh?.toLowerCase() || "";
            const cat = s.shopCategory?.nameEn?.toLowerCase() || "";
            const district = s.districtEn?.toLowerCase() || s.districtMm?.toLowerCase() || "";
            const city = s.city?.nameEn?.toLowerCase() || "";
            const address = s.addressEn?.toLowerCase() || "";

            return (
                nameEn.includes(q) ||
                nameMm.includes(q) ||
                nameTh.includes(q) ||
                cat.includes(q) ||
                district.includes(q) ||
                city.includes(q) ||
                address.includes(q)
            );
        });
    }, [shops, tab, deliveryOnShops, deliveryOffShops, search]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border/80 shadow-2xl">
                {/* Header */}
                <DialogHeader className="p-5 pb-3 border-b border-border/50 bg-muted/20">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                                <Bike className="h-5 w-5 text-emerald-500" />
                                Merchant Delivery Coverage &amp; Options
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                delivery service enabled vs disabled (pickup only)
                            </DialogDescription>
                        </div>

                        {/* Top quick-metric counters */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {onCount} ON
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                {offCount} OFF
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-muted-foreground bg-muted">
                                Total {allCount}
                            </span>
                        </div>
                    </div>

                    {/* Filter Tabs & Search Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3">
                        {/* Segmented Filter Buttons */}
                        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/60 border border-border/60 self-start">
                            <button
                                type="button"
                                onClick={() => setTab("ALL")}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                    tab === "ALL"
                                        ? "bg-background text-foreground shadow-sm font-semibold"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                All Shops ({allCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab("ON")}
                                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                    tab === "ON"
                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm font-semibold border border-emerald-500/30"
                                        : "text-muted-foreground hover:text-emerald-500"
                                }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Delivery ON ({onCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab("OFF")}
                                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                    tab === "OFF"
                                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 shadow-sm font-semibold border border-rose-500/30"
                                        : "text-muted-foreground hover:text-rose-500"
                                }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Delivery OFF ({offCount})
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative flex-1 sm:max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, category, area..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 pr-8 h-8 text-xs bg-background/80"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {/* Body - Scrollable Shop List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[320px] max-h-[58vh]">
                    {filteredShops.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                            <Store className="h-10 w-10 stroke-[1.5] text-muted-foreground/60 mb-2" />
                            <p className="text-sm font-medium text-foreground">No shops found</p>
                            <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
                                {search
                                    ? `No merchants match "${search}" with current delivery filter.`
                                    : "No merchants found in this delivery category."}
                            </p>
                            {search && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSearch("")}
                                    className="mt-3 text-xs h-7"
                                >
                                    Clear Search
                                </Button>
                            )}
                        </div>
                    ) : (
                        filteredShops.map((shop) => {
                            const isDeliveryEnabled = shop.deliveryEnabled !== false;
                            const categoryName = shop.shopCategory?.nameEn || "General";
                            const locationStr = [shop.districtEn, shop.city?.nameEn]
                                .filter(Boolean)
                                .join(", ");

                            return (
                                <div
                                    key={shop.id}
                                    onClick={() => {
                                        onOpenChange(false);
                                        navigate(`/shops/create?id=${shop.id}`);
                                    }}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition-colors group cursor-pointer"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Avatar / Logo */}
                                        <div className="relative h-11 w-11 shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center border border-border/60">
                                            {shop.logoUrl ? (
                                                <img
                                                    src={shop.logoUrl}
                                                    alt={shop.nameEn}
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLElement).style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                <Store className="h-5 w-5 text-muted-foreground/60" />
                                            )}
                                        </div>

                                        {/* Name & Details */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                    {shop.nameEn}
                                                </h4>
                                                {shop.nameMm && (
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        ({shop.nameMm})
                                                    </span>
                                                )}
                                                {!shop.isActive && (
                                                    <Badge variant="outline" className="text-[10px] text-muted-foreground py-0 h-4">
                                                        Inactive
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                                                <span className="inline-flex items-center gap-1 text-[11px]">
                                                    <Tag className="h-3 w-3 text-primary/70" />
                                                    {categoryName}
                                                </span>
                                                {locationStr && (
                                                    <span className="inline-flex items-center gap-1 text-[11px]">
                                                        <MapPin className="h-3 w-3 text-muted-foreground/70" />
                                                        {locationStr}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Badge & Action Button */}
                                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                                        {isDeliveryEnabled ? (
                                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold py-1 px-2.5 flex items-center gap-1.5 shadow-none">
                                                <Bike className="h-3.5 w-3.5 shrink-0" />
                                                <span>Delivery ON</span>
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-xs font-semibold py-1 px-2.5 flex items-center gap-1.5">
                                                <Store className="h-3.5 w-3.5 shrink-0" />
                                                <span>Delivery OFF (Pickup)</span>
                                            </Badge>
                                        )}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOpenChange(false);
                                                navigate(`/shops/create?id=${shop.id}`);
                                            }}
                                            className="h-8 px-3 text-xs font-semibold text-foreground hover:text-primary hover:border-primary/50 gap-1.5 cursor-pointer shadow-xs"
                                            title={`Manage & Edit ${shop.nameEn} (Delivery, Info, Hours)`}
                                        >
                                            <span>Manage</span>
                                            <ExternalLink className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 px-5 border-t border-border/50 bg-muted/20 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                        Showing <strong className="text-foreground">{filteredShops.length}</strong> of{" "}
                        <strong className="text-foreground">{allCount}</strong> shops
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                onOpenChange(false);
                                navigate("/shops/manage");
                            }}
                            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                        >
                            <span>All Shops Directory</span>
                            <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-7 text-xs"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
