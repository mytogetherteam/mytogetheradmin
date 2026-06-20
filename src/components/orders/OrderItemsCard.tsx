import { Order } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Package } from "lucide-react";
import { renderCurrency } from "./order-format";

export function OrderItemsCard({ order }: { order: Order }) {
    const subtotalFallback =
        (order.totalAmount || 0) - (order.deliveryFee || 0) - (order.taxAmount || 0);

    return (
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
                        <span className="text-muted-foreground">Item Price (Subtotal)</span>
                        <span>{renderCurrency(order.displayItemPrice ?? order.itemPrice ?? subtotalFallback)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span>{renderCurrency(order.displayTaxAmount ?? order.taxAmount ?? 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery Fee</span>
                        <span>{renderCurrency(order.displayDeliveryFee ?? order.deliveryFee)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total Amount</span>
                        <span className="text-primary">{renderCurrency(order.displayTotalAmount || order.totalAmount)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
