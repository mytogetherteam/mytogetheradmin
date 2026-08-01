import { useState } from "react";
import { Check, ExternalLink, Loader2, X } from "lucide-react";

import {
  useApproveSubscriptionMutation,
  useCancelSubscriptionMutation,
  useRejectSubscriptionMutation,
  useSubscription,
} from "@/hooks/subscriptions/useSubscription";
import type { SubscriptionListItem } from "@/services/subscriptionService";
import { EditSubscriptionOptionsDialog } from "@/components/subscriptions/EditSubscriptionOptionsDialog";
import { OptionDeliveryChecklist } from "@/components/subscriptions/OptionDeliveryChecklist";
import { SubscriptionStatusBadge } from "@/components/subscriptions/SubscriptionStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * One short phrase per quota. Kept plain so the value column reads as a single
 * unit — "2 per day", not "2/1".
 */
function formatQuota(quota: SubscriptionListItem["quotas"][number]) {
  if (quota.isUnlimited) return "Unlimited";

  const parts: string[] = [];
  if (quota.limit != null) {
    parts.push(quota.period ? `${quota.limit} per ${quota.period}` : `×${quota.limit}`);
  }
  if (quota.valueLabel) parts.push(quota.valueLabel);
  if (quota.isChooseAll) parts.push("All options");
  else if (quota.chooseCount != null) {
    parts.push(`Choose ${quota.chooseCount}`);
  }
  return parts.join(" · ") || "Included";
}

interface SubscriptionDetailDialogProps {
  subscriptionId: number | null;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionDetailDialog({
  subscriptionId,
  onOpenChange,
}: SubscriptionDetailDialogProps) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [editPicksOpen, setEditPicksOpen] = useState(false);

  // Always refetch the full record: the row in the table may be a page old.
  const { data: subscription, isPending } = useSubscription(subscriptionId ?? 0);
  const { mutateAsync: approve, isPending: approving } =
    useApproveSubscriptionMutation();
  const { mutateAsync: reject, isPending: rejecting } =
    useRejectSubscriptionMutation();
  const { mutateAsync: cancel, isPending: canceling } =
    useCancelSubscriptionMutation();

  const busy = approving || rejecting || canceling;

  const close = () => {
    setReason("");
    setReasonError(null);
    setAdminNote("");
    onOpenChange(false);
  };

  const handleApprove = async () => {
    if (!subscription) return;
    await approve({
      id: subscription.id,
      body: adminNote.trim() ? { adminNote: adminNote.trim() } : undefined,
    });
    close();
  };

  /** Reject and cancel both need a reason the shop will actually read. */
  const withReason = async (action: (value: string) => Promise<unknown>) => {
    const value = reason.trim();
    if (value.length < 3) {
      setReasonError("Give the shop a reason (at least 3 characters).");
      return;
    }
    setReasonError(null);
    await action(value);
    close();
  };

