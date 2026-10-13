import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    CheckCircle2,
    XCircle,
    Bike,
    Store,
    ArrowUpRight,
    ListFilter,
} from "lucide-react";
import type { AdminShopProfileListItem } from "@/services/shopService";
import { DeliveryOptionShopListModal } from "./DeliveryOptionShopListModal";

interface Props {
    loading?: boolean;
    todayDelivered: number;
    todayCanceled: number;
    totalDeliveredAllTime: number;
    totalCanceledAllTime: number;
    shops: AdminShopProfileListItem[];
    totalShopsCount?: number;
}

export function TodayFulfillmentOperationsSection({
    loading,
    todayDelivered,
    todayCanceled,
    totalDeliveredAllTime,
    totalCanceledAllTime,
    shops,
    totalShopsCount,
}: Props) {
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<"ALL" | "ON" | "OFF">("ALL");

    const effectiveTotalShops = totalShopsCount || shops.length || 0;
    const deliveryOnShops = shops.filter((s) => s.deliveryEnabled !== false);
    const deliveryOffShops = shops.filter((s) => s.deliveryEnabled === false);

    const deliveryOnCount = deliveryOnShops.length;
    const deliveryOffCount = deliveryOffShops.length;

    const onPercent = effectiveTotalShops > 0
        ? Math.round((deliveryOnCount / (effectiveTotalShops || 1)) * 100)
        : 0;
    const offPercent = effectiveTotalShops > 0
        ? Math.max(0, 100 - onPercent)
        : 0;

    const handleOpenModal = (tab: "ALL" | "ON" | "OFF") => {
        setModalTab(tab);
        setModalOpen(true);
    };

    return (
        <div className="space-y-3">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Bike className="h-4 w-4 text-emerald-500" />
                        Today's Fulfillment &amp; Merchant Delivery Operations
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                        Live daily order completions, cancellations, and merchant delivery availability
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenModal("ALL")}
                        className="h-7 text-xs gap-1.5 border-border/70 hover:border-emerald-500/40 hover:bg-emerald-500/5 cursor-pointer"
                    >
                        <ListFilter className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Delivery Option Shop List</span>
                    </Button>
                </div>
            </div>

            {/* Grid of Cards: Today Delivered, Today Canceled, Delivery Option Overview */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Today Delivered Total */}
                <Card
                    onClick={() => navigate("/orders/history?status=DELIVERED&period=today")}
                    className="border-border/70 shadow-sm overflow-hidden bg-card/90 hover:border-emerald-500/40 hover:shadow-md transition-all cursor-pointer group"
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                            Today Delivered
                        </CardTitle>
                        <div className="flex items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-semibold tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                TODAY
                            </span>
                            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <>
                                <Skeleton className="h-7 w-20 mb-2" />
                                <Skeleton className="h-3 w-32" />
                            </>
                        ) : (
                            <div>
                                <div className="flex items-end justify-between">
                                    <div className="text-2xl font-bold text-foreground">
                                        {todayDelivered.toLocaleString()}
                                    </div>
                                    <span className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5 group-hover:underline">
                                        Fulfillment done
                                        <ArrowUpRight className="h-3 w-3" />
                                    </span>
                                </div>
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate("/orders/history?status=DELIVERED&period=all");
                                    }}
                                    className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border/40 hover:text-emerald-500 transition-colors"
                                    title="View all-time delivered orders"
                                >
                                    <span>All-time delivered:</span>
                                    <strong className="text-foreground font-mono">
                                        {totalDeliveredAllTime.toLocaleString()}
                                    </strong>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Today Canceled Total */}
                <Card
                    onClick={() => navigate("/orders/history?status=CANCELED&period=today")}
                    className="border-border/70 shadow-sm overflow-hidden bg-card/90 hover:border-rose-500/40 hover:shadow-md transition-all cursor-pointer group"
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                            Today Canceled
                        </CardTitle>
                        <div className="flex items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[9px] font-semibold tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                TODAY
                            </span>
                            <div className="h-7 w-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                                <XCircle className="h-4 w-4" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <>
                                <Skeleton className="h-7 w-20 mb-2" />
                                <Skeleton className="h-3 w-32" />
                            </>
                        ) : (
                            <div>
                                <div className="flex items-end justify-between">
                                    <div className="text-2xl font-bold text-foreground">
                                        {todayCanceled.toLocaleString()}
                                    </div>
                                    <span className="text-xs font-semibold text-rose-500 flex items-center gap-0.5 group-hover:underline">
                                        Cancelled/void
                                        <ArrowUpRight className="h-3 w-3" />
                                    </span>
                                </div>
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate("/orders/history?status=CANCELED&period=all");
                                    }}
                                    className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border/40 hover:text-rose-500 transition-colors"
                                    title="View all-time canceled orders"
                                >
                                    <span>All-time canceled:</span>
                                    <strong className="text-foreground font-mono">
                                        {totalCanceledAllTime.toLocaleString()}
                                    </strong>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. Delivery Option ON Total */}
                <Card
                    onClick={() => handleOpenModal("ON")}
                    className="border-border/70 shadow-sm overflow-hidden bg-card/90 hover:border-emerald-500/40 hover:shadow-md transition-all cursor-pointer group"
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                            Delivery Option ON
                        </CardTitle>
                        <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                            <Bike className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <>
                                <Skeleton className="h-7 w-20 mb-2" />
                                <Skeleton className="h-3 w-32" />
                            </>
                        ) : (
                            <div>
                                <div className="flex items-end justify-between">
                                    <div className="text-2xl font-bold text-foreground">
                                        {deliveryOnCount.toLocaleString()}
                                        <span className="text-xs font-normal text-muted-foreground ml-1">shops</span>
                                    </div>
                                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-2">
                                        {onPercent}% Active
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border/40">
                                    <span>Delivery fleet active:</span>
                                    <span className="text-emerald-500 font-medium group-hover:underline flex items-center gap-0.5">
                                        Inspect list <ArrowUpRight className="h-3 w-3" />
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 4. Delivery Option OFF Total */}
                <Card
                    onClick={() => handleOpenModal("OFF")}
                    className="border-border/70 shadow-sm overflow-hidden bg-card/90 hover:border-rose-500/40 hover:shadow-md transition-all cursor-pointer group"
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                            Delivery Option OFF
                        </CardTitle>
                        <div className="h-7 w-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                            <Store className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <>
                                <Skeleton className="h-7 w-20 mb-2" />
                                <Skeleton className="h-3 w-32" />
                            </>
                        ) : (
                            <div>
                                <div className="flex items-end justify-between">
                                    <div className="text-2xl font-bold text-foreground">
                                        {deliveryOffCount.toLocaleString()}
                                        <span className="text-xs font-normal text-muted-foreground ml-1">shops</span>
                                    </div>
                                    <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold px-2">
                                        {offPercent}% Pickup Only
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border/40">
                                    <span>Pickup only / disabled:</span>
                                    <span className="text-rose-500 font-medium group-hover:underline flex items-center gap-0.5">
                                        Inspect list <ArrowUpRight className="h-3 w-3" />
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delivery Ratio Distribution Bar */}
            <Card className="border-border/60 bg-muted/20 shadow-none">
                <CardContent className="p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">Merchant Network Delivery Ratio:</span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleOpenModal("ON")}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium transition-colors cursor-pointer"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Delivery ON: {deliveryOnCount} ({onPercent}%)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleOpenModal("OFF")}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-medium transition-colors cursor-pointer"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Delivery OFF: {deliveryOffCount} ({offPercent}%)
                            </button>
                        </div>
                    </div>

                    {/* Visual Segmented Progress Bar */}
                    <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
                        <div className="w-full h-2 rounded-full bg-muted/80 overflow-hidden flex">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${Math.max(onPercent, 5)}%` }}
                                title={`Delivery ON: ${onPercent}%`}
                            />
                            <div
                                className="h-full bg-rose-500 transition-all duration-500"
                                style={{ width: `${offPercent}%` }}
                                title={`Delivery OFF: ${offPercent}%`}
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal("ALL")}
                            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted font-medium cursor-pointer"
                        >
                            View All ({effectiveTotalShops})
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Modal for full searchable and filterable list */}
            <DeliveryOptionShopListModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                shops={shops}
                initialTab={modalTab}
            />
        </div>
    );
}
