import React, { useState } from "react";
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
    desc: "Quick delivery & instant hunger relief",
    icon: Flame,
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    id: "GOOD_CHOICE",
    label: "Good Choice",
    labelMm: "ရွေးချယ်မှု ကောင်း",
    desc: "Top-rated crowd favorites & bestsellers",
    icon: Star,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  {
    id: "HAPPY_MONDAY",
    label: "Happy Monday",
    labelMm: "တနင်္လာ အားဖြည့်စရာ",
    desc: "Energizing coffee, hearty noodles & breakfast",
    icon: Coffee,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    id: "RAINY_DAY",
    label: "Rainy Day Warmup",
    labelMm: "မိုးအေးအေးနဲ့ ပူပူစပ်စပ်",
    desc: "Hot soup, spicy noodles & comfort food",
    icon: CloudRain,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
  },
  {
    id: "WEEKEND_FEAST",
    label: "Weekend Feast",
    labelMm: "စနေ/တနင်္ဂနွေ အဝစား",
    desc: "Family platters, BBQ, hotpot & party sets",
    icon: PartyPopper,
    color: "text-rose-600 bg-rose-50 border-rose-200",
  },
  {
    id: "BUDGET_FRIENDLY",
    label: "Budget Friendly",
    labelMm: "ဘတ် ၁၀၀ အောက် အလန်းတွေ",
    desc: "Delicious meals under 100 THB",
    icon: Coins,
    color: "text-teal-600 bg-teal-50 border-teal-200",
  },
  {
    id: "LATE_NIGHT",
    label: "Late Night",
    labelMm: "ညဘက် ဗိုက်ဆာရင်",
    desc: "Midnight cravings & comfort supper",
    icon: Moon,
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
  {
    id: "CUSTOM",
    label: "Custom Topic",
    labelMm: "စိတ်ကြိုက် ခေါင်းစဉ်",
    desc: "Type your own specific food theme",
    icon: Pencil,
    color: "text-violet-600 bg-violet-50 border-violet-200",
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

  // Generated results
  const [generatedTitle, setGeneratedTitle] = useState<string>("");
  const [generatedDesc, setGeneratedDesc] = useState<string>("");
  const [generatedItems, setGeneratedItems] = useState<
    AiGeneratedCollectionItem[]
  >([]);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await CollectionService.aiGenerate({
        mode: selectedMode,
        customTopic: selectedMode === "CUSTOM" ? customTopic.trim() : undefined,
        radiusKm,
        limit: 12,
      });

      setGeneratedTitle(response.title || "");
      setGeneratedDesc(response.description || "");
      setGeneratedItems(response.items || []);
      setHasGenerated(true);
      toast.success("AI collection generated successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate AI collection");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveItem = (id: number) => {
    setGeneratedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePublish = async () => {
    if (!generatedTitle.trim()) {
      toast.error("Please provide a collection title.");
      return;
    }

    if (generatedItems.length === 0) {
      toast.error("Collection must contain at least one item.");
      return;
    }

    setIsPublishing(true);
    try {
      await CollectionService.createCollection({
        name: generatedTitle.trim(),
        description: generatedDesc.trim(),
        status: "ACTIVE",
        menuItemIds: generatedItems.map((item) => item.id),
      });

      toast.success(
        `"${generatedTitle}" created & published to MyTogether app!`,
      );
      onSuccess();
      onOpenChange(false);
      resetState();
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish collection");
    } finally {
      setIsPublishing(false);
    }
  };

  const resetState = () => {
    setHasGenerated(false);
    setGeneratedTitle("");
    setGeneratedDesc("");
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
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 border-b bg-gradient-to-r from-purple-50 via-white to-pink-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Auto-Generate Collection with AI
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-purple-700 text-xs font-semibold border-purple-200"
                >
                  Gemini 1.5 Flash · 0 Cost
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-sm mt-0.5">
                Generates a punchy Myanmar hook title and curates nearby shop
                menu items within {radiusKm} km for your mobile app.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4 overflow-y-auto">
          {!hasGenerated ? (
            <div className="space-y-6">
              {/* Mode Selection */}
              <div>
                <Label className="text-sm font-semibold mb-3 block text-gray-800">
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
                            ? "border-purple-600 bg-purple-50/70 shadow-sm shadow-purple-100"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <span
                            className={`p-2 rounded-lg border text-sm ${mode.color}`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="h-5 w-5 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">
                            {mode.label}
                          </div>
                          <div className="text-xs font-medium text-purple-700 mt-0.5 font-sans">
                            {mode.labelMm}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-1 line-clamp-1">
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
                <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 animate-in fade-in">
                  <Label
                    htmlFor="customTopic"
                    className="text-xs font-semibold text-purple-900"
                  >
                    Custom Topic / Food Theme:
                  </Label>
                  <Input
                    id="customTopic"
                    placeholder="e.g. မနက်ခင်း ကော်ဖီနှင့် မုန့်ဟင်းခါး (Morning coffee & light meals)"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    className="mt-1.5 bg-white"
                  />
                </div>
              )}

              {/* Radius & Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border bg-gray-50/60">
                <div>
                  <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-purple-600" />
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
                            ? "bg-purple-600 hover:bg-purple-700 text-white font-medium"
                            : "bg-white text-gray-700"
                        }
                        onClick={() => setRadiusKm(km)}
                      >
                        {km} km
                      </Button>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    Filters open & published shops within {radiusKm} km of
                    Bangkok center.
                  </p>
                </div>

                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Zero-Cost AI Architecture:
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1">
                    Uses Google Gemini 1.5 Flash Free Tier with candidate
                    filtering and instant fallback. 100% \$0 API cost.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Results & Review Step */
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-300 font-medium"
                  >
                    AI Generated Preview
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {generatedItems.length} items suggested within {radiusKm} km
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="text-purple-700 hover:bg-purple-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 mr-1.5 ${isGenerating ? "animate-spin" : ""}`}
                  />
                  Regenerate
                </Button>
              </div>

              {/* Title & Description Edit Fields */}
              <div className="space-y-3 p-4 rounded-xl border bg-purple-50/40 border-purple-200">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label
                      htmlFor="title"
                      className="text-xs font-bold text-purple-900 flex items-center gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                      App Collection Title (Myanmar Hook):
                    </Label>
                    <span className="text-[11px] text-purple-600 font-medium">
                      Informal, short & punchy
                    </span>
                  </div>
                  <Input
                    id="title"
                    value={generatedTitle}
                    onChange={(e) => setGeneratedTitle(e.target.value)}
                    className="bg-white font-semibold text-base border-purple-300 focus-visible:ring-purple-500"
                    placeholder="e.g. တနင်္လာ အားဖြည့်စရာ"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="desc"
                    className="text-xs font-semibold text-gray-700 block mb-1"
                  >
                    Description:
                  </Label>
                  <Textarea
                    id="desc"
                    rows={2}
                    value={generatedDesc}
                    onChange={(e) => setGeneratedDesc(e.target.value)}
                    className="bg-white text-xs border-purple-200"
                    placeholder="Short description..."
                  />
                </div>
              </div>

              {/* Menu Items Grid */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Curated Menu Items ({generatedItems.length})
                  </Label>
                  <span className="text-[11px] text-gray-500">
                    Click ✕ on any item to remove it
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {generatedItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative flex items-center gap-3 p-2.5 rounded-lg border bg-white hover:shadow-sm transition-all"
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.nameEn}
                          className="h-12 w-12 rounded-lg object-cover shrink-0 border"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400 shrink-0">
                          No Pic
                        </div>
                      )}

                      <div className="flex-1 min-w-0 pr-6">
                        <div className="text-xs font-semibold text-gray-900 truncate">
                          {item.nameMm || item.nameEn}
                        </div>
                        {item.nameMm && (
                          <div className="text-[10px] text-gray-500 truncate">
                            {item.nameEn}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                          <span className="font-bold text-emerald-600">
                            ฿{item.price ?? 0}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500 truncate text-[10px]">
                            {item.shopName}
                          </span>
                          {item.distanceKm !== undefined && (
                            <span className="text-[10px] text-purple-600 font-medium">
                              ({item.distanceKm}km)
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="absolute right-2 top-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
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

        <DialogFooter className="px-6 py-4 border-t bg-gray-50/80 flex sm:justify-between items-center gap-2">
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
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-md shadow-purple-200"
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-200"
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

