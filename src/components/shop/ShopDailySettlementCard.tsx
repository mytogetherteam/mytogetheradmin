import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  Truck,
  Clock,
  Wallet,
  Building2,
  RefreshCw,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import {
  ShopService,
  type DailySettlementData,
} from "@/services/shopService";
import { toast } from "sonner";

interface ShopDailySettlementCardProps {
  shopId: number;
}

export function ShopDailySettlementCard({ shopId }: ShopDailySettlementCardProps) {
  const getTodayBangkokStr = () => {
    const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
    const bangkokNow = new Date(Date.now() + BANGKOK_OFFSET_MS);
    return bangkokNow.toISOString().slice(0, 10);
  };

  const [date, setDate] = useState<string>(getTodayBangkokStr());
  const [data, setData] = useState<DailySettlementData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchSettlement = async (targetDate: string) => {
    setIsLoading(true);
    try {
      const res = await ShopService.getAdminDailySettlement(shopId, targetDate);
      setData(res);
    } catch (err: any) {
      console.error("Failed to load daily settlement:", err);
      toast.error(err?.message || "Failed to load daily settlement ledger.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (shopId > 0) {
      fetchSettlement(date);
    }
  }, [shopId, date]);

  const currency = data?.currency || "฿";
  const formatMoney = (val: number) => {
    const sign = val < 0 ? "-" : "";
    return `${sign}${currency}${Math.abs(val).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">
                Daily Net Profit & Settlement Ledger
              </CardTitle>
            </div>
            <CardDescription className="mt-1">
              Real-time audit of daily restaurant gross food sales, Lalamove delivery deductions, wait time penalties, and net payout splits.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40 h-9 text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchSettlement(date)}
              disabled={isLoading}
              className="gap-1.5 h-9"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
            <span>Calculating daily ledger...</span>
          </div>
        )}

        {!isLoading && !data && (
          <div className="text-center py-12 text-muted-foreground">
            No settlement data found for this date.
          </div>
        )}

        {!isLoading && data && (
          <>
            {/* Top 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Net Payout Hero */}
              <div className="p-4 rounded-xl border bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Net Merchant Payout
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {formatMoney(data.netPayout)}
                  </div>
                  <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 inline" />
                    {data.orderCount} total orders ({data.completedOrderCount} fulfilled)
                  </div>
                </div>
              </div>

              {/* Gross Food Sales */}
              <div className="p-4 rounded-xl border bg-background flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Gross Food Sales
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-foreground">
                    +{formatMoney(data.grossFoodSales)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Food items & options subtotal
                  </div>
                </div>
              </div>

              {/* Lalamove Delivery Cost */}
              <div className="p-4 rounded-xl border bg-background flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Lalamove Delivery Cost
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                    -{formatMoney(data.deliveryCost)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Platform dispatch delivery fees
                  </div>
                </div>
              </div>

              {/* Wait Time Penalty */}
              <div className="p-4 rounded-xl border bg-background flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Wait Penalty
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-500">
                    {data.waitTimeFee > 0 ? `-${formatMoney(data.waitTimeFee)}` : "฿0.00"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Driver wait surcharge (&gt;15 mins)
                  </div>
                </div>
              </div>
            </div>

            {/* Cash vs Bank Settlement Distribution Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Cash in Hand (COD Received)
                  </div>
                  <div className="text-xl font-bold text-amber-800 dark:text-amber-300 mt-1">
                    {formatMoney(data.codCashAmount)}
                  </div>
                  <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">
                    Collected directly from customers by rider/restaurant upon delivery.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    Platform Bank Payout
                  </div>
                  <div className="text-xl font-bold text-blue-800 dark:text-blue-300 mt-1">
                    {formatMoney(data.platformPayoutAmount)}
                  </div>
                  <p className="text-xs text-blue-700/80 dark:text-blue-400/80 mt-1">
                    Digital bank transfers &amp; PromptPay QR payments owed to restaurant account.
                  </p>
                </div>
              </div>
            </div>

            {/* Itemized Order Breakdown Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">
                  Itemized Orders for {data.date} ({data.orders.length})
                </div>
              </div>

              {data.orders.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground border rounded-lg">
                  No orders recorded on this date.
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Food Sales</TableHead>
                        <TableHead className="text-right">Delivery</TableHead>
                        <TableHead className="text-right">Wait Penalty</TableHead>
                        <TableHead className="text-right font-bold text-emerald-700">Net Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.orders.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-sm">
                            {item.orderNumber}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.customerName}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                item.paymentChannel === "COD"
                                  ? "border-amber-500/40 text-amber-700 bg-amber-50/50 dark:bg-amber-950/20"
                                  : "border-blue-500/40 text-blue-700 bg-blue-50/50 dark:bg-blue-950/20"
                              }
                            >
                              {item.paymentChannel === "COD" ? "Cash COD" : "PromptPay QR"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            +{formatMoney(item.foodAmount)}
                          </TableCell>
                          <TableCell className="text-right text-sm text-amber-600">
                            {item.deliveryFee > 0 ? `-${formatMoney(item.deliveryFee)}` : "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm text-rose-600">
                            {item.waitTimeFee > 0 ? `-${formatMoney(item.waitTimeFee)}` : "—"}
                          </TableCell>
                          <TableCell className="text-right font-bold text-sm text-emerald-600">
                            {formatMoney(item.netAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
