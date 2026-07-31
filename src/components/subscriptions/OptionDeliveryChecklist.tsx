import { useState } from "react";
import { Check, ExternalLink, Loader2, Pencil, Plus, X } from "lucide-react";

import {
  useRecordDeliveryMutation,
  useRemoveDeliveryMutation,
} from "@/hooks/subscriptions/useSubscription";
import type { SubscriptionOptionRow } from "@/services/subscriptionService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OptionDeliveryChecklistProps {
  subscriptionId: number;
  options: SubscriptionOptionRow[];
  /** Deliveries can only be recorded once the plan is paid for. */
  canRecord: boolean;
  /** Picks can only be swapped while the subscription is pending or running. */
  canEditPicks: boolean;
  onEditPicks: () => void;
}

/**
 * The shop's chosen package options and how much of each has actually been
 * delivered. These are services a person performs, so a SuperAdmin ticks each
 * one off — nothing can count them automatically.
 */
export function OptionDeliveryChecklist({
  subscriptionId,
  options,
  canRecord,
  canEditPicks,
  onEditPicks,
}: OptionDeliveryChecklistProps) {
  const [openRowId, setOpenRowId] = useState<number | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [note, setNote] = useState("");

  const { mutateAsync: recordDelivery, isPending: recording } =
    useRecordDeliveryMutation();
  const { mutateAsync: removeDelivery, isPending: removing } =
    useRemoveDeliveryMutation();

  const closeForm = () => {
    setOpenRowId(null);
    setLinkUrl("");
    setNote("");
  };

  const handleRecord = async (optionRowId: number) => {
    await recordDelivery({
      id: subscriptionId,
      payload: {
        subscriptionOptionId: optionRowId,
        linkUrl: linkUrl.trim() || undefined,
        note: note.trim() || undefined,
      },
    });
    closeForm();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>Package options</Label>
        {canEditPicks ? (
          <Button type="button" variant="ghost" size="sm" onClick={onEditPicks}>
            <Pencil className="mr-2 h-3 w-3" />
            Change picks
          </Button>
        ) : null}
      </div>
      <div className="divide-y rounded-md border">
        {options.map((option) => {
          const countable = option.quantity != null;
          const progress = countable
            ? (option.deliveredCount / option.quantity!) * 100
            : 0;

          return (
            <div key={option.id} className="space-y-2 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {option.optionText ?? `Option #${option.optionId}`}
                </span>
                {countable ? (
                  <Badge
                    variant={option.isFullyDelivered ? "default" : "secondary"}
                    className="gap-1"
                  >
                    {option.isFullyDelivered ? (
                      <Check className="h-3 w-3" />
                    ) : null}
                    {option.deliveredCount}/{option.quantity} delivered
                  </Badge>
                ) : (
                  <Badge variant="outline">Ongoing</Badge>
                )}
              </div>

              {countable ? (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
              ) : null}

              {option.deliveries.length > 0 ? (
                <ul className="space-y-1">
                  {option.deliveries.map((delivery) => (
                    <li
                      key={delivery.id}
                      className="flex items-center justify-between gap-2 text-xs text-muted-foreground"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                        <span className="shrink-0">
                          {new Date(delivery.deliveredAt).toLocaleDateString()}
                        </span>
                        {delivery.linkUrl ? (
                          <a
                            href={delivery.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 truncate hover:text-foreground"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">{delivery.linkUrl}</span>
                          </a>
                        ) : null}
                        {delivery.note ? (
                          <span className="truncate">· {delivery.note}</span>
                        ) : null}
                      </span>
                      {canRecord ? (
                        <button
                          type="button"
                          className="shrink-0 rounded p-0.5 hover:bg-muted hover:text-foreground"
                          aria-label="Undo this delivery"
                          disabled={removing}
                          onClick={() =>
                            removeDelivery({
                              id: subscriptionId,
                              deliveryId: delivery.id,
                            })
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}

              {canRecord && countable && !option.isFullyDelivered ? (
                openRowId === option.id ? (
                  <div className="space-y-2 rounded-md border bg-muted/30 p-2">
                    <Input
                      autoFocus
                      placeholder="https://facebook.com/… (optional)"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                    <Input
                      placeholder="Note (optional)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={closeForm}
                        disabled={recording}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={recording}
                        onClick={() => handleRecord(option.id)}
                      >
                        {recording ? (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-3 w-3" />
                        )}
                        Save delivery
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenRowId(option.id)}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Mark delivered
                  </Button>
                )
              ) : null}

              {!countable ? (
                <p className="text-xs text-muted-foreground">
                  No count on this option, so there is nothing to tick off.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
