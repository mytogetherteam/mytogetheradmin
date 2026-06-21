import { Bike, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { TableImage } from "@/components/TableImage";
import {
  getDeliveryDriverShopName,
  type DeliveryDriver,
} from "@/schemas/delivery-driver.schema";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

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
    <span className="text-sm text-right">{value ?? "—"}</span>
  </div>
);

type DeliveryDriverDetailModalProps = {
  driver: DeliveryDriver | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHardDelete: (driver: DeliveryDriver) => void;
};

export function DeliveryDriverDetailModal({
  driver,
  open,
  onOpenChange,
  onHardDelete,
}: DeliveryDriverDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {driver ? (
          <>
            <DialogHeader>
              <DialogTitle>{driver.name}</DialogTitle>
              <DialogDescription>
                Driver #{driver.id} · {getDeliveryDriverShopName(driver)}
              </DialogDescription>
            </DialogHeader>

            <Separator />

            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <TableImage
                  src={driver.profileUrl}
                  alt={driver.name}
                  size="lg"
                  fallbackIcon={
                    <Bike className="h-5 w-5 text-muted-foreground" />
                  }
                />
                <div>
                  <p className="font-medium">{driver.name}</p>
                  <p className="text-sm text-muted-foreground">{driver.phone}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Bike className="h-3 w-3" />
                    {driver.vehicleNo}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3">
                <InfoRow label="Shop" value={getDeliveryDriverShopName(driver)} />
                <InfoRow label="Active" value={driver.isActive ? "Yes" : "No"} />
                <InfoRow label="Busy" value={driver.isBusy ? "Yes" : "No"} />
                <InfoRow label="Created" value={formatDate(driver.createdAt)} />
                <InfoRow label="Updated" value={formatDate(driver.updatedAt)} />
                <InfoRow
                  label="Soft deleted"
                  value={formatDate(driver.deletedAt)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => onHardDelete(driver)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hard delete
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
