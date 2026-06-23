import { Bike } from "lucide-react";
import { DeliveryDriversPanel } from "@/pages/delivery-drivers/components/DeliveryDriversPanel";

export default function ManageDeliveryDrivers() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Bike className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">Delivery Drivers</h1>
          <p className="text-sm text-muted-foreground">
            View all shop delivery drivers. Shops soft-delete; admin can hard
            delete permanently.
          </p>
        </div>
      </div>

      <DeliveryDriversPanel />
    </div>
  );
}
