import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Gift, Loader2, Search, X } from "lucide-react";

import {
  useSubscriptionSummary,
  useSubscriptions,
} from "@/hooks/subscriptions/useSubscription";
import type { SubscriptionStatus } from "@/services/subscriptionService";
import { ShopSelect } from "@/components/ShopSelect";
import { GrantSubscriptionDialog } from "@/components/subscriptions/GrantSubscriptionDialog";
import { SubscriptionDetailDialog } from "@/components/subscriptions/SubscriptionDetailDialog";
import { SubscriptionsTable } from "@/components/subscriptions/SubscriptionsTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ALL = "ALL";

/** Pending first — that is the queue a SuperAdmin actually works through. */
const TABS: { value: string; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "REJECTED", label: "Rejected" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CANCELED", label: "Cancelled" },
  { value: ALL, label: "All" },
];

export default function ManageSubscriptions() {
  const [tab, setTab] = useState<string>("PENDING");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [grantOpen, setGrantOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [shopId, setShopId] = useState<number | null>(null);
  // Bumping this remounts <ShopSelect>, resetting its own label on "Clear".
  const [shopSelectKey, setShopSelectKey] = useState(0);
  const isFirstSearchDebounce = useRef(true);
  const [searchParams, setSearchParams] = useSearchParams();

  // `?subscriptionId=` deep link — the notification bell sends a SuperAdmin
  // straight to the purchase that raised the alert. Derived, not synced into
  // state, so closing the dialog is what clears it.
  const linkedId = searchParams.get("subscriptionId");
  const activeDetailId = detailId ?? (linkedId ? Number(linkedId) : null);

  const closeDetail = () => {
    setDetailId(null);
    if (!linkedId) return;
    // Drop the param, or re-opening the dialog from the table would fight it.
    const next = new URLSearchParams(searchParams);
    next.delete("subscriptionId");
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const delayMs = isFirstSearchDebounce.current ? 0 : 500;
    isFirstSearchDebounce.current = false;
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), delayMs);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isPending: loading } = useSubscriptions({
    page: 1,
    size: 100,
    search: debouncedSearch.trim() || undefined,
    status: tab === ALL ? undefined : (tab as SubscriptionStatus),
    shopId: shopId ?? undefined,
  });
  // Same scope as the list, so the tab counts never contradict the rows.
  const { data: summary } = useSubscriptionSummary(shopId ?? undefined);

  const subscriptions = data?.content ?? [];
  const pendingCount = summary?.PENDING ?? 0;
  const hasFilters = shopId !== null || searchTerm.trim().length > 0;

  const resetFilters = () => {
    setShopId(null);
    setSearchTerm("");
    setShopSelectKey((k) => k + 1);
  };

  return (
    <div className="container mx-auto max-w-6xl py-10">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Subscriptions
                {pendingCount > 0 ? (
                  <Badge variant="destructive">{pendingCount} to review</Badge>
                ) : null}
              </CardTitle>
              <CardDescription>
                Shop plan purchases awaiting review, plus everything already
                granted. Click a row to see the transfer slip.
              </CardDescription>
            </div>
            {/* The only action up here — filters live above the table instead. */}
            <Button className="shrink-0" onClick={() => setGrantOpen(true)}>
              <Gift className="h-4 w-4" />
              Grant Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Tabs value={tab} onValueChange={setTab} className="w-full lg:w-auto">
              <TabsList className="flex flex-wrap justify-start">
                {TABS.map((item) => {
                  const count =
                    item.value === ALL
                      ? undefined
                      : (summary?.[item.value as SubscriptionStatus] ?? 0);
                  return (
                    <TabsTrigger key={item.value} value={item.value}>
                      {item.label}
                      {count !== undefined ? (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {count}
                        </span>
                      ) : null}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <ShopSelect
                key={shopSelectKey}
                onSelect={setShopId}
                className="w-full sm:w-[200px]"
                placeholder="All shops"
              />
              <div className="relative w-full sm:w-[220px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search shop or plan..."
                  className="w-full pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {hasFilters ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="self-start text-muted-foreground sm:self-auto"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              ) : null}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : subscriptions.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {debouncedSearch.trim()
                ? "No subscription matches that search."
                : shopId
                  ? "This shop has nothing under this tab."
                  : tab === "PENDING"
                    ? "Nothing waiting for review."
                    : "No subscriptions here yet."}
            </p>
          ) : (
            <SubscriptionsTable
              subscriptions={subscriptions}
              onOpen={(subscription) => setDetailId(subscription.id)}
            />
          )}
        </CardContent>
      </Card>

      <SubscriptionDetailDialog
        subscriptionId={activeDetailId}
        onOpenChange={(open) => {
          if (!open) closeDetail();
        }}
      />

      <GrantSubscriptionDialog open={grantOpen} onOpenChange={setGrantOpen} />
    </div>
  );
}
