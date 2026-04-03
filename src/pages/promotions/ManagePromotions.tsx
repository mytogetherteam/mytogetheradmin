import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Loader2, Download } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { PromotionService, PromotionDTO } from "@/services/promotionService";
import { PageableResponse } from "@/services/shopService";
import { useDebounce } from "@/hooks/use-debounce";
import { SortableTableHead } from "@/components/SortableTableHead";
import * as XLSX from "xlsx";

export default function ManagePromotions() {
    const [promotions, setPromotions] = useState<PromotionDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: keyof PromotionDTO | ""; direction: "asc" | "desc" }>({ key: "", direction: "asc" });

    const debouncedSearch = useDebounce(search, 500);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchPromotions = async (currentPage: number, currentSearch: string) => {
        setLoading(true);
        try {
            const data: PageableResponse<PromotionDTO> = await PromotionService.getPromotions({
                page: currentPage,
                size: pageSize,
                search: currentSearch || undefined,
            });
            setPromotions(data.content || []);
            setTotalPages(data.totalPages || 1);
            setTotalElements(data.totalElements || 0);
        } catch (error) {
            handleApiError(error, "Failed to load promotions");
        } finally {
            setLoading(false);
        }
    };

    const prevSearchRef = useRef(debouncedSearch);

    useEffect(() => {
        if (prevSearchRef.current !== debouncedSearch) {
            prevSearchRef.current = debouncedSearch;
            if (page !== 0) {
                setPage(0);
                // The setPage above will trigger a re-render and execute the fetch later.
                return;
            }
        }
        fetchPromotions(page, debouncedSearch);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch]);

    const handleSort = (key: string) => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key: key as keyof PromotionDTO, direction });
    };

    const sortedPromotions = [...promotions].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal === undefined && bVal === undefined) return 0;
        if (aVal === undefined) return sortConfig.direction === "asc" ? 1 : -1;
        if (bVal === undefined) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
    });

    const handleDelete = async () => {
        if (deletingId === null) return;
        setDeleting(true);
        try {
            await PromotionService.deletePromotion(deletingId);
            toast.success("Promotion deleted successfully");
            fetchPromotions(page, debouncedSearch);
        } catch (error) {
            handleApiError(error, "Failed to delete promotion");
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
            setDeletingId(null);
        }
    };

    const handleExport = () => {
        const exportData = sortedPromotions.map(p => ({
            "ID": p.id,
            "Title (EN)": p.titleEn || "",
            "Title (MM)": p.titleMm || "",
            "Title (TH)": p.titleTh || "",
            "Promotion Type": p.promotionType,
            "Value": p.promotionValue || 0,
            "Target Type": p.targetType,
            "Target ID": p.targetId || "",
            "Start Date": p.startDate || "",
            "End Date": p.endDate || "",
            "Image URL": p.imageUrl || "",
            "Is Active": p.isActive ? "Yes" : "No",
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Promotions");
        XLSX.writeFile(wb, "promotions_export.xlsx");
    };

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Admin Promotions</h2>
                    <p className="text-muted-foreground">Manage marketing promotions, offers, and discounts.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport} disabled={sortedPromotions.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Export Excel
                    </Button>
                    <Link to="/promotions/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Promotion
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="border-solid">
                <CardHeader>
                    <CardTitle>Promotion List</CardTitle>
                    <CardDescription>View and manage all your promotions.</CardDescription>
                    <div className="flex w-full max-w-sm items-center space-x-2 pt-4">
                        <div className="relative w-full">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search promotions..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading && promotions.length === 0 ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="rounded-md border border-solid">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <SortableTableHead label="ID" sortKey="id" sortConfig={sortConfig} onSort={handleSort} className="w-[80px]" />
                                        <TableHead>Image</TableHead>
                                        <SortableTableHead label="Title" sortKey="titleEn" sortConfig={sortConfig} onSort={handleSort} />
                                        <TableHead>Target</TableHead>
                                        <TableHead>Type/Value</TableHead>
                                        <TableHead>Dates</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedPromotions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                No promotions found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sortedPromotions.map((promo) => (
                                            <TableRow key={promo.id}>
                                                <TableCell className="font-medium">{promo.id}</TableCell>
                                                <TableCell>
                                                    {promo.imageUrl ? (
                                                        <img src={promo.imageUrl} alt={promo.titleEn} className="h-10 w-16 object-cover rounded bg-muted" />
                                                    ) : (
                                                        <div className="h-10 w-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">No img</div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{promo.titleEn || '-'}</div>
                                                    {promo.titleMm && <div className="text-xs text-muted-foreground">{promo.titleMm}</div>}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm px-2 py-0.5 rounded text-muted-foreground bg-muted/20 border border-solid">
                                                        {promo.targetType} {promo.targetId ? `#${promo.targetId}` : ''}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-sm">{promo.promotionType}</div>
                                                    <div className="text-xs font-mono text-muted-foreground">Val: {promo.promotionValue || 0}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs space-y-1">
                                                        <div>{promo.startDate || "N/A"} to {promo.endDate || "N/A"}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {promo.isActive ? (
                                                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Link to={`/promotions/create?id=${promo.id}`}>
                                                            <Button variant="outline" size="icon">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            onClick={() => {
                                                                setDeletingId(promo.id);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="text-sm text-muted-foreground">
                            Showing {sortedPromotions.length} of {totalElements} results
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0 || loading}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1 || loading}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete this promotion.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? "Deleting..." : "Delete Promotion"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
