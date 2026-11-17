import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Store,
  Phone,
  MessageSquare,
  Bot,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Download,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  HelpCircle,
  FileText,
  Send,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { TableImage } from "@/components/TableImage";
import {
  merchantOperationsService,
  ShopPerformanceItem,
  MerchantOperationsResponse,
  AiFollowUpStrategy,
} from "@/services/merchantOperationsService";

// Helper for date presets in YYYY-MM-DD
function getPresetDates(preset: "today" | "yesterday" | "7d" | "30d" | "thisMonth") {
  const now = new Date();
  const format = (d: Date) => d.toISOString().split("T")[0];

  if (preset === "today") {
    return { start: format(now), end: format(now) };
  }
  if (preset === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return { start: format(y), end: format(y) };
  }
  if (preset === "7d") {
    const s = new Date(now);
    s.setDate(s.getDate() - 7);
    return { start: format(s), end: format(now) };
  }
  if (preset === "thisMonth") {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: format(s), end: format(now) };
  }
  // default 30d
  const s = new Date(now);
  s.setDate(s.getDate() - 30);
  return { start: format(s), end: format(now) };
}

export default function MerchantPerformancePage() {
  const [datePreset, setDatePreset] = useState<"today" | "yesterday" | "7d" | "30d" | "thisMonth">("30d");
  const [startDate, setStartDate] = useState(() => getPresetDates("30d").start);
  const [endDate, setEndDate] = useState(() => getPresetDates("30d").end);
  const [activeTab, setActiveTab] = useState<"cancels" | "dormant" | "top" | "normal">("cancels");
  const [searchQuery, setSearchQuery] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MerchantOperationsResponse | null>(null);

  // AI Strategy Dialog state
  const [strategyDialogOpen, setStrategyDialogOpen] = useState(false);
  const [selectedShopForAi, setSelectedShopForAi] = useState<ShopPerformanceItem | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStrategy, setAiStrategy] = useState<AiFollowUpStrategy | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);

  // Note Dialog state
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedShopForNote, setSelectedShopForNote] = useState<ShopPerformanceItem | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteStatus, setNoteStatus] = useState<string>("CALLED");
  const [savingNote, setSavingNote] = useState(false);

  // Load data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await merchantOperationsService.getMerchantPerformance({
        startDate,
        endDate,
        tab: activeTab,
        search: searchQuery.trim() || undefined,
        urgency: urgencyFilter !== "all" ? (urgencyFilter as any) : undefined,
        followUpStatus: statusFilter !== "ALL" ? statusFilter : undefined,
        limit: 100,
      });
      setData(res);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load merchant operations data");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, activeTab, searchQuery, urgencyFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePresetChange = (preset: "today" | "yesterday" | "7d" | "30d" | "thisMonth") => {
    setDatePreset(preset);
    const p = getPresetDates(preset);
    setStartDate(p.start);
    setEndDate(p.end);
  };

  // Quick follow-up status change from table dropdown
  const handleQuickStatusChange = async (shop: ShopPerformanceItem, newStatus: string) => {
    try {
      await merchantOperationsService.updateFollowUp(shop.id, {
        status: newStatus,
        note: shop.followUpNotes || undefined,
      });
      toast.success(`Follow-up status for "${shop.nameEn}" updated to ${newStatus}`);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          shops: prev.shops.map((s) =>
            s.id === shop.id ? { ...s, followUpStatus: newStatus as any } : s,
          ),
        };
      });
    } catch {
      toast.error("Failed to update follow-up status");
    }
  };

  // Open AI Strategy modal
  const handleOpenAiStrategy = async (shop: ShopPerformanceItem) => {
    setSelectedShopForAi(shop);
    setStrategyDialogOpen(true);
    setAiStrategy(null);
    setCopiedScript(false);
    setCopiedWa(false);
    setAiLoading(true);

    try {
      const res = await merchantOperationsService.getAiStrategy(shop.id, {
        startDate,
        endDate,
      });
      setAiStrategy(res.strategy);
    } catch (err: any) {
      toast.error(err?.message || "Could not generate AI strategy");
    } finally {
      setAiLoading(false);
    }
  };

  // Open Note dialog
  const handleOpenNoteDialog = (shop: ShopPerformanceItem) => {
    setSelectedShopForNote(shop);
    setNoteText(shop.followUpNotes || "");
    setNoteStatus(shop.followUpStatus || "CALLED");
    setNoteDialogOpen(true);
  };

  // Save Note
  const handleSaveNote = async () => {
    if (!selectedShopForNote) return;
    try {
      setSavingNote(true);
      await merchantOperationsService.updateFollowUp(selectedShopForNote.id, {
        status: noteStatus,
        note: noteText.trim() || undefined,
      });
      toast.success("Follow-up note saved successfully");
      setNoteDialogOpen(false);
      fetchData();
    } catch {
      toast.error("Failed to save follow-up note");
    } finally {
      setSavingNote(false);
    }
  };

  // Copy text helper
  const copyToClipboard = (text: string, type: "script" | "wa") => {
    navigator.clipboard.writeText(text);
    if (type === "script") {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else {
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2000);
    }
    toast.success("Copied to clipboard!");
  };

  // Open WhatsApp with text
  const openWhatsApp = (phone: string | null, message: string) => {
    if (!phone) {
      toast.error("Restaurant phone number is not available");
      return;
    }
    // Clean phone number (strip spaces, dashes, parentheses)
    const cleanPhone = phone.replace(/[^0-9+]/g, "").replace(/^0/, "66"); // default Thailand if starts with 0
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Export CSV
  const exportCsv = () => {
    if (!data || data.shops.length === 0) {
      toast.error("No data available to export");
      return;
    }

    const headers = [
      "Shop ID",
      "Shop Name (EN)",
      "Shop Name (MM)",
      "Phone",
      "Total Orders",
      "Completed Orders",
      "Cancelled Orders",
      "Cancel Rate (%)",
      "Lost GMV (THB)",
      "Top Cancel Reason",
      "Peak Cancel Window",
      "Urgency",
      "Follow-up Status",
      "Follow-up Notes",
      "Contacted By",
      "Last Contacted At",
    ];

    const rows = data.shops.map((s) => [
      s.id,
      `"${(s.nameEn || "").replace(/"/g, '""')}"`,
      `"${(s.nameMm || "").replace(/"/g, '""')}"`,
      `"${s.phone || ""}"`,
      s.totalOrders,
      s.completedOrders,
      s.cancelledOrders,
      s.cancelRate,
      s.lostGmv,
      `"${(s.topCancelReason || "").replace(/"/g, '""')}"`,
      `"${s.peakCancelHours?.[0]?.timeWindow || "N/A"}"`,
      s.urgency,
      s.followUpStatus,
      `"${(s.followUpNotes || "").replace(/"/g, '""')}"`,
      `"${s.contactedByName || ""}"`,
      s.lastContactedAt ? new Date(s.lastContactedAt).toLocaleDateString() : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `merchant_operations_report_${startDate}_to_${endDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Operations report downloaded successfully");
  };

  const summary = data?.summary;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Restaurant Operations & AI Follow-up
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Bot className="h-3 w-3 mr-1 text-primary animate-pulse" /> Gemini 2.5 Flash
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor restaurant performance groups, audit high cancellation root causes, and run AI-assisted merchant follow-ups.
          </p>
        </div>

        {/* Date presets & actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border bg-muted/40 p-0.5 text-xs">
            {(["today", "yesterday", "7d", "30d", "thisMonth"] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetChange(preset)}
                className={`px-2.5 py-1 rounded transition-colors font-medium ${
                  datePreset === preset
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {preset === "today"
                  ? "Today"
                  : preset === "yesterday"
                    ? "Yesterday"
                    : preset === "7d"
                      ? "7 Days"
                      : preset === "30d"
                        ? "30 Days"
                        : "This Month"}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={loading || !data?.shops?.length}
            className="h-8"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── TOP KPI SUMMARY CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Active Restaurants */}
        <Card className="border-border/50 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Active Merchants
            </CardTitle>
            <Store className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalShops ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span>{summary?.completedOrders ?? 0} orders completed in period</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 2: High Cancellations & Lost GMV */}
        <Card className="border-red-200/50 dark:border-red-950/50 bg-red-50/20 dark:bg-red-950/10 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
              High Cancellation Risk
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {summary?.highCancelShopsCount ?? 0} <span className="text-xs font-normal text-muted-foreground">shops</span>
              </div>
              <Badge variant="destructive" className="text-[10px] h-5">
                {summary?.platformCancelRate ?? 0}% Avg Rate
              </Badge>
            </div>
            <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              <span>Lost GMV: ฿{(summary?.totalLostGmv ?? 0).toLocaleString()}</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Zero-Order (Dormant) */}
        <Card className="border-amber-200/50 dark:border-amber-950/50 bg-amber-50/20 dark:bg-amber-950/10 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Zero-Order (Dormant)
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {summary?.dormantShopsCount ?? 0}
            </div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
              Registered merchants with 0 orders in period
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Top Sellers (VIP) */}
        <Card className="border-emerald-200/50 dark:border-emerald-950/50 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Top Sellers (VIP)
            </CardTitle>
            <Flame className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {summary?.topPerformersCount ?? 0} <span className="text-xs font-normal text-muted-foreground">shops</span>
              </div>
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] h-5">
                VIP Partners
              </Badge>
            </div>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>Gross Sales: ฿{(summary?.totalGmv ?? 0).toLocaleString()}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── PLATFORM CANCEL REASONS BREAKDOWN PILLS ───────────────────────── */}
      {data?.platformCancelReasons && data.platformCancelReasons.length > 0 && (
        <Card className="border-border/50 bg-muted/20 shadow-xs">
          <CardContent className="p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-red-500" /> Top Cancellation Reasons Across Platform
              </span>
              <span className="text-xs text-muted-foreground">
                Total {summary?.cancelledOrders ?? 0} cancelled orders analyzed
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2.5">
              {data.platformCancelReasons.map((item, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs shadow-2xs"
                >
                  <span className="font-medium text-foreground">{item.reason}</span>
                  <span className="rounded-full bg-red-100 dark:bg-red-950/80 px-1.5 py-0.2 text-[10px] font-semibold text-red-700 dark:text-red-300">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TABS & FILTER BAR ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Main 4 Segmentation Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(val: any) => setActiveTab(val)}
            className="w-full lg:w-auto"
          >
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-9">
              <TabsTrigger value="cancels" className="gap-1.5 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                <span>High Cancels</span>
                <span className="ml-1 rounded-full bg-red-100 dark:bg-red-950 px-1.5 py-0.2 text-[10px] font-bold text-red-700 dark:text-red-300">
                  {summary?.highCancelShopsCount ?? 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="dormant" className="gap-1.5 text-xs">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>Zero-Order</span>
                <span className="ml-1 rounded-full bg-amber-100 dark:bg-amber-950 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  {summary?.dormantShopsCount ?? 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="top" className="gap-1.5 text-xs">
                <Flame className="h-3.5 w-3.5 text-emerald-500" />
                <span>Top Sellers</span>
                <span className="ml-1 rounded-full bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  {summary?.topPerformersCount ?? 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="normal" className="gap-1.5 text-xs">
                <Store className="h-3.5 w-3.5 text-blue-500" />
                <span>Normal Vol</span>
                <span className="ml-1 rounded-full bg-blue-100 dark:bg-blue-950 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                  {summary?.normalVolumeCount ?? 0}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters: Search & Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search shop or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-32 h-9 text-xs">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="critical">🚨 Critical</SelectItem>
                <SelectItem value="warning">⚠️ Warning</SelectItem>
                <SelectItem value="dormant">💤 Dormant</SelectItem>
                <SelectItem value="normal">✅ Normal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue placeholder="Follow-up Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">🔴 Need Follow-up</SelectItem>
                <SelectItem value="CALLED">🟡 Called / In Progress</SelectItem>
                <SelectItem value="RESOLVED">🟢 Resolved</SelectItem>
                <SelectItem value="NO_ANSWER">⚪ No Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── SHOPS DATA TABLE ────────────────────────────────────────────── */}
        <Card className="border-border/50 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border/50 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Restaurant</th>
                  <th className="py-3 px-4">Orders & Rate</th>
                  <th className="py-3 px-4">
                    {activeTab === "dormant" ? "Days Inactive" : "Top Cancel Root Cause"}
                  </th>
                  <th className="py-3 px-4">Peak Window</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Follow-up Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading restaurant operational metrics...
                    </td>
                  </tr>
                ) : !data?.shops || data.shops.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <HelpCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      No restaurants match the selected filters or date range.
                    </td>
                  </tr>
                ) : (
                  data.shops.map((shop) => (
                    <tr
                      key={shop.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Shop Identity */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <TableImage
                            src={shop.logoUrl}
                            alt={shop.nameEn}
                            size="sm"
                            className="rounded-md shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground truncate max-w-[160px] sm:max-w-[200px]">
                                {shop.nameEn}
                              </span>
                              {shop.isVerified && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                                  Verified
                                </Badge>
                              )}
                              {!shop.isOpen && (
                                <span className="inline-block w-2 h-2 rounded-full bg-red-400" title="Closed" />
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                              {shop.nameMm && <span>{shop.nameMm}</span>}
                              {shop.phone && (
                                <a
                                  href={`tel:${shop.phone}`}
                                  className="text-primary hover:underline flex items-center gap-0.5"
                                >
                                  <Phone className="h-2.5 w-2.5" />
                                  {shop.phone}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Orders & Cancel Rate */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-medium">
                            <span className="text-foreground font-bold">{shop.completedOrders}</span>
                            <span className="text-muted-foreground">/ {shop.totalOrders}</span>
                            {shop.cancelledOrders > 0 && (
                              <span className="text-red-500 font-semibold text-[11px]">
                                ({shop.cancelledOrders} canceled)
                              </span>
                            )}
                          </div>
                          {shop.totalOrders > 0 ? (
                            <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden flex">
                              <div
                                className="bg-emerald-500 h-full"
                                style={{
                                  width: `${Math.max(0, 100 - shop.cancelRate)}%`,
                                }}
                              />
                              <div
                                className="bg-red-500 h-full"
                                style={{ width: `${shop.cancelRate}%` }}
                              />
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">No orders</span>
                          )}
                          {shop.lostGmv > 0 && (
                            <div className="text-[10px] text-red-500 font-medium">
                              -฿{shop.lostGmv.toLocaleString()} lost
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Root Cause / Days Inactive */}
                      <td className="py-3 px-4 max-w-[200px]">
                        {activeTab === "dormant" ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              {shop.daysSinceLastOrder ?? 0} days
                            </span>
                            <p className="text-[10px] text-muted-foreground">
                              {shop.lastOrderAt
                                ? `Last: ${new Date(shop.lastOrderAt).toLocaleDateString()}`
                                : "Never ordered"}
                            </p>
                          </div>
                        ) : shop.topCancelReason ? (
                          <div className="space-y-0.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30 text-red-700 dark:text-red-300 truncate max-w-[190px]"
                            >
                              {shop.topCancelReason}
                            </Badge>
                            {shop.canceledByBreakdown && (
                              <p className="text-[10px] text-muted-foreground">
                                By: {shop.canceledByBreakdown.shop} shop · {shop.canceledByBreakdown.user} user
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Clean (0 cancels)</span>
                        )}
                      </td>

                      {/* Peak Cancel Window */}
                      <td className="py-3 px-4">
                        {shop.peakCancelHours && shop.peakCancelHours.length > 0 ? (
                          <Badge variant="outline" className="text-[10px] font-normal">
                            <Clock className="h-2.5 w-2.5 mr-1 text-muted-foreground" />
                            {shop.peakCancelHours[0].timeWindow}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">—</span>
                        )}
                      </td>

                      {/* Urgency Badge */}
                      <td className="py-3 px-4">
                        {shop.urgency === "critical" ? (
                          <Badge className="bg-red-600 hover:bg-red-600 text-white text-[10px]">
                            🚨 Critical
                          </Badge>
                        ) : shop.urgency === "warning" ? (
                          <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-[10px]">
                            ⚠️ Warning
                          </Badge>
                        ) : shop.urgency === "dormant" ? (
                          <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">
                            💤 Dormant
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                            Normal
                          </Badge>
                        )}
                      </td>

                      {/* Follow-up Status Dropdown */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Select
                            value={shop.followUpStatus}
                            onValueChange={(val) => handleQuickStatusChange(shop, val)}
                          >
                            <SelectTrigger className="h-7 w-28 text-[11px] p-1.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">🔴 Need Call</SelectItem>
                              <SelectItem value="CALLED">🟡 Called</SelectItem>
                              <SelectItem value="RESOLVED">🟢 Resolved</SelectItem>
                              <SelectItem value="NO_ANSWER">⚪ No Answer</SelectItem>
                            </SelectContent>
                          </Select>

                          <button
                            onClick={() => handleOpenNoteDialog(shop)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                            title={shop.followUpNotes || "Add follow-up note"}
                          >
                            <FileText className={`h-3.5 w-3.5 ${shop.followUpNotes ? "text-primary" : ""}`} />
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 🤖 Gemini AI Strategy Button */}
                          <Button
                            size="sm"
                            className="h-7 px-2.5 text-xs bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium shadow-xs"
                            onClick={() => handleOpenAiStrategy(shop)}
                          >
                            <Bot className="h-3 w-3 mr-1 text-white" /> AI Strategy
                          </Button>

                          {/* Call shortcut */}
                          {shop.phone && (
                            <a
                              href={`tel:${shop.phone}`}
                              className="inline-flex items-center justify-center h-7 w-7 rounded-md border text-muted-foreground hover:text-primary hover:bg-muted"
                              title={`Call ${shop.phone}`}
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          )}

                          {/* WhatsApp shortcut */}
                          {shop.phone && (
                            <button
                              onClick={() =>
                                openWhatsApp(
                                  shop.phone,
                                  `မင်္ဂလာပါရှင့် ${shop.nameEn}။ MyTogether Operations မှ ဖြစ်ပါတယ်။ ဆိုင်၏ အော်ဒါအခြေအနေနှင့် ပတ်သက်ပြီး အကူအညီ လိုအပ်ပါက ဆက်သွယ်ပေးပါရှင့်။`,
                                )
                              }
                              className="inline-flex items-center justify-center h-7 w-7 rounded-md border text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                              title="Message via WhatsApp"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Manage link */}
                          <Link
                            to={`/shops/manage`}
                            className="inline-flex items-center justify-center h-7 w-7 rounded-md border text-muted-foreground hover:text-foreground hover:bg-muted"
                            title="Manage Shop"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── 🤖 GEMINI AI FOLLOW-UP STRATEGY MODAL ────────────────────────── */}
      <Dialog open={strategyDialogOpen} onOpenChange={setStrategyDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold">
                    AI Follow-up Playbook & Call Script
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {selectedShopForAi?.nameEn} · {selectedShopForAi?.phone || "No phone"}
                  </DialogDescription>
                </div>
              </div>

              {aiStrategy && (
                <Badge
                  className={
                    aiStrategy.urgency === "Critical"
                      ? "bg-red-600 text-white"
                      : "bg-amber-500 text-white"
                  }
                >
                  {aiStrategy.urgency} Priority
                </Badge>
              )}
            </div>
          </DialogHeader>

          {aiLoading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-600" />
              <p className="text-sm font-medium text-foreground">
                Gemini is analyzing cancellation patterns, peak hours & order velocity...
              </p>
              <p className="text-xs text-muted-foreground">
                Generating personalized phone call script and actionable solutions.
              </p>
            </div>
          ) : aiStrategy ? (
            <div className="space-y-4 pt-2">
              {/* 1. Root Cause Diagnosis */}
              <div className="rounded-lg border border-purple-200/50 bg-purple-50/30 dark:bg-purple-950/20 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-1">
                  <Zap className="h-3.5 w-3.5" /> Root Cause Diagnosis (အဓိက ပြဿနာ သုံးသပ်ချက်)
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  {aiStrategy.rootCauseAnalysis}
                </p>
              </div>

              {/* 2. Operations Phone Call Script */}
              <div className="rounded-lg border border-border/80 bg-background p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-emerald-500" /> Phone Call Script (ဖုန်းဆက်ပြောရန် Playbook)
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => copyToClipboard(aiStrategy.callScript, "script")}
                  >
                    {copiedScript ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-emerald-500" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" /> Copy Script
                      </>
                    )}
                  </Button>
                </div>
                <div className="rounded-md bg-muted/40 p-3 text-xs leading-relaxed font-mono whitespace-pre-wrap text-foreground/90 border">
                  {aiStrategy.callScript}
                </div>
              </div>

              {/* 3. 1-Click WhatsApp / Telegram Message */}
              <div className="rounded-lg border border-border/80 bg-background p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Send className="h-3.5 w-3.5 text-blue-500" /> WhatsApp / Telegram Message Template
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => copyToClipboard(aiStrategy.whatsappMessage, "wa")}
                    >
                      {copiedWa ? (
                        <>
                          <Check className="h-3 w-3 mr-1 text-emerald-500" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() =>
                        openWhatsApp(selectedShopForAi?.phone ?? null, aiStrategy.whatsappMessage)
                      }
                    >
                      <MessageSquare className="h-3 w-3 mr-1" /> Open WhatsApp
                    </Button>
                  </div>
                </div>
                <p className="rounded-md bg-muted/40 p-2.5 text-xs text-foreground/90 italic border">
                  "{aiStrategy.whatsappMessage}"
                </p>
              </div>

              {/* 4. Action Recommendations */}
              <div className="rounded-lg border border-border/80 bg-background p-3.5 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Actionable Checklist for Operations Agent
                </span>
                <ul className="space-y-1.5 text-xs text-foreground">
                  {aiStrategy.actionRecommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="rounded-full bg-primary/10 text-primary w-4 h-4 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Unable to generate AI follow-up strategy.
            </div>
          )}

          <DialogFooter className="flex sm:justify-between items-center pt-3 border-t">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Quick Status:</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={async () => {
                  if (selectedShopForAi) {
                    await handleQuickStatusChange(selectedShopForAi, "CALLED");
                    setStrategyDialogOpen(false);
                  }
                }}
              >
                Mark as Called
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-emerald-600"
                onClick={async () => {
                  if (selectedShopForAi) {
                    await handleQuickStatusChange(selectedShopForAi, "RESOLVED");
                    setStrategyDialogOpen(false);
                  }
                }}
              >
                Mark as Resolved
              </Button>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStrategyDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── NOTE DIALOG ─────────────────────────────────────────────────── */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Follow-up Call Notes
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedShopForNote?.nameEn} · Record call outcome & merchant feedback
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Status</label>
              <Select value={noteStatus} onValueChange={setNoteStatus}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">🔴 Need Follow-up</SelectItem>
                  <SelectItem value="CALLED">🟡 Called / In Progress</SelectItem>
                  <SelectItem value="RESOLVED">🟢 Resolved / Fixed</SelectItem>
                  <SelectItem value="NO_ANSWER">⚪ No Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Call Notes & Action Items</label>
              <Textarea
                rows={4}
                placeholder="E.g. Spoke with store manager. Chef was sick today, advised to toggle store closed. Will resume tomorrow morning."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNoteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveNote}
              disabled={savingNote}
            >
              {savingNote ? "Saving..." : "Save Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
