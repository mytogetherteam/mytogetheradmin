import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Truck, Loader2, Save, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DateTimePickerField } from "@/components/common/DateTimePickerField";
import { handleApiError } from "@/lib/error-utils";
import {
  freeDeliveryService,
  FreeDeliveryConfigDTO,
} from "@/services/freeDeliveryService";

export default function FreeDeliveryManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [startsAt, setStartsAt] = useState<Date | null>(null);
  const [endsAt, setEndsAt] = useState<Date | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const applyConfig = (config: FreeDeliveryConfigDTO) => {
    setIsEnabled(Boolean(config.isEnabled));
    setStartsAt(config.startsAt ? new Date(config.startsAt) : null);
    setEndsAt(config.endsAt ? new Date(config.endsAt) : null);
    setIsActive(Boolean(config.isActive));
    setUpdatedAt(config.updatedAt ?? null);
  };

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const config = await freeDeliveryService.getConfig();
      applyConfig(config);
    } catch (error) {
      handleApiError(error, "Failed to load free delivery settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    if (startsAt && endsAt && endsAt < startsAt) {
      toast.error("End must be after start");
      return;
    }
    setSaving(true);
    try {
      const updated = await freeDeliveryService.updateConfig({
        isEnabled,
        startsAt: startsAt ? startsAt.toISOString() : null,
        endsAt: endsAt ? endsAt.toISOString() : null,
      });
      applyConfig(updated);
      toast.success("Platform free delivery updated");
    } catch (error) {
      handleApiError(error, "Failed to save free delivery settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Free Delivery
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Platform-wide free delivery for all shops while active. Individual shops
            can still enable their own free delivery, or opt out of this campaign
            on the shop form.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetchConfig()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Global campaign</CardTitle>
              <CardDescription>
                Start and end are optional. Empty start means from now; empty end
                means until you turn it off.
              </CardDescription>
            </div>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active now" : "Inactive"}
            </Badge>
          </div>
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
                  <Label>Enable free delivery for all shops</Label>
                  <p className="text-xs text-muted-foreground">
                    Shops that opted out stay on normal fees unless they have their
                    own shop-level free delivery.
                  </p>
                </div>
                <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
              </div>

              {isEnabled && (
                <div className="grid gap-4 sm:grid-cols-2 rounded-lg border p-3 bg-muted/10">
                  <DateTimePickerField
                    label="Starts (optional)"
                    value={startsAt}
                    onChange={setStartsAt}
                  />
                  <DateTimePickerField
                    label="Ends (optional)"
                    value={endsAt}
                    onChange={setEndsAt}
                    error={
                      startsAt && endsAt && endsAt < startsAt
                        ? "End must be after start"
                        : undefined
                    }
                  />
                </div>
              )}

              {updatedAt && (
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(updatedAt).toLocaleString()}
                </p>
              )}

              <div className="flex justify-end">
                <Button onClick={() => void handleSave()} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
