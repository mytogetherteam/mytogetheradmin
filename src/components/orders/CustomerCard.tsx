import { Order } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, MapPin } from "lucide-react";
import { renderAddress } from "./order-format";

export function CustomerCard({ order }: { order: Order }) {
    return (
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
    );
}
