import { useState, useEffect } from "react";
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
import { ShopService, MenuCategory } from "@/services/shopService";
import { menuService, MenuSubCategory } from "@/services/menuService";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Label } from "@/components/ui/label";

export default function ManageSubCategories() {
    const navigate = useNavigate();
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [selectedCategoryData, setSelectedCategoryData] = useState<{ label: string; value: string } | null>(null);

    const [subCategories, setSubCategories] = useState<MenuSubCategory[]>([]);
    const [loading, setLoading] = useState(false);

    const [sortConfig, setSortConfig] = useState<{ key: keyof MenuSubCategory; direction: "asc" | "desc" } | null>(null);

    // Load Categories on Mount
    useEffect(() => {
        loadCategories();
    }, []);

    // Load SubCategories when Category Select Changes
    useEffect(() => {
        if (selectedCategoryId) {
            loadSubCategories(parseInt(selectedCategoryId));
        } else {
            setSubCategories([]);
        }
    }, [selectedCategoryId]);

    const loadCategories = async () => {
        try {
            const res = await ShopService.getAdminCategories(0, 1, "");
            const content = res.content || [];
            if (content.length > 0) {
                const first = content[0];
                const data = { label: first.nameEn || first.name || `Category ${first.id}`, value: first.id.toString() };
                setSelectedCategoryData(data);
                setSelectedCategoryId(data.value);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const loadSubCategories = async (catId: number) => {
        setLoading(true);
        try {
            const data = await menuService.getMenuSubCategories(catId);
            if (Array.isArray(data)) {
                setSubCategories(data);
            } else {
                setSubCategories([]);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load sub-categories");
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: keyof MenuSubCategory) => {
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
            Name: c.name,
            "Name (MM)": c.nameMm || "",
            "Name (EN)": c.nameEn || "",
            "Display Order": c.displayOrder,
            IsActive: c.isActive !== false ? 'Yes' : 'No'
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "SubCategories");
        XLSX.writeFile(wb, "SubCategories.xlsx");
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this sub-category?")) return;
        try {
            await menuService.deleteMenuSubCategory(id);
            toast.success("Deleted successfully");
            if (selectedCategoryId) {
                loadSubCategories(parseInt(selectedCategoryId));
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete");
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-7xl">
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="leading-tight">Manage Menu Sub-Categories</CardTitle>
                            <CardDescription>
                                Manage sub-categories belonging to a specific menu category.
                            </CardDescription>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <Button variant="outline" className="gap-2 shrink-0" onClick={exportToExcel}>
                                <FileSpreadsheet className="h-4 w-4" />
                                Export
                            </Button>
                            <Button onClick={() => navigate("/menus/sub-categories/create")}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create New
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filter Section */}
                    <div className="mb-6 p-4 border rounded-lg bg-muted/20">
                        <Label className="mb-2 block">Select Menu Category</Label>
                        <div className="flex gap-4 items-center max-w-md">
                            <InfiniteSearchableSelect
                                placeholder="Select a Category"
                                selectedValue={selectedCategoryData}
                                onChange={(val) => {
                                    setSelectedCategoryData(val);
                                    setSelectedCategoryId(val?.value || "");
                                }}
                                fetchData={async (page, size, search) => {
                                    const res = await ShopService.getAdminCategories(page, size, search);
                                    return {
                                        content: (res?.content || []).map((cat: MenuCategory) => ({
                                            label: cat.nameEn || cat.name || `Category ${cat.id}`,
                                            value: cat.id.toString(),
                                        })),
                                        last: !!res?.last,
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
                                                    onClick={() => navigate(`/menus/sub-categories/create?id=${sub.id}`)}
                                                >
                                                    <TableCell className="font-mono text-xs">{sub.id}</TableCell>
                                                    <TableCell>
                                                        {sub.imageUrl || sub.icon ? (
                                                            <img src={sub.imageUrl || sub.icon} className="h-8 w-8 rounded object-cover border" alt={sub.name} />
                                                        ) : <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">None</div>}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{sub.name}</div>
                                                        {(sub.nameMm || sub.nameEn) && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {sub.nameMm && <span className="mr-2">{sub.nameMm}</span>}
                                                                {sub.nameEn && <span>{sub.nameEn}</span>}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{sub.displayOrder}</TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sub.isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                            }`}>
                                                            {sub.isActive !== false ? "Active" : "Inactive"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/menus/sub-categories/create?id=${sub.id}`);
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
        </div>
    );
}
