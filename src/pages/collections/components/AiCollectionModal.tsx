import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Loader2,
  Coffee,
  Star,
  Flame,
  CloudRain,
  PartyPopper,
  Coins,
  Moon,
  Pencil,
  X,
  MapPin,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  CollectionService,
  type AiGeneratedCollectionItem,
} from "@/services/collectionService";

interface AiCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const MODES = [
  {
    id: "EAT_NOW",
    label: "Eat Now",
    labelMm: "အခုချက်ချင်း စားမယ်",
    labelTh: "กินเลย อร่อยด่วน",
    desc: "Quick delivery & instant hunger relief",
    defaultDescMm: "ဗိုက်ဆာဆာနဲ့ အမြန်စားချင်သူများအတွက် အနီးဆုံးဆိုင်များ",
    defaultDescEn: "Satisfy hunger right away with fast-delivery dishes nearby",
    defaultDescTh: "อิ่มอร่อยทันใจกับเมนูพร้อมส่งด่วนในระยะ 15 กม.",
    icon: Flame,
    color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
  },
  {
    id: "GOOD_CHOICE",
    label: "Good Choice",
    labelMm: "ရွေးချယ်မှု ကောင်း",
    labelTh: "จานเด็ดโดนใจ",
    desc: "Top-rated crowd favorites & bestsellers",
    defaultDescMm: "လူကြိုက်အများဆုံးနှင့် သုံးသပ်ချက်အကောင်းဆုံး ထိပ်တန်းဟင်းလျာများ",
    defaultDescEn: "Highest-rated bestsellers and crowd favorite meals nearby",
    defaultDescTh: "เมนูยอดนิยมเรตติ้งดี การันตีความอร่อยใกล้คุณ",
    icon: Star,
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
  },
  {
    id: "HAPPY_MONDAY",
    label: "Happy Monday",
    labelMm: "တနင်္လာ အားဖြည့်စရာ",
    labelTh: "เติมพลังวันจันทร์",
    desc: "Energizing coffee, hearty noodles & breakfast",
    defaultDescMm: "တနင်္လာနေ့အတွက် စွမ်းအင်ပြည့်ဝစေမည့် ကော်ဖီနှင့် မနက်စာကောင်းများ",
    defaultDescEn: "Kickstart your week with energizing coffee and breakfast favorites",
    defaultDescTh: "กาแฟสดและอาหารเช้าเพิ่มพลังรับวันทำงาน",
    icon: Coffee,
    color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
  },
  {
    id: "RAINY_DAY",
    label: "Rainy Day Warmup",
    labelMm: "မိုးအေးအေးနဲ့ ပူပူစပ်စပ်",
    labelTh: "เมนูอุ่นๆ วันฝนพรำ",
    desc: "Hot soup, spicy noodles & comfort food",
    defaultDescMm: "မိုးအေးတဲ့နေ့မှာ ပူပူနွေးနွေး သောက်ရမယ့် ဟင်းရည်နှင့် အစပ်ဟင်းလျာများ",
    defaultDescEn: "Warm soups, spicy bowls and comfort meals for rainy weather",
    defaultDescTh: "ซุปร้อนๆ และต้มยำรสแซ่บคลายหนาววันฝนตก",
    icon: CloudRain,
    color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800",
  },
  {
    id: "WEEKEND_FEAST",
    label: "Weekend Feast",
    labelMm: "စနေ/တနင်္ဂနွေ အဝစား",
    labelTh: "ปาร์ตี้วันหยุดสุดสัปดาห์",
    desc: "Family platters, BBQ, hotpot & party sets",
    defaultDescMm: "ပိတ်ရက်မှာ မိသားစု၊ သူငယ်ချင်းများနှင့် အတူစားရန် အထူးပွဲတော်ဟင်းများ",
    defaultDescEn: "Hearty family combos, BBQ and weekend gathering specials",
    defaultDescTh: "เซตอาหารจานใหญ่สำหรับครอบครัวและเพื่อนฝูงวันหยุด",
    icon: PartyPopper,
    color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
  },
  {
    id: "BUDGET_FRIENDLY",
    label: "Budget Friendly",
    labelMm: "ဘတ် ၁၀၀ အောက် အလန်းတွေ",
    labelTh: "อร่อยคุ้ม ต่ำกว่า 100 บาท",
    desc: "Delicious meals under 100 THB",
    defaultDescMm: "အိတ်ကပ်မပေါက်ဘဲ အရသာရှိရှိ စားနိုင်မည့် တန်ဖိုးသင့် ဟင်းလျာများ",
    defaultDescEn: "Delicious everyday meals and snacks under 100 THB",
    defaultDescTh: "เมนูอร่อยประหยัดกระเป๋า ราคาสบายๆ ไม่เกิน 100 บาท",
    icon: Coins,
    color: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800",
  },
  {
    id: "LATE_NIGHT",
    label: "Late Night",
    labelMm: "ညဘက် ဗိုက်ဆာရင်",
    labelTh: "หิวดึกจัดเต็ม",
    desc: "Midnight cravings & comfort supper",
    defaultDescMm: "ညဉ့်နက်ချိန် အဆာပြေနှင့် ညစာကောင်းများ",
    defaultDescEn: "Midnight supper and late night comfort food open right now",
    defaultDescTh: "เมนูรอบดึก คลายหิวกลางดึกส่งตรงถึงบ้าน",
    icon: Moon,
    color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
  },
  {
    id: "CUSTOM",
    label: "Custom Topic",
    labelMm: "စိတ်ကြိုက် ခေါင်းစဉ်",
    labelTh: "เมนูแนะนำวันนี้",
    desc: "Type your own specific food theme",
    defaultDescMm: "အနီးအနား ၁၅ ကီလိုမီတာအတွင်း ရွေးချယ်ထားသော စားကောင်းသောက်ဖွယ်များ",
    defaultDescEn: "Curated selection of food specials within 15 km",
    defaultDescTh: "เมนูคัดสรรพิเศษในระยะ 15 กม. สำหรับคุณวันนี้",
    icon: Pencil,
    color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
  },
];

