import { useState, useEffect, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Loader2,
    Plus,
    Search,
    FileSpreadsheet,
    Trash2,
    Pencil,
} from "lucide-react";
import { DataTablePagination } from "@/components/DataTablePagination";
import { SortableTableHead } from "@/components/SortableTableHead";
import { TableImage } from "@/components/TableImage";
import { SortConfig, toggleSort, sortData } from "@/lib/sort-utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { ItemTagService, ItemTagDTO } from "@/services/itemTagService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import * as XLSX from "xlsx";

export default function ManageItemTags() {
    const navigate = useNavigate();
    const [tags, setTags] = useState<ItemTagDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    // Delete confirmation dialog
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: "" });
    const [deleting, setDeleting] = useState(false);

    const loadTags = useCallback(async () => {
        setLoading(true);
        try {
            const res = await ItemTagService.getItemTags({
                page: 0, // Since frontend sorting is used, load a larger set or adjust API
                size: 200,
                search: searchTerm
            });
            setTags(res.content || []);
        } catch (e) {
            handleApiError(e, "Failed to load item tags");
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadTags();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, loadTags]);

    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key));

    const sortedTags = sortData(tags, sortConfig);

    const totalItems = sortedTags.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const currentTags = sortedTags.slice(startIndex, endIndex);

    const exportToExcel = () => {
        const data = sortedTags.map((t) => ({
            ID: t.id,
            "Name (EN)": t.nameEn || "",
            "Name (MM)": t.nameMm || "",
            "Name (TH)": t.nameTh || "",
            "Tag Type": t.tagType || "",
            "Color Code": t.colorCode || "",
            "Is Active": t.isActive !== false ? "Yes" : "No",
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Item Tags");
        XLSX.writeFile(wb, "ItemTags.xlsx");
    };

    const handleDeleteClick = (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        setDeleteDialog({ open: true, id, name });
    };

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            await ItemTagService.deleteItemTag(deleteDialog.id);
            toast.success("Item tag deleted successfully");
            setDeleteDialog({ open: false, id: 0, name: "" });
            loadTags();
        } catch (e) {
            handleApiError(e, "Failed to delete item tag");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-7xl">
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="leading-tight">Manage Item Discovery Tags</CardTitle>
                            <CardDescription className="line-clamp-2 md:line-clamp-none">
                                Global discovery tags for items (e.g., Mala, Keto, Halal).
                            </CardDescription>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search tags..."
                                    className="pl-8 w-full sm:w-[200px] lg:w-[300px]"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                            <Button variant="outline" className="gap-2 shrink-0" onClick={exportToExcel}>
                                <FileSpreadsheet className="h-4 w-4" />
                                Export
                            </Button>
                            <Button onClick={() => navigate("/item-tags/create")}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create New
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <SortableTableHead label="ID" sortKey="id" sortConfig={sortConfig} onSort={handleSort} className="w-[80px]" />
                                            <TableHead>Icon</TableHead>
                                            <SortableTableHead label="Name" sortKey="nameEn" sortConfig={sortConfig} onSort={handleSort} />
                                            <TableHead>Tag Type</TableHead>
                                            <TableHead>Color</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentTags.length > 0 ? (
                                            currentTags.map((tag) => (
                                                <TableRow
                                                    key={tag.id}
                                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                    onClick={() => navigate(`/item-tags/create?id=${tag.id}`)}
                                                >
                                                    <TableCell className="font-mono text-xs">{tag.id}</TableCell>
                                                    <TableCell>
                                                        <TableImage src={tag.iconUrl} alt={tag.nameEn || "Tag"} size="sm" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{tag.nameEn || tag.nameMm || tag.nameTh || `Tag ${tag.id}`}</div>
                                                        {(tag.nameMm || tag.nameTh) && (
                                                            <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                                                                {tag.nameMm && <span>{tag.nameMm}</span>}
                                                                {tag.nameTh && <span>• {tag.nameTh}</span>}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm border px-2 py-0.5 rounded text-muted-foreground bg-muted/20">
                                                            {tag.tagType || "Default"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {tag.colorCode ? (
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                                                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: tag.colorCode }}></div>
                                                                {tag.colorCode}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tag.isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                            {tag.isActive !== false ? "Active" : "Inactive"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <TooltipProvider>
                                                            <div className="flex justify-end gap-1">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-8 w-8 p-0"
                                                                            onClick={(e) => { e.stopPropagation(); navigate(`/item-tags/create?id=${tag.id}`); }}
                                                                        >
                                                                            <Pencil className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Edit Tag</TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-8 w-8 p-0 text-destructive"
                                                                            onClick={(e) => handleDeleteClick(e, tag.id, tag.nameEn || tag.nameMm || tag.nameTh || `Tag ${tag.id}`)}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Delete Tag</TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </TooltipProvider>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                    No item tags found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <DataTablePagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                pageSize={pageSize}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                            />
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !deleting && setDeleteDialog((d) => ({ ...d, open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Item Tag?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete <strong>{deleteDialog.name}</strong>. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, id: 0, name: "" })} disabled={deleting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
                            {deleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
