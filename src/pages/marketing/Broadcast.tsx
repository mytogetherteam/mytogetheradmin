import { useEffect, useState, useCallback } from "react";
import { marketingService } from "@/services/marketingService";
import { userService } from "@/services/userService";
import { ShopService } from "@/services/shopService";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
    Table, TableBody, TableCell, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Send, History, Users, Store, User } from "lucide-react";
import { SortableTableHead, SortConfig, toggleSort, sortData } from "@/components/SortableTableHead";
import { DataTablePagination } from "@/components/DataTablePagination";
import { toast } from "sonner";

export default function Broadcast() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [target, setTarget] = useState<"USERS" | "SHOPS" | "SINGLE_USER" | "SINGLE_SHOP">("USERS");
    const [sending, setSending] = useState(false);

    const [shops, setShops] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedShopId, setSelectedShopId] = useState<string>("");
    const [selectedUserId, setSelectedUserId] = useState<string>("");

    useEffect(() => {
        const loadData = async () => {
            try {
                const [shopsRes, usersRes] = await Promise.all([
                    ShopService.getAllShops(0, 1000),
                    userService.getAllUsers(0, 1000)
                ]);
                setShops(shopsRes?.content || []);
                setUsers(usersRes?.content || []);
            } catch (error) {
                console.error("Failed to load users/shops", error);
            }
        };
        loadData();
    }, []);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const data = await marketingService.getBroadcastHistory(page, pageSize);
            setHistory(data.content || []);
            setTotalElements(data.totalElements || 0);
            setTotalPages(data.totalPages || 1);
        } catch {
            toast.error("Failed to load broadcast history");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !message) return toast.error("Title and message are required");

        setSending(true);
        try {
            if (target === "USERS") {
                await marketingService.broadcastToUsers(title, message);
            } else if (target === "SHOPS") {
                await marketingService.broadcastToShops(title, message);
            } else if (target === "SINGLE_USER") {
                if (!selectedUserId) return toast.error("Please select a user");
                await marketingService.notifySingleUser(selectedUserId, title, message);
            } else if (target === "SINGLE_SHOP") {
                if (!selectedShopId) return toast.error("Please select a shop");
                await marketingService.notifySingleShop(selectedShopId, title, message);
            }
            toast.success(`Broadcast sent successfully`);
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

    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key));
    const sortedHistory = sortData(history, sortConfig);

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
                                        <SelectItem value="SINGLE_USER">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" /> <span>Single User</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="SINGLE_SHOP">
                                            <div className="flex items-center gap-2">
                                                <Store className="h-4 w-4" /> <span>Single Shop</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {target === "SINGLE_USER" && (
                                <div className="space-y-2">
                                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Select User</label>
                                    <SearchableSelect
                                        data={users.map(u => ({ label: u.name || u.phone || u.email || `User #${u.id}`, value: String(u.id) }))}
                                        value="value"
                                        labelKey="label"
                                        selectedValue={selectedUserId ? { label: users.find(u => String(u.id) === selectedUserId)?.name || users.find(u => String(u.id) === selectedUserId)?.phone || users.find(u => String(u.id) === selectedUserId)?.email || `User #${selectedUserId}`, value: selectedUserId } : undefined}
                                        onChange={(item) => setSelectedUserId(item?.value || "")}
                                        placeholder="Search user..."
                                    />
                                </div>
                            )}

                            {target === "SINGLE_SHOP" && (
                                <div className="space-y-2">
                                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Select Shop</label>
                                    <SearchableSelect
                                        data={shops.map(s => ({ label: s.nameEn || s.name, value: String(s.id) }))}
                                        value="value"
                                        labelKey="label"
                                        selectedValue={selectedShopId ? { label: shops.find(s => String(s.id) === selectedShopId)?.nameEn || shops.find(s => String(s.id) === selectedShopId)?.name || "", value: selectedShopId } : undefined}
                                        onChange={(item) => setSelectedShopId(item?.value || "")}
                                        placeholder="Search shop..."
                                    />
                                </div>
                            )}

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
                                    <SortableTableHead label="Target" sortKey="targetType" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Title" sortKey="title" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Message" sortKey="body" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Recipients" sortKey="recipientCount" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="By" sortKey="sentByName" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Date" sortKey="sentAt" sortConfig={sortConfig} onSort={handleSort} />
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
                                ) : sortedHistory.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                                            No broadcast history found.
                                        </TableCell>
                                    </TableRow>
                                ) : sortedHistory.map((h) => (
                                    <TableRow key={h.id}>
                                        <TableCell>
                                            <Badge variant="outline" className={h.targetType === "USERS" ? "text-blue-600 bg-blue-50" : "text-purple-600 bg-purple-50"}>
                                                {h.targetType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-sm">{h.title}</TableCell>
                                        <TableCell className="max-w-xs">
                                            <p className="text-xs truncate" title={h.body}>{h.body}</p>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">{h.recipientCount ?? "—"}</TableCell>
                                        <TableCell className="text-sm">{h.sentByName || "—"}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {h.sentAt ? new Date(h.sentAt).toLocaleDateString() : "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                    <DataTablePagination
                        currentPage={page + 1}
                        totalPages={totalPages}
                        totalItems={totalElements}
                        pageSize={pageSize}
                        onPageChange={(p) => setPage(p - 1)}
                        onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
                    />
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
