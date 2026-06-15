import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TableImage } from "@/components/TableImage";
import { Trash2 } from "lucide-react";
import { getBannerDisplayName } from "@/hooks/banner-images/useBannerManagement";
import type { BannerImage } from "@/schemas/banner-image.schema";

interface BannerCardProps {
  banner: BannerImage;
  onToggle: (id: number, active: boolean) => void;
  onEdit: (banner: BannerImage) => void;
  onDelete: (id: number, name: string) => void;
}

export function BannerCard({ banner, onToggle, onEdit, onDelete }: BannerCardProps) {
  const displayName = getBannerDisplayName(banner);

  return (
    <Card className="overflow-hidden">
      <div className="h-36 bg-muted flex items-center justify-center relative">
        <TableImage
          src={banner.imageUrl}
          alt={displayName}
          className="w-full h-full object-cover rounded-none"
        />
      </div>
      <CardContent className="pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm truncate">{displayName}</p>
          <Switch
            checked={banner.isActive}
            onCheckedChange={(checked) => onToggle(banner.id, checked)}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {banner.position} · {new Date(banner.startDate).toLocaleDateString()} –{" "}
          {new Date(banner.endDate).toLocaleDateString()}
        </p>
        {(banner.descriptionEn || banner.descriptionMm || banner.descriptionTh) && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {banner.descriptionEn || banner.descriptionMm || banner.descriptionTh}
          </p>
        )}
        <div className="flex justify-between items-center w-full gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onEdit(banner)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={() => onDelete(banner.id, displayName)}
          >
            <Trash2 className="h-3 w-3 mr-1" /> Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
