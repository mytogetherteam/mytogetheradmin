import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Store,
  Phone,
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
  ChevronRight,
  ChevronLeft,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  HelpCircle,
  FileText,
  Zap,
  BarChart3,
  Target,
  Wrench,
  Megaphone,
  ClipboardCheck,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
function getPresetDates(preset: "today" | "yesterday" | "7d" | "thisMonth") {
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
  // thisMonth
  const s = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start: format(s), end: format(now) };
}

export default function MerchantPerformancePage() {
  const [datePreset, setDatePreset] = useState<"today" | "yesterday" | "7d" | "thisMonth">("7d");
  const [startDate, setStartDate] = useState(() => getPresetDates("7d").start);
  const [endDate, setEndDate] = useState(() => getPresetDates("7d").end);
  const [activeTab, setActiveTab] = useState<"cancels" | "dormant" | "top" | "normal">("cancels");
  const [searchQuery, setSearchQuery] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(15);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MerchantOperationsResponse | null>(null);

  // AI Strategy Dialog state
  const [strategyDialogOpen, setStrategyDialogOpen] = useState(false);
  const [selectedShopForAi, setSelectedShopForAi] = useState<{
    id: number;
    nameEn: string;
    nameMm?: string | null;
    phone?: string | null;
    followUpStatus?: string;
    followUpNotes?: string | null;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStrategy, setAiStrategy] = useState<AiFollowUpStrategy | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);

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
        page,
        limit,
      });
      setData(res);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load merchant operations data");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, activeTab, searchQuery, urgencyFilter, statusFilter, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePresetChange = (preset: "today" | "yesterday" | "7d" | "thisMonth") => {
    setDatePreset(preset);
    const p = getPresetDates(preset);
    setStartDate(p.start);
    setEndDate(p.end);
    setPage(1);
  };

  const handleTabChange = (val: "cancels" | "dormant" | "top" | "normal") => {
    setActiveTab(val);
    setPage(1);
  };

  // Quick follow-up status change from table dropdown
  const handleQuickStatusChange = async (
    shop: { id: number; nameEn: string; followUpNotes?: string | null },
    newStatus: string,
  ) => {
    try {
      await merchantOperationsService.updateFollowUp(shop.id, {
        status: newStatus,
        note: shop.followUpNotes || undefined,
      });
      toast.success(`Status for "${shop.nameEn}" updated to ${newStatus}`);
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

  // Open AI Analysis modal
  const handleOpenAiStrategy = async (shop: {
    id: number;
    nameEn: string;
    nameMm?: string | null;
    phone?: string | null;
    followUpStatus?: string;
    followUpNotes?: string | null;
  }) => {
    setSelectedShopForAi(shop);
    setStrategyDialogOpen(true);
    setAiStrategy(null);
    setCopiedReport(false);
    setAiLoading(true);

    try {
      const res = await merchantOperationsService.getAiStrategy(shop.id, {
        startDate,
        endDate,
      });
      setAiStrategy(res.strategy);
    } catch (err: any) {
      toast.error(err?.message || "Could not generate AI analysis");
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

  // Copy full AI analysis report for internal team notes
  const copyFullAnalysisReport = () => {
    if (!aiStrategy || !selectedShopForAi) return;
    const text = [
      `📊 [AI Operational Analysis] ${selectedShopForAi.nameEn}`,
      `Focus: ${aiStrategy.keyFocus} (${aiStrategy.urgency} Priority)`,
      ``,
      `🔍 Root Cause Diagnosis:`,
      aiStrategy.rootCauseAnalysis,
      ``,
      `🛠️ Operational Improvement Suggestions:`,
      ...(aiStrategy.operationalImprovements || []).map((item, i) => `${i + 1}. ${item}`),
      ``,
      `📈 Marketing & Growth Suggestions:`,
      ...(aiStrategy.marketingGrowthSuggestions || []).map((item, i) => `${i + 1}. ${item}`),
      ``,
      `📋 Internal Follow-up Discussion Points:`,
      ...(aiStrategy.followUpDiscussionPoints || []).map((item, i) => `${i + 1}. ${item}`),
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
    toast.success("Analysis report copied to clipboard!");
  };

  // Export CSV
  const exportCsv = () => {
    if (!data || data.shops.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = [
      "Shop ID",
      "Shop Name",
      "Myanmar Name",
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
      "Latest Notes",
      "Contacted By",
      "Last Contacted Date",
    ];

    const rows = data.shops.map((s) => [
      s.id,
      `"${s.nameEn.replace(/"/g, '""')}"`,
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
  const insights = data?.operationalInsights;
  const pagination = data?.pagination;

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full">
      {/* ── HEADER (Clean without extra badges) ──────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Merchant Operations & Performance Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ဆိုင်များ၏ ရောင်းအား၊ Cancel ဖြစ်ရသည့် အကြောင်းရင်းများနှင့် တိုးတက်ရေး အကြံပြုချက်များကို စစ်ဆေးသုံးသပ်ရန် စင်တာ
          </p>
        </div>

        {/* Date presets & actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border bg-muted/50 p-1 text-xs shadow-2xs">
            {(["today", "yesterday", "7d", "thisMonth"] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetChange(preset)}
                className={`px-3 py-1.5 rounded-md transition-all font-medium ${
                  datePreset === preset
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {preset === "today"
                  ? "Today"
                  : preset === "yesterday"
                    ? "Yesterday"
                    : preset === "7d"
                      ? "7 Days"
                      : "This Month"}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={loading || !data?.shops?.length}
            className="h-9"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── SECTION 2: REAL-WORLD OPERATIONAL INTELLIGENCE COMMAND CENTER ─── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Panel 1: Top Revenue Leakage Shops */}
        <Card className="border-red-200/70 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/15 shadow-xs">
          <CardHeader className="pb-2 pt-3.5 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TrendingDown className="h-4 w-4" /> Top Revenue Loss Shops
              </span>
              <span className="text-[11px] font-semibold">
                -฿{(summary?.totalLostGmv ?? 0).toLocaleString()}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3.5">
            {insights?.topLossShops && insights.topLossShops.length > 0 ? (
              <div className="space-y-2">
                {insights.topLossShops.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-red-200/50 dark:border-red-900/40 bg-background/80 px-2.5 py-1.5 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground truncate">
                        {idx + 1}. {item.nameEn}
                      </div>
                      <div className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                        -฿{item.lostGmv.toLocaleString()} ({item.cancelledOrders} cancels · {item.cancelRate}%)
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleOpenAiStrategy(item)}
                      className="h-7 px-2 text-[11px] font-semibold !bg-purple-600 hover:!bg-purple-700 !text-white shrink-0 border-0"
                    >
                      <Bot className="h-3 w-3 !text-white mr-1" />
                      Analyze
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No cancelled orders in this period.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel 2: Cancellation Source Breakdown (Who Cancelled?) */}
        <Card className="border-border/70 bg-card shadow-xs">
          <CardHeader className="pb-2 pt-3.5 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-primary" /> Cancellation Source
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">
                {summary?.cancelledOrders ?? 0} total
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3.5 space-y-2.5">
            {/* Stacked Bar */}
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex">
              <div
                className="bg-red-500 h-full transition-all"
                style={{ width: `${insights?.canceledBySummary?.shopPct ?? 0}%` }}
                title="Shop Rejected"
              />
              <div
                className="bg-amber-500 h-full transition-all"
                style={{ width: `${insights?.canceledBySummary?.systemPct ?? 0}%` }}
                title="System Auto-Timeout"
              />
              <div
                className="bg-blue-500 h-full transition-all"
                style={{ width: `${insights?.canceledBySummary?.userPct ?? 0}%` }}
                title="Customer Cancelled"
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  Shop Rejected (ဆိုင်မှပယ်ချ)
                </span>
                <span className="font-bold text-foreground">
                  {insights?.canceledBySummary?.shop ?? 0} ({insights?.canceledBySummary?.shopPct ?? 0}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  System Timeout (အချိန်ကျော်)
                </span>
                <span className="font-bold text-foreground">
                  {insights?.canceledBySummary?.system ?? 0} ({insights?.canceledBySummary?.systemPct ?? 0}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                  Customer Cancel (ဝယ်သူပယ်ဖျက်)
                </span>
                <span className="font-bold text-foreground">
                  {insights?.canceledBySummary?.user ?? 0} ({insights?.canceledBySummary?.userPct ?? 0}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Panel 3: Peak Failure Hours */}
        <Card className="border-border/70 bg-card shadow-xs">
          <CardHeader className="pb-2 pt-3.5 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-500" /> Peak Failure Hours
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Bangkok Time
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3.5">
            {insights?.peakCancelHours && insights.peakCancelHours.length > 0 ? (
              <div className="space-y-2.5">
                {insights.peakCancelHours.map((slot, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                          #{i + 1}
                        </Badge>
                        {slot.timeWindow}
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {slot.count} cancels ({slot.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, slot.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No peak failure hours recorded.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel 4: Team Follow-up Execution */}
        <Card className="border-border/70 bg-card shadow-xs">
          <CardHeader className="pb-2 pt-3.5 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-emerald-500" /> Ops Follow-up Progress
              </span>
              <Badge variant="secondary" className="text-[10px] h-4.5">
                {insights?.followUpProgress?.actionedRate ?? 0}% Actioned
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3.5 space-y-2.5">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${insights?.followUpProgress?.actionedRate ?? 0}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="rounded-md bg-red-500/10 border border-red-500/20 p-1.5">
                <div className="text-sm font-bold text-red-600 dark:text-red-400">
                  {insights?.followUpProgress?.pendingCount ?? 0}
                </div>
                <div className="text-[10px] text-muted-foreground">Pending</div>
              </div>
              <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-1.5">
                <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {insights?.followUpProgress?.inProgressCount ?? 0}
                </div>
                <div className="text-[10px] text-muted-foreground">In Contact</div>
              </div>
              <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-1.5">
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {insights?.followUpProgress?.resolvedCount ?? 0}
                </div>
                <div className="text-[10px] text-muted-foreground">Resolved</div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs font-medium"
              onClick={() => {
                setActiveTab("cancels");
                setStatusFilter(statusFilter === "PENDING" ? "ALL" : "PENDING");
                setPage(1);
              }}
            >
              {statusFilter === "PENDING"
                ? "Show All Follow-up Statuses"
                : `Filter Unresolved Only (${insights?.followUpProgress?.pendingCount ?? 0})`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── TOP KPI SUMMARY CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Active Restaurants */}
        <Card className="border-border/60 shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Active Merchants
            </CardTitle>
            <Store className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {summary?.totalShops ?? 0} <span className="text-xs font-normal text-muted-foreground">shops</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>{summary?.completedOrders ?? 0} completed orders</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 2: High Cancellations & Lost GMV */}
        <Card
          onClick={() => handleTabChange("cancels")}
          className={`cursor-pointer border-red-200 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/20 shadow-xs transition-all hover:ring-2 hover:ring-red-400 ${activeTab === "cancels" ? "ring-2 ring-red-500" : ""}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
              Cancel Alert (Urgent)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {summary?.highCancelShopsCount ?? 0} <span className="text-xs font-normal text-muted-foreground">shops</span>
              </div>
              <Badge variant="destructive" className="text-[10px] h-5">
                {summary?.platformCancelRate ?? 0}% Platform Avg
              </Badge>
            </div>
            <p className="text-xs text-red-600/90 dark:text-red-400/90 mt-1 flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>Lost Revenue: <strong>฿{(summary?.totalLostGmv ?? 0).toLocaleString()}</strong></span>
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Zero-Order (Dormant) */}
        <Card
          onClick={() => handleTabChange("dormant")}
          className={`cursor-pointer border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 shadow-xs transition-all hover:ring-2 hover:ring-amber-400 ${activeTab === "dormant" ? "ring-2 ring-amber-500" : ""}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Zero Orders (Dormant)
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {summary?.dormantShopsCount ?? 0} <span className="text-xs font-normal text-muted-foreground">shops</span>
            </div>
            <p className="text-xs text-amber-600/90 dark:text-amber-400/90 mt-1">
              ၀ အော်ဒါဖြစ်နေသော ဆိုင်များ (Needs Activation)
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Top Sellers (VIP) */}
        <Card
          onClick={() => handleTabChange("top")}
          className={`cursor-pointer border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs transition-all hover:ring-2 hover:ring-emerald-400 ${activeTab === "top" ? "ring-2 ring-emerald-500" : ""}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
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
            <p className="text-xs text-emerald-600/90 dark:text-emerald-400/90 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Gross Sales: ฿{(summary?.totalGmv ?? 0).toLocaleString()}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── PLATFORM CANCEL REASONS BREAKDOWN PILLS ───────────────────────── */}
      {data?.platformCancelReasons && data.platformCancelReasons.length > 0 && (
        <Card className="border-border/60 bg-muted/20 shadow-xs">
          <CardContent className="p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                အဓိက Order Cancel ဖြစ်ရသည့် အကြောင်းရင်းများ (Root Causes Across Platform)
              </span>
              <span className="text-xs text-muted-foreground">
                Total {summary?.cancelledOrders ?? 0} cancels analyzed
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {data.platformCancelReasons.map((item, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-xs shadow-2xs"
                >
                  <span className="font-medium text-foreground">{item.reason}</span>
                  <span className="rounded-md bg-red-100 dark:bg-red-950 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:text-red-300">
                    {item.count} cancels ({item.percentage}%)
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
            onValueChange={(val: any) => handleTabChange(val)}
            className="w-full lg:w-auto"
          >
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-10 p-1 bg-muted/60">
              <TabsTrigger value="cancels" className="gap-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                <span>Cancel Alert</span>
                <span className="ml-1 rounded-full bg-red-100 dark:bg-red-950 px-2 py-0.2 text-[10px] font-bold text-red-700 dark:text-red-300">
                  {summary?.highCancelShopsCount ?? 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="dormant" className="gap-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>Zero-Order (၀ အော်ဒါ)</span>
                <span className="ml-1 rounded-full bg-amber-100 dark:bg-amber-950 px-2 py-0.2 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  {summary?.dormantShopsCount ?? 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="top" className="gap-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                <Flame className="h-3.5 w-3.5 text-emerald-500" />
                <span>Top Sellers</span>
                <span className="ml-1 rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  {summary?.topPerformersCount ?? 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="normal" className="gap-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                <Store className="h-3.5 w-3.5 text-blue-500" />
                <span>Steady / Normal</span>
                <span className="ml-1 rounded-full bg-blue-100 dark:bg-blue-950 px-2 py-0.2 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                  {summary?.normalVolumeCount ?? 0}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters: Search & Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by restaurant name or phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-10 text-xs"
              />
            </div>

            <Select
              value={urgencyFilter}
              onValueChange={(val) => {
                setUrgencyFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-32 h-10 text-xs">
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

            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40 h-10 text-xs">
                <SelectValue placeholder="Follow-up Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Follow-ups</SelectItem>
                <SelectItem value="PENDING">🔴 Need Follow-up</SelectItem>
                <SelectItem value="CALLED">🟡 In Contact / Called</SelectItem>
                <SelectItem value="RESOLVED">🟢 Resolved</SelectItem>
                <SelectItem value="NO_ANSWER">⚪ No Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── SHOPS DATA TABLE ────────────────────────────────────────────── */}
        <Card className="border-border/60 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 border-b border-border/60 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-3">Restaurant Info</th>
                  <th className="py-3 px-3">Orders & Loss</th>
                  <th className="py-3 px-3">
                    {activeTab === "dormant" ? "Inactivity Duration" : "Root Cause & Peak Window"}
                  </th>
                  <th className="py-3 px-3">Follow-up Status</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading merchant performance data...
                    </td>
                  </tr>
                ) : !data?.shops || data.shops.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-muted-foreground">
                      <HelpCircle className="h-7 w-7 mx-auto mb-2 opacity-40" />
                      No restaurants found in this category or matching your search.
                    </td>
                  </tr>
                ) : (
                  data.shops.map((shop) => (
                    <tr
                      key={shop.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      {/* 1. Shop Identity */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <TableImage
                            src={shop.logoUrl}
                            alt={shop.nameEn}
                            size="md"
                            className="rounded-lg shrink-0 border"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm text-foreground truncate max-w-[180px] sm:max-w-[240px]">
                                {shop.nameEn}
                              </span>
                              {shop.isVerified && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                                  Verified
                                </Badge>
                              )}
                              {!shop.isOpen ? (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-red-300 text-red-600 bg-red-50 dark:bg-red-950">
                                  Closed
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950">
                                  Open
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                              {shop.nameMm || shop.addressEn || "No Burmese name"}
                            </div>
                            {shop.phone && (
                              <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                {shop.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Orders & Financial Loss */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-bold text-foreground">
                              {shop.completedOrders}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              / {shop.totalOrders} total
                            </span>
                          </div>

                          {shop.cancelledOrders > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-red-600 dark:text-red-400 font-semibold">
                                  {shop.cancelledOrders} cancelled ({shop.cancelRate}%)
                                </span>
                              </div>
                              <div className="w-28 bg-muted rounded-full h-1.5 overflow-hidden flex">
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
                              {shop.lostGmv > 0 && (
                                <div className="text-[11px] font-bold text-red-600 dark:text-red-400">
                                  💸 Lost: ฿{shop.lostGmv.toLocaleString()}
                                </div>
                              )}
                            </div>
                          ) : shop.totalOrders > 0 ? (
                            <div className="space-y-0.5">
                              <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-600 bg-emerald-50/50">
                                100% Fulfilled
                              </Badge>
                              <div className="text-[11px] text-muted-foreground">
                                Sales: ฿{shop.totalGmv.toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">
                              No orders yet
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Root Cause & Peak Window */}
                      <td className="py-3 px-3">
                        {activeTab === "dormant" ? (
                          <div className="space-y-1">
                            <div className="text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {shop.daysSinceLastOrder ?? 0} days inactive
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {shop.lastOrderAt
                                ? `Last order: ${new Date(shop.lastOrderAt).toLocaleDateString()}`
                                : "Never received orders"}
                            </p>
                          </div>
                        ) : shop.topCancelReason ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                              <span>⚠️ {shop.topCancelReason}</span>
                            </div>
                            {shop.peakCancelHours && shop.peakCancelHours.length > 0 && (
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Peak: <strong className="text-foreground">{shop.peakCancelHours[0].timeWindow}</strong>
                              </div>
                            )}
                            {shop.canceledByBreakdown && (
                              <div className="text-[10px] text-muted-foreground">
                                By: {shop.canceledByBreakdown.shop} shop · {shop.canceledByBreakdown.system} timeout · {shop.canceledByBreakdown.user} user
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Clean performance
                          </span>
                        )}
                      </td>

                      {/* 4. Follow-up Status */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Select
                              value={shop.followUpStatus}
                              onValueChange={(val) => handleQuickStatusChange(shop, val)}
                            >
                              <SelectTrigger className="h-8 w-36 text-xs p-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDING">🔴 Need Follow-up</SelectItem>
                                <SelectItem value="CALLED">🟡 In Contact / Called</SelectItem>
                                <SelectItem value="RESOLVED">🟢 Resolved</SelectItem>
                                <SelectItem value="NO_ANSWER">⚪ No Answer</SelectItem>
                              </SelectContent>
                            </Select>

                            <button
                              onClick={() => handleOpenNoteDialog(shop)}
                              className={`h-8 w-8 inline-flex items-center justify-center rounded-md border text-muted-foreground hover:text-foreground hover:bg-muted ${shop.followUpNotes ? "border-primary/50 text-primary bg-primary/5" : ""}`}
                              title={shop.followUpNotes || "Add follow-up notes"}
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          </div>

                          {shop.contactedByName && (
                            <p className="text-[10px] text-muted-foreground">
                              By: {shop.contactedByName} {shop.lastContactedAt && `(${new Date(shop.lastContactedAt).toLocaleDateString()})`}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 5. Actions (AI Analyze / Bigger Phone Button / Manage) */}
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center justify-end gap-2 whitespace-nowrap">
                          {/* 🤖 AI Deep Analysis Button */}
                          <Button
                            size="sm"
                            className="h-9 px-3.5 text-xs font-semibold !bg-purple-600 hover:!bg-purple-700 active:!bg-purple-800 !text-white rounded-md shadow-xs shrink-0 inline-flex items-center gap-1.5 border-0"
                            onClick={() => handleOpenAiStrategy(shop)}
                          >
                            <Bot className="h-4 w-4 !text-white" />
                            <span>AI Analyze</span>
                          </Button>

                          {/* 📞 Bigger Phone Call Button */}
                          {shop.phone ? (
                            <a
                              href={`tel:${shop.phone}`}
                              className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 font-semibold text-xs transition-colors shrink-0 shadow-2xs"
                              title={`Call ${shop.phone}`}
                            >
                              <Phone className="h-4 w-4" />
                              <span>Call</span>
                            </a>
                          ) : (
                            <span
                              className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md border border-border bg-muted/40 text-muted-foreground text-xs opacity-50 cursor-not-allowed shrink-0"
                              title="No phone number listed"
                            >
                              <Phone className="h-4 w-4" />
                              <span>No Phone</span>
                            </span>
                          )}

                          {/* Manage link */}
                          <Link
                            to={`/shops/manage`}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                            title="Manage Restaurant"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── TABLE PAGINATION FOOTER ────────────────────────────────────── */}
          {pagination && pagination.total > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-border/60 bg-muted/20 text-xs">
              <div className="flex items-center gap-3 text-muted-foreground">
                <span>
                  Showing{" "}
                  <strong className="text-foreground">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </strong>{" "}
                  to{" "}
                  <strong className="text-foreground">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </strong>{" "}
                  of <strong className="text-foreground">{pagination.total}</strong> restaurants
                </span>

                <Select
                  value={String(limit)}
                  onValueChange={(val) => {
                    setLimit(Number(val));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 / page</SelectItem>
                    <SelectItem value="30">30 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                    <SelectItem value="100">100 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Prev
                </Button>

                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, idx) => {
                  const startPage = Math.max(
                    1,
                    Math.min(
                      pagination.page - 2,
                      pagination.totalPages - 4,
                    ),
                  );
                  const pageNum = startPage + idx;
                  if (pageNum > pagination.totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0 text-xs"
                      disabled={loading}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── 🤖 AI DEEP DIAGNOSTIC & IMPROVEMENT SUGGESTIONS MODAL ────────── */}
      <Dialog open={strategyDialogOpen} onOpenChange={setStrategyDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    AI Operational Diagnosis & Improvement Plan
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {selectedShopForAi?.nameEn}{" "}
                    {selectedShopForAi?.nameMm ? `(${selectedShopForAi.nameMm})` : ""} ·{" "}
                    {aiStrategy?.keyFocus || "Data-Driven Merchant Audit"}
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {aiStrategy && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={copyFullAnalysisReport}
                  >
                    {copiedReport ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy Report
                      </>
                    )}
                  </Button>
                )}
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
            </div>
          </DialogHeader>

          {aiLoading ? (
            <div className="py-14 text-center space-y-3">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-600" />
              <p className="text-sm font-semibold text-foreground">
                Analyzing order history, cancelled menu items, peak failure hours & AOV...
              </p>
              <p className="text-xs text-muted-foreground">
                Generating operational & marketing improvement recommendations.
              </p>
            </div>
          ) : aiStrategy ? (
            <div className="space-y-4 pt-2">
              {/* Data Snapshot Row */}
              {aiStrategy.metricsSnapshot && (
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-lg border bg-muted/30 p-2.5 text-center">
                    <div className="text-[11px] text-muted-foreground">Active Menu Items</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">
                      {aiStrategy.metricsSnapshot.activeMenuCount} items
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-2.5 text-center">
                    <div className="text-[11px] text-muted-foreground">Avg Order Value</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">
                      ฿{aiStrategy.metricsSnapshot.avgOrderValue.toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-2.5 text-center">
                    <div className="text-[11px] text-muted-foreground">Cancel Source</div>
                    <div className="text-xs font-bold text-foreground mt-0.5">
                      Shop {aiStrategy.metricsSnapshot.canceledByBreakdown.shop} · Timeout{" "}
                      {aiStrategy.metricsSnapshot.canceledByBreakdown.system} · User{" "}
                      {aiStrategy.metricsSnapshot.canceledByBreakdown.user}
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Item Diagnostics (Cancelled vs Best Selling Dishes) */}
              {aiStrategy.metricsSnapshot &&
                (aiStrategy.metricsSnapshot.topCancelledItems.length > 0 ||
                  aiStrategy.metricsSnapshot.topSellingItems.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {aiStrategy.metricsSnapshot.topCancelledItems.length > 0 && (
                      <div className="rounded-xl border border-red-200/60 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/15 p-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5 mb-2">
                          <Utensils className="h-3.5 w-3.5" /> Most Cancelled Menu Items
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {aiStrategy.metricsSnapshot.topCancelledItems.map((item, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-[11px] border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 bg-background"
                            >
                              {item.name} ({item.count})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiStrategy.metricsSnapshot.topSellingItems.length > 0 && (
                      <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/15 p-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                          <Flame className="h-3.5 w-3.5" /> Top Selling Menu Items
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {aiStrategy.metricsSnapshot.topSellingItems.map((item, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-[11px] border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-background"
                            >
                              {item.name} ({item.count})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* 1. Deep Performance & Root Cause Diagnosis */}
              <div className="rounded-xl border border-purple-200/60 bg-purple-50/40 dark:bg-purple-950/20 p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-1.5">
                  <Zap className="h-4 w-4" /> 1. Data & Root Cause Analysis (အဓိက ပြဿနာနှင့် အချက်အလက် သုံးသပ်ချက်)
                </div>
                <p className="text-xs text-foreground leading-relaxed font-medium">
                  {aiStrategy.rootCauseAnalysis}
                </p>
              </div>

              {/* 2. Operational Improvement Suggestions */}
              <div className="rounded-xl border border-border/80 bg-background p-4 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Wrench className="h-4 w-4 text-amber-500" /> 2. Operational Improvements (Operations ပိုင်း ပြုပြင်ရန် အကြံပြုချက်များ)
                </span>
                <ul className="space-y-2 text-xs text-foreground">
                  {(aiStrategy.operationalImprovements || []).map((rec, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 3. Marketing & Revenue Growth Suggestions */}
              <div className="rounded-xl border border-border/80 bg-background p-4 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Megaphone className="h-4 w-4 text-emerald-500" /> 3. Marketing & Growth Strategy (Marketing နှင့် ရောင်းအားမြှင့်တင်ရေး အကြံပြုချက်များ)
                </span>
                <ul className="space-y-2 text-xs text-foreground">
                  {(aiStrategy.marketingGrowthSuggestions || []).map((rec, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 4. Internal Audit & Follow-up Discussion Points */}
              <div className="rounded-xl border border-border/80 bg-background p-4 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <ClipboardCheck className="h-4 w-4 text-blue-500" /> 4. Internal Follow-up Audit Guide (ဆိုင်နှင့် ပြန်လည်ဆွေးနွေးစစ်ဆေးရန် အချက်များ)
                </span>
                <ul className="space-y-2 text-xs text-foreground">
                  {(aiStrategy.followUpDiscussionPoints || []).map((rec, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Unable to generate AI operational analysis.
            </div>
          )}

          <DialogFooter className="flex sm:justify-between items-center pt-3 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">Update Status:</span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={async () => {
                  if (selectedShopForAi) {
                    await handleQuickStatusChange(selectedShopForAi, "CALLED");
                    setStrategyDialogOpen(false);
                  }
                }}
              >
                Mark as In Contact / Called
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs text-emerald-600 border-emerald-300"
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
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">🔴 Need Follow-up</SelectItem>
                  <SelectItem value="CALLED">🟡 In Contact / Called</SelectItem>
                  <SelectItem value="RESOLVED">🟢 Resolved / Fixed</SelectItem>
                  <SelectItem value="NO_ANSWER">⚪ No Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Operational Notes & Action Items</label>
              <Textarea
                rows={4}
                placeholder="E.g. Reviewed menu stock with store manager. Disabled 3 out-of-stock dishes during lunch peak. Will monitor cancel rate over next 48 hours."
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
