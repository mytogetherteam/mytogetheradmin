import { useEffect, useState, useCallback } from "react";
import { marketingService } from "@/services/marketingService";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Send, History, ChevronLeft, ChevronRight, Users, Store } from "lucide-react";
import { toast } from "sonner";

export default function Broadcast() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Form state
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [target, setTarget] = useState<"USERS" | "SHOPS">("USERS");
    const [sending, setSending] = useState(false);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const data = await marketingService.getBroadcastHistory(page);
            setHistory(data.content || []);
            setTotalPages(data.totalPages || 1);
        } catch {
            toast.error("Failed to load broadcast history");
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !message) return toast.error("Title and message are required");

        setSending(true);
        try {
            if (target === "USERS") {
                await marketingService.broadcastToUsers(title, message);
            } else {
                await marketingService.broadcastToShops(title, message);
            }
            toast.success(`Broadcast sent to all ${target.toLowerCase()}`);
            setTitle("");
            setMessage("");
            setPage(0);
            fetchHistory();
        } catch {
            toast.error("Failed to send broadcast");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Megaphone className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-semibold md:text-2xl">Push Broadcast</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Compose Section */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Send className="h-4 w-4" /> Compose Announcement
                        </CardTitle>
                        <CardDescription>Target users or shop owners with a push notification.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSend} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Target Audience</label>
                                <Select value={target} onValueChange={(v: any) => setTarget(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USERS">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4" /> <span>All Users</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="SHOPS">
                                            <div className="flex items-center gap-2">
                                                <Store className="h-4 w-4" /> <span>All Shop Owners</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Notification Title</label>
                                <Input
                                    placeholder="Enter title..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Message Body</label>
                                <Textarea
                                    placeholder="Enter message content..."
                                    className="min-h-[120px]"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={sending}>
                                {sending ? "Sending..." : "Send Now"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* History Section */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <History className="h-4 w-4" /> Broadcast History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Target</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : history.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                                            No broadcast history found.
                                        </TableCell>
                                    </TableRow>
                                ) : history.map((h) => (
                                    <TableRow key={h.id}>
                                        <TableCell>
                                            <Badge variant="outline" className={h.targetType === "USERS" ? "text-blue-600 bg-blue-50" : "text-purple-600 bg-purple-50"}>
                                                {h.targetType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-sm">{h.title}</TableCell>
                                        <TableCell className="max-w-xs">
                                            <p className="text-xs truncate" title={h.message}>{h.message}</p>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(h.createdAt).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t">
                            <p className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

function Badge({ children, className }: any) {
    return (
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${className}`}>
            {children}
        </span>
    );
}
