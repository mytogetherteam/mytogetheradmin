import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { orderService, Order, OrderHistoryEntry } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    Phone,
    User,
    Store,
    Truck,
    CreditCard,
    ExternalLink,
    AlertCircle,
    Package
} from "lucide-react";
import { handleApiError } from "@/lib/error-utils";
import { Separator } from "@/components/ui/separator";

const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
    ACCEPTED: "bg-cyan-100 text-cyan-800 border-cyan-200",
    PREPARING: "bg-orange-100 text-orange-800 border-orange-200",
    READY: "bg-purple-100 text-purple-800 border-purple-200",
    DELIVERING: "bg-indigo-100 text-indigo-800 border-indigo-200",
    DELIVERED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

export default function OrderDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [history, setHistory] = useState<OrderHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrderDetail = useCallback(async (orderId: string) => {
        setLoading(true);
        console.log("OrderDetail: Fetching ID", orderId);
        try {
            const [orderData, historyData] = await Promise.all([
                orderService.getOrderDetail(orderId),
                orderService.getOrderHistory(orderId).catch(() => [])
            ]);
            console.log("OrderDetail: Received Data", orderData, historyData);
            setOrder(orderData);
            setHistory(historyData);
        } catch (error) {
            handleApiError(error, "Failed to load order details");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (id) {
            fetchOrderDetail(id);
        }
    }, [id, fetchOrderDetail]);

    if (loading) {
        return (
            <div className="container mx-auto py-10 space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2"><Skeleton className="h-[400px] w-full" /></Card>
                    <Card><Skeleton className="h-[400px] w-full" /></Card>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container mx-auto py-20 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold">Order Not Found</h2>
                <p className="text-sm text-muted-foreground mb-4">Request ID: {id}</p>
                <Button variant="outline" onClick={() => navigate("/orders/history")}>
                    Back to History
                </Button>
            </div>
        );
    }

    // Double check that we have an ID to render (Final crash guard)
    if (!order.id) {
        console.error("OrderDetail: Order object missing ID", order);
        return <div className="p-10 text-center text-destructive">Data Format Error: Order ID missing</div>;
    }

    // Helper to safely render the address which might be a string or an object

    interface Address {
        buildingName?: string;
        floor?: string;
        address?: string;
        note?: string;
    }

    const renderAddress = (addr: string | Address | null | undefined) => {
        if (!addr) return "N/A";
        if (typeof addr === 'string') return addr;
        if (typeof addr === 'object') {
            const parts = [
                addr.buildingName,
                addr.floor ? `Floor ${addr.floor}` : null,
                addr.address,
                addr.note ? `(Note: ${addr.note})` : null
            ].filter(Boolean);
            return parts.length > 0 ? parts.join(', ') : "Address details provided but empty";
        }
        return "Invalid address format";
    };

    // Helper to safely render currency/amounts

    interface Price {
        displayValue?: string;
        amount?: number;
    }

    const renderCurrency = (val: string | number | Price | null | undefined) => {
        if (val === null || val === undefined) return "0";
        if (typeof val === 'string' || typeof val === 'number') return val.toString();
        if (typeof val === 'object') {
            return val.displayValue || (val.amount !== undefined ? val.amount.toString() : JSON.stringify(val));
        }
        return "N/A";
    };

    return (
        <div className="container mx-auto py-6 max-w-6xl space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Order Details</h1>
                    <p className="text-muted-foreground">ID: #{order.id}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Badge variant="outline" className={`px-3 py-1 text-sm ${STATUS_COLORS[order.status] || "bg-gray-100"}`}>
                        {order.statusLabel || order.status}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Store className="h-5 w-5 text-primary" />
                                Shop Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-lg border overflow-hidden bg-white shrink-0">
                                    {order.shopImageUrl ? (
                                        <img src={order.shopImageUrl} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-muted text-xs">No Img</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg truncate">{order.shopName}</h3>
                                    {order.shopNameMm && <p className="text-muted-foreground truncate">{order.shopNameMm}</p>}
                                    <p className="text-xs text-muted-foreground mt-1">ID: {order.shopId}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => navigate(`/shops/${order.shopId}`)}>
                                    View Shop
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Order Items</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {order.items && order.items.length > 0 ? (
                                <div className="divide-y max-h-[400px] overflow-y-auto">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="p-4 flex justify-between items-center hover:bg-muted/50 transition-colors">
                                            <div className="flex gap-3 items-center">
                                                <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                                    {item.quantity}x
                                                </div>
                                                {item.menuItemImageUrl && (
                                                    <img src={item.menuItemImageUrl} alt="" className="h-10 w-10 object-cover rounded shadow-sm border" />
                                                )}
                                                <div>
                                                    <p className="font-medium text-sm">{item.menuItemName || item.name}</p>
                                                    {(item.menuItemNameMm || item.nameMm) && <p className="text-[10px] text-muted-foreground">{item.menuItemNameMm || item.nameMm}</p>}
                                                    {item.options && <p className="text-xs text-muted-foreground mt-0.5">{item.options}</p>}
                                                    {item.specialInstructions && <p className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded mt-1 italic max-w-xs">{item.specialInstructions}</p>}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-bold text-sm text-primary">{item.displayPrice || renderCurrency(item.totalPrice || (item.price * item.quantity))}</p>
                                                <p className="text-[10px] text-muted-foreground">{renderCurrency(item.price)} each</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-muted-foreground">
                                    <Package className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm italic">No items found in this order</p>
                                </div>
                            )}
                            <div className="bg-muted/30 p-4 space-y-2 border-t">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{renderCurrency((order.totalAmount || 0) - (order.deliveryFee || 0))}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Delivery Fee</span>
                                    <span>{renderCurrency(order.deliveryFee)}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total Amount</span>
                                    <span className="text-primary">{renderCurrency(order.displayTotalAmount || order.totalAmount)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {order.paymentSlipUrl && (
                        <Card>
                            <CardHeader className="pb-3 px-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-primary" />
                                    Payment Slip
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="max-w-md mx-auto aspect-[3/4] rounded-lg border overflow-hidden bg-muted relative group">
                                    <img src={order.paymentSlipUrl} alt="Slip" className="h-full w-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button size="sm" variant="secondary" asChild>
                                            <a href={order.paymentSlipUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Open Full
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Customer Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-start gap-3">
                                <User className="h-4 w-4 mt-1 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">{order.userFullName || "Guest User"}</p>
                                    <p className="text-xs text-muted-foreground">ID: {order.userId || "N/A"}</p>
                                </div>
                            </div>
                            {order.userPhone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm">{order.userPhone}</p>
                                </div>
                            )}
                            {order.deliveryAddress && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                                    <div className="text-sm overflow-hidden break-words">
                                        {renderAddress(order.deliveryAddress)}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Truck className="h-4 w-4" />
                                Delivery Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Type</span>
                                <Badge variant="secondary">{order.deliveryType}</Badge>
                            </div>
                            {order.deliveryTier && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tier</span>
                                    <span className="font-medium">{order.deliveryTier}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Estimated Time</span>
                                <span className="flex items-center gap-1 font-medium">
                                    <Clock className="h-3 w-3" />
                                    {order.estimatedDeliveryTime || "N/A"}
                                </span>
                            </div>
                            {order.isScheduled && (
                                <div className="pt-2 border-t">
                                    <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Scheduled For</p>
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        {order.scheduledDeliveryTime}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-1">
                            {history.length > 0 ? (
                                <div className="space-y-4">
                                    {history.map((event, idx) => (
                                        <div key={event.id || idx} className="flex gap-4 relative">
                                            {/* Timeline Line connecting dots, except last one */}
                                            {idx !== history.length - 1 && (
                                                <div className="absolute left-2.5 top-6 bottom-[-16px] w-[2px] bg-border rounded-full" />
                                            )}

                                            {/* Status Dot */}
                                            <div className="relative shrink-0 mt-1">
                                                <div className="h-5 w-5 rounded-full border-4 border-background bg-primary shadow-sm z-10 relative" />
                                            </div>

                                            {/* Content */}
                                            <div className="pb-1 w-full">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <p className="text-sm font-bold uppercase tracking-wide">
                                                        {event.toStatus.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-muted-foreground tabular-nums whitespace-nowrap">
                                                        {new Date(event.changedAt).toLocaleString(undefined, {
                                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                                                    <User className="h-3 w-3" />
                                                    {event.changedByAdminName || event.changedBy || "System"}
                                                </div>

                                                {event.note && (
                                                    <p className="text-xs bg-muted/50 text-muted-foreground p-2 mt-2 rounded border border-border/50">
                                                        "{event.note}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <div className="w-1 h-full bg-muted rounded"></div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-bold uppercase">Ordered On</p>
                                            <p className="text-sm font-medium">
                                                {order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase">Last Updated</p>
                                            <p className="text-sm font-medium">
                                                {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : "—"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
