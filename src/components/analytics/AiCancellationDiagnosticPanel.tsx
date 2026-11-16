import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Store,
  RefreshCw,
  Sparkles,
  Phone,
  Power,
  Search,
  ExternalLink,
  ShieldAlert,
  Clock,
  Layers,
  FileText,
  Percent,
} from "lucide-react";
import {
  analyticsService,
  CancellationDiagnosticData,
  ProblematicShop,
} from "@/services/analyticsService";
import { ShopService } from "@/services/shopService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Props {
  from: string;
  to: string;
  onRangeChange?: (from: string, to: string) => void;
}

export function AiCancellationDiagnosticPanel({ from, to }: Props) {
  const navigate = useNavigate();
  const [data, setData] = useState<CancellationDiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state for shops
  const [language, setLanguage] = useState<"mm" | "en">("mm");
  const [shopFilter, setShopFilter] = useState<"ALL" | "CRITICAL" | "WARNING" | "HEALTHY">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [togglingShopId, setTogglingShopId] = useState<number | null>(null);

  const fetchDiagnostic = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.getCancellationDiagnostic(from, to, 1);
      setData(res);
    } catch (err: any) {
      console.error("Diagnostic load error:", err);
      setError(err?.message || "Failed to load cancellation diagnostic.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [from, to]);

  useEffect(() => {
    void fetchDiagnostic();
  }, [fetchDiagnostic]);

  // Handle toggling shop open status directly
  const handleToggleShopOpen = async (shop: ProblematicShop) => {
    setTogglingShopId(shop.shopId);
    const nextOpen = !shop.isOpen;
    try {
      await ShopService.toggleShopStatus(shop.shopId, {
        isActive: shop.isActive,
        isOpen: nextOpen,
      });
      toast.success(
        nextOpen
          ? `Restaurant "${shop.shopName}" is now marked OPEN.`
          : `Restaurant "${shop.shopName}" has been PAUSED (closed) to prevent cancellation leaks.`,
      );
      // Update local state smoothly
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          problematicShops: prev.problematicShops.map((s) =>
            s.shopId === shop.shopId ? { ...s, isOpen: nextOpen } : s,
          ),
        };
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update restaurant status.");
    } finally {
      setTogglingShopId(null);
    }
  };

  // Filter problematic shops
  const filteredShops = useMemo(() => {
    if (!data?.problematicShops) return [];
    return data.problematicShops.filter((shop) => {
      const matchesSearch =
        shop.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (shop.phone && shop.phone.includes(searchQuery));
      if (!matchesSearch) return false;
      if (shopFilter === "ALL") return true;
      return shop.severity === shopFilter;
    });
  }, [data?.problematicShops, searchQuery, shopFilter]);

  const criticalCount = useMemo(
    () => data?.problematicShops.filter((s) => s.severity === "CRITICAL").length || 0,
    [data?.problematicShops],
  );
  const warningCount = useMemo(
    () => data?.problematicShops.filter((s) => s.severity === "WARNING").length || 0,
    [data?.problematicShops],
  );
  const healthyCount = useMemo(
    () => data?.problematicShops.filter((s) => s.severity === "HEALTHY").length || 0,
    [data?.problematicShops],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
          <h3 className="font-semibold text-lg">Diagnostic Data Unavailable</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {error || "Could not retrieve cancellation diagnostic metrics."}
          </p>
          <Button onClick={() => fetchDiagnostic(true)} variant="outline" className="mt-4 gap-2">
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { summary, funnelDropOff, topReasons, aiRecap } = data;
  const isCancelHigher = summary.cancelRatePercent > summary.deliveredRatePercent;

  return (
    <div className="space-y-6">
      {/* Executive Discrepancy Banner */}
      <div
        className={`rounded-xl border p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
          isCancelHigher
            ? "bg-rose-50 border-rose-200 text-rose-950 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-100"
            : "bg-emerald-50 border-emerald-200 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-100"
        }`}
      >
        <div className="flex items-start gap-3">
          {isCancelHigher ? (
            <ShieldAlert className="h-6 w-6 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          )}
          <div>
            <h4 className="font-bold text-base">
              {isCancelHigher
                ? `⚠️ Order Cancel Rate (${summary.cancelRatePercent}%) is greater than Delivery Success Rate (${summary.deliveredRatePercent}%)`
                : `✅ Healthy Delivery Success Rate (${summary.deliveredRatePercent}%)`}
            </h4>
            <p className="text-sm opacity-90 mt-0.5">
              {isCancelHigher
                ? `Platform lost ฿${summary.lostSales.toLocaleString()} due to ${summary.canceledOrders} cancelled orders. Primary leak: ${
                    funnelDropOff.shopTimeoutPercent >= funnelDropOff.slipTimeoutPercent
                      ? `Shop Unresponsive Timeout (${funnelDropOff.shopTimeoutOrders} orders, ${funnelDropOff.shopTimeoutPercent}%)`
                      : `Payment Slip Timeout (${funnelDropOff.slipTimeoutOrders} orders, ${funnelDropOff.slipTimeoutPercent}%)`
                  }.`
                : `Completed ฿${summary.deliveredSales.toLocaleString()} with ${summary.deliveredOrders} delivered orders in this timeframe.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchDiagnostic(true)}
            disabled={refreshing}
            className="gap-1.5 h-8 bg-background"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Analysis
          </Button>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {/* Total Placed */}
        <Card className="shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-muted-foreground">Total Orders</span>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1 tabular-nums">{summary.totalOrders.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {summary.activeOrders > 0 ? `${summary.activeOrders} in progress` : "All finalized"}
            </p>
          </CardContent>
        </Card>

        {/* Delivered Success */}
        <Card className="shadow-xs border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-emerald-700 dark:text-emerald-400">
                Delivered Success
              </span>
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {summary.deliveredOrders.toLocaleString()}
              </p>
              <Badge variant="outline" className="text-emerald-700 bg-emerald-500/10 border-emerald-500/20">
                {summary.deliveredRatePercent}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sales: ฿{summary.deliveredSales.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Canceled Rate */}
        <Card className="shadow-xs border-rose-500/20 bg-rose-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-rose-700 dark:text-rose-400">
                Canceled Orders
              </span>
              <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold tabular-nums text-rose-700 dark:text-rose-400">
                {summary.canceledOrders.toLocaleString()}
              </p>
              <Badge variant="destructive" className="bg-rose-600 text-white">
                {summary.cancelRatePercent}%
              </Badge>
            </div>
            <p className="text-xs text-rose-600/90 dark:text-rose-400 font-medium mt-0.5">
              Lost: ฿{summary.lostSales.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Choke Point */}
        <Card className="shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-muted-foreground">Primary Leak</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-sm font-semibold mt-1 truncate" title={
              funnelDropOff.shopTimeoutPercent >= funnelDropOff.slipTimeoutPercent
                ? "Shop Unresponsive (10m)"
                : "Slip Upload Timeout (20m)"
            }>
              {funnelDropOff.shopTimeoutPercent >= funnelDropOff.slipTimeoutPercent
                ? "Shop Unresponsive (10m)"
                : "Slip Upload Timeout (20m)"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {Math.max(funnelDropOff.shopTimeoutPercent, funnelDropOff.slipTimeoutPercent)}% of all cancellations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="recap" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-xl">
          <TabsTrigger value="recap" className="gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> AI Diagnostic Recap
          </TabsTrigger>
          <TabsTrigger value="shops" className="gap-2">
            <Store className="h-4 w-4 text-rose-600" /> High-Risk Shops ({criticalCount + warningCount})
          </TabsTrigger>
          <TabsTrigger value="funnel" className="gap-2">
            <Percent className="h-4 w-4" /> Funnel & Reasons
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: EXECUTIVE AI RECAP */}
        <TabsContent value="recap" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                  Executive AI Diagnostic Report
                </CardTitle>
                <CardDescription>
                  Deep real-data intelligence generated by Google Gemini for operations leadership.
                </CardDescription>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                <Button
                  size="sm"
                  variant={language === "mm" ? "default" : "ghost"}
                  onClick={() => setLanguage("mm")}
                  className="h-7 text-xs px-2.5"
                >
                  မြန်မာစာ (Unicode)
                </Button>
                <Button
                  size="sm"
                  variant={language === "en" ? "default" : "ghost"}
                  onClick={() => setLanguage("en")}
                  className="h-7 text-xs px-2.5"
                >
                  English
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/40 p-5 border text-sm leading-relaxed whitespace-pre-line font-sans">
                {language === "mm" ? aiRecap.myanmar : aiRecap.english}
              </div>

              {/* Actionable Strategy Cards */}
              <div className="grid gap-3 md:grid-cols-4 mt-5">
                <div className="p-3.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2 font-semibold text-xs text-primary mb-1">
                    <Clock className="h-4 w-4" /> 1. Merchant Ringtone
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">
                    အော်ဒါအသစ်ဝင်ပါက ဆိုင်ရှင်ဖုန်းတွင် လက်မခံမချင်း မြည်နေမည့် အသံ (Repetitive Ringtone) ထည့်သွင်းပါ။
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2 font-semibold text-xs text-rose-600 mb-1">
                    <Power className="h-4 w-4" /> 2. Auto-Pause Dormant Shops
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">
                    အော်ဒါ ၂ ကြိမ်ဆက်တိုက် လွတ်သွားသော ဆိုင်များကို အလိုအလျောက် ယာယီပိတ် (Auto-Close) ထားပေးပါ။
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2 font-semibold text-xs text-emerald-600 mb-1">
                    <Percent className="h-4 w-4" /> 3. Instant Payment / COD
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">
                    Manual Bank Slip တင်ရသည့် ၂၀ မိနစ် Timeout ကို လျှော့ချရန် COD နှင့် Instant PromptPay QR ချဲ့ထွင်ပါ။
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2 font-semibold text-xs text-amber-600 mb-1">
                    <TrendingUp className="h-4 w-4" /> 4. Fast-Response Ranking
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">
                    Cancel နည်းပြီး ၃ မိနစ်အတွင်း Confirm လုပ်သော ဆိုင်များကို Customer App ထိပ်ဆုံးတွင် ဦးစားပေးပြသပါ။
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: HIGH-RISK SHOPS (FEATURE 2) */}
        <TabsContent value="shops" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Store className="h-5 w-5 text-rose-600" />
                    High-Cancellation Shops & Health Management
                  </CardTitle>
                  <CardDescription>
                    Restaurants with elevated cancel rates. Quickly identify unresponsive shops and pause them with 1-click.
                  </CardDescription>
                </div>

                {/* Filter and Search */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-48">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search shop or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 pl-8 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg">
                    <Button
                      size="sm"
                      variant={shopFilter === "ALL" ? "default" : "ghost"}
                      onClick={() => setShopFilter("ALL")}
                      className="h-7 text-xs px-2"
                    >
                      All ({data.problematicShops.length})
                    </Button>
                    <Button
                      size="sm"
                      variant={shopFilter === "CRITICAL" ? "default" : "ghost"}
                      onClick={() => setShopFilter("CRITICAL")}
                      className="h-7 text-xs px-2 text-rose-600 dark:text-rose-400 font-semibold"
                    >
                      Critical ({criticalCount})
                    </Button>
                    <Button
                      size="sm"
                      variant={shopFilter === "WARNING" ? "default" : "ghost"}
                      onClick={() => setShopFilter("WARNING")}
                      className="h-7 text-xs px-2 text-amber-600 dark:text-amber-400 font-semibold"
                    >
                      Warning ({warningCount})
                    </Button>
                    <Button
                      size="sm"
                      variant={shopFilter === "HEALTHY" ? "default" : "ghost"}
                      onClick={() => setShopFilter("HEALTHY")}
                      className="h-7 text-xs px-2 text-emerald-600"
                    >
                      Healthy ({healthyCount})
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredShops.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No restaurants match the selected filter.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Restaurant Name</TableHead>
                        <TableHead>App Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Delivered</TableHead>
                        <TableHead className="text-right">Canceled</TableHead>
                        <TableHead className="text-center">Cancel Rate</TableHead>
                        <TableHead className="text-right">Lost Sales</TableHead>
                        <TableHead>Primary Leak Cause</TableHead>
                        <TableHead className="text-center">Quick Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredShops.map((shop) => (
                        <TableRow key={shop.shopId} className="hover:bg-muted/40">
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm">{shop.shopName}</span>
                              {shop.phone && (
                                <a
                                  href={`tel:${shop.phone}`}
                                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5"
                                >
                                  <Phone className="h-3 w-3" /> {shop.phone}
                                </a>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                shop.isOpen
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              {shop.isOpen ? "OPEN" : "CLOSED/PAUSED"}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right tabular-nums">{shop.totalOrders}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-emerald-600">
                            {shop.deliveredOrders}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-rose-600">
                            {shop.canceledOrders}
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge
                              variant={
                                shop.severity === "CRITICAL"
                                  ? "destructive"
                                  : shop.severity === "WARNING"
                                  ? "secondary"
                                  : "outline"
                              }
                              className={
                                shop.severity === "WARNING"
                                  ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200"
                                  : shop.severity === "HEALTHY"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : ""
                              }
                            >
                              {shop.cancelRatePercent}%
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right tabular-nums font-semibold text-rose-600">
                            ฿{shop.lostAmount.toLocaleString()}
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                            {shop.topCancelReason}
                          </TableCell>

                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* 1-Click Toggle Shop Status Button */}
                              <Button
                                size="sm"
                                variant={shop.isOpen ? "destructive" : "outline"}
                                disabled={togglingShopId === shop.shopId}
                                onClick={() => handleToggleShopOpen(shop)}
                                className="h-7 text-xs px-2.5 gap-1"
                                title={shop.isOpen ? "Pause this shop (mark Closed to stop cancellations)" : "Re-open this shop"}
                              >
                                {togglingShopId === shop.shopId ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Power className="h-3 w-3" />
                                )}
                                {shop.isOpen ? "Pause Shop" : "Re-Open"}
                              </Button>

                              {/* View detail button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/shops/${shop.shopId}`)}
                                className="h-7 w-7 p-0"
                                title="View Restaurant Profile"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: FUNNEL & REASONS */}
        <TabsContent value="funnel" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Conversion Drop-off Funnel Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Percent className="h-4 w-4 text-primary" />
                  Order Funnel Drop-Off Points
                </CardTitle>
                <CardDescription>
                  Where customer orders die along the fulfillment pipeline.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 1. Shop Unresponsive */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-rose-600 flex items-center gap-1.5">
                      1. Shop Unresponsive Timeout (10m)
                    </span>
                    <span className="tabular-nums font-bold">
                      {funnelDropOff.shopTimeoutOrders} orders ({funnelDropOff.shopTimeoutPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-600 rounded-full transition-all"
                      style={{ width: `${Math.min(100, funnelDropOff.shopTimeoutPercent)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Order sat in PENDING for 10 minutes without shop response.
                  </p>
                </div>

                {/* 2. Slip Upload Timeout */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-amber-600 flex items-center gap-1.5">
                      2. Payment Slip Upload Timeout (20m)
                    </span>
                    <span className="tabular-nums font-bold">
                      {funnelDropOff.slipTimeoutOrders} orders ({funnelDropOff.slipTimeoutPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, funnelDropOff.slipTimeoutPercent)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Customer did not upload bank transfer screenshot within 20 minutes.
                  </p>
                </div>

                {/* 3. Customer Cancelled */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-blue-600 flex items-center gap-1.5">
                      3. Customer Cancelled
                    </span>
                    <span className="tabular-nums font-bold">
                      {funnelDropOff.userDropOrders} orders ({funnelDropOff.userDropPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, funnelDropOff.userDropPercent)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Customer manually cancelled while waiting for shop confirmation.
                  </p>
                </div>

                {/* 4. Shop Rejected */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-purple-600 flex items-center gap-1.5">
                      4. Shop Rejected / Out of Stock
                    </span>
                    <span className="tabular-nums font-bold">
                      {funnelDropOff.shopRejectedOrders} orders ({funnelDropOff.shopRejectedPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, funnelDropOff.shopRejectedPercent)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Restaurant declined due to ingredients out of stock or kitchen rush.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Reasons Table Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Top Cancellation Reasons Ledger
                </CardTitle>
                <CardDescription>
                  Exact reason labels recorded in the database.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto max-h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reason</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Lost Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topReasons.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs font-medium max-w-[200px] truncate" title={r.reason}>
                            {r.reason}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {r.actor}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums font-semibold">
                            {r.count} ({r.percentage}%)
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums font-semibold text-rose-600">
                            ฿{r.lostAmount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
