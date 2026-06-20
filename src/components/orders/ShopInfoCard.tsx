import { useNavigate } from "react-router-dom";
import { Order } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";

export function ShopInfoCard({ order }: { order: Order }) {
    const navigate = useNavigate();
    return (
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
    );
}
