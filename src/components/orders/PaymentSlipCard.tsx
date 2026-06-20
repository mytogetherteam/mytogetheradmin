import { Order } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink } from "lucide-react";

export function PaymentSlipCard({ order }: { order: Order }) {
    if (!order.paymentSlipUrl) return null;
    return (
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
    );
}
