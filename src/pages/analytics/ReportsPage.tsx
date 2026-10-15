import { useCallback, useEffect, useRef, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { activeUsersService, ActiveActor } from "@/services/activeUsersService";
import {
    reportsService,
    OperationsReport,
    ShopScorecardRow,
    CancellationLedger,
    ShopMoneyReport,
    MenuPerformanceReport,
    PromotionLedger,
    ReviewRecord,
} from "@/services/reportsService";
import { ApiError } from "@/services/apiClient";
import { formatBangkokDateTime, getBangkokDateString } from "@/utils/bangkokTime";

type ReportId =
    | "operations"
    | "shops"
    | "cancellations"
    | "money"
    | "menus"
    | "promotions"
    | "reviews"
    | "staff";

const REPORTS: Array<{ id: ReportId; title: string; hint: string }> = [
    {
        id: "operations",
        title: "Operations summary",
        hint: "One row per day. Placed is every order created that day. Delivered, picked up, and canceled are the current status. Escalated orders can also appear in those columns. Kitchen wait averages only completed orders that have a wait recorded.",
    },
    {
        id: "shops",
        title: "Shop scorecard",
        hint: "Testing shops are omitted. Needs attention means open with no orders, a cancel rate of 20% or more on at least 3 orders, or a rating under 3 with at least 3 orders.",
    },
    {
        id: "cancellations",
        title: "Cancellation ledger",
        hint: "Each canceled order in the range. The newest 500 are listed when there are more.",
    },
    {
        id: "money",
        title: "Shop money",
        hint: "Sales from orders that were not canceled. Customers paid is the stored order total.",
    },
    {
        id: "menus",
        title: "Menu performance",
        hint: "Dishes ordered in this range. Orders means separate orders, and sales is the line total. Views and likes are all-time totals. Testing shops are omitted. The top 200 by orders are listed.",
    },
    {
        id: "promotions",
        title: "Promotion ledger",
        hint: "Coupons redeemed or used on a non-canceled order in this range. Testing shops are omitted.",
    },
    {
        id: "reviews",
        title: "Review record",
        hint: "Reviews are order reviews on delivered orders created in this range. Shop ratings are the shop's current rating.",
    },
    {
        id: "staff",
        title: "Staff log",
        hint: "Shop staff and admins active on the To date.",
    },
];

const ACTORS = [
    { id: "ALL", label: "Everyone" },
    { id: "USER", label: "Customer" },
    { id: "SHOP", label: "Shop" },
    { id: "ADMIN", label: "Admin" },
    { id: "SYSTEM", label: "System" },
    { id: "UNSPECIFIED", label: "Unspecified" },
];

function defaultRange() {
    const end = new Date();
    const start = new Date(end.getTime() - 29 * 86_400_000);
    return { start: getBangkokDateString(start), end: getBangkokDateString(end) };
}

function rangeError(start: string, end: string) {
    if (!start || !end) return "Choose a from and to date.";
    if (start > end) return "From must be on or before To.";
    const days = Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1;
    if (days > 366) return "Date range cannot exceed 366 days.";
    return null;
}

function baht(value: number) {
    return `฿${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function waitLabel(value: number | null) {
    return value == null ? "—" : `${Math.round(value)} min`;
}

function actorLabel(actor: string | null) {
    return ACTORS.find((item) => item.id === actor)?.label ?? (actor ? actor : "Unspecified");
}

function promoTypeLabel(value: string) {
    if (value === "BUY_X_GET_DISCOUNT") return "Buy X get discount";
    if (value === "BUY_X_GET_FREE") return "Buy X get free";
    return value;
}

function promoTargetLabel(value: string) {
    if (value === "ALL") return "All customers";
    if (value === "EARLY_BIRD") return "Early bird";
    if (value === "REFERRAL") return "Referral";
    return value;
}

function roleLabel(role: string | null) {
    if (role === "SuperAdmin") return "Super admin";
    if (role === "ShopAdmin") return "Shop admin";
    if (role === "OperationAdmin") return "Operation admin";
    if (role === "MarketingAdmin") return "Marketing admin";
    return role ?? "—";
}

function errorMessage(error: unknown) {
    if (error instanceof ApiError) return error.message;
    if (error instanceof Error) return error.message;
    return "Could not load this report.";
}

function EmptyRow({ cols, label }: { cols: number; label: string }) {
    return (
        <TableRow>
            <TableCell colSpan={cols} className="h-24 text-center text-muted-foreground">{label}</TableCell>
        </TableRow>
    );
}

function ShownNote({ shown, total }: { shown: number; total: number }) {
    if (total <= shown) return null;
    return <p className="text-xs text-muted-foreground">Showing {shown.toLocaleString()} of {total.toLocaleString()}.</p>;
}

export default function ReportsPage() {
    const defaults = defaultRange();
    const [reportId, setReportId] = useState<ReportId>("operations");
    const [startDate, setStartDate] = useState(defaults.start);
    const [endDate, setEndDate] = useState(defaults.end);
    const [actor, setActor] = useState("ALL");
    const [maxRating, setMaxRating] = useState("3");
    const [attentionOnly, setAttentionOnly] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [operations, setOperations] = useState<OperationsReport | null>(null);
    const [shops, setShops] = useState<ShopScorecardRow[]>([]);
    const [cancellations, setCancellations] = useState<CancellationLedger | null>(null);
    const [money, setMoney] = useState<ShopMoneyReport | null>(null);
    const [menus, setMenus] = useState<MenuPerformanceReport | null>(null);
    const [promotions, setPromotions] = useState<PromotionLedger | null>(null);
    const [reviews, setReviews] = useState<ReviewRecord | null>(null);
    const [staff, setStaff] = useState<{ total: number; actors: ActiveActor[] } | null>(null);

    const selected = REPORTS.find((item) => item.id === reportId) ?? REPORTS[0];
    const dateProblem = rangeError(startDate, endDate);

    const requestId = useRef(0);

    const loadReport = useCallback(async () => {
        const id = ++requestId.current;
        setLoading(true);
        setError(null);
        const current = () => requestId.current === id;
        try {
            if (reportId === "operations") {
                const result = await reportsService.operations(startDate, endDate);
                if (current()) setOperations(result);
            } else if (reportId === "shops") {
                const result = await reportsService.shops(startDate, endDate);
                if (current()) setShops(result.rows);
            } else if (reportId === "cancellations") {
                const result = await reportsService.cancellations(startDate, endDate, actor === "ALL" ? undefined : actor);
                if (current()) setCancellations(result);
            } else if (reportId === "money") {
                const result = await reportsService.money(startDate, endDate);
                if (current()) setMoney(result);
            } else if (reportId === "menus") {
                const result = await reportsService.menus(startDate, endDate);
                if (current()) setMenus(result);
            } else if (reportId === "promotions") {
                const result = await reportsService.promotions(startDate, endDate);
                if (current()) setPromotions(result);
            } else if (reportId === "reviews") {
                const result = await reportsService.reviews(startDate, endDate, maxRating);
                if (current()) setReviews(result);
            } else {
                const actors: ActiveActor[] = [];
                let page = 1;
                let total = 0;
                while (page <= 20) {
                    if (!current()) return;
                    const day = await activeUsersService.day({ date: endDate, actorType: "ADMIN", page, size: 100 });
                    total = day.total;
                    actors.push(...day.actors);
                    if (!day.hasMore) break;
                    page += 1;
                }
                if (current()) setStaff({ total, actors });
            }
        } catch (loadError: unknown) {
            if (current()) setError(errorMessage(loadError));
        } finally {
            if (current()) setLoading(false);
        }
    }, [reportId, startDate, endDate, actor, maxRating]);

    useEffect(() => {
        if (dateProblem) return;
        void loadReport();
    }, [dateProblem, loadReport]);

    const shopRows = attentionOnly ? shops.filter((row) => row.attention.length > 0) : shops;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-6 w-6 text-primary" />
                    <h1 className="text-lg font-semibold md:text-2xl">Reports</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-8 w-36 text-xs" />
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-8 w-36 text-xs" />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Select value={reportId} onValueChange={(value) => setReportId(value as ReportId)}>
                    <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {REPORTS.map((item) => (
                            <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {reportId === "shops" && (
                    <Button size="sm" variant={attentionOnly ? "secondary" : "outline"} onClick={() => setAttentionOnly((value) => !value)}>
                        {attentionOnly ? "Showing needs attention" : "Needs attention"}
                    </Button>
                )}
                {reportId === "cancellations" && (
                    <Select value={actor} onValueChange={setActor}>
                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {ACTORS.map((item) => (
                                <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
                {reportId === "reviews" && (
                    <Select value={maxRating} onValueChange={setMaxRating}>
                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2">Rating at or under 2</SelectItem>
                            <SelectItem value="3">Rating at or under 3</SelectItem>
                            <SelectItem value="4">Rating at or under 4</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{selected.title}</CardTitle>
                    <CardDescription>{selected.hint}</CardDescription>
                </CardHeader>
                <CardContent>
                    {dateProblem ? (
                        <p className="py-16 text-center text-sm text-muted-foreground">{dateProblem}</p>
                    ) : loading ? <Skeleton className="h-[280px] w-full" /> : error ? (
                        <p className="py-16 text-center text-sm text-muted-foreground">{error}</p>
                    ) : reportId === "operations" && operations ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Placed</TableHead>
                                    <TableHead className="text-right">Delivered</TableHead>
                                    <TableHead className="text-right">Picked up</TableHead>
                                    <TableHead className="text-right">Canceled</TableHead>
                                    <TableHead className="text-right">Escalated</TableHead>
                                    <TableHead className="text-right">Avg kitchen wait</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {operations.rows.length === 0 ? <EmptyRow cols={7} label="No days in this range." /> : operations.rows.map((row) => (
                                    <TableRow key={row.date}>
                                        <TableCell>{row.date}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.placed.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.delivered.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.pickedUp.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.canceled.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.escalated.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{waitLabel(row.avgWaitMinutes)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell className="font-medium">Total</TableCell>
                                    <TableCell className="text-right tabular-nums">{operations.totals.placed.toLocaleString()}</TableCell>
                                    <TableCell className="text-right tabular-nums">{operations.totals.delivered.toLocaleString()}</TableCell>
                                    <TableCell className="text-right tabular-nums">{operations.totals.pickedUp.toLocaleString()}</TableCell>
                                    <TableCell className="text-right tabular-nums">{operations.totals.canceled.toLocaleString()}</TableCell>
                                    <TableCell className="text-right tabular-nums">{operations.totals.escalated.toLocaleString()}</TableCell>
                                    <TableCell className="text-right tabular-nums">{waitLabel(operations.totals.avgWaitMinutes)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    ) : reportId === "shops" ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Shop</TableHead>
                                    <TableHead className="text-right">Orders</TableHead>
                                    <TableHead className="text-right">Sales</TableHead>
                                    <TableHead className="text-right">AOV</TableHead>
                                    <TableHead className="text-right">Cancel rate</TableHead>
                                    <TableHead className="text-right">Rating</TableHead>
                                    <TableHead className="text-right">Reviews</TableHead>
                                    <TableHead className="text-right">Avg kitchen wait</TableHead>
                                    <TableHead>Attention</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shopRows.length === 0 ? <EmptyRow cols={9} label="No shops in this view." /> : shopRows.map((row) => (
                                    <TableRow key={row.shopId}>
                                        <TableCell className="font-medium">{row.shopName}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.orders.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(row.sales)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(row.averageOrderValue)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.cancelRatePercent.toFixed(1)}%</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.ratingCount > 0 ? `${row.ratingAvg.toFixed(1)} (${row.ratingCount})` : "—"}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.reviews.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{waitLabel(row.avgWaitMinutes)}</TableCell>
                                        <TableCell className="text-muted-foreground">{row.attention.join(", ") || "—"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : reportId === "cancellations" && cancellations ? (
                        <div className="space-y-3">
                            <ShownNote shown={cancellations.shown} total={cancellations.total} />
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Shop</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Who</TableHead>
                                        <TableHead>Reason</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cancellations.rows.length === 0 ? <EmptyRow cols={6} label="No canceled orders in this range." /> : cancellations.rows.map((row) => (
                                        <TableRow key={row.orderId}>
                                            <TableCell className="font-medium">{row.orderNo}</TableCell>
                                            <TableCell>{formatBangkokDateTime(row.createdAt)}</TableCell>
                                            <TableCell>{row.shopName}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(row.amount)}</TableCell>
                                            <TableCell>{actorLabel(row.canceledBy)}</TableCell>
                                            <TableCell className="max-w-[280px] truncate">{row.cancelReason || "—"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : reportId === "money" && money ? (
                        <div className="space-y-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Shop</TableHead>
                                        <TableHead className="text-right">Item sales</TableHead>
                                        <TableHead className="text-right">Delivery fees</TableHead>
                                        <TableHead className="text-right">Free delivery</TableHead>
                                        <TableHead className="text-right">Coupon discounts</TableHead>
                                        <TableHead className="text-right">Shop discounts</TableHead>
                                        <TableHead className="text-right">Customers paid</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {money.shops.length === 0 ? <EmptyRow cols={7} label="No paid orders in this range." /> : money.shops.map((row) => (
                                        <TableRow key={row.shopId}>
                                            <TableCell className="font-medium">{row.shopName}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(row.itemSales)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(row.deliveryFees)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{row.freeDeliveryOrders.toLocaleString()}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(row.couponDiscounts)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(row.shopDiscounts)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(row.customersPaid)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell className="font-medium">Total</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(money.totals.itemSales)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(money.totals.deliveryFees)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{money.totals.freeDeliveryOrders.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(money.totals.couponDiscounts)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(money.totals.shopDiscounts)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(money.totals.customersPaid)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                            <div>
                                <h2 className="mb-2 text-sm font-medium">Payment methods</h2>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Method</TableHead>
                                            <TableHead className="text-right">Orders</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {money.paymentMethods.length === 0 ? <EmptyRow cols={3} label="No paid orders in this range." /> : money.paymentMethods.map((row) => (
                                            <TableRow key={row.method}>
                                                <TableCell>{row.method}</TableCell>
                                                <TableCell className="text-right tabular-nums">{row.orders.toLocaleString()}</TableCell>
                                                <TableCell className="text-right tabular-nums">{baht(row.amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : reportId === "menus" && menus ? (
                        <div className="space-y-3">
                            <ShownNote shown={menus.shown} total={menus.total} />
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Dish</TableHead>
                                        <TableHead>Shop</TableHead>
                                        <TableHead className="text-right">Views</TableHead>
                                        <TableHead className="text-right">Likes</TableHead>
                                        <TableHead className="text-right">Orders</TableHead>
                                        <TableHead className="text-right">Sales</TableHead>
                                        <TableHead className="text-right">Orders per view</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {menus.rows.length === 0 ? <EmptyRow cols={7} label="No dishes were ordered in this range." /> : menus.rows.map((row) => (
                                        <TableRow key={row.menuId}>
                                            <TableCell className="font-medium">{row.dishName}</TableCell>
                                            <TableCell>{row.shopName}</TableCell>
                                            <TableCell className="text-right tabular-nums">{row.views.toLocaleString()}</TableCell>
                                            <TableCell className="text-right tabular-nums">{row.likes.toLocaleString()}</TableCell>
                                            <TableCell className="text-right tabular-nums">{row.orders.toLocaleString()}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(row.sales)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{row.ordersPerView == null ? "—" : row.ordersPerView.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : reportId === "promotions" && promotions ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Coupon</TableHead>
                                    <TableHead>Shop</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Who can use it</TableHead>
                                    <TableHead className="text-right">Redemptions</TableHead>
                                    <TableHead className="text-right">Discount given</TableHead>
                                    <TableHead className="text-right">Orders</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {promotions.rows.length === 0 ? <EmptyRow cols={7} label="No coupon use in this range." /> : promotions.rows.map((row) => (
                                    <TableRow key={row.couponId}>
                                        <TableCell className="font-medium">{row.couponName}</TableCell>
                                        <TableCell>{row.shopName}</TableCell>
                                        <TableCell>{promoTypeLabel(row.promotionType)}</TableCell>
                                        <TableCell>{promoTargetLabel(row.target)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.redemptions.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(row.discountGiven)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.orders.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : reportId === "reviews" && reviews ? (
                        <div className="space-y-6">
                            <div className="grid gap-3 md:grid-cols-4">
                                <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Delivered orders</p><p className="text-2xl font-semibold tabular-nums">{reviews.delivered.toLocaleString()}</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Reviewed</p><p className="text-2xl font-semibold tabular-nums">{reviews.reviewed.toLocaleString()}</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Review rate</p><p className="text-2xl font-semibold tabular-nums">{reviews.reviewRatePercent.toFixed(1)}%</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Average rating</p><p className="text-2xl font-semibold tabular-nums">{reviews.averageRating == null ? "—" : reviews.averageRating.toFixed(2)}</p></CardContent></Card>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-sm font-medium">Low ratings</h2>
                                <ShownNote shown={reviews.comments.shown} total={reviews.comments.total} />
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order</TableHead>
                                            <TableHead>Shop</TableHead>
                                            <TableHead className="text-right">Rating</TableHead>
                                            <TableHead>Comment</TableHead>
                                            <TableHead>Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reviews.comments.rows.length === 0 ? <EmptyRow cols={5} label="No reviews at or under this rating." /> : reviews.comments.rows.map((row) => (
                                            <TableRow key={`${row.orderNo}-${row.createdAt}`}>
                                                <TableCell className="font-medium">{row.orderNo}</TableCell>
                                                <TableCell>{row.shopName}</TableCell>
                                                <TableCell className="text-right tabular-nums">{row.rating.toFixed(1)}</TableCell>
                                                <TableCell className="max-w-[320px]">{row.comment || "—"}</TableCell>
                                                <TableCell>{formatBangkokDateTime(row.createdAt)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-sm font-medium">Shops at or under {reviews.threshold}</h2>
                                <ShownNote shown={reviews.shops.shown} total={reviews.shops.total} />
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Shop</TableHead>
                                            <TableHead className="text-right">Current rating</TableHead>
                                            <TableHead className="text-right">Rating count</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reviews.shops.rows.length === 0 ? <EmptyRow cols={3} label="No shops at or under this rating." /> : reviews.shops.rows.map((row) => (
                                            <TableRow key={row.shopId}>
                                                <TableCell className="font-medium">{row.shopName}</TableCell>
                                                <TableCell className="text-right tabular-nums">{row.ratingAvg.toFixed(2)}</TableCell>
                                                <TableCell className="text-right tabular-nums">{row.ratingCount.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : reportId === "staff" && staff ? (
                        <div className="space-y-3">
                            <ShownNote shown={staff.actors.length} total={staff.total} />
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Shop</TableHead>
                                        <TableHead>Last seen</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {staff.actors.length === 0 ? <EmptyRow cols={4} label="No staff were active on that date." /> : staff.actors.map((actorRow) => (
                                        <TableRow key={`${actorRow.actorId}-${actorRow.shopId ?? "none"}`}>
                                            <TableCell className="font-medium">{actorRow.name ?? actorRow.contact ?? `#${actorRow.actorId}`}</TableCell>
                                            <TableCell>{roleLabel(actorRow.role)}</TableCell>
                                            <TableCell>{actorRow.shopName ?? "—"}</TableCell>
                                            <TableCell>{formatBangkokDateTime(actorRow.lastSeenAt)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}
