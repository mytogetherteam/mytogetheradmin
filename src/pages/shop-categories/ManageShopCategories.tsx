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
    Pencil, // Changed from Edit to Pencil as per instruction
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
import { ShopCategoryService, ShopCategoryDTO } from "@/services/shopCategoryService";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function ManageShopCategories() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<ShopCategoryDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    // Delete confirmation dialog
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: "" });
    const [deleting, setDeleting] = useState(false);

    const loadCategories = useCallback(async () => {
        setLoading(true);
        try {
            const res = await ShopCategoryService.getShopCategories({
                page: 0,
                size: 200,
                search: searchTerm
            });
            setCategories(res.content || []);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load shop categories");
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadCategories();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, loadCategories]);

    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key));

    const sortedCategories = sortData(categories, sortConfig);

    const totalItems = sortedCategories.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const currentCategories = sortedCategories.slice(startIndex, endIndex);

    const exportToExcel = () => {
        const data = sortedCategories.map((c) => ({
            ID: c.id,
            Name: c.name,
            "Name (MM)": c.nameMm || "",
            "Name (EN)": c.nameEn || "",
            "Is Active": c.isActive !== false ? "Yes" : "No",
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Shop Categories");
        XLSX.writeFile(wb, "ShopCategories.xlsx");
    };

    const handleDeleteClick = (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        setDeleteDialog({ open: true, id, name });
    };

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            await ShopCategoryService.deleteShopCategory(deleteDialog.id);
            toast.success("Shop category deleted successfully");
            setDeleteDialog({ open: false, id: 0, name: "" });
            loadCategories();
        } catch (e) {
            console.error(e);
            toast.error("Failed to delete shop category");
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
                            <CardTitle className="leading-tight">Manage Shop Categories</CardTitle>
                            <CardDescription className="line-clamp-2 md:line-clamp-none">
                                Global classification management for shops and restaurants.
                            </CardDescription>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
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
                            <Button onClick={() => navigate("/shop-categories/create")}>
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
                                            <TableHead>Image</TableHead>
                                            <SortableTableHead label="Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentCategories.length > 0 ? (
                                            currentCategories.map((cat) => (
                                                <TableRow
                                                    key={cat.id}
                                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                    onClick={() => navigate(`/shop-categories/create?id=${cat.id}`)}
                                                >
                                                    <TableCell className="font-mono text-xs">{cat.id}</TableCell>
                                                    <TableCell>
                                                        <TableImage src={cat.imageUrl} alt={cat.name} size="sm" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{cat.name || cat.nameEn || cat.nameMm || cat.nameTh || `Category ${cat.id}`}</div>
                                                        {(cat.nameMm || cat.nameEn || cat.nameTh) && (
                                                            <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                                                                {cat.nameMm && <span>{cat.nameMm}</span>}
                                                                {cat.nameTh && <span>• {cat.nameTh}</span>}
                                                                {cat.nameEn && <span>• {cat.nameEn}</span>}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cat.isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                            {cat.isActive !== false ? "Active" : "Inactive"}
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
                                                                            onClick={(e) => { e.stopPropagation(); navigate(`/shop-categories/create?id=${cat.id}`); }}
                                                                        >
                                                                            <Pencil className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Edit Category</TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-8 w-8 p-0 text-destructive"
                                                                            onClick={(e) => handleDeleteClick(e, cat.id, cat.name)}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Delete Category</TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </TooltipProvider>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                    No shop categories found.
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
                        <DialogTitle>Delete Shop Category?</DialogTitle>
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
