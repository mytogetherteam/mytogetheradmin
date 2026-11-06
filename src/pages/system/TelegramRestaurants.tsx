import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/common/ConfirmDialog";
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
import { handleApiError } from "@/lib/error-utils";
import {
  TelegramRestaurant,
  telegramRestaurantsService,
} from "@/services/telegramRestaurantsService";

type Filter = "ALL" | "CONNECTED" | "WAITING";

function usernameLabel(username: string | null): string {
  if (!username) return "—";
  return username.startsWith("@") ? username : `@${username}`;
}

export default function TelegramRestaurants() {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [shops, setShops] = useState<TelegramRestaurant[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setShops(await telegramRestaurantsService.list());
    } catch (error) {
      handleApiError(error, "Failed to load Telegram restaurants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    if (filter === "CONNECTED") return shops.filter((shop) => shop.connected);
    if (filter === "WAITING") return shops.filter((shop) => !shop.connected);
    return shops;
  }, [filter, shops]);

  const connectedCount = shops.filter((shop) => shop.connected).length;
  const waitingCount = shops.length - connectedCount;

  const sendReport = async () => {
    setSending(true);
    try {
      const result = await telegramRestaurantsService.sendDailyReport();
      if (result.skipped) {
        toast.success(result.reason || "The report was not sent");
      } else {
        toast.success(
          `Sent today's ranking to ${result.sentTo} restaurant${result.sentTo === 1 ? "" : "s"}`,
        );
      }
    } catch (error) {
      handleApiError(error, "Failed to send today's ranking");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Send className="h-6 w-6" />
            Telegram Restaurants
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Connected restaurants already finished /start. Waiting restaurants
            have a username saved and still need to open the bot. Sending the
            ranking goes only to connected restaurants that are active and open.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setConfirmSend(true)} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Send today's ranking
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === "ALL" ? "default" : "outline"}
          onClick={() => setFilter("ALL")}
        >
          All ({shops.length})
        </Button>
        <Button
          size="sm"
          variant={filter === "CONNECTED" ? "default" : "outline"}
          onClick={() => setFilter("CONNECTED")}
        >
          Connected ({connectedCount})
        </Button>
        <Button
          size="sm"
          variant={filter === "WAITING" ? "default" : "outline"}
          onClick={() => setFilter("WAITING")}
        >
          Waiting for /start ({waitingCount})
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurant</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Telegram</TableHead>
              <TableHead>Shop</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && shops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  Loading…
                </TableCell>
              </TableRow>
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  {shops.length === 0
                    ? "No restaurant has a Telegram username yet."
                    : "Nothing matches this filter."}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((shop) => (
                <TableRow key={shop.id}>
                  <TableCell className="font-medium">{shop.name}</TableCell>
                  <TableCell>{usernameLabel(shop.username)}</TableCell>
                  <TableCell>
                    <Badge variant={shop.connected ? "default" : "secondary"}>
                      {shop.connected ? "Connected" : "Waiting for /start"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {shop.isActive ? "Active" : "Inactive"}
                    {shop.isOpen ? " · Open" : " · Closed"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={confirmSend}
        onOpenChange={setConfirmSend}
        title="Send today's ranking?"
        description="This messages every connected restaurant that is active and open."
        confirmText="Send"
        loading={sending}
        onConfirm={sendReport}
      />
    </div>
  );
}