export function AiCollectionModal({
  open,
  onOpenChange,
  onSuccess,
}: AiCollectionModalProps) {
  const [selectedMode, setSelectedMode] = useState<string>("GOOD_CHOICE");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [radiusKm, setRadiusKm] = useState<number>(15);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Generated results (Myanmar, English, Thai)
  const [generatedTitleMm, setGeneratedTitleMm] = useState<string>("");
  const [generatedTitleEn, setGeneratedTitleEn] = useState<string>("");
  const [generatedTitleTh, setGeneratedTitleTh] = useState<string>("");

  const [generatedDescMm, setGeneratedDescMm] = useState<string>("");
  const [generatedDescEn, setGeneratedDescEn] = useState<string>("");
  const [generatedDescTh, setGeneratedDescTh] = useState<string>("");

  const [primaryTitleLang, setPrimaryTitleLang] = useState<
    "mm" | "en" | "th" | "dual"
  >("mm");

  const [generatedItems, setGeneratedItems] = useState<
    AiGeneratedCollectionItem[]
  >([]);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const modeConfig = MODES.find((m) => m.id === selectedMode) || MODES[1];

    try {
      const response = await CollectionService.aiGenerate({
        mode: selectedMode,
        customTopic: selectedMode === "CUSTOM" ? customTopic.trim() : undefined,
        radiusKm,
        limit: 12,
      });

      const resData = (response as any)?.data || response;

      // Title Guarantee: For standard modes, ALWAYS lock to the official mode hook title!
      // Only for CUSTOM mode do we adopt the AI-generated custom title.
      if (selectedMode !== "CUSTOM") {
        setGeneratedTitleMm(modeConfig.labelMm);
        setGeneratedTitleEn(modeConfig.label);
        setGeneratedTitleTh(modeConfig.labelTh);
      } else {
        setGeneratedTitleMm(
          resData?.titleMm || resData?.title || modeConfig.labelMm,
        );
        setGeneratedTitleEn(resData?.titleEn || modeConfig.label);
        setGeneratedTitleTh(resData?.titleTh || modeConfig.labelTh);
      }

      const descMm =
        resData?.descriptionMm ||
        resData?.description ||
        modeConfig.defaultDescMm;
      const descEn = resData?.descriptionEn || modeConfig.defaultDescEn;
      const descTh = resData?.descriptionTh || modeConfig.defaultDescTh;

      setGeneratedDescMm(descMm);
      setGeneratedDescEn(descEn);
      setGeneratedDescTh(descTh);

      setGeneratedItems(resData?.items || []);
      setHasGenerated(true);
      toast.success("AI collection generated in 3 languages (MM, EN, TH)!");
    } catch (err: unknown) {
      // Guaranteed instant fallback with matching preset titles
      setGeneratedTitleMm(modeConfig.labelMm);
      setGeneratedTitleEn(modeConfig.label);
      setGeneratedTitleTh(modeConfig.labelTh);
      setGeneratedDescMm(modeConfig.defaultDescMm);
      setGeneratedDescEn(modeConfig.defaultDescEn);
      setGeneratedDescTh(modeConfig.defaultDescTh);
      setHasGenerated(true);

      const msg = err instanceof Error ? err.message : String(err);
      toast.info(`Generated with fallback presets (${msg})`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveItem = (id: number) => {
    setGeneratedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const getFinalTitle = () => {
    if (primaryTitleLang === "en") {
      return generatedTitleEn.trim() || generatedTitleMm.trim();
    }
    if (primaryTitleLang === "th") {
      return generatedTitleTh.trim() || generatedTitleMm.trim();
    }
    if (primaryTitleLang === "dual") {
      return generatedTitleEn.trim()
        ? `${generatedTitleMm.trim()} (${generatedTitleEn.trim()})`
        : generatedTitleMm.trim();
    }
    return (
      generatedTitleMm.trim() ||
      generatedTitleEn.trim() ||
      generatedTitleTh.trim()
    );
  };

  const getFinalDesc = () => {
    if (primaryTitleLang === "en") {
      return generatedDescEn.trim() || generatedDescMm.trim();
    }
    if (primaryTitleLang === "th") {
      return generatedDescTh.trim() || generatedDescMm.trim();
    }
    return (
      generatedDescMm.trim() ||
      generatedDescEn.trim() ||
      generatedDescTh.trim()
    );
  };

  const handlePublish = async () => {
    const finalTitle = getFinalTitle();
    if (!finalTitle) {
      toast.error("Please provide at least one collection title.");
      return;
    }

    if (generatedItems.length === 0) {
      toast.error("Collection must contain at least one item.");
      return;
    }

    setIsPublishing(true);
    try {
      await CollectionService.createCollection({
        name: finalTitle,
        nameEn: generatedTitleEn.trim() || undefined,
        nameMm: generatedTitleMm.trim() || undefined,
        nameTh: generatedTitleTh.trim() || undefined,
        description: getFinalDesc() || undefined,
        descriptionEn: generatedDescEn.trim() || undefined,
        descriptionMm: generatedDescMm.trim() || undefined,
        descriptionTh: generatedDescTh.trim() || undefined,
        status: "ACTIVE",
        menuItemIds: generatedItems.map((item) => item.id),
      });

      toast.success(
        `"${finalTitle}" created & published to MyTogether app!`,
      );
      onSuccess();
      onOpenChange(false);
      resetState();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || "Failed to publish collection");
    } finally {
      setIsPublishing(false);
    }
  };

  const resetState = () => {
    setHasGenerated(false);
    setGeneratedTitleMm("");
    setGeneratedTitleEn("");
    setGeneratedTitleTh("");
    setGeneratedDescMm("");
    setGeneratedDescEn("");
    setGeneratedDescTh("");
    setGeneratedItems([]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetState();
      }}
    >
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-background border border-border shadow-2xl">
        {/* Header with MyTogether Primary Gradient Theme */}
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-border bg-gradient-to-r from-rose-500/10 via-background to-orange-500/10 dark:from-rose-950/30 dark:via-zinc-900/60 dark:to-orange-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#ED3973] to-[#F96232] text-white shadow-md shadow-rose-500/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground dark:text-zinc-100">
                Auto-Generate Collection with AI
                <Badge
                  variant="secondary"
                  className="bg-gradient-to-r from-rose-500/15 to-orange-500/15 text-rose-700 dark:text-rose-300 text-xs font-semibold border-rose-200 dark:border-rose-900"
                >
                  Gemini 1.5 Flash · $0 Cost
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-sm mt-0.5 text-muted-foreground dark:text-zinc-400">
                Curates matching menu items within {radiusKm} km with
                authentic Myanmar hook title, English & Thai.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4 overflow-y-auto">
          {!hasGenerated ? (
            <div className="space-y-6">
              {/* Mode Selection */}
              <div>
                <Label className="text-sm font-semibold mb-3 block text-foreground dark:text-zinc-100">
                  1. Select Collection Theme / Mode
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {MODES.map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = selectedMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setSelectedMode(mode.id)}
                        className={`text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-[#ED3973] bg-gradient-to-br from-rose-500/10 to-orange-500/5 dark:from-rose-950/40 dark:to-orange-950/20 shadow-sm shadow-rose-200/50 dark:shadow-none"
                            : "border-border bg-card hover:bg-muted/50 dark:hover:bg-zinc-800/60"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <span
                            className={`p-2 rounded-lg border text-sm ${mode.color}`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="h-5 w-5 text-[#ED3973]" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground dark:text-zinc-100 text-sm">
                            {mode.label}
                          </div>
                          <div className="text-xs font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#ED3973] to-[#F96232] mt-0.5 font-sans font-semibold">
                            {mode.labelMm}
                          </div>
                          <div className="text-[11px] text-muted-foreground dark:text-zinc-400 mt-1 line-clamp-1">
                            {mode.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Topic Input if Custom selected */}
              {selectedMode === "CUSTOM" && (
                <div className="p-4 bg-gradient-to-br from-rose-500/10 to-orange-500/5 dark:from-rose-950/30 dark:to-orange-950/20 rounded-xl border border-rose-200 dark:border-rose-900 animate-in fade-in">
                  <Label
                    htmlFor="customTopic"
                    className="text-xs font-semibold text-rose-900 dark:text-rose-200"
                  >
                    Custom Topic / Food Theme:
                  </Label>
                  <Input
                    id="customTopic"
                    placeholder="e.g. မနက်ခင်း ကော်ဖီနှင့် မုန့်ဟင်းခါး (Morning coffee & light meals)"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    className="mt-1.5 bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 border-rose-200 dark:border-zinc-800 focus-visible:ring-[#ED3973]"
                  />
                </div>
              )}

              {/* Radius & Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border bg-muted/30 dark:bg-zinc-900/50">
                <div>
                  <Label className="text-xs font-semibold text-foreground dark:text-zinc-200 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#ED3973]" />
                    Nearby Radius Scope:
                  </Label>
                  <div className="flex gap-2 mt-2">
                    {[10, 15, 20, 30].map((km) => (
                      <Button
                        key={km}
                        type="button"
                        size="sm"
                        variant={radiusKm === km ? "default" : "outline"}
                        className={
                          radiusKm === km
                            ? "bg-gradient-to-r from-[#ED3973] to-[#F96232] text-white font-semibold shadow-sm"
                            : "bg-card text-foreground border-border hover:bg-muted dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                        }
                        onClick={() => setRadiusKm(km)}
                      >
                        {km} km
                      </Button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground dark:text-zinc-400 mt-1.5">
                    Filters open & published shops within {radiusKm} km of
                    center.
                  </p>
                </div>

                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground dark:text-zinc-200">
                    <Sparkles className="h-4 w-4 text-[#ED3973]" />
                    Thematic + Free Gemini 1.5 Flash:
                  </div>
                  <p className="text-[11px] text-muted-foreground dark:text-zinc-400 mt-1">
                    Strict mode filtering & ranking + Gemini Flash structured
                    curation. 100% $0 API cost.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Results & Review Step */
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-medium"
                  >
                    AI Generated Preview
                  </Badge>
                  <span className="text-xs text-muted-foreground dark:text-zinc-400">
                    {generatedItems.length} curated items within {radiusKm} km
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="text-[#ED3973] hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 mr-1.5 ${isGenerating ? "animate-spin" : ""}`}
                  />
                  Regenerate
                </Button>
              </div>

              {/* 3-Language Titles Section with MyTogether Gradient Accent */}
              <div className="space-y-4 p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-gradient-to-br from-rose-500/5 via-background to-orange-500/5 dark:from-rose-950/20 dark:via-zinc-900/40 dark:to-orange-950/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-rose-100 dark:border-rose-900/50">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground dark:text-zinc-100">
                    <Sparkles className="h-4 w-4 text-[#ED3973]" />
                    Collection Titles (Myanmar Hook, English & Thai)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground dark:text-zinc-400 font-medium">
                      App Primary Title:
                    </span>
                    <select
                      value={primaryTitleLang}
                      onChange={(e) =>
                        setPrimaryTitleLang(
                          e.target.value as "mm" | "en" | "th" | "dual",
                        )
                      }
                      aria-label="App Primary Title Language"
                      className="text-xs bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 border border-rose-300 dark:border-zinc-700 rounded-md px-2.5 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-[#ED3973] shadow-sm"
                    >
                      <option value="mm">🇲🇲 Myanmar Hook (Default)</option>
                      <option value="en">🇬🇧 English</option>
                      <option value="th">🇹🇭 Thai (ภาษาไทย)</option>
                      <option value="dual">🇲🇲 + 🇬🇧 Dual Language</option>
                    </select>
                  </div>
                </div>

                {/* 3 Title Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Myanmar Hook Title */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="titleMm"
                        className="text-xs font-semibold text-foreground dark:text-zinc-200"
                      >
                        🇲🇲 Myanmar (Hook)
                      </Label>
                      {primaryTitleLang === "mm" && (
                        <Badge className="bg-gradient-to-r from-[#ED3973] to-[#F96232] text-white hover:opacity-95 text-[10px] px-1.5 py-0 h-4 border-0">
                          App Header
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="titleMm"
                      value={generatedTitleMm}
                      onChange={(e) => setGeneratedTitleMm(e.target.value)}
                      className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 border-rose-200 dark:border-zinc-800 focus-visible:ring-[#ED3973] font-medium text-sm"
                      placeholder="e.g. အခုချက်ချင်း စားမယ်"
                    />
                    <span className="text-[10px] text-muted-foreground dark:text-zinc-400 block">
                      Informal, punchy mobile hook
                    </span>
                  </div>

                  {/* English Title */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="titleEn"
                        className="text-xs font-semibold text-foreground dark:text-zinc-200"
                      >
                        🇬🇧 English
                      </Label>
                      {primaryTitleLang === "en" && (
                        <Badge className="bg-gradient-to-r from-[#ED3973] to-[#F96232] text-white hover:opacity-95 text-[10px] px-1.5 py-0 h-4 border-0">
                          App Header
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="titleEn"
                      value={generatedTitleEn}
                      onChange={(e) => setGeneratedTitleEn(e.target.value)}
                      className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 border-rose-200 dark:border-zinc-800 focus-visible:ring-[#ED3973] font-medium text-sm"
                      placeholder="e.g. Eat Now & Fast Delivery"
                    />
                    <span className="text-[10px] text-muted-foreground dark:text-zinc-400 block">
                      Catchy & engaging
                    </span>
                  </div>

                  {/* Thai Title */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="titleTh"
                        className="text-xs font-semibold text-foreground dark:text-zinc-200"
                      >
                        🇹🇭 Thai (ภาษาไทย)
                      </Label>
                      {primaryTitleLang === "th" && (
                        <Badge className="bg-gradient-to-r from-[#ED3973] to-[#F96232] text-white hover:opacity-95 text-[10px] px-1.5 py-0 h-4 border-0">
                          App Header
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="titleTh"
                      value={generatedTitleTh}
                      onChange={(e) => setGeneratedTitleTh(e.target.value)}
                      className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 border-rose-200 dark:border-zinc-800 focus-visible:ring-[#ED3973] font-medium text-sm"
                      placeholder="e.g. กินเลย อร่อยด่วน"
                    />
                    <span className="text-[10px] text-muted-foreground dark:text-zinc-400 block">
                      Natural Thai phrasing
                    </span>
                  </div>
                </div>

                {/* 3 Description Textareas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-rose-100 dark:border-rose-900/50">
                  <div className="space-y-1">
                    <Label
                      htmlFor="descMm"
                      className="text-[11px] font-medium text-muted-foreground dark:text-zinc-300"
                    >
                      🇲🇲 Description (MM):
                    </Label>
                    <Textarea
                      id="descMm"
                      rows={2}
                      value={generatedDescMm}
                      onChange={(e) => setGeneratedDescMm(e.target.value)}
                      className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 border-rose-200 dark:border-zinc-800 focus-visible:ring-[#ED3973] text-xs"
                      placeholder="မြန်မာ ဖော်ပြချက်..."
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="descEn"
                      className="text-[11px] font-medium text-muted-foreground dark:text-zinc-300"
                    >
                      🇬🇧 Description (EN):
                    </Label>
                    <Textarea
                      id="descEn"
                      rows={2}
                      value={generatedDescEn}
                      onChange={(e) => setGeneratedDescEn(e.target.value)}
                      className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 border-rose-200 dark:border-zinc-800 focus-visible:ring-[#ED3973] text-xs"
                      placeholder="English description..."
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="descTh"
                      className="text-[11px] font-medium text-muted-foreground dark:text-zinc-300"
                    >
                      🇹🇭 Description (TH):
                    </Label>
                    <Textarea
                      id="descTh"
                      rows={2}
                      value={generatedDescTh}
                      onChange={(e) => setGeneratedDescTh(e.target.value)}
                      className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 border-rose-200 dark:border-zinc-800 focus-visible:ring-[#ED3973] text-xs"
                      placeholder="คำอธิบายภาษาไทย..."
                    />
                  </div>
                </div>
              </div>

              {/* Menu Items Grid */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-zinc-200">
                    Curated Menu Items ({generatedItems.length})
                  </Label>
                  <span className="text-[11px] text-muted-foreground dark:text-zinc-400">
                    Click ✕ on any item to remove it
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {generatedItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card dark:bg-zinc-900/90 hover:shadow-sm hover:border-[#ED3973] dark:hover:border-[#ED3973] transition-all"
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.nameEn}
                          className="h-12 w-12 rounded-lg object-cover shrink-0 border border-border"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted dark:bg-zinc-800 flex items-center justify-center text-xs text-muted-foreground shrink-0">
                          No Pic
                        </div>
                      )}

                      <div className="flex-1 min-w-0 pr-6">
                        <div className="text-xs font-semibold text-foreground dark:text-zinc-100 truncate">
                          {item.nameMm || item.nameEn}
                        </div>
                        <div className="text-[10px] text-muted-foreground dark:text-zinc-400 truncate">
                          {[item.nameEn, item.nameTh].filter(Boolean).join(" · ")}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            ฿{item.price ?? 0}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground dark:text-zinc-400 truncate text-[10px]">
                            {item.shopName}
                          </span>
                          {item.distanceKm !== undefined && (
                            <span className="text-[10px] text-[#ED3973] font-medium">
                              ({item.distanceKm}km)
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="absolute right-2 top-2 p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors"
                        title="Remove item"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 dark:bg-zinc-900/60 flex items-center justify-between">
          {!hasGenerated ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-gradient-to-r from-[#ED3973] to-[#F96232] hover:opacity-95 text-white font-semibold shadow-md shadow-rose-500/25"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Collection
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setHasGenerated(false)}
              >
                Back to Options
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing || generatedItems.length === 0}
                  className="bg-gradient-to-r from-[#ED3973] to-[#F96232] hover:opacity-95 text-white font-semibold shadow-md shadow-rose-500/25"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing to App...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Publish to MyTogether App
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AiCollectionModal;
