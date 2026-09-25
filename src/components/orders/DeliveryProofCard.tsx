import { Order } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, ExternalLink, Link2 } from "lucide-react";

/**
 * Proof-of-delivery photo and/or tracking URL. Renders nothing when neither
 * is present so the detail page layout stays unchanged for most orders.
 */
export function DeliveryProofCard({ order }: { order: Order }) {
    const proofUrl = order.proofPhotoUrl?.trim() || null;
    const trackingUrl = order.trackingUrl?.trim() || null;
    if (!proofUrl && !trackingUrl) return null;

    return (
        <Card>
            <CardHeader className="pb-3 px-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    Delivery Proof
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
                {trackingUrl && (
                    <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="text-sm truncate">{trackingUrl}</span>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                            <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-1.5" />
                                Open
                            </a>
                        </Button>
                    </div>
                )}
                {proofUrl && (
                    <div className="max-w-md mx-auto aspect-[3/4] rounded-lg border overflow-hidden bg-muted relative group">
                        <img src={proofUrl} alt="Delivery proof" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button size="sm" variant="secondary" asChild>
                                <a href={proofUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open Full
                                </a>
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
