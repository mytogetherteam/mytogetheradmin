import { useState } from "react";
import { Loader2, Save } from "lucide-react";

import { useUpdateSubscriptionOptionsMutation } from "@/hooks/subscriptions/useSubscription";
import { usePlan } from "@/hooks/plans/usePlan";
import type { SubscriptionOptionRow } from "@/services/subscriptionService";
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
import { Label } from "@/components/ui/label";

interface EditSubscriptionOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: number;
  planId: number;
  /** What the subscription holds today, including delivery counts. */
  currentOptions: SubscriptionOptionRow[];
}

/**
 * Swaps which package options a subscription includes. The plan decides how many
 * may be picked, so the count is enforced here as well as on the API — and an
 * option that already has deliveries recorded cannot be unticked, because
 * dropping it would erase work that was done.
 */
export function EditSubscriptionOptionsDialog({
  open,
  onOpenChange,
  subscriptionId,
  planId,
  currentOptions,
}: EditSubscriptionOptionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Remounted per opening so the tick state starts from what is saved —
            no effect syncing props into state. */}
        {open ? (
          <EditOptionsForm
            key={currentOptions.map((option) => option.optionId).join("-")}
            onOpenChange={onOpenChange}
            subscriptionId={subscriptionId}
            planId={planId}
            currentOptions={currentOptions}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditOptionsForm({
  onOpenChange,
  subscriptionId,
  planId,
  currentOptions,
}: Omit<EditSubscriptionOptionsDialogProps, "open">) {
  const { data: plan, isPending: loadingPlan } = usePlan(planId);
  const { mutateAsync: updateOptions, isPending } =
    useUpdateSubscriptionOptionsMutation();

  const [selected, setSelected] = useState<number[]>(() =>
    currentOptions.map((option) => option.optionId),
  );
  const [error, setError] = useState<string | null>(null);

  const deliveredByOptionId = new Map(
    currentOptions.map((option) => [option.optionId, option.deliveredCount]),
  );

  // Only "pick N of these" rows are editable; a plain quota has no options.
  const selectableFeatures = (plan?.featureValues ?? []).filter(
    (featureValue) =>
      featureValue.offeredOptions.length > 0 && !featureValue.isChooseAll,
  );

  const handleToggle = (optionId: number, checked: boolean) => {
    setError(null);
    setSelected((current) =>
      checked
        ? [...current, optionId]
        : current.filter((id) => id !== optionId),
    );
  };

  const handleSave = async () => {
    for (const featureValue of selectableFeatures) {
      const required = Math.min(
        featureValue.chooseCount ?? featureValue.offeredOptions.length,
        featureValue.offeredOptions.length,
      );
      const picked = featureValue.offeredOptions.filter((option) =>
        selected.includes(option.id),
      ).length;
      if (picked !== required) {
        setError(
          `"${featureValue.feature?.nameEn ?? "This feature"}" needs exactly ${required} option(s) — ${picked} selected.`,
        );
        return;
      }
    }

    await updateOptions({ id: subscriptionId, selectedOptionIds: selected });
    onOpenChange(false);
  };

  return (
    <>
        <DialogHeader>
          <DialogTitle>Change package options</DialogTitle>
          <DialogDescription>
            Pick what this shop gets. Options with deliveries already recorded
            cannot be removed.
          </DialogDescription>
        </DialogHeader>

        {loadingPlan ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : selectableFeatures.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            This plan has nothing to choose — its options are fixed.
          </p>
        ) : (
          <div className="space-y-4">
            {selectableFeatures.map((featureValue) => {
              const required = Math.min(
                featureValue.chooseCount ?? featureValue.offeredOptions.length,
                featureValue.offeredOptions.length,
              );
              const picked = featureValue.offeredOptions.filter((option) =>
                selected.includes(option.id),
              ).length;

              return (
                <div key={featureValue.featureId} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>{featureValue.feature?.nameEn}</Label>
                    <Badge
                      variant={picked === required ? "default" : "secondary"}
                    >
                      {picked}/{required} chosen
                    </Badge>
                  </div>
                  <div className="divide-y rounded-md border">
                    {featureValue.offeredOptions.map((option) => {
                      const delivered = deliveredByOptionId.get(option.id) ?? 0;
                      const locked = delivered > 0;
                      const checked = selected.includes(option.id);
                      return (
                        <label
                          key={option.id}
                          htmlFor={`opt-${option.id}`}
                          className={`flex items-start gap-3 p-3 ${
                            locked ? "opacity-90" : "cursor-pointer hover:bg-muted/50"
                          }`}
                        >
                          <Checkbox
                            id={`opt-${option.id}`}
                            checked={checked}
                            disabled={locked}
                            onCheckedChange={(next) =>
                              handleToggle(option.id, next === true)
                            }
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span>{option.textEn}</span>
                              {option.quantity != null ? (
                                <Badge variant="outline">
                                  ×{option.quantity}
                                </Badge>
                              ) : null}
                            </div>
                            {locked ? (
                              <p className="text-xs text-muted-foreground">
                                {delivered} delivery/deliveries recorded — undo
                                them first to remove this.
                              </p>
                            ) : null}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || selectableFeatures.length === 0}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save picks
          </Button>
        </DialogFooter>
    </>
  );
}
