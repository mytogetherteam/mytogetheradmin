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
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  HelpCircle,
  FileText,
  Zap,
  MessageCircle,
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

// Official LINE Brand SVG Icon
function LineBrandIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19.365 9.863c.349.001.635.289.635.642 0 .354-.286.643-.635.643h-2.138v1.397h2.138c.349.001.635.289.635.642 0 .354-.286.643-.635.643h-2.78c-.349 0-.635-.289-.635-.643V8.718c0-.353.286-.642.635-.642h2.78c.349 0 .635.289.635.642 0 .354-.286.642-.635.642h-2.138v1.403h2.138zM10.82 8.718c0-.353.286-.642.635-.642.349 0 .635.289.635.642v4.743c0 .354-.286.643-.635.643-.349 0-.635-.289-.635-.643V8.718zm4.316 4.743c0 .354-.286.643-.635.643h-2.138c-.349 0-.635-.289-.635-.643V8.718c0-.353.286-.642.635-.642.349 0 .635.289.635.642v4.1h2.138c.349 0 .635.289.635.643zM8.36 8.076c.349 0 .635.289.635.642v2.793l2.03-2.617c.121-.157.306-.251.503-.251.349 0 .635.289.635.642v4.743c0 .354-.286.643-.635.643-.349 0-.635-.289-.635-.643V11.23l-2.03 2.618c-.121.157-.306.251-.503.251-.349 0-.635-.289-.635-.643V8.718c0-.353.286-.642.635-.642zm11.082 1.787C19.442 4.417 15.228 0 10.021 0 4.814 0 .6 4.417.6 9.863c0 4.887 4.213 8.98 9.42 8.98 1.047 0 2.054-.162 2.998-.466.786.524 2.378 1.585 2.502 1.637.147.062.302.043.43-.051.127-.094.19-.248.163-.404-.038-.216-.409-2.071-.462-2.338 2.656-1.787 4.191-4.596 4.191-7.358z" />
    </svg>
  );
}

