import { useState } from "react";
import { Gift, Loader2 } from "lucide-react";

import { useGrantSubscriptionMutation } from "@/hooks/subscriptions/useSubscription";
import { usePlans } from "@/hooks/plans/usePlan";
import type { PlanBillingPeriod } from "@/services/planService";
import { ShopSelect } from "@/components/ShopSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

/**
 * Applies a "choose N" tick without ever exceeding N. With N = 1 the new pick
 * replaces the old one, which is what a single-choice list should do; above that
 * the extra boxes are disabled instead.
 */
function toggleWithinFeature(params: {
  current: number[];
  optionId: number;
  checked: boolean;
  featureOptionIds: number[];
  required: number;
}) {
  const { current, optionId, checked, featureOptionIds, required } = params;
  if (!checked) return current.filter((id) => id !== optionId);

  const pickedHere = current.filter((id) => featureOptionIds.includes(id));
  if (pickedHere.length < required) return [...current, optionId];
  if (required === 1) {
    // Swap: drop this feature's other pick, keep every other feature's.
    return [
      ...current.filter((id) => !featureOptionIds.includes(id)),
      optionId,
    ];
  }
  return current;
}

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
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: plansData, isPending: loadingPlans } = usePlans({
    page: 1,
    size: 200,
    isActive: true,
  });
  const { mutateAsync: grant, isPending } = useGrantSubscriptionMutation();

  const plans = plansData?.content ?? [];
  const selectedPlan = plans.find((plan) => String(plan.id) === planId);

  /**
   * "Choose N" features must be answered before the plan can be granted — the
   * API rejects the grant otherwise. "(All)" needs no answer: it takes the lot.
   */
  const selectableFeatures = (selectedPlan?.featureValues ?? []).filter(
    (featureValue) =>
      featureValue.offeredOptions.length > 0 && !featureValue.isChooseAll,
  );

  const requiredFor = (featureValue: (typeof selectableFeatures)[number]) =>
    Math.min(
      featureValue.chooseCount ?? featureValue.offeredOptions.length,
      featureValue.offeredOptions.length,
    );

  const close = () => {
    setShopId(null);
    setPlanId("");
    setBillingPeriod("MONTHLY");
    setAmount("");
    setAdminNote("");
    setSelectedOptionIds([]);
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

    for (const featureValue of selectableFeatures) {
      const required = requiredFor(featureValue);
      const picked = featureValue.offeredOptions.filter((option) =>
        selectedOptionIds.includes(option.id),
      ).length;
      if (picked !== required) {
        return setError(
          `Choose ${required} option(s) for "${featureValue.feature?.nameEn ?? "this feature"}" — ${picked} selected.`,
        );
      }
    }

    setError(null);
    await grant({
      shopId,
      planId: selectedPlan.id,
      billingPeriod,
      ...(amount.trim() ? { amount: Number(amount) } : {}),
      ...(adminNote.trim() ? { adminNote: adminNote.trim() } : {}),
      ...(selectedOptionIds.length ? { selectedOptionIds } : {}),
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
              <Select
                value={planId}
                onValueChange={(next) => {
                  setPlanId(next);
                  // Options belong to the old plan; keeping them would send ids
                  // the new plan does not offer.
                  setSelectedOptionIds([]);
                  setError(null);
                }}
              >
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

          {selectableFeatures.map((featureValue) => {
            const required = requiredFor(featureValue);
            const picked = featureValue.offeredOptions.filter((option) =>
              selectedOptionIds.includes(option.id),
            ).length;
            return (
              <div key={featureValue.featureId} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>{featureValue.feature?.nameEn}</Label>
                  <Badge variant={picked === required ? "default" : "secondary"}>
                    {picked}/{required} chosen
                  </Badge>
                </div>
                <div className="divide-y rounded-md border">
                  {featureValue.offeredOptions.map((option) => {
                    const checked = selectedOptionIds.includes(option.id);
                    const featureOptionIds = featureValue.offeredOptions.map(
                      (item) => item.id,
                    );
                    return (
                      <label
                        key={option.id}
                        htmlFor={`grant-opt-${option.id}`}
                        className="flex cursor-pointer items-center gap-3 p-3 text-sm hover:bg-muted/50"
                      >
                        <Checkbox
                          id={`grant-opt-${option.id}`}
                          checked={checked}
                          // Over-picking is refused at the tick rather than at
                          // submit: "2/1 chosen" is not a state worth allowing.
                          disabled={!checked && picked >= required && required > 1}
                          onCheckedChange={(next) => {
                            setError(null);
                            setSelectedOptionIds((current) =>
                              toggleWithinFeature({
                                current,
                                optionId: option.id,
                                checked: next === true,
                                featureOptionIds,
                                required,
                              }),
                            );
                          }}
                        />
                        <span className="flex-1">{option.textEn}</span>
                        {option.quantity != null ? (
                          <Badge variant="outline">×{option.quantity}</Badge>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {required === 1
                    ? "Pick one — ticking another swaps it."
                    : `The shop must be given exactly ${required} of these.`}
                </p>
              </div>
            );
          })}

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
