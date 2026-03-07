import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { orderService, Order } from "@/services/orderService";
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
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
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
    const [loading, setLoading] = useState(true);

    const fetchOrderDetail = useCallback(async (orderId: string) => {
        setLoading(true);
        console.log("OrderDetail: Fetching ID", orderId);
        try {
            const data = await orderService.getOrderDetail(orderId);
            console.log("OrderDetail: Received Data", data);
            setOrder(data);
        } catch (error) {
            console.error("OrderDetail: Fetch Error", error);
            toast.error("Failed to load order details");
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
    const renderAddress = (addr: any) => {
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
                        <CardHeader>
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
                                <div>
                                    <h3 className="font-bold text-lg">{order.shopName}</h3>
                                    <p className="text-muted-foreground">{order.shopNameMm}</p>
                                    <p className="text-xs text-muted-foreground mt-1">ID: {order.shopId}</p>
                                </div>
                                <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate(`/shops/${order.shopId}`)}>
                                    View Shop
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Order Items</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {order.items && order.items.length > 0 ? (
                                <div className="divide-y">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="p-4 flex justify-between items-center">
                                            <div className="flex gap-3 items-center">
                                                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center font-bold text-xs">
                                                    {item.quantity}x
                                                </div>
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    {item.nameMm && <p className="text-xs text-muted-foreground">{item.nameMm}</p>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{item.totalPrice || (item.price * item.quantity)}</p>
                                                <p className="text-[10px] text-muted-foreground">{item.price} each</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 text-center text-muted-foreground">
                                    No item details available for this order.
                                </div>
                            )}
                            <div className="bg-muted/30 p-4 space-y-2 border-t">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{(order.totalAmount || 0) - (order.deliveryFee || 0)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Delivery Fee</span>
                                    <span>{order.deliveryFee || 0}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total Amount</span>
                                    <span className="text-primary">{order.displayTotalAmount || order.totalAmount}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
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
                        <CardContent className="space-y-4">
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
                        </CardContent>
                    </Card>

                    {order.paymentSlipUrl && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Payment Slip
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="aspect-[3/4] rounded-lg border overflow-hidden bg-muted relative group">
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
            </div>
        </div>
    );
}
