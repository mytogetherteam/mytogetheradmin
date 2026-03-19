import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Loader2,
    Plus,
    FileSpreadsheet,
    Trash2,
    Edit,
} from "lucide-react";
import { DataTablePagination } from "@/components/DataTablePagination";
import { SortableTableHead } from "@/components/SortableTableHead";
import { SortConfig, toggleSort, sortData } from "@/lib/sort-utils";
import { useNavigate } from "react-router-dom";
import { ShopCategoryService, ShopCategoryDTO, ShopSubCategoryDTO } from "@/services/shopCategoryService";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Label } from "@/components/ui/label";
import { TableImage } from "@/components/TableImage";

export default function ManageShopSubCategories() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<ShopCategoryDTO[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

    const [subCategories, setSubCategories] = useState<ShopSubCategoryDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingCategories, setFetchingCategories] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);

    const [totalElements, setTotalElements] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    const loadCategories = useCallback(async () => {
        setFetchingCategories(true);
        try {
            const res = await ShopCategoryService.getShopCategories({ page: 0, size: 100 });
            if (res && res.content) {
                setCategories(res.content);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load shop categories");
        } finally {
            setFetchingCategories(false);
        }
    }, []);

    // Load Categories on Mount
    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const fetchSubCategories = useCallback(async () => {
        setLoading(true);
        try {
            const res = await ShopCategoryService.getShopSubCategoriesPaginated({
                page: currentPage - 1,
                size: pageSize,
                search: debouncedSearch
            });
            if (res && res.content) {
                setSubCategories(res.content);
                setTotalElements(res.totalElements);
            } else {
                setSubCategories([]);
                setTotalElements(0);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load shop sub-categories");
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, debouncedSearch]);

    // Replace loadSubCategories usage
    useEffect(() => {
        fetchSubCategories();
    }, [fetchSubCategories]);

    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key));

    const sortedSubCategories = sortData(subCategories, sortConfig);

    const totalItems = totalElements;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const currentSubCategories = sortedSubCategories;

    const exportToExcel = () => {
        if (subCategories.length === 0) {
            toast.error("No data to export");
            return;
        }
        const data = sortedSubCategories.map(c => ({
            ID: c.id,
            Name: c.name,
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

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this shop sub-category?")) return;
        try {
            await ShopCategoryService.deleteShopSubCategory(id);
            toast.success("Deleted successfully");
            fetchSubCategories();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete shop sub-category");
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
                            <Button onClick={() => navigate("/shop-sub-categories/create")}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create New
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Search Section */}
                    <div className="mb-6 flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="search">Search Sub-Categories</Label>
                            <Input
                                id="search"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <div className="w-full md:w-[300px] space-y-2">
                            <Label className="block">Filter by Category</Label>
                            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {fetchingCategories && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mb-3" />}
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
                                            <SortableTableHead label="ID" sortKey="id" sortConfig={sortConfig} onSort={handleSort} className="w-[80px]" />
                                            <TableHead>Image</TableHead>
                                            <SortableTableHead label="Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                                            <SortableTableHead label="Order" sortKey="displayOrder" sortConfig={sortConfig} onSort={handleSort} />
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentSubCategories.length > 0 ? (
                                            currentSubCategories.map((sub) => (
                                                <TableRow
                                                    key={sub.id}
                                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                    onClick={() => navigate(`/shop-sub-categories/create?id=${sub.id}`)}
                                                >
                                                    <TableCell className="font-mono text-xs">{sub.id}</TableCell>
                                                    <TableCell>
                                                        <TableImage src={sub.imageUrl} alt={sub.name} size="sm" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{sub.name || sub.nameEn || sub.nameMm || '—'}</div>
                                                        {(sub.nameMm || sub.nameEn || sub.nameTh) && (
                                                            <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                                                                {sub.nameMm && <span>{sub.nameMm}</span>}
                                                                {sub.nameTh && <span>• {sub.nameTh}</span>}
                                                                {sub.nameEn && <span>• {sub.nameEn}</span>}
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
                                                                onClick={(e) => handleDelete(e, sub.id)}
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
                                                    No sub-categories found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="mt-4">
                                <DataTablePagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    pageSize={pageSize}
                                    totalItems={totalItems}
                                    onPageChange={setCurrentPage}
                                    onPageSizeChange={setPageSize}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