  return (
    <Dialog
      open={subscriptionId != null}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
    >
      <DialogContent className="max-h-[90vh] sm:max-w-2xl">
        {isPending || !subscription ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                {subscription.shop?.nameEn ?? `Shop #${subscription.shopId}`}
                <span className="text-muted-foreground">·</span>
                {subscription.plan?.nameEn}
                <SubscriptionStatusBadge status={subscription.status} />
              </DialogTitle>
              <DialogDescription>
                {subscription.source === "ADMIN_GRANT"
                  ? "Granted directly by an admin — no payment slip involved."
                  : "Bought by the shop with a transfer slip attached."}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[55vh] pr-3">
              <div className="space-y-5">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Amount</dt>
                    <dd className="font-mono">
                      {subscription.amount != null
                        ? `฿${subscription.amount.toLocaleString()}`
                        : "—"}{" "}
                      <span className="text-xs text-muted-foreground">
                        /{subscription.billingPeriod === "YEARLY" ? "yr" : "mo"}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Period</dt>
                    <dd>
                      {subscription.startDate
                        ? `${formatDateTime(subscription.startDate)} → ${formatDateTime(subscription.endDate)}`
                        : "Not started"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Requested</dt>
                    <dd>{formatDateTime(subscription.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Reviewed</dt>
                    <dd>{formatDateTime(subscription.reviewedAt)}</dd>
                  </div>
                </dl>

                {subscription.rejectReason ? (
                  <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                    <span className="font-medium">Reason shown to shop:</span>{" "}
                    {subscription.rejectReason}
                  </p>
                ) : null}

                {subscription.adminNote ? (
                  <p className="rounded-md border bg-muted/40 p-3 text-sm">
                    <span className="font-medium">Internal note:</span>{" "}
                    {subscription.adminNote}
                  </p>
                ) : null}

                {subscription.payments.length > 0 ? (
                  <div className="space-y-2">
                    <Label>Payment slips</Label>
                    <div className="space-y-2">
                      {subscription.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex gap-3 rounded-md border p-3"
                        >
                          <a
                            href={payment.screenshotUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0"
                          >
                            <img
                              src={payment.screenshotUrl}
                              alt="Transfer slip"
                              className="h-24 w-24 rounded border object-cover"
                            />
                          </a>
                          <div className="min-w-0 flex-1 space-y-1 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant={
                                  payment.status === "APPROVED"
                                    ? "default"
                                    : payment.status === "REJECTED"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {payment.status}
                              </Badge>
                              <span className="font-mono">
                                {payment.amount != null
                                  ? `฿${payment.amount.toLocaleString()}`
                                  : "—"}
                              </span>
                              <a
                                href={payment.screenshotUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Full size
                              </a>
                            </div>
                            {payment.platformAccount ? (
                              <p className="text-xs text-muted-foreground">
                                Into {payment.platformAccount.paymentMethod.name}{" "}
                                · {payment.platformAccount.accountNumber}
                              </p>
                            ) : null}
                            {payment.transferRef ? (
                              <p className="text-xs text-muted-foreground">
                                Ref: {payment.transferRef}
                              </p>
                            ) : null}
                            <p className="text-xs text-muted-foreground">
                              Uploaded {formatDateTime(payment.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {subscription.quotas.length > 0 ? (
                  <div className="space-y-2">
                    <Label>Granted quotas</Label>
                    <p className="text-xs text-muted-foreground">
                      Frozen when the plan was activated — editing the plan later
                      does not change these.
                    </p>
                    {/* One quota per line: side-by-side columns ran the value of
                        one into the name of the next. */}
                    <div className="divide-y rounded-md border text-sm">
                      {subscription.quotas.map((quota) => (
                        <div
                          key={quota.featureKey}
                          className="flex items-baseline justify-between gap-4 px-3 py-2"
                        >
                          <span className="min-w-0 truncate text-muted-foreground">
                            {quota.featureName ?? quota.featureKey}
                          </span>
                          <span className="shrink-0 font-medium tabular-nums">
                            {formatQuota(quota)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {subscription.options.length > 0 ? (
                  <OptionDeliveryChecklist
                    subscriptionId={subscription.id}
                    options={subscription.options}
                    // Only a paid-for plan has anything to deliver against.
                    canRecord={
                      subscription.status === "ACTIVE" ||
                      subscription.status === "EXPIRED"
                    }
                    canEditPicks={
                      subscription.status === "ACTIVE" ||
                      subscription.status === "PENDING"
                    }
                    onEditPicks={() => setEditPicksOpen(true)}
                  />
                ) : null}

                {/* What Approve will actually do — shown before it is clicked,
                    because the difference between a renewal and a replacement is
                    days the shop already paid for. */}
                {subscription.status === "PENDING" &&
                subscription.activationPreview ? (
                  <div
                    className={`space-y-1 rounded-md border p-3 text-sm ${
                      subscription.activationPreview.supersedes.length > 0 ||
                      subscription.activationPreview.cancels.length > 0
                        ? "border-amber-500/40 bg-amber-500/10"
                        : "bg-muted/40"
                    }`}
                  >
                    <p className="font-medium">
                      {subscription.activationPreview.isRenewal
                        ? "Renewal — queues after the period already paid for"
                        : "Starts immediately on approval"}
                    </p>
                    <p className="text-muted-foreground">
                      Runs{" "}
                      {formatDateTime(subscription.activationPreview.startDate)}{" "}
                      → {formatDateTime(subscription.activationPreview.endDate)}
                    </p>
                    {subscription.activationPreview.supersedes.map((item) => (
                      <p key={item.id} className="text-amber-600 dark:text-amber-400">
                        ⚠ Ends subscription #{item.id} early — the shop loses{" "}
                        {item.daysCutShort} paid day
                        {item.daysCutShort === 1 ? "" : "s"}.
                      </p>
                    ))}
                    {/* A queued period is cancelled whole, not trimmed — the
                        shop paid for days it will never get. */}
                    {subscription.activationPreview.cancels.map((item) => (
                      <p key={item.id} className="text-red-600 dark:text-red-400">
                        ⚠ Cancels queued subscription #{item.id} (
                        {formatDateTime(item.startDate)} →{" "}
                        {formatDateTime(item.endDate)}) — {item.daysLost} paid
                        day{item.daysLost === 1 ? "" : "s"} never used. The shop
                        may be owed a refund.
                      </p>
                    ))}
                  </div>
                ) : null}

                {subscription.status === "PENDING" ? (
                  <div className="space-y-2">
                    <Label htmlFor="adminNote">Internal note (optional)</Label>
                    <Textarea
                      id="adminNote"
                      rows={2}
                      placeholder="Matched against the KBZ statement"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                    />
                  </div>
                ) : null}

                {subscription.status === "PENDING" ||
                subscription.status === "ACTIVE" ? (
                  <div className="space-y-2">
                    <Label htmlFor="reason">
                      {subscription.status === "PENDING"
                        ? "Rejection reason"
                        : "Cancellation reason"}
                    </Label>
                    <Textarea
                      id="reason"
                      rows={2}
                      placeholder="Slip is unreadable, please re-upload"
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value);
                        if (reasonError) setReasonError(null);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Shown to the shop. After a rejection they can upload a new
                      slip on the same request.
                    </p>
                    {reasonError ? (
                      <p className="text-xs text-destructive">{reasonError}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </ScrollArea>

            <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={close} disabled={busy}>
                Close
              </Button>

              {subscription.status === "PENDING" ? (
                <>
                  <Button
                    variant="destructive"
                    disabled={busy}
                    onClick={() =>
                      withReason((value) =>
                        reject({ id: subscription.id, reason: value }),
                      )
                    }
                  >
                    {rejecting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Reject
                  </Button>
                  <Button disabled={busy} onClick={handleApprove}>
                    {approving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Approve &amp; activate
                  </Button>
                </>
              ) : null}

              {subscription.status === "ACTIVE" ? (
                <Button
                  variant="destructive"
                  disabled={busy}
                  onClick={() =>
                    withReason((value) =>
                      cancel({ id: subscription.id, reason: value }),
                    )
                  }
                >
                  {canceling ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <X className="mr-2 h-4 w-4" />
                  )}
                  Cancel subscription
                </Button>
              ) : null}
            </div>
          </>
        )}
      </DialogContent>

      {subscription ? (
        <EditSubscriptionOptionsDialog
          open={editPicksOpen}
          onOpenChange={setEditPicksOpen}
          subscriptionId={subscription.id}
          planId={subscription.planId}
          currentOptions={subscription.options}
        />
      ) : null}
    </Dialog>
  );
}
