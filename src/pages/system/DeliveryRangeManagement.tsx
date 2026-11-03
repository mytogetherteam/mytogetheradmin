import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, Loader2, Save, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { handleApiError } from "@/lib/error-utils";
import {
  deliveryRangeService,
  DeliveryRangeDTO,
} from "@/services/deliveryRangeService";

export default function DeliveryRangeManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [maxDeliveryKm, setMaxDeliveryKm] = useState("30");
  const [farWarningKm, setFarWarningKm] = useState("6");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const applyConfig = (range: DeliveryRangeDTO) => {
    setLimitEnabled(range.enabled === true);
    setMaxDeliveryKm(String(range.maxDeliveryKm));
    setFarWarningKm(String(range.farWarningKm));
    setUpdatedAt(range.updatedAt ?? null);
  };

  const fetchRange = useCallback(async () => {
    setLoading(true);
    try {
      applyConfig(await deliveryRangeService.get());
    } catch (error) {
      handleApiError(error, "Failed to load delivery range");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRange();
  }, [fetchRange]);

  const handleSave = async () => {
    const maxKm = Number(maxDeliveryKm);
    const warningKm = Number(farWarningKm);
    if (!Number.isFinite(maxKm) || !Number.isFinite(warningKm)) {
      toast.error("Enter both distances in kilometers");
      return;
    }
    if (warningKm >= maxKm) {
      toast.error("The warning distance must be lower than the maximum");
      return;
    }
    setSaving(true);
    try {
      applyConfig(
        await deliveryRangeService.update({
          enabled: limitEnabled,
          maxDeliveryKm: maxKm,
          farWarningKm: warningKm,
        }),
      );
      toast.success("Delivery range updated");
    } catch (error) {
      handleApiError(error, "Failed to save delivery range");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Delivery Range
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Straight-line kilometers from the shop to the customer’s address.
            Blocking far deliveries is off until you turn it on. Above the
            warning distance, the customer must confirm first.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetchRange()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer app limits</CardTitle>
          <CardDescription>
            Turn blocking on to stop a delivery at the maximum distance or
            farther. The warning starts only after its own distance, so 6 km
            still allows the order after the customer confirms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <>
              <div className="flex flex-row items-center justify-between rounded-lg border p-3 bg-muted/20">
                <div className="space-y-0.5 pr-4">
                  <Label htmlFor="delivery-limit-enabled">
                    Block deliveries beyond the maximum
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Off by default. When on, a delivery at the maximum distance,
                    or farther, cannot be placed.
                  </p>
                </div>
                <Switch
                  id="delivery-limit-enabled"
                  checked={limitEnabled}
                  onCheckedChange={setLimitEnabled}
                />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="max-delivery-km">Maximum delivery distance (km)</Label>
                  <Input
                    id="max-delivery-km"
                    type="number"
                    min={1}
                    max={200}
                    step="0.1"
                    value={maxDeliveryKm}
                    onChange={(event) => setMaxDeliveryKm(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used only while blocking is turned on.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="far-warning-km">Far delivery warning (km)</Label>
                  <Input
                    id="far-warning-km"
                    type="number"
                    min={1}
                    max={200}
                    step="0.1"
                    value={farWarningKm}
                    onChange={(event) => setFarWarningKm(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Customers see a confirmation above this distance.
                  </p>
                </div>
              </div>
              {updatedAt && (
                <p className="text-xs text-muted-foreground">
                  Last updated {new Date(updatedAt).toLocaleString()}
                </p>
              )}
              <Button onClick={() => void handleSave()} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