export default function MerchantPerformancePage() {
  const [datePreset, setDatePreset] = useState<"today" | "yesterday" | "7d" | "thisMonth">("7d");
  const [startDate, setStartDate] = useState(() => getPresetDates("7d").start);
  const [endDate, setEndDate] = useState(() => getPresetDates("7d").end);
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
  const [copiedLine, setCopiedLine] = useState(false);

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

  const handlePresetChange = (preset: "today" | "yesterday" | "7d" | "thisMonth") => {
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

  // Open AI Strategy modal
  const handleOpenAiStrategy = async (shop: ShopPerformanceItem) => {
    setSelectedShopForAi(shop);
    setStrategyDialogOpen(true);
    setAiStrategy(null);
    setCopiedScript(false);
    setCopiedLine(false);
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
  const copyToClipboard = (text: string, type: "script" | "line") => {
    navigator.clipboard.writeText(text);
    if (type === "script") {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else {
      setCopiedLine(true);
      setTimeout(() => setCopiedLine(false), 2000);
    }
    toast.success("Copied to clipboard!");
  };

  // Open LINE with prefilled text
  const openLine = (message: string) => {
    // Official LINE URL scheme to share/send prefilled text in chat
    const url = `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Quick LINE Follow-up for restaurant row
  const handleQuickLine = (shop: ShopPerformanceItem) => {
    const defaultText = `မင်္ဂလာပါရှင့် ${shop.nameEn}။ MyTogether Merchant Team မှ ဖြစ်ပါတယ်။ ဆိုင်၏ အော်ဒါအခြေအနေနှင့် ပတ်သက်ပြီး အကူအညီ လိုအပ်ပါက ဤ LINE မှ ဆက်သွယ်ပေးပါရှင့်။`;
    openLine(defaultText);
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

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Merchant Operations & LINE Marketing Hub
            </h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
              <LineBrandIcon className="h-3 w-3 mr-1 text-[#06C755]" /> LINE Connected
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300">
              <Bot className="h-3 w-3 mr-1 text-purple-600" /> Gemini AI Follow-up
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5">
            ဆိုင်များ၏ Cancel ဖြစ်ရသည့် အကြောင်းရင်းများကို စစ်ဆေးပြီး 1-Click LINE / Phone ဖြင့် Marketing Follow-up ပြုလုပ်ရန် စင်တာ
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

      {/* ── MARKETING ACTION ALERT BANNER ─────────────────────────────────── */}
      <div className="rounded-xl border border-border/80 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-emerald-500/10 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Marketing & Operations Action Plan ({startDate} ~ {endDate})
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              ယခုရွေးချယ်ထားသော ကာလအတွင်း{" "}
              <strong className="text-red-600 dark:text-red-400">
                {summary?.highCancelShopsCount ?? 0} ဆိုင်
              </strong>{" "}
              သည် Cancel များနေပြီး ဆုံးရှုံးငွေ{" "}
              <strong className="text-red-600 dark:text-red-400">
                ฿{(summary?.totalLostGmv ?? 0).toLocaleString()}
              </strong>{" "}
              ရှိပါသည်။ ထို့အပြင်{" "}
              <strong className="text-amber-600 dark:text-amber-400">
                {summary?.dormantShopsCount ?? 0} ဆိုင်
              </strong>{" "}
              သည် အော်ဒါ ၀ ခု ဖြစ်နေသဖြင့် LINE မှတဆင့် Welcome Promo သို့မဟုတ် Menu Boost လုပ်ပေးသင့်ပါသည်။
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant={activeTab === "cancels" ? "default" : "outline"}
              className="text-xs h-8"
              onClick={() => setActiveTab("cancels")}
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1 text-red-500" />
              Check Cancels ({summary?.highCancelShopsCount ?? 0})
            </Button>
            <Button
              size="sm"
              variant={activeTab === "dormant" ? "default" : "outline"}
              className="text-xs h-8"
              onClick={() => setActiveTab("dormant")}
            >
              <Clock className="h-3.5 w-3.5 mr-1 text-amber-500" />
              Check Dormant ({summary?.dormantShopsCount ?? 0})
            </Button>
          </div>
        </div>
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
            <div className="text-2xl font-bold text-foreground">{summary?.totalShops ?? 0} <span className="text-xs font-normal text-muted-foreground">shops</span></div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>{summary?.completedOrders ?? 0} completed orders</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 2: High Cancellations & Lost GMV */}
        <Card
          onClick={() => setActiveTab("cancels")}
          className={`cursor-pointer border-red-200 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/20 shadow-xs transition-all hover:ring-2 hover:ring-red-400 ${activeTab === "cancels" ? "ring-2 ring-red-500" : ""}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
              🚨 Cancel Alert (Urgent)
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
          onClick={() => setActiveTab("dormant")}
          className={`cursor-pointer border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 shadow-xs transition-all hover:ring-2 hover:ring-amber-400 ${activeTab === "dormant" ? "ring-2 ring-amber-500" : ""}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              😴 Zero Orders (Dormant)
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {summary?.dormantShopsCount ?? 0} <span className="text-xs font-normal text-muted-foreground">shops</span>
            </div>
            <p className="text-xs text-amber-600/90 dark:text-amber-400/90 mt-1">
              ၀ အော်ဒါဖြစ်နေသော ဆိုင်များ (Needs LINE Check-in)
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Top Sellers (VIP) */}
        <Card
          onClick={() => setActiveTab("top")}
          className={`cursor-pointer border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs transition-all hover:ring-2 hover:ring-emerald-400 ${activeTab === "top" ? "ring-2 ring-emerald-500" : ""}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              👑 Top Sellers (VIP)
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
            onValueChange={(val: any) => setActiveTab(val)}
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs"
              />
            </div>

            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-10 text-xs">
                <SelectValue placeholder="Follow-up Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Follow-ups</SelectItem>
                <SelectItem value="PENDING">🔴 Need Follow-up</SelectItem>
                <SelectItem value="CALLED">💬 Contacted / In Progress</SelectItem>
                <SelectItem value="RESOLVED">🟢 Resolved</SelectItem>
                <SelectItem value="NO_ANSWER">⚪ No Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── SHOPS DATA TABLE (CLEAR & MARKETING-FOCUSED) ────────────────── */}
        <Card className="border-border/60 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 border-b border-border/60 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Restaurant Info</th>
                  <th className="py-2.5 px-3">Orders & Loss</th>
                  <th className="py-2.5 px-3">
                    {activeTab === "dormant" ? "Inactivity Duration" : "Root Cause & Peak Window"}
                  </th>
                  <th className="py-2.5 px-3">Follow-up Status</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Actions</th>
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
                      <td className="py-2.5 px-3">
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
                              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <a
                                  href={`tel:${shop.phone}`}
                                  className="text-foreground hover:text-primary font-mono"
                                >
                                  {shop.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Orders & Financial Loss */}
                      <td className="py-2.5 px-3">
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
                      <td className="py-2.5 px-3">
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
                                Cancelled by: {shop.canceledByBreakdown.shop} shop · {shop.canceledByBreakdown.user} customer
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
                      <td className="py-2.5 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Select
                              value={shop.followUpStatus}
                              onValueChange={(val) => handleQuickStatusChange(shop, val)}
                            >
                              <SelectTrigger className="h-7.5 w-32 text-xs p-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDING">🔴 Need Follow-up</SelectItem>
                                <SelectItem value="CALLED">💬 In Contact</SelectItem>
                                <SelectItem value="RESOLVED">🟢 Resolved</SelectItem>
                                <SelectItem value="NO_ANSWER">⚪ No Answer</SelectItem>
                              </SelectContent>
                            </Select>

                            <button
                              onClick={() => handleOpenNoteDialog(shop)}
                              className={`p-1.5 rounded-md border text-muted-foreground hover:text-foreground hover:bg-muted ${shop.followUpNotes ? "border-primary/50 text-primary bg-primary/5" : ""}`}
                              title={shop.followUpNotes || "Add follow-up notes"}
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {shop.contactedByName && (
                            <p className="text-[10px] text-muted-foreground">
                              By: {shop.contactedByName} {shop.lastContactedAt && `(${new Date(shop.lastContactedAt).toLocaleDateString()})`}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 5. Actions (LINE / Phone / AI) */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {/* 🤖 Gemini AI Strategy Button */}
                          <Button
                            size="sm"
                            className="h-7.5 px-2.5 text-xs font-semibold !bg-purple-600 hover:!bg-purple-700 active:!bg-purple-800 !text-white rounded-md shadow-xs shrink-0 inline-flex items-center gap-1.5 border-0"
                            onClick={() => handleOpenAiStrategy(shop)}
                          >
                            <Bot className="h-3.5 w-3.5 !text-white" />
                            <span>AI Script</span>
                          </Button>

                          {/* 💬 LINE Direct Button */}
                          <Button
                            size="sm"
                            onClick={() => handleQuickLine(shop)}
                            className="h-7.5 px-2.5 text-xs font-semibold !bg-[#06C755] hover:!bg-[#05b34c] active:!bg-[#049f43] !text-white rounded-md shadow-xs shrink-0 inline-flex items-center gap-1.5 border-0"
                            title="Open in LINE and send message"
                          >
                            <LineBrandIcon className="h-3.5 w-3.5 !text-white" />
                            <span>LINE</span>
                          </Button>

                          {/* 📞 Phone call shortcut */}
                          {shop.phone && (
                            <a
                              href={`tel:${shop.phone}`}
                              className="inline-flex items-center justify-center h-7.5 w-7.5 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                              title={`Call ${shop.phone}`}
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          )}

                          {/* Manage link */}
                          <Link
                            to={`/shops/manage`}
                            className="inline-flex items-center justify-center h-7.5 w-7.5 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
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
        </Card>
      </div>

      {/* ── 🤖 GEMINI AI & LINE FOLLOW-UP STRATEGY MODAL ────────────────── */}
      <Dialog open={strategyDialogOpen} onOpenChange={setStrategyDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Merchant Follow-up & LINE Playbook
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {selectedShopForAi?.nameEn} {selectedShopForAi?.nameMm ? `(${selectedShopForAi.nameMm})` : ""} · Phone: {selectedShopForAi?.phone || "N/A"}
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
            <div className="py-14 text-center space-y-3">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-600" />
              <p className="text-sm font-semibold text-foreground">
                Gemini AI is analyzing cancellation causes, peak hours & marketing solutions...
              </p>
              <p className="text-xs text-muted-foreground">
                Personalized Burmese phone script and LINE template are being prepared.
              </p>
            </div>
          ) : aiStrategy ? (
            <div className="space-y-4 pt-2">
              {/* 1. Root Cause Diagnosis */}
              <div className="rounded-xl border border-purple-200/60 bg-purple-50/40 dark:bg-purple-950/20 p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-1.5">
                  <Zap className="h-4 w-4" /> Root Cause Diagnosis (အဓိက ပြဿနာ သုံးသပ်ချက်)
                </div>
                <p className="text-xs text-foreground leading-relaxed font-medium">
                  {aiStrategy.rootCauseAnalysis}
                </p>
              </div>

              {/* 2. 💬 LINE Message (Primary Chat Channel) */}
              <div className="rounded-xl border border-emerald-300/70 bg-emerald-50/30 dark:bg-emerald-950/20 p-4 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <LineBrandIcon className="h-4 w-4 text-[#06C755]" /> LINE Message Template (LINE စာသား)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs bg-background"
                      onClick={() =>
                        copyToClipboard(
                          aiStrategy.lineMessage || aiStrategy.whatsappMessage || "",
                          "line",
                        )
                      }
                    >
                      {copiedLine ? (
                        <>
                          <Check className="h-3 w-3 mr-1 text-emerald-500" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" /> Copy LINE Text
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-[#06C755] hover:bg-[#05b34c] text-white font-medium"
                      onClick={() =>
                        openLine(
                          aiStrategy.lineMessage || aiStrategy.whatsappMessage || "",
                        )
                      }
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1" /> Open in LINE
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg bg-background p-3 text-xs text-foreground leading-relaxed border italic">
                  "{aiStrategy.lineMessage || aiStrategy.whatsappMessage}"
                </div>
              </div>

              {/* 3. 📞 Phone Call Script */}
              <div className="rounded-xl border border-border/80 bg-background p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-primary" /> Phone Call Script (ဖုန်းဆက်ပြောရန် Script)
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
                <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed font-mono whitespace-pre-wrap text-foreground border">
                  {aiStrategy.callScript}
                </div>
              </div>

              {/* 4. Action Recommendations */}
              <div className="rounded-xl border border-border/80 bg-background p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Marketing & Ops Checklist (လုပ်ဆောင်ချက်များ)
                </span>
                <ul className="space-y-2 text-xs text-foreground">
                  {aiStrategy.actionRecommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="rounded-full bg-primary/10 text-primary w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
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
              Unable to generate AI follow-up strategy.
            </div>
          )}

          <DialogFooter className="flex sm:justify-between items-center pt-3 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">Quick Status:</span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                onClick={async () => {
                  if (selectedShopForAi) {
                    await handleQuickStatusChange(selectedShopForAi, "CALLED");
                    setStrategyDialogOpen(false);
                  }
                }}
              >
                Mark as Contacted via LINE
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
                  <SelectItem value="CALLED">💬 Contacted via LINE / Phone</SelectItem>
                  <SelectItem value="RESOLVED">🟢 Resolved / Fixed</SelectItem>
                  <SelectItem value="NO_ANSWER">⚪ No Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Call Notes & Action Items</label>
              <Textarea
                rows={4}
                placeholder="E.g. Contacted store owner on LINE. They will pause the out-of-stock menu items during lunch peak. Will follow up tomorrow."
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
