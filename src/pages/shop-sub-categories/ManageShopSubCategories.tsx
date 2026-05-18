import { useState, useEffect } from "react";
import { useShopSubCategoriesByCategory } from "@/hooks/shop-sub-categories/useShopSubCategory";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InfiniteSearchableSelect } from "@/components/ui/infinite-searchable-select";
import {
    Loader2,
    Plus,
    FileSpreadsheet,
    ArrowUpDown,
    Edit,
    Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ShopCategoryService, ShopCategoryDTO, ShopSubCategoryDTO } from "@/services/shopCategoryService";
import { TableImage } from "@/components/TableImage";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import * as XLSX from "xlsx";
import { Label } from "@/components/ui/label";

export default function ManageShopSubCategories() {
    const navigate = useNavigate();
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [selectedCategoryData, setSelectedCategoryData] = useState<{ label: string; value: string } | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: "" });
    const [deleting, setDeleting] = useState(false);

    const [sortConfig, setSortConfig] = useState<{ key: keyof ShopSubCategoryDTO; direction: "asc" | "desc" } | null>(null);

    // Load Categories on Mount
    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const res = await ShopCategoryService.getShopCategories({ page: 0, size: 1 });
            const content = res.content || [];
            if (content.length > 0) {
                const first = content[0];
                const data = { label: first.nameEn || first.name || `Category ${first.id}`, value: first.id.toString() };
                setSelectedCategoryData(data);
                setSelectedCategoryId(data.value);
            }
        } catch (error) {
            handleApiError(error, "Failed to load categories");
        }
    };

    const { data, isPending, refetch } = useShopSubCategoriesByCategory(
        selectedCategoryId ? parseInt(selectedCategoryId) : null
    );

    const loading = selectedCategoryId ? isPending : false;
    const subCategories = data || [];

    const handleSort = (key: keyof ShopSubCategoryDTO) => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const sortedSubCategories = [...subCategories].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        let aVal = a[key];
        let bVal = b[key];

        // Handle undefined values
        if (aVal === undefined) aVal = "";
        if (bVal === undefined) bVal = "";

        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return direction === "asc" ? -1 : 1;
        if (aVal > bVal) return direction === "asc" ? 1 : -1;
        return 0;
    });

    const exportToExcel = () => {
        if (subCategories.length === 0) {
            toast.error("No data to export");
            return;
        }
        const data = sortedSubCategories.map(c => ({
            ID: c.id,
            Name: c.nameEn || c.name || `Sub-Category ${c.id}`,
            "Name (MM)": c.nameMm || "",
            "Name (EN)": c.nameEn || "",
            "Display Order": c.displayOrder,
            IsActive: c.isActive !== false ? 'Yes' : 'No'
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ShopSubCategories");
        XLSX.writeFile(wb, "ShopSubCategories.xlsx");
    };

    const handleDeleteClick = async (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        setDeleteDialog({ open: true, id, name });
    };

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            await ShopCategoryService.deleteShopSubCategory(deleteDialog.id);
            toast.success("Deleted successfully");
            setDeleteDialog({ open: false, id: 0, name: "" });
            void refetch();
        } catch (error) {
            handleApiError(error, "Failed to delete shop sub-category");
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
                            <CardTitle className="leading-tight">Manage Shop Sub-Categories</CardTitle>
                            <CardDescription>
                                Manage sub-categories belonging to a specific shop category.
                            </CardDescription>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <Button variant="outline" className="gap-2 shrink-0" onClick={exportToExcel}>
                                <FileSpreadsheet className="h-4 w-4" />
                                Export
                            </Button>
                            <Button onClick={() => navigate(`/shop-sub-categories/create`)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create New
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filter Section */}
                    <div className="mb-6 p-4 border rounded-lg bg-muted/20">
                        <Label className="mb-2 block">Select Shop Category</Label>
                        <div className="flex gap-4 items-center max-w-md">
                            <InfiniteSearchableSelect
                                placeholder="Select a Category"
                                selectedValue={selectedCategoryData}
                                onChange={(val) => {
                                    setSelectedCategoryData(val);
                                    setSelectedCategoryId(val?.value || "");
                                }}
                                fetchData={async (page, size, search) => {
                                    const res = await ShopCategoryService.getShopCategories({ page, size, search });
                                    return {
                                        content: (res?.content || []).map((cat: ShopCategoryDTO) => ({
                                            label: cat.nameEn || cat.name || `Category ${cat.id}`,
                                            value: cat.id.toString(),
                                        })),
                                        last: res?.totalPages ? (page + 1 >= res.totalPages) : true,
                                    };
                                }}
                                valueKey="value"
                                labelKey="label"
                            />
                        </div>
                    </div>

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
                                            <TableHead className="w-[80px] cursor-pointer" onClick={() => handleSort("id")}>
                                                <div className="flex items-center gap-2">
                                                    ID <ArrowUpDown className="h-3 w-3" />
                                                </div>
                                            </TableHead>
                                            <TableHead>Image</TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                                                <div className="flex items-center gap-2">
                                                    Name <ArrowUpDown className="h-3 w-3" />
                                                </div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort("displayOrder")}>
                                                <div className="flex items-center gap-2">
                                                    Order <ArrowUpDown className="h-3 w-3" />
                                                </div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort("isActive")}>
                                                Status
                                            </TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedSubCategories.length > 0 ? (
                                            sortedSubCategories.map((sub) => (
                                                <TableRow
                                                    key={sub.id}
                                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                    onClick={() => navigate(`/shop-sub-categories/create?id=${sub.id}`)}
                                                >
                                                    <TableCell className="font-mono text-xs">{sub.id}</TableCell>
                                                    <TableCell>
                                                        <TableImage 
                                                            src={sub.imageUrl} 
                                                            alt={sub.nameEn || sub.name || "Sub-Category"} 
                                                            size="sm" 
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{sub.nameEn || sub.name || `Sub-Category ${sub.id}`}</div>
                                                        {(sub.nameMm || sub.nameEn || sub.nameTh) && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {sub.nameMm && <span className="mr-2">{sub.nameMm}</span>}
                                                                {sub.nameEn && <span className="mr-2">{sub.nameEn}</span>}
                                                                {sub.nameTh && <span>{sub.nameTh}</span>}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{sub.displayOrder}</TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sub.isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                            }`}>
                                                            {sub.isActive !== false ? "Active" : "Inactive"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/shop-sub-categories/create?id=${sub.id}`);
                                                                }}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                onClick={(e) => handleDeleteClick(e, sub.id, sub.nameEn || sub.name || `Sub-Category ${sub.id}`)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                    {selectedCategoryId ? "No sub-categories found for this category." : "Please select a category above."}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !deleting && setDeleteDialog((d) => ({ ...d, open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Shop Sub-Category?</DialogTitle>
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
