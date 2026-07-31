import { Gift, Receipt } from "lucide-react";

import type { SubscriptionListItem } from "@/services/subscriptionService";
import { SubscriptionStatusBadge } from "@/components/subscriptions/SubscriptionStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(amount: number | null) {
  return amount != null ? `฿${amount.toLocaleString()}` : "—";
}

interface SubscriptionsTableProps {
  subscriptions: SubscriptionListItem[];
  onOpen: (subscription: SubscriptionListItem) => void;
}

export function SubscriptionsTable({
  subscriptions,
  onOpen,
}: SubscriptionsTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Shop</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((subscription) => (
            <TableRow
              key={subscription.id}
              className="cursor-pointer"
              onClick={() => onOpen(subscription)}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  {subscription.shop?.logoUrl ? (
                    <img
                      src={subscription.shop.logoUrl}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : null}
                  <span className="font-medium">
                    {subscription.shop?.nameEn ?? `Shop #${subscription.shopId}`}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-2">
                  <span>{subscription.plan?.nameEn ?? "—"}</span>
                  {subscription.source === "ADMIN_GRANT" ? (
                    <Badge variant="secondary" className="gap-1">
                      <Gift className="h-3 w-3" />
                      Granted
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <Receipt className="h-3 w-3" />
                      Slip
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {formatAmount(subscription.amount)}
                <span className="ml-1 text-xs text-muted-foreground">
                  /{subscription.billingPeriod === "YEARLY" ? "yr" : "mo"}
                </span>
              </TableCell>
              <TableCell className="text-sm">
                {subscription.startDate ? (
                  <div className="flex flex-col">
                    <span>
                      {formatDate(subscription.startDate)} →{" "}
                      {formatDate(subscription.endDate)}
                    </span>
                    {subscription.daysRemaining != null ? (
                      <span className="text-xs text-muted-foreground">
                        {subscription.daysRemaining} day
                        {subscription.daysRemaining === 1 ? "" : "s"} left
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Not started</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <SubscriptionStatusBadge
                    status={subscription.status}
                    className="w-fit"
                  />
                  {/* A row can read ACTIVE while its window has not opened yet. */}
                  {subscription.status === "ACTIVE" &&
                  !subscription.isCurrent ? (
                    <span className="text-xs text-muted-foreground">
                      Not running now
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(subscription);
                  }}
                >
                  {subscription.status === "PENDING" ? "Review" : "View"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
