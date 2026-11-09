import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Save, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleApiError } from "@/lib/error-utils";
import { orderTimeoutService, OrderFlowTimes } from "@/services/orderTimeoutService";

const FIELDS: { key: keyof OrderFlowTimes; label: string; help: string }[] = [
  {
    key: "pendingWarnMinutes",
    label: "New order warning",
    help: "Minutes in Pending before the shop is reminded.",
  },
  {
    key: "pendingCancelMinutes",
    label: "New order cancel",
    help: "Minutes in Pending before the order cancels itself. Must be later than the warning.",
  },
  {
    key: "paymentWarnMinutes",
    label: "Payment slip warning",
    help: "Minutes after a slip is requested before the customer is reminded.",
  },
  {
    key: "paymentCancelMinutes",
    label: "Payment slip cancel",
    help: "Minutes after a slip is requested before the order cancels itself. Must be later than the warning.",
  },
  {
    key: "approvalWarnMinutes",
    label: "Slip review warning",
    help: "Minutes a slip can wait before the shop is reminded to check it. This step does not cancel the order.",
  },
];

export default function OrderTimeoutManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({
    pendingWarnMinutes: "5",
    pendingCancelMinutes: "10",
    paymentWarnMinutes: "10",
    paymentCancelMinutes: "20",
    approvalWarnMinutes: "5",
  });
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const apply = (times: OrderFlowTimes) => {
    setValues({
      pendingWarnMinutes: String(times.pendingWarnMinutes),
      pendingCancelMinutes: String(times.pendingCancelMinutes),
      paymentWarnMinutes: String(times.paymentWarnMinutes),
      paymentCancelMinutes: String(times.paymentCancelMinutes),
      approvalWarnMinutes: String(times.approvalWarnMinutes),
    });
    setUpdatedAt(times.updatedAt ?? null);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      apply(await orderTimeoutService.get());
    } catch (error) {
      handleApiError(error, "Failed to load order flow times");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    const payload = {} as OrderFlowTimes;
    for (const field of FIELDS) {
      const parsed = Number(values[field.key]);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1440) {
        toast.error(`${field.label} must be a whole number of minutes from 1 to 1440`);
        return;
      }
      payload[field.key] = parsed as never;
    }
    if (payload.pendingCancelMinutes <= payload.pendingWarnMinutes) {
      toast.error("The new-order cancel time must be later than the warning");
      return;
    }
    if (payload.paymentCancelMinutes <= payload.paymentWarnMinutes) {
      toast.error("The payment cancel time must be later than the warning");
      return;
    }

    setSaving(true);
    try {
      apply(await orderTimeoutService.update(payload));
      toast.success("Order flow times saved. Orders already waiting keep their current timer.");
    } catch (error) {
      handleApiError(error, "Failed to save order flow times");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Timer className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold md:text-2xl">Order Timeouts</h1>
        <Button variant="outline" size="sm" className="ml-auto gap-2" onClick={() => void load()} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How long each step waits</CardTitle>
          <CardDescription>
            These are the clocks for a new order, a payment slip, and a slip waiting to be checked.
            Saving does not restart an order that is already waiting. The next order to enter that step uses the new time.
            Until you save, the times stay 5, 10, 10, 20, and 5 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                inputMode="numeric"
                value={values[field.key] ?? ""}
                disabled={loading || saving}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [field.key]: event.target.value }))
                }
              />
              <p className="text-sm text-muted-foreground">{field.help}</p>
            </div>
          ))}
          <div className="md:col-span-2 flex items-center gap-3">
            <Button onClick={() => void handleSave()} disabled={loading || saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
            {updatedAt ? (
              <p className="text-sm text-muted-foreground">
                Last saved {new Date(updatedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
