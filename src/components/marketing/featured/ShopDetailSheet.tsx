import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Star,
  Store,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { Shop } from "@/services/shopService";

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => (
  <div className="flex justify-between items-start gap-4 py-2 border-b border-muted/40 last:border-0">
    <span className="text-xs font-bold uppercase text-muted-foreground shrink-0">
      {label}
    </span>
    <span className="text-sm text-right">{value ?? "N/A"}</span>
  </div>
);

const BoolBadge = ({ value, label }: { value?: boolean; label: string }) => (
  <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/30 border border-muted/40">
    <span className="text-[10px] text-muted-foreground uppercase font-bold">
      {label}
    </span>
    {value ? (
      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1 text-[10px] hover:bg-green-500/10">
        <CheckCircle2 className="h-3 w-3" /> Yes
      </Badge>
    ) : (
      <Badge variant="outline" className="text-muted-foreground gap-1 text-[10px]">
        <XCircle className="h-3 w-3" /> No
      </Badge>
    )}
  </div>
);

interface ShopDetailSheetProps {
  shop: Shop | null;
  open: boolean;
  onClose: () => void;
  onToggleFeatured: (shop: Shop) => void;
  onBoost: (shop: Shop) => void;
  featuringId: number | null;
}

export function ShopDetailSheet({
  shop,
  open,
  onClose,
  onToggleFeatured,
  onBoost,
  featuringId,
}: ShopDetailSheetProps) {
  if (!shop) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            {shop.logoUrl ? (
              <img
                src={shop.logoUrl}
                alt={shop.nameEn}
                className="h-14 w-14 rounded-xl object-cover border"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Store className="h-7 w-7 text-primary" />
              </div>
            )}
            <div>
              <SheetTitle className="text-lg">
                {shop.nameEn || shop.nameMm || "Shop"}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                <span>ID: {shop.id}</span>
                {shop.isFeatured && (
                  <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1 text-[10px] hover:bg-yellow-500/10">
                    <Star className="h-3 w-3 fill-yellow-500" /> Featured
                  </Badge>
                )}
                <Badge
                  variant={shop.isActive ? "default" : "secondary"}
                  className="text-[10px]"
                >
                  {shop.isActive ? "Active" : "Inactive"}
                </Badge>
              </SheetDescription>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              className="flex-1"
              variant={shop.isFeatured ? "outline" : "default"}
              size="sm"
              disabled={featuringId === shop.id}
              onClick={() => onToggleFeatured(shop)}
            >
              <Star
                className={`h-4 w-4 mr-2 ${
                  shop.isFeatured ? "fill-yellow-500 text-yellow-500" : ""
                }`}
              />
              {shop.isFeatured ? "Unfeature Shop" : "Set as Featured"}
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              size="sm"
              onClick={() => onBoost(shop)}
            >
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              Boost Score
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">
              Basic Info
            </h3>
            <InfoRow label="Name (EN)" value={shop.nameEn} />
            <InfoRow label="Name (MM)" value={shop.nameMm} />
            <InfoRow label="Name (TH)" value={shop.nameTh} />
            <InfoRow
              label="Category"
              value={shop.shopCategory?.nameEn || shop.category}
            />
            <InfoRow label="Price Preference" value={shop.pricePreference} />
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">
              Contact
            </h3>
            <div className="space-y-1.5">
              {shop.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {shop.phone}
                </div>
              )}
              {shop.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {shop.email}
                </div>
              )}
              {(shop.addressEn || shop.address) && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                  <span>{shop.addressEn || shop.address}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">
              Features
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <BoolBadge value={shop.deliveryEnabled} label="Delivery" />
              <BoolBadge value={shop.hasWifi} label="WiFi" />
              <BoolBadge value={shop.hasParking} label="Parking" />
              <BoolBadge value={shop.isHalal} label="Halal" />
              <BoolBadge value={shop.isVegetarian} label="Vegetarian" />
              <BoolBadge value={shop.isVerified} label="Verified" />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">
              Location
            </h3>
            <InfoRow label="District" value={shop.districtId} />
            <InfoRow label="Latitude" value={shop.latitude} />
            <InfoRow label="Longitude" value={shop.longitude} />
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">
              Timestamps
            </h3>
            <InfoRow
              label="Created At"
              value={
                shop.createdAt ? new Date(shop.createdAt).toLocaleString() : null
              }
            />
            <InfoRow
              label="Updated At"
              value={
                shop.updatedAt ? new Date(shop.updatedAt).toLocaleString() : null
              }
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
