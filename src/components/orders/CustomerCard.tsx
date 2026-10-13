import { useState, useMemo } from "react";
import { Order } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    User,
    Phone,
    MapPin,
    Maximize2,
    ExternalLink,
    Copy,
    Compass,
    Check,
} from "lucide-react";
import { toast } from "sonner";
import { orderAddressText } from "./order-format";

function extractCoordinates(order: Order): { lat: number; lon: number } | null {
    if (order.lat != null && order.lon != null) {
        const lat = Number(order.lat);
        const lon = Number(order.lon);
        if (!isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0)) {
            return { lat, lon };
        }
    }

    if (order.deliveryAddress) {
        let addrObj: any = order.deliveryAddress;
        if (typeof addrObj === "string" && (addrObj.startsWith("{") || addrObj.startsWith("["))) {
            try {
                addrObj = JSON.parse(addrObj);
            } catch {
                // not json
            }
        }
        if (typeof addrObj === "object" && addrObj !== null) {
            const lat = Number(addrObj.lat ?? addrObj.latitude);
            const lon = Number(addrObj.lon ?? addrObj.lng ?? addrObj.longitude);
            if (!isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0)) {
                return { lat, lon };
            }
        }
    }

    return null;
}

export function CustomerCard({ order }: { order: Order }) {
    const address = orderAddressText(order);
    const coords = useMemo(() => extractCoordinates(order), [order]);
    const hasCoords = coords !== null;

    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [mapProvider, setMapProvider] = useState<"google" | "osm">("google");
    const [copiedCoord, setCopiedCoord] = useState(false);
    const [copiedAddress, setCopiedAddress] = useState(false);

    const queryTarget = hasCoords
        ? `${coords!.lat},${coords!.lon}`
        : encodeURIComponent(address || "");

    const googleEmbedUrl = `https://maps.google.com/maps?q=${queryTarget}&hl=en&z=16&output=embed`;

    const osmEmbedUrl = useMemo(() => {
        if (hasCoords) {
            const delta = 0.006;
            const bbox = `${coords!.lon - delta}%2C${coords!.lat - delta}%2C${coords!.lon + delta}%2C${coords!.lat + delta}`;
            return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords!.lat}%2C${coords!.lon}`;
        }
        return googleEmbedUrl;
    }, [hasCoords, coords, googleEmbedUrl]);

    const activeEmbedUrl = mapProvider === "osm" && hasCoords ? osmEmbedUrl : googleEmbedUrl;
    const googleMapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${queryTarget}`;

    const copyCoordinates = () => {
        if (!coords) return;
        navigator.clipboard.writeText(`${coords.lat}, ${coords.lon}`);
        setCopiedCoord(true);
        setTimeout(() => setCopiedCoord(false), 2000);
        toast.success("Coordinates copied to clipboard!");
    };

    const copyAddress = () => {
        if (!address) return;
        navigator.clipboard.writeText(address);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
        toast.success("Address copied to clipboard!");
    };

    return (
        <>
            <Card className="border-border/70 shadow-sm overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/15">
                    <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                        Customer Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3.5">
                    {/* Customer Name & ID */}
                    <div className="flex items-start gap-3">
                        <User className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-foreground">{order.userFullName || "Guest User"}</p>
                            <p className="text-xs text-muted-foreground">ID: {order.userId || "N/A"}</p>
                        </div>
                    </div>

                    {/* Customer Phone */}
                    {order.userPhone && (
                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                            <a
                                href={`tel:${order.userPhone}`}
                                className="text-sm text-foreground hover:text-pink-600 dark:hover:text-pink-400 font-medium transition-colors"
                            >
                                {order.userPhone}
                            </a>
                        </div>
                    )}

                    {/* Customer Address */}
                    {address && (
                        <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                            <div className="text-sm text-foreground/90 overflow-hidden break-words leading-relaxed">
                                {address}
                            </div>
                        </div>
                    )}

                    {/* Customer Location with Map Pin & Mini Preview */}
                    {(hasCoords || address) && (
                        <div className="pt-3 border-t border-border/50 space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-pink-500 fill-pink-500/20" />
                                    Customer Location Pin
                                </span>
                                {hasCoords ? (
                                    <span className="text-[10px] font-mono text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded border border-border/40">
                                        {coords!.lat.toFixed(4)}, {coords!.lon.toFixed(4)}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded">
                                        From address
                                    </span>
                                )}
                            </div>

                            {/* Mini Map Card Preview with Expand Action */}
                            <div
                                onClick={() => setIsMapModalOpen(true)}
                                className="group relative h-32 w-full rounded-xl overflow-hidden border border-border/80 bg-muted/30 cursor-pointer shadow-xs hover:border-pink-500/60 hover:shadow-md transition-all duration-200"
                            >
                                <iframe
                                    title="Customer Location Mini Map"
                                    src={googleEmbedUrl}
                                    className="w-full h-full pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity"
                                    loading="lazy"
                                />

                                {/* Center Map Pin Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="relative flex items-center justify-center">
                                        <span className="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-pink-500 opacity-50" />
                                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-pink-600 to-orange-500 text-white flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-zinc-900">
                                            <MapPin className="h-4 w-4 fill-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Prompt */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-[1px] transition-all duration-200">
                                    <Maximize2 className="h-4 w-4" />
                                    <span>Click to Expand Map</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-0.5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-8 text-xs gap-1.5 hover:border-pink-500/50 hover:text-pink-600 dark:hover:text-pink-400 font-medium"
                                    onClick={() => setIsMapModalOpen(true)}
                                >
                                    <Maximize2 className="h-3.5 w-3.5" />
                                    <span>Expand Map</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
                                    asChild
                                >
                                    <a
                                        href={googleMapsExternalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Open directly in Google Maps"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        <span>Google Maps</span>
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Expanded Map Modal View (Dialog) */}
            <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
                <DialogContent className="max-w-3xl p-0 overflow-hidden border border-border/80 shadow-2xl">
                    <DialogHeader className="p-4 sm:p-5 border-b border-border/50 bg-muted/20">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0 border border-pink-500/20">
                                <MapPin className="h-5 w-5 fill-pink-500/30" />
                            </div>
                            <div>
                                <DialogTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                    Customer Delivery Location
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Order #{order.lastOrderNo || order.id} • Customer: {order.userFullName || "Customer"}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Customer & Address Details Bar */}
                    <div className="px-5 py-3.5 bg-muted/30 border-b border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span>{order.userFullName || "Guest User"} (ID: {order.userId || "N/A"})</span>
                            </div>
                            {order.userPhone && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Phone className="h-3.5 w-3.5 shrink-0" />
                                    <span>{order.userPhone}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5 sm:text-right">
                            {hasCoords ? (
                                <div className="flex items-center sm:justify-end gap-1.5 font-mono text-[11px] text-muted-foreground">
                                    <Compass className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                                    <span>Lat: {coords!.lat.toFixed(6)}, Lon: {coords!.lon.toFixed(6)}</span>
                                </div>
                            ) : (
                                <div className="text-muted-foreground text-[11px]">Exact coordinates not provided</div>
                            )}
                            {address && (
                                <div className="text-foreground/90 font-medium line-clamp-2" title={address}>
                                    {address}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Full Map View Container */}
                    <div className="relative w-full h-[450px] bg-muted/20">
                        <iframe
                            title="Customer Delivery Location Full Map"
                            src={activeEmbedUrl}
                            className="w-full h-full border-0"
                            loading="eager"
                        />

                        {/* Map Provider Switcher */}
                        {hasCoords && (
                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/90 backdrop-blur-md p-1 rounded-lg border border-border/70 shadow-sm text-xs">
                                <button
                                    type="button"
                                    onClick={() => setMapProvider("google")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                        mapProvider === "google"
                                            ? "bg-pink-500 text-white shadow-xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    Google Maps
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMapProvider("osm")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                        mapProvider === "osm"
                                            ? "bg-pink-500 text-white shadow-xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    OpenStreetMap
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Dialog Footer Actions */}
                    <DialogFooter className="p-3.5 px-5 border-t border-border/50 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {hasCoords && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5"
                                    onClick={copyCoordinates}
                                >
                                    {copiedCoord ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                    <span>{copiedCoord ? "Copied" : "Copy Coords"}</span>
                                </Button>
                            )}
                            {address && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5"
                                    onClick={copyAddress}
                                >
                                    {copiedAddress ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                    <span>{copiedAddress ? "Copied" : "Copy Address"}</span>
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <Button
                                type="button"
                                size="sm"
                                className="h-8 gap-1.5 bg-gradient-to-r from-pink-500 to-orange-500 text-white border-0 hover:opacity-90 shadow-xs"
                                asChild
                            >
                                <a href={googleMapsExternalUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    <span>Open in Google Maps</span>
                                </a>
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => setIsMapModalOpen(false)}
                            >
                                Close
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
