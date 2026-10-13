import { useState, useRef, useEffect } from "react";
import { Order } from "@/services/orderService";
import { useOrderChat, useSendOrderChatMessageMutation } from "@/hooks/orders/useOrders";
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
    ShieldCheck,
    Check,
    CheckCheck,
    Volume2,
    Play,
    Pause,
    X,
    Sparkles,
    AlertCircle,
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

function AudioPlayer({ url, duration }: { url: string; duration?: number | null }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(() => {});
            setIsPlaying(true);
        }
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        const total = audioRef.current.duration || duration || 1;
        setProgress((current / total) * 100);
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    const formatSeconds = (sec?: number | null) => {
        if (!sec) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    return (
        <div className="flex items-center gap-2 bg-background/50 dark:bg-background/20 p-2 rounded-xl border border-border/40 max-w-xs">
            <audio
                ref={audioRef}
                src={url}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                preload="metadata"
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full shrink-0"
                onClick={togglePlay}
            >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex-1 space-y-1">
                <div className="w-full bg-muted-foreground/20 h-1.5 rounded-full overflow-hidden">
                    <div
                        className="bg-primary h-full transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Volume2 className="h-3 w-3" /> Voice Note
                    </span>
                    <span>{formatSeconds(duration)}</span>
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

    const sendMutation = useSendOrderChatMessageMutation(order.id, order.shopId);

    const [messageText, setMessageText] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const messages = chatData?.messages ?? [];

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages.length]);

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
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-base font-semibold">
                                        Order Message Chat
                                    </CardTitle>
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                </div>
                                <CardDescription className="text-xs">
                                    Live conversation between customer ({order.userFullName || "Customer"}) and shop ({order.shopName})
                                </CardDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs font-medium">
                                {messages.length} {messages.length === 1 ? "message" : "messages"}
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
                    {/* Chat Messages List */}
                    <div className="p-4 space-y-4 max-h-[460px] min-h-[260px] overflow-y-auto bg-slate-50/50 dark:bg-zinc-950/30">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-2">
                                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                                <p className="text-sm">Loading order messages...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                    <Sparkles className="h-6 w-6 text-primary" />
                                </div>
                                <h4 className="text-sm font-semibold text-foreground">No Chat Messages Yet</h4>
                                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                                    Customer and shop have not sent any chat messages for this order yet. You can send a direct support update below.
                                </p>
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                const isCustomer = msg.senderType === "USER";
                                const isShop = msg.senderType === "SHOP";
                                const isSystem = msg.senderType === "SYSTEM" || msg.type === "SYSTEM";

                                const showDateDivider =
                                    index === 0 ||
                                    formatChatDate(msg.createdAt) !==
                                        formatChatDate(messages[index - 1]?.createdAt);

                                if (isSystem) {
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

                                return (
                                    <div key={msg.id || index} className="space-y-1">
                                        {showDateDivider && (
                                            <div className="flex items-center justify-center my-2">
                                                <span className="text-[10px] bg-muted px-2.5 py-0.5 rounded-full text-muted-foreground uppercase tracking-wider font-medium">
                                                    {formatChatDate(msg.createdAt)}
                                                </span>
                                            </div>
                                        )}

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
                                                className={`flex flex-col max-w-[80%] md:max-w-[70%] space-y-1 ${
                                                    isCustomer ? "items-start" : "items-end"
                                                }`}
                                            >
                                                {/* Sender Tag Header */}
                                                <div className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
                                                    {isCustomer ? (
                                                        <>
                                                            <span className="font-semibold text-foreground flex items-center gap-1">
                                                                <UserIcon className="h-3 w-3" />
                                                                {msg.senderUser?.name || order.userFullName || "Customer"}
                                                            </span>
                                                            <span className="text-[10px] bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300 px-1.5 py-0.2 rounded font-medium">
                                                                Customer
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 px-1.5 py-0.2 rounded font-medium">
                                                                {msg.senderAdmin ? "Admin / Support" : "Shop"}
                                                            </span>
                                                            <span className="font-semibold text-foreground flex items-center gap-1">
                                                                {msg.senderAdmin ? (
                                                                    <>
                                                                        <ShieldCheck className="h-3 w-3 text-purple-600" />
                                                                        {msg.senderAdmin.name || "Admin"}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Store className="h-3 w-3 text-amber-600" />
                                                                        {order.shopName}
                                                                    </>
                                                                )}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Speech Bubble */}
                                                <div
                                                    className={`p-3 rounded-2xl shadow-sm text-sm break-words ${
                                                        isCustomer
                                                            ? "bg-white dark:bg-zinc-800 text-foreground border border-slate-200 dark:border-zinc-700 rounded-bl-sm"
                                                            : "bg-blue-600 text-white dark:bg-blue-600 rounded-br-sm"
                                                    }`}
                                                >
                                                    {/* Text Content */}
                                                    {msg.content && (
                                                        <p className="whitespace-pre-wrap leading-relaxed select-text">
                                                            {msg.content}
                                                        </p>
                                                    )}

                                                    {/* Attachments */}
                                                    {msg.attachments && msg.attachments.length > 0 && (
                                                        <div
                                                            className={`space-y-2 ${
                                                                msg.content ? "mt-2 pt-2 border-t border-white/20 dark:border-zinc-600" : ""
                                                            }`}
                                                        >
                                                            {/* Images Grid */}
                                                            {msg.attachments
                                                                .filter((att) => att.type === "IMAGE")
                                                                .map((att) => (
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

                                                            {/* Audio Attachments */}
                                                            {msg.attachments
                                                                .filter((att) => att.type === "AUDIO")
                                                                .map((att) => (
                                                                    <AudioPlayer
                                                                        key={att.id}
                                                                        url={att.url}
                                                                        duration={att.duration}
                                                                    />
                                                                ))}
                                                        </div>
                                                    )}

                                                    {/* Time & Read Receipts inside/bottom of bubble */}
                                                    <div
                                                        className={`flex items-center justify-end gap-1 text-[10px] mt-1.5 ${
                                                            isCustomer
                                                                ? "text-muted-foreground"
                                                                : "text-blue-100"
                                                        }`}
                                                    >
                                                        <span>{formatChatTime(msg.createdAt)}</span>
                                                        {isShop && (
                                                            <span>
                                                                {msg.isRead ? (
                                                                    <CheckCheck className="h-3 w-3 text-blue-200" />
                                                                ) : (
                                                                    <Check className="h-3 w-3 opacity-80" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Shop / Admin Avatar on the Right */}
                                            {!isCustomer && (
                                                <Avatar className="h-7 w-7 ring-1 ring-border shrink-0">
                                                    <AvatarImage src={order.shopImageUrl || undefined} />
                                                    <AvatarFallback className="text-[11px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                        {order.shopName?.charAt(0) || "S"}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
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
                            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={() => fileInputRef.current?.click()}
                            title="Attach images or audio"
                        >
                            <ImageIcon className="h-4 w-4" />
                        </Button>

                        <Input
                            placeholder="Type a message to customer or shop..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            className="flex-1 h-9 text-sm focus-visible:ring-1"
                            disabled={sendMutation.isPending}
                        />

                        <Button
                            type="submit"
                            size="sm"
                            className="h-9 px-4 gap-1.5 shrink-0"
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
