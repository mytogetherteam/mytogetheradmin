import { useState } from "react";
import { Gift, Loader2 } from "lucide-react";

import { useGrantSubscriptionMutation } from "@/hooks/subscriptions/useSubscription";
import { usePlans } from "@/hooks/plans/usePlan";
import type { PlanBillingPeriod } from "@/services/planService";
import { ShopSelect } from "@/components/ShopSelect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface GrantSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Puts a shop on a plan without a payment slip — for comped accounts, offline
 * deals and "Let's talk" tiers. It activates immediately.
 */
export function GrantSubscriptionDialog({
  open,
  onOpenChange,
}: GrantSubscriptionDialogProps) {
  const [shopId, setShopId] = useState<number | null>(null);
  const [planId, setPlanId] = useState<string>("");
  const [billingPeriod, setBillingPeriod] =
    useState<PlanBillingPeriod>("MONTHLY");
  const [amount, setAmount] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: plansData, isPending: loadingPlans } = usePlans({
    page: 1,
    size: 200,
    isActive: true,
  });
  const { mutateAsync: grant, isPending } = useGrantSubscriptionMutation();

  const plans = plansData?.content ?? [];
  const selectedPlan = plans.find((plan) => String(plan.id) === planId);

  const close = () => {
    setShopId(null);
    setPlanId("");
    setBillingPeriod("MONTHLY");
    setAmount("");
    setAdminNote("");
    setError(null);
    onOpenChange(false);
  };

  /** What the shop will be charged, unless the admin types an override. */
  const planAmount =
    billingPeriod === "YEARLY"
      ? selectedPlan?.annualPrice
      : selectedPlan?.price;

  const yearlyUnavailable =
    billingPeriod === "YEARLY" &&
    !!selectedPlan &&
    selectedPlan.annualPrice == null &&
    !selectedPlan.isCustomPricing;

  const handleSubmit = async () => {
    if (!shopId) return setError("Pick a shop.");
    if (!selectedPlan) return setError("Pick a plan.");
    if (yearlyUnavailable) {
      return setError(
        `"${selectedPlan.nameEn}" has no annual price. Grant it monthly instead.`,
      );
    }
    if (selectedPlan.isCustomPricing && !amount.trim()) {
      return setError(
        `"${selectedPlan.nameEn}" is custom-priced — enter the agreed amount.`,
      );
    }

    setError(null);
    await grant({
      shopId,
      planId: selectedPlan.id,
      billingPeriod,
      ...(amount.trim() ? { amount: Number(amount) } : {}),
      ...(adminNote.trim() ? { adminNote: adminNote.trim() } : {}),
    });
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Grant a plan</DialogTitle>
          <DialogDescription>
            Activates straight away — no payment slip and no review step. Any plan
            the shop is already on ends at this moment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Shop</Label>
            <ShopSelect onSelect={setShopId} placeholder="Search for a shop..." />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="grant-plan">Plan</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger id="grant-plan" hideClear>
                  <SelectValue
                    placeholder={loadingPlans ? "Loading…" : "Select a plan"}
                  >
                    {selectedPlan?.nameEn}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={String(plan.id)}>
                      {plan.nameEn}
                      {plan.isCustomPricing ? " — custom price" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grant-period">Billing period</Label>
              <Select
                value={billingPeriod}
                onValueChange={(next) =>
                  setBillingPeriod(next as PlanBillingPeriod)
                }
              >
                <SelectTrigger id="grant-period" hideClear>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grant-amount">Amount (฿)</Label>
            <Input
              id="grant-amount"
              type="number"
              min={0}
              placeholder={
                planAmount != null
                  ? `${planAmount} (plan price)`
                  : "Enter the agreed amount"
              }
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {selectedPlan?.isCustomPricing
                ? "This plan has no published price, so an amount is required."
                : "Leave empty to record the plan's own price."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grant-note">Internal note</Label>
            <Textarea
              id="grant-note"
              rows={2}
              placeholder="Comped for launch partnership"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Gift className="mr-2 h-4 w-4" />
            )}
            Grant plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
