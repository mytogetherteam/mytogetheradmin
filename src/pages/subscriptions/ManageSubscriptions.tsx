import { useEffect, useRef, useState } from "react";
import { Gift, Loader2, Search } from "lucide-react";

import {
  useSubscriptionSummary,
  useSubscriptions,
} from "@/hooks/subscriptions/useSubscription";
import type { SubscriptionStatus } from "@/services/subscriptionService";
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
  const isFirstSearchDebounce = useRef(true);

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
  });
  const { data: summary } = useSubscriptionSummary();

  const subscriptions = data?.content ?? [];
  const pendingCount = summary?.PENDING ?? 0;

  return (
    <div className="container mx-auto max-w-6xl py-10">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search shop or plan..."
                  className="w-full pl-8 sm:w-[240px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => setGrantOpen(true)}>
                <Gift className="mr-2 h-4 w-4" />
                Grant Plan
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex w-full flex-wrap justify-start">
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

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : subscriptions.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {debouncedSearch.trim()
                ? "No subscription matches that search."
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
        subscriptionId={detailId}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
      />

      <GrantSubscriptionDialog open={grantOpen} onOpenChange={setGrantOpen} />
    </div>
  );
}
