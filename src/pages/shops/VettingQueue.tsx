import { useEffect, useState, useCallback } from "react";
import { ShopService } from "@/services/shopService";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DataTablePagination } from "@/components/DataTablePagination";
import { SortableTableHead, SortConfig, toggleSort, sortData } from "@/components/SortableTableHead";

export default function VettingQueue() {
    const [shops, setShops] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalElements, setTotalElements] = useState(0);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    const [rejectShop, setRejectShop] = useState<any | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchShops = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ShopService.getPendingVettingShops(currentPage - 1, pageSize);
            const content = data?.content ?? [];
            setShops(content);
            setTotalElements(data?.totalElements ?? content.length);
        } catch {
            toast.error("Failed to load pending shops");
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize]);

    useEffect(() => { fetchShops(); }, [fetchShops]);

    const handleApprove = async (id: number) => {
        try {
            await ShopService.verifyShop(id);
            toast.success("Shop approved successfully");
            fetchShops();
        } catch {
            toast.error("Failed to approve shop");
        }
    };

    const handleReject = async () => {
        if (!rejectShop) return;
        setActionLoading(true);
        try {
            await ShopService.rejectShop(rejectShop.id, rejectReason.trim() || undefined);
            toast.success("Shop rejected");
            setRejectShop(null);
            setRejectReason("");
            fetchShops();
        } catch {
            toast.error("Failed to reject shop");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key));
    const sortedShops = sortData(shops, sortConfig);
    const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-semibold md:text-2xl">Vetting Queue — Pending Approval</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Shops Awaiting Approval</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="rounded-md border-t overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableTableHead label="Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                                    <TableHead>Owner</TableHead>
                                    <SortableTableHead label="Category" sortKey="category" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Submitted" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} />
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(4)].map((_, i) => (
                                        <TableRow key={i}>
                                            {[...Array(6)].map((__, j) => (
                                                <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : sortedShops.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                            No shops pending approval
                                        </TableCell>
                                    </TableRow>
                                ) : sortedShops.map((shop: any) => (
                                    <TableRow key={shop.id}>
                                        <TableCell className="font-mono text-xs">{shop.id}</TableCell>
                                        <TableCell className="font-medium">{shop.nameEn || shop.name}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{shop.ownerName ?? "—"}</TableCell>
                                        <TableCell className="text-sm">{shop.category}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {shop.createdAt ? new Date(shop.createdAt).toLocaleDateString() : "—"}
                                        </TableCell>
                                        <TableCell className="text-sm">{shop.phone ?? "—"}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm" variant="outline"
                                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                                    onClick={() => handleApprove(shop.id)}
                                                >
                                                    <Check className="h-3 w-3 mr-1" /> Approve
                                                </Button>
                                                <Button
                                                    size="sm" variant="outline"
                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                    onClick={() => setRejectShop(shop)}
                                                >
                                                    <X className="h-3 w-3 mr-1" /> Reject
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalElements}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />

            {/* Reject Dialog */}
            <Dialog open={!!rejectShop} onOpenChange={() => setRejectShop(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Shop: {rejectShop?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Provide a reason for rejection (optional but recommended).
                        </p>
                        <Textarea
                            placeholder="e.g., Incomplete information, duplicate listing..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectShop(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
                            <X className="h-4 w-4 mr-2" /> Reject Shop
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
