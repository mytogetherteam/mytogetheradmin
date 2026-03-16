import { useState, useEffect, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Search,
    Loader2,
    FileSpreadsheet,
} from "lucide-react";
import { DataTablePagination } from "@/components/DataTablePagination";
import { SortableTableHead } from "@/components/SortableTableHead";
import { TableImage } from "@/components/TableImage";
import { SortConfig, toggleSort, sortData } from "@/lib/sort-utils";
import { useNavigate } from "react-router-dom";
import { menuService, MenuItem } from "@/services/menuService";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";

export default function ManageMenuItems() {
    const navigate = useNavigate();
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    const loadItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await menuService.getAllMenuItems(currentPage - 1, pageSize, searchTerm);
            if (response && response.content) {
                setItems(response.content);
                setTotalPages(response.totalPages);
                setTotalItems(response.totalElements);
            } else if (Array.isArray(response)) {
                setItems(response);
                setTotalItems(response.length);
                setTotalPages(Math.ceil(response.length / pageSize));
            }
        } catch (error) {
            console.error("Failed to load menu items", error);
            toast.error("Failed to load menu items");
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadItems();
        }, 300);
        return () => clearTimeout(timer);
    }, [currentPage, pageSize, searchTerm, loadItems]);

    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key));

    const sortedItems = sortData(items, sortConfig);

    const handleToggleFlag = async (item: MenuItem, flagType: 'recommended' | 'available' | 'hotdeal', value: boolean) => {
        if (!item.id) return;
        try {
            switch (flagType) {
                case 'recommended':
                    await menuService.toggleRecommended(item.id, value);
                    break;
                case 'available':
                    await menuService.toggleAvailable(item.id, value);
                    break;
                case 'hotdeal':
                    await menuService.toggleHotDeal(item.id, value);
                    break;
            }

            // Update local state
            setItems(prevItems =>
                prevItems.map(i => {
                    if (i.id === item.id) {
                        return {
                            ...i,
                            ...(flagType === 'recommended' && { isRecommended: value }),
                            ...(flagType === 'available' && { isAvailable: value }),
                            ...(flagType === 'hotdeal' && { isHotDeal: value })
                        };
                    }
                    return i;
                })
            );
            toast.success(`Item updated successfully`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update item status");
        }
    };

    const exportToExcel = () => {
        const data = items.map(i => ({
            ID: i.id,
            Name: i.name,
            Price: i.price,
            Currency: i.currency,

            Shop: i.shopName || i.shopId,

            Category: i.categoryName || 'Uncategorized'
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "MenuItems");
        XLSX.writeFile(wb, "Menu_Items.xlsx");
    };

    return (
        <div className="container mx-auto py-10 max-w-7xl">
            <Card className="flex flex-col h-full border-solid">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="leading-tight">Menu Items</CardTitle>
                            <CardDescription className="line-clamp-2 md:line-clamp-none">
                                Manage menu items and prices across all shops.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
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
                            <Button onClick={() => navigate("/menus/items/create")}>
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
                                            <SortableTableHead label="Price" sortKey="price" sortConfig={sortConfig} onSort={handleSort} />
                                            <TableHead>Shop</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Flags</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedItems.length > 0 ? (
                                            sortedItems.map((item) => (
                                                <TableRow
                                                    key={item.id}
                                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                    onClick={() => navigate(`/menus/items/create?id=${item.id}`)}
                                                >
                                                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                                                    <TableCell>
                                                        <TableImage 
                                                            src={item.imageUrl || item.imageUrls?.[0]} 
                                                            alt={item.nameEn || item.name} 
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{item.nameEn || item.name}</div>
                                                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">{item.descriptionEn || item.description}</div>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        <div>{item.price} <span className="text-[10px] text-muted-foreground">{item.currency}</span></div>
                                                        {(item.smallPrice || item.mediumPrice || item.largePrice) && (
                                                            <div className="text-[10px] text-muted-foreground mt-1">
                                                                {item.smallPrice && <span>S: {item.smallPrice} </span>}
                                                                {item.mediumPrice && <span>M: {item.mediumPrice} </span>}
                                                                {item.largePrice && <span>L: {item.largePrice} </span>}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    { }
                                                    <TableCell className="text-sm">{item.shopName || item.shopId}</TableCell>
                                                    <TableCell>
                                                        { }
                                                        <Badge variant="outline" className="font-normal">{item.categoryName || "Uncategorized"}</Badge>
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center justify-between gap-2 max-w-[120px]">
                                                                <Label className="text-[10px] cursor-pointer" htmlFor={`avail-${item.id}`}>Avail</Label>
                                                                <Switch id={`avail-${item.id}`} className="scale-75 origin-right" checked={item.isAvailable} onCheckedChange={(val) => handleToggleFlag(item, 'available', val)} />
                                                            </div>
                                                            <div className="flex items-center justify-between gap-2 max-w-[120px]">
                                                                <Label className="text-[10px] cursor-pointer" htmlFor={`rec-${item.id}`}>Rec</Label>
                                                                <Switch id={`rec-${item.id}`} className="scale-75 origin-right" checked={item.isRecommended} onCheckedChange={(val) => handleToggleFlag(item, 'recommended', val)} />
                                                            </div>
                                                            <div className="flex items-center justify-between gap-2 max-w-[120px]">
                                                                <Label className="text-[10px] cursor-pointer" htmlFor={`hot-${item.id}`}>Hot</Label>
                                                                <Switch id={`hot-${item.id}`} className="scale-75 origin-right" checked={item.isHotDeal} onCheckedChange={(val) => handleToggleFlag(item, 'hotdeal', val)} />
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                    No results found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

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
        </div>
    );
}
