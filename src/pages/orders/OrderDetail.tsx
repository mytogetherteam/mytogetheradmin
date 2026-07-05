import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertCircle, XCircle } from "lucide-react";
import { authService } from "@/services/authService";
import { AdminRole, hasAccess } from "@/utils/rbac";
import { useOrderDetail, useOrderHistory } from "@/hooks/orders/useOrders";
import { STATUS_COLORS } from "@/components/orders/order-format";
import { ShopInfoCard } from "@/components/orders/ShopInfoCard";
import { OrderItemsCard } from "@/components/orders/OrderItemsCard";
import { PaymentSlipCard } from "@/components/orders/PaymentSlipCard";
import { CustomerCard } from "@/components/orders/CustomerCard";
import { DeliveryInfoCard } from "@/components/orders/DeliveryInfoCard";
import { OrderTimelineCard } from "@/components/orders/OrderTimelineCard";
import { OrderStatusActionCard } from "@/components/orders/OrderStatusActionCard";
import type { OrderCanceledBy } from "@/services/orderService";

/** Fallback text shown when a cancelled order has no free-text reason. */
const CANCELED_BY_LABELS: Record<OrderCanceledBy, string> = {
    USER: "Cancelled by the customer.",
    SHOP: "Cancelled by the shop.",
    ADMIN: "Cancelled by an administrator.",
    SYSTEM: "Automatically cancelled by the system.",
};

export default function OrderDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const isSuperAdmin = hasAccess(authService.getUserData()?.role, AdminRole.ADMIN);

    const { data: order, isLoading } = useOrderDetail(id);
    const { data: history = [] } = useOrderHistory(id);

    if (isLoading) {
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

    if (!order || !order.id) {
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

            {order.status === "CANCELED" && (
                <Card className="border-destructive/40 bg-destructive/5 p-4">
                    <div className="flex items-start gap-3">
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                        <div>
                            <p className="font-medium text-destructive">
                                Order cancelled
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {order.cancelReason?.trim()
                                    ? order.cancelReason
                                    : order.canceledBy
                                        ? CANCELED_BY_LABELS[order.canceledBy]
                                        : "No reason was provided for this cancellation."}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <ShopInfoCard order={order} />
                    <OrderItemsCard order={order} />
                    <PaymentSlipCard order={order} />
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {isSuperAdmin && <OrderStatusActionCard order={order} />}
                    <CustomerCard order={order} />
                    <DeliveryInfoCard order={order} />
                    <OrderTimelineCard order={order} history={history} />
                </div>
            </div>
        </div>
    );
}
