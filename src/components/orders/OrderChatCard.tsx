import { useState, useRef, useEffect, useMemo } from "react";
import { Order, ChatAttachment } from "@/services/orderService";
import { useOrderChat, useSendOrderChatMessageMutation } from "@/hooks/orders/useOrders";
import { parseCallChat, describeCallChat } from "@/lib/callChat";
import { useOrderChatSocket } from "@/hooks/orders/useOrderChatSocket";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
    MessageSquare,
    Send,
    Image as ImageIcon,
    RefreshCw,
    User as UserIcon,
    Store,
    Check,
    CheckCheck,
    Volume2,
    Play,
    Pause,
    X,
    Sparkles,
    AlertCircle,
    Mic,
    Phone,
    PhoneMissed,
} from "lucide-react";

interface OrderChatCardProps {
    order: Order;
}

function formatChatTime(dateString?: string) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

function formatChatDate(dateString?: string) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const today = new Date();
    const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

    if (isToday) return "Today";

    return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
}

function formatSeconds(sec?: number | null) {
    if (!sec || isNaN(sec) || !isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
}

/** Check if attachment is an audio/voice note. */
function isVoiceAttachment(att: ChatAttachment): boolean {
    const typeStr = String(att.type || "").toUpperCase();
    const mime = String(att.mimeType || "").toLowerCase();
    const url = String(att.url || "").toLowerCase();
    return (
        typeStr === "VOICE" ||
        typeStr === "AUDIO" ||
        mime.startsWith("audio/") ||
        mime === "video/mp4" ||
        url.endsWith(".m4a") ||
        url.endsWith(".mp3") ||
        url.endsWith(".aac") ||
        url.endsWith(".wav") ||
        url.endsWith(".ogg")
    );
}

/** Check if attachment is an image. */
function isImageAttachment(att: ChatAttachment): boolean {
    const typeStr = String(att.type || "").toUpperCase();
    const mime = String(att.mimeType || "").toLowerCase();
    return typeStr === "IMAGE" || mime.startsWith("image/");
}

/** Interactive voice message player with seeking, time display, and waveform effect. */
function AudioPlayer({
    url,
    duration,
    isOutgoing,
}: {
    url: string;
    duration?: number | null;
    isOutgoing?: boolean;
}) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progressBarRef = useRef<HTMLDivElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState<number>(duration || 0);
    const [hasError, setHasError] = useState(false);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current
                .play()
                .then(() => setIsPlaying(true))
                .catch((err) => {
                    console.warn("Audio play error, falling back:", err);
                    setHasError(true);
                });
        }
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        setCurrentTime(audioRef.current.currentTime);
        if (audioRef.current.duration && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
            setTotalDuration(audioRef.current.duration);
        }
    };

    const handleLoadedMetadata = () => {
        if (!audioRef.current) return;
        if (audioRef.current.duration && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
            setTotalDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current || !audioRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, clickX / rect.width));
        const total = totalDuration || audioRef.current.duration || 1;
        audioRef.current.currentTime = percent * total;
        setCurrentTime(percent * total);
    };

    const progressPercent = totalDuration > 0 ? Math.min(100, (currentTime / totalDuration) * 100) : 0;

    if (hasError) {
        return (
            <div className={`p-2 rounded-xl text-xs flex items-center gap-2 ${
                isOutgoing ? "bg-white/20 text-white" : "bg-muted/70 text-muted-foreground"
            }`}>
                <Volume2 className="h-4 w-4 shrink-0" />
                <audio controls src={url} className="h-8 max-w-full" preload="metadata" />
            </div>
        );
    }

    return (
        <div
            className={`flex items-center gap-2.5 p-2 px-3 rounded-xl max-w-xs transition-colors ${
                isOutgoing
                    ? "bg-white/15 hover:bg-white/20 border border-white/25 text-white"
                    : "bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-700/60 dark:hover:bg-zinc-700 border border-border/50 text-foreground"
            }`}
        >
            <audio
                ref={audioRef}
                src={url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                onError={() => setHasError(true)}
                preload="metadata"
            />
            <button
                type="button"
                onClick={togglePlay}
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95 ${
                    isOutgoing
                        ? "bg-white text-pink-600 hover:bg-white/90"
                        : "bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:opacity-90"
                }`}
                aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
            >
                {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
            </button>

            <div className="flex-1 min-w-[130px] space-y-1">
                {/* Seekable Progress Bar */}
                <div
                    ref={progressBarRef}
                    onClick={handleProgressClick}
                    className={`w-full h-2 rounded-full overflow-hidden cursor-pointer relative group ${
                        isOutgoing ? "bg-white/30" : "bg-muted-foreground/20"
                    }`}
                    title="Click to seek"
                >
                    <div
                        className={`h-full transition-all duration-100 rounded-full ${
                            isOutgoing ? "bg-white" : "bg-gradient-to-r from-pink-500 to-orange-500"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <div
                    className={`flex justify-between items-center text-[10px] font-medium ${
                        isOutgoing ? "text-white/90" : "text-muted-foreground"
                    }`}
                >
                    <span className="flex items-center gap-1">
                        <Mic className="h-3 w-3" /> Voice Note
                    </span>
                    <span>
                        {isPlaying || currentTime > 0
                            ? `${formatSeconds(currentTime)} / ${formatSeconds(totalDuration)}`
                            : formatSeconds(totalDuration)}
                    </span>
                </div>
            </div>
        </div>
    );
}

export function OrderChatCard({ order }: OrderChatCardProps) {
    const {
        data: chatData,
        isLoading,
        isRefetching,
        refetch,
    } = useOrderChat(order.id, order.shopId);

    const { connected: isWsConnected } = useOrderChatSocket(order.id, order.shopId);

    const sendMutation = useSendOrderChatMessageMutation(order.id, order.shopId);

    const [messageText, setMessageText] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const messages = chatData?.messages ?? [];

    // Chronological order: oldest messages at top, latest messages at the very bottom (like Messenger)
    const sortedMessages = useMemo(() => {
        return [...messages].sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (timeA !== timeB) return timeA - timeB;
            return (a.id || 0) - (b.id || 0);
        });
    }, [messages]);

    // Auto-scroll to bottom like Messenger when messages load or a new message arrives
    useEffect(() => {
        if (sortedMessages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [sortedMessages.length]);

    // Initial scroll to bottom on mount
    useEffect(() => {
        if (!isLoading && sortedMessages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        }
    }, [isLoading]);

    // Handle file attachments preview
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const newFiles = Array.from(e.target.files);
        setSelectedFiles((prev) => [...prev, ...newFiles]);

        const newUrls = newFiles.map((file) => URL.createObjectURL(file));
        setFilePreviewUrls((prev) => [...prev, ...newUrls]);
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        setFilePreviewUrls((prev) => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = messageText.trim();
        if (!trimmed && selectedFiles.length === 0) return;

        try {
            await sendMutation.mutateAsync({
                content: trimmed || undefined,
                attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
            });
            setMessageText("");
            setSelectedFiles([]);
            filePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
            setFilePreviewUrls([]);
        } catch {
            // Error toast handled by mutation
        }
    };

    return (
        <>
            <Card className="border-border/60 shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500/15 to-orange-500/15 text-pink-600 dark:text-pink-400">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-base font-semibold">
                                        Order Message Chat
                                    </CardTitle>
                                    <span
                                        className="relative flex h-2 w-2"
                                        title={
                                            isWsConnected
                                                ? "Live WebSocket connected (instant updates)"
                                                : "Auto-refreshing (polling every 4s)"
                                        }
                                    >
                                        <span
                                            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                                                isWsConnected ? "bg-emerald-400" : "bg-amber-400"
                                            } opacity-75`}
                                        ></span>
                                        <span
                                            className={`relative inline-flex rounded-full h-2 w-2 ${
                                                isWsConnected ? "bg-emerald-500" : "bg-amber-500"
                                            }`}
                                        ></span>
                                    </span>
                                    {isWsConnected && (
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                                            Live
                                        </span>
                                    )}
                                </div>
                                <CardDescription className="text-xs">
                                    Live conversation between customer ({order.userFullName || "Customer"}) and shop ({order.shopName})
                                </CardDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs font-medium">
                                {sortedMessages.length} {sortedMessages.length === 1 ? "message" : "messages"}
                            </Badge>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => refetch()}
                                title="Refresh chat messages"
                                disabled={isRefetching}
                            >
                                <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 flex flex-col">
                    {/* Chat Messages List (Latest at bottom like Messenger) */}
                    <div
                        ref={messagesContainerRef}
                        className="p-4 space-y-4 max-h-[460px] min-h-[260px] overflow-y-auto bg-slate-50/50 dark:bg-zinc-950/30 flex flex-col"
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-2">
                                <RefreshCw className="h-6 w-6 animate-spin text-pink-500" />
                                <p className="text-sm">Loading order messages...</p>
                            </div>
                        ) : sortedMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center my-auto">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-pink-500/15 to-orange-500/15 flex items-center justify-center mb-3">
                                    <Sparkles className="h-6 w-6 text-pink-500" />
                                </div>
                                <h4 className="text-sm font-semibold text-foreground">No Chat Messages Yet</h4>
                                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                                    Customer and shop have not sent any chat messages for this order yet. You can send a direct support update below.
                                </p>
                            </div>
                        ) : (
                            sortedMessages.map((msg, index) => {
                                // Strictly distinguish Admin / System from Customer and Shop
                                const isSystem =
                                    msg.senderType === "SYSTEM" ||
                                    msg.senderType === "ADMIN" ||
                                    Boolean(msg.senderAdminId && msg.senderType !== "SHOP" && msg.senderType !== "USER") ||
                                    Boolean(msg.senderAdmin && msg.senderType !== "SHOP" && msg.senderType !== "USER");

                                const isCustomer =
                                    !isSystem &&
                                    (msg.senderType === "USER" ||
                                        Boolean(msg.senderUserId && !msg.senderAdminId));

                                const isShop = !isCustomer && !isSystem;

                                const isAutomatedNotice =
                                    msg.type === "SYSTEM" &&
                                    !msg.senderAdmin &&
                                    !msg.senderAdminId &&
                                    (!msg.attachments || msg.attachments.length === 0);

                                const showDateDivider =
                                    index === 0 ||
                                    formatChatDate(msg.createdAt) !==
                                        formatChatDate(sortedMessages[index - 1]?.createdAt);

                                // Call outcome (missed / declined / ended 02:15 …) — centered pill like Messenger
                                const callEvent = parseCallChat(msg.content);
                                if (callEvent) {
                                    const desc = describeCallChat(callEvent);
                                    const missed = desc.tone === "missed";
                                    return (
                                        <div key={msg.id || index} className="space-y-2">
                                            {showDateDivider && (
                                                <div className="flex items-center justify-center my-2">
                                                    <span className="text-[10px] bg-muted px-2.5 py-0.5 rounded-full text-muted-foreground uppercase tracking-wider font-medium">
                                                        {formatChatDate(msg.createdAt)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-center">
                                                <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-100/80 dark:bg-zinc-800/70 backdrop-blur-md border border-slate-200/90 dark:border-zinc-700/70 shadow-sm">
                                                    <span
                                                        className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                                                            missed
                                                                ? "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400"
                                                                : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                                                        }`}
                                                    >
                                                        {missed ? <PhoneMissed className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
                                                    </span>
                                                    <div className="leading-tight">
                                                        <div className={`text-xs font-semibold ${missed ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                                                            {desc.title}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground">{desc.subtitle}</div>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground opacity-75 self-end">
                                                        {formatChatTime(msg.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                if (isAutomatedNotice) {
                                    return (
                                        <div key={msg.id || index} className="space-y-2">
                                            {showDateDivider && (
                                                <div className="flex items-center justify-center my-2">
                                                    <span className="text-[10px] bg-muted px-2.5 py-0.5 rounded-full text-muted-foreground uppercase tracking-wider font-medium">
                                                        {formatChatDate(msg.createdAt)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-center">
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/60 text-muted-foreground text-xs rounded-full border border-border/50">
                                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                                    <span>{msg.content}</span>
                                                    <span className="text-[10px] opacity-75">
                                                        {formatChatTime(msg.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                const voiceAttachments = (msg.attachments || []).filter(isVoiceAttachment);
                                const imageAttachments = (msg.attachments || []).filter(isImageAttachment);

                                return (
                                    <div key={msg.id || index} className="space-y-1">
                                        {showDateDivider && (
                                            <div className="flex items-center justify-center my-2">
                                                <span className="text-[10px] bg-muted px-2.5 py-0.5 rounded-full text-muted-foreground uppercase tracking-wider font-medium">
                                                    {formatChatDate(msg.createdAt)}
                                                </span>
                                            </div>
                                        )}

                                        {isSystem ? (
                                            /* System Admin Message: Centered with System Admin style */
                                            <div className="flex flex-col items-center my-3 px-2 w-full">
                                                <div className="max-w-[85%] md:max-w-[70%] w-full flex flex-col items-center">
                                                    {/* Header: System Admin Badge with myTogether Icon */}
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/70 dark:bg-zinc-800/70 backdrop-blur-md text-foreground border border-slate-300/60 dark:border-zinc-700/60 text-xs font-semibold shadow-xs mb-2">
                                                        <img
                                                            src="/logo-mytogether.jpg"
                                                            alt="myTogether"
                                                            className="h-4 w-4 rounded-full object-cover shrink-0 ring-1 ring-border/50"
                                                        />
                                                        <span>System Admin</span>
                                                        {msg.senderAdmin?.name && (
                                                            <span className="text-[11px] font-medium text-muted-foreground">
                                                                • {msg.senderAdmin.name}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Content Card: Gray Glass Style */}
                                                    <div className="w-full bg-slate-100/75 dark:bg-zinc-800/60 backdrop-blur-md border border-slate-200/90 dark:border-zinc-700/70 rounded-2xl p-3.5 shadow-sm space-y-2">
                                                        {msg.content && (
                                                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed select-text text-center sm:text-left">
                                                                {msg.content}
                                                            </p>
                                                        )}

                                                        {/* Attachments Section */}
                                                        {msg.attachments && msg.attachments.length > 0 && (
                                                            <div className={`space-y-2 ${msg.content ? "pt-2 border-t border-slate-200/80 dark:border-zinc-700/60" : ""}`}>
                                                                {imageAttachments.map((att) => (
                                                                    <div
                                                                        key={att.id}
                                                                        className="relative group cursor-pointer overflow-hidden rounded-xl border border-black/10 mx-auto max-w-sm"
                                                                        onClick={() => setLightboxImage(att.url)}
                                                                    >
                                                                        <img
                                                                            src={att.url}
                                                                            alt={att.fileName || "attachment"}
                                                                            className="max-h-56 max-w-full rounded-xl object-cover hover:scale-102 transition-transform duration-200 mx-auto"
                                                                            loading="lazy"
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                                                                            <span className="text-white text-xs font-medium bg-black/60 px-2 py-1 rounded">
                                                                                Click to view
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}

                                                                {voiceAttachments.map((att) => (
                                                                    <AudioPlayer
                                                                        key={att.id}
                                                                        url={att.url}
                                                                        duration={att.duration}
                                                                        isOutgoing={false}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Timestamp */}
                                                        <div className="flex items-center justify-center sm:justify-end gap-1 text-[10px] text-muted-foreground pt-1">
                                                            <span>{formatChatTime(msg.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Regular User (Left) vs Shop (Right) Message */
                                            <div
                                                className={`flex items-end gap-2.5 ${
                                                    isCustomer ? "justify-start" : "justify-end"
                                                }`}
                                            >
                                                {/* Customer Avatar on the Left */}
                                                {isCustomer && (
                                                    <Avatar className="h-7 w-7 ring-1 ring-border shrink-0">
                                                        <AvatarImage src={msg.senderUser?.profileUrl || undefined} />
                                                        <AvatarFallback className="text-[11px] bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                                                            {order.userFullName?.charAt(0) || "U"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}

                                                {/* Message Bubble Body */}
                                                <div
                                                    className={`flex flex-col max-w-[85%] md:max-w-[70%] space-y-1 ${
                                                        isCustomer ? "items-start" : "items-end"
                                                    }`}
                                                >
                                                    {/* Sender Tag Header */}
                                                    <div className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
                                                        {isCustomer ? (
                                                            <span className="font-semibold text-foreground flex items-center gap-1">
                                                                <UserIcon className="h-3 w-3 text-sky-500" />
                                                                {msg.senderUser?.name || order.userFullName || "Customer"}
                                                            </span>
                                                        ) : (
                                                            <span className="font-semibold text-foreground flex items-center gap-1">
                                                                <Store className="h-3 w-3 text-orange-500" />
                                                                {order.shopName || "Shop"}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Speech Bubble: Shop messages use primary gradient, Customer uses white/slate */}
                                                    <div
                                                        className={`p-3 rounded-2xl text-sm break-words ${
                                                            isCustomer
                                                                ? "bg-white dark:bg-zinc-800 text-foreground border border-slate-200 dark:border-zinc-700 rounded-bl-sm shadow-sm"
                                                                : "bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-br-sm shadow-md"
                                                        }`}
                                                    >
                                                        {/* Text Content */}
                                                        {msg.content && (
                                                            <p className="whitespace-pre-wrap leading-relaxed select-text">
                                                                {msg.content}
                                                            </p>
                                                        )}

                                                        {/* Attachments Section */}
                                                        {msg.attachments && msg.attachments.length > 0 && (
                                                            <div
                                                                className={`space-y-2 ${
                                                                    msg.content ? "mt-2 pt-2 border-t border-white/20 dark:border-zinc-600" : ""
                                                                }`}
                                                            >
                                                                {/* Images Grid */}
                                                                {imageAttachments.map((att) => (
                                                                    <div
                                                                        key={att.id}
                                                                        className="relative group cursor-pointer overflow-hidden rounded-xl border border-black/10"
                                                                        onClick={() => setLightboxImage(att.url)}
                                                                    >
                                                                        <img
                                                                            src={att.url}
                                                                            alt={att.fileName || "attachment"}
                                                                            className="max-h-56 max-w-full rounded-xl object-cover hover:scale-102 transition-transform duration-200"
                                                                            loading="lazy"
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                                                                            <span className="text-white text-xs font-medium bg-black/60 px-2 py-1 rounded">
                                                                                Click to view
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}

                                                                {/* Audio/Voice Attachments (play & seek support) */}
                                                                {voiceAttachments.map((att) => (
                                                                    <AudioPlayer
                                                                        key={att.id}
                                                                        url={att.url}
                                                                        duration={att.duration}
                                                                        isOutgoing={!isCustomer}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Time & Read Receipts inside bottom of bubble */}
                                                        <div
                                                            className={`flex items-center justify-end gap-1 text-[10px] mt-1.5 ${
                                                                isCustomer
                                                                    ? "text-muted-foreground"
                                                                    : "text-white/90"
                                                            }`}
                                                        >
                                                            <span>{formatChatTime(msg.createdAt)}</span>
                                                            {!isCustomer && (
                                                                <span>
                                                                    {msg.isRead ? (
                                                                        <CheckCheck className="h-3 w-3 text-white/90" />
                                                                    ) : (
                                                                        <Check className="h-3 w-3 opacity-80" />
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Shop Profile Image Avatar on the Right */}
                                                {isShop && (
                                                    <Avatar className="h-7 w-7 ring-1 ring-border shrink-0 shadow-sm overflow-hidden bg-muted">
                                                        <AvatarImage
                                                            src={order.shopImageUrl || chatData?.shop?.logoUrl || undefined}
                                                            alt={order.shopName || "Shop"}
                                                            className="h-full w-full object-cover"
                                                        />
                                                        <AvatarFallback className="text-[11px] bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold">
                                                            {order.shopName?.charAt(0) || "S"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Attachment Previews */}
                    {filePreviewUrls.length > 0 && (
                        <div className="px-4 py-2 border-t border-border/40 bg-muted/30 flex items-center gap-2 overflow-x-auto">
                            {filePreviewUrls.map((url, idx) => (
                                <div key={idx} className="relative group shrink-0">
                                    <img
                                        src={url}
                                        alt="Preview"
                                        className="h-14 w-14 rounded-lg object-cover border border-border"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeFile(idx)}
                                        className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5 shadow hover:scale-110 transition-transform"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Chat Input Bar */}
                    <form
                        onSubmit={handleSendMessage}
                        className="p-3 border-t border-border/40 bg-background flex items-center gap-2"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,audio/*"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                        />

                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground hover:border-pink-500/50"
                            onClick={() => fileInputRef.current?.click()}
                            title="Attach images or audio"
                        >
                            <ImageIcon className="h-4 w-4" />
                        </Button>

                        <Input
                            placeholder="Type a message to customer or shop..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            className="flex-1 h-9 text-sm focus-visible:ring-pink-500"
                            disabled={sendMutation.isPending}
                        />

                        <Button
                            type="submit"
                            size="sm"
                            className="h-9 px-4 gap-1.5 shrink-0 bg-gradient-to-r from-pink-500 to-orange-500 hover:opacity-90 text-white border-0 shadow-sm transition-opacity"
                            disabled={
                                (!messageText.trim() && selectedFiles.length === 0) ||
                                sendMutation.isPending
                            }
                        >
                            {sendMutation.isPending ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <span>Send</span>
                                    <Send className="h-3.5 w-3.5" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Lightbox Preview Dialog for Images */}
            <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
                <DialogContent className="max-w-3xl p-2 bg-black/90 border-0 flex flex-col items-center justify-center">
                    <DialogTitle className="sr-only">Image Attachment Preview</DialogTitle>
                    {lightboxImage && (
                        <div className="relative max-h-[85vh] overflow-hidden rounded-lg flex items-center justify-center">
                            <img
                                src={lightboxImage}
                                alt="Expanded view"
                                className="max-h-[80vh] w-auto max-w-full rounded-md object-contain"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
