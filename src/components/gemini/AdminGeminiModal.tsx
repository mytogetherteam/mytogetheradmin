import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Send,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  TrendingUp,
  Store,
  Bike,
  ClipboardList,
} from "lucide-react";
import {
  adminAiService,
  ChatHistoryItem,
  TodayPlatformSnapshot,
} from "@/services/adminAiService";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  isRecap?: boolean;
}

interface AdminGeminiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_SUGGESTIONS = [
  "📊 ယနေ့ အော်ဒါအခြေအနေ အနှစ်ချုပ်",
  "⚠️ Cancel အများဆုံးဖြစ်တဲ့ ဆိုင်များ",
  "🛵 လမ်းပေါ်တွင် အော်ဒါပို့နေသော Driver များ",
  "🍜 လူကြိုက်အများဆုံး Menu ထိပ်တန်း ၅ ခု",
  "🔔 အတည်ပြုရန်ကျန် Menu Approvals များ",
];

export const AdminGeminiModal: React.FC<AdminGeminiModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecapLoading, setIsRecapLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<TodayPlatformSnapshot | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load Today's Recap when modal first opens
  useEffect(() => {
    if (open && messages.length === 0) {
      void fetchTodayRecap();
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isRecapLoading]);

  const fetchTodayRecap = async () => {
    setIsRecapLoading(true);
    try {
      const data = await adminAiService.getTodayRecap();
      if (!data) return;
      if (data.snapshot) {
        setSnapshot(data.snapshot);
      }

      const recapMsg: Message = {
        id: `recap-${Date.now()}`,
        role: "model",
        text: data.aiRecap || "ယနေ့အတွက် အနှစ်ချုပ် အချက်အလက်များကို စုစည်းထားပါသည်ခင်ဗျာ။",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isRecap: true,
      };

      setMessages([recapMsg]);
    } catch (err) {
      console.error("Failed to fetch today's recap:", err);
      toast.error("Today's recap ရယူရာတွင် အခက်အခဲရှိနေပါသည်");
    } finally {
      setIsRecapLoading(false);
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Prior turns only for history
    const history: ChatHistoryItem[] = messages
      .filter((m) => !m.isRecap)
      .slice(-6)
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await adminAiService.sendChatMessage(userMsg.text, history);

      const aiMsg: Message = {
        id: `model-${Date.now()}`,
        role: "model",
        text: res?.reply || "အချက်အလက်ကို ပြန်လည် စီစစ်နေပါသည်ခင်ဗျာ။",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (res?.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions);
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: "model",
        text: "တောင်းပန်ပါတယ်ခင်ဗျာ။ အချက်အလက် ခေတ္တ ချိတ်ဆက်မရဖြစ်နေသဖြင့် ခေတ္တစောင့်ဆိုင်းပြီးမှ ပြန်လည် မေးမြန်းပေးပါရန် မေတ္တာရပ်ခံအပ်ပါသည်။ 🙏",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([]);
    setSuggestions(DEFAULT_SUGGESTIONS);
    void fetchTodayRecap();
  };

  // Simple Markdown-like renderer for bullet points, bold text, and headers
  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let formatted = line;

      // Header handling
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-semibold text-base mt-2 mb-1 text-primary">
            {line.replace("### ", "")}
          </h4>
        );
      }

      // Bold text handling **text**
      const parts = formatted.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={idx} className={line.trim() === "" ? "h-2" : "leading-relaxed my-0.5"}>
          {parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pIdx} className="font-semibold text-foreground">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </div>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] p-0 flex flex-col gap-0 overflow-hidden border-border bg-background shadow-2xl">
        {/* Modal Header */}
        <DialogHeader className="p-4 border-b bg-muted/30 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                Gemini AI Assistant
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
                  ● Live DB Brain
                </Badge>
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                MyTogether Platform Intelligence • Zero AI Cost
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pr-6">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Refresh Today's Recap"
              onClick={fetchTodayRecap}
              disabled={isRecapLoading || isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isRecapLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Clear Chat History"
              onClick={handleClear}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Message Container */}
        <ScrollArea className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Today's Quick KPI Mini Tiles if snapshot exists */}
            {snapshot && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                <div className="bg-muted/40 border rounded-lg p-2.5 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-500 shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Today Orders</div>
                    <div className="text-sm font-bold">{snapshot.orders.totalOrdersToday}</div>
                  </div>
                </div>
                <div className="bg-muted/40 border rounded-lg p-2.5 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Delivered</div>
                    <div className="text-sm font-bold">{snapshot.orders.deliveredCount}</div>
                  </div>
                </div>
                <div className="bg-muted/40 border rounded-lg p-2.5 flex items-center gap-2">
                  <Store className="w-4 h-4 text-purple-500 shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Open Shops</div>
                    <div className="text-sm font-bold">{snapshot.shops.openShops}</div>
                  </div>
                </div>
                <div className="bg-muted/40 border rounded-lg p-2.5 flex items-center gap-2">
                  <Bike className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Active Drivers</div>
                    <div className="text-sm font-bold">{snapshot.drivers.activeDrivers}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Recap Loading Skeleton */}
            {isRecapLoading && (
              <div className="flex gap-3 items-start bg-muted/30 p-4 rounded-xl border animate-pulse">
                <Bot className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted-foreground/20 rounded w-1/3"></div>
                  <div className="h-3 bg-muted-foreground/15 rounded w-full"></div>
                  <div className="h-3 bg-muted-foreground/15 rounded w-5/6"></div>
                  <div className="h-3 bg-muted-foreground/15 rounded w-2/3"></div>
                </div>
              </div>
            )}

            {/* Message Bubbles */}
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 items-start ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-sm"
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`group relative max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      isUser
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted/60 border border-border text-foreground rounded-tl-none"
                    }`}
                  >
                    {m.isRecap && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-2 pb-1.5 border-b border-border/40">
                        <Sparkles className="w-3.5 h-3.5" />
                        Today's Platform Intelligence Recap
                      </div>
                    )}

                    <div className="space-y-1">{renderFormattedText(m.text)}</div>

                    <div
                      className={`flex items-center justify-between gap-2 mt-2 pt-1.5 text-[10px] ${
                        isUser ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      <span>{m.timestamp}</span>
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopy(m.id, m.text)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-foreground"
                          title="Copy reply"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* AI Thinking Animation */}
            {isLoading && (
              <div className="flex gap-3 items-center text-xs text-muted-foreground py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-muted/40 border rounded-2xl px-4 py-2.5 flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                  <span>Gemini is reading database & thinking...</span>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 bg-muted/20 border-t flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-muted-foreground font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" /> Suggestions:
          </span>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => void handleSend(s)}
              className="text-xs bg-background hover:bg-muted text-foreground border rounded-full px-3 py-1 shrink-0 transition-colors cursor-pointer hover:border-primary/50 shadow-sm"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t bg-background">
          <div className="flex items-center gap-2 max-w-2xl mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="မေးလိုရာကို မြန်မာလို သို့မဟုတ် အင်္ဂလိပ်လို ရိုက်ထည့်ပါ... (Enter နှိပ်ပါ)"
              className="flex-1 bg-muted/40 border border-input rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <Button
              type="button"
              onClick={() => void handleSend()}
              disabled={!input.trim() || isLoading}
              className="rounded-xl px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md shadow-purple-500/20 shrink-0"
            >
              <Send className="w-4 h-4 mr-1" /> Send
            </Button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            💡 Powered by Google Gemini Pro/Flash • Memory & Live Operations Grounding Active
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
