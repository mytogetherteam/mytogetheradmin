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
import { ShopService } from "@/services/shopService";
import { InfiniteSearchableSelect } from "@/components/ui/infinite-searchable-select";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
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
    const [isClientPaginated, setIsClientPaginated] = useState(false);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    const [shopId, setShopId] = useState<string>("");
    const [selectedShopData, setSelectedShopData] = useState<{ label: string, value: string } | null>(null);
    const [categoryId, setCategoryId] = useState<string>("");
    const [selectedCategoryData, setSelectedCategoryData] = useState<{ label: string, value: string } | null>(null);
    const [masterCategoryId, setMasterCategoryId] = useState<string>("");
    const [selectedMasterCategoryData, setSelectedMasterCategoryData] = useState<{ label: string, value: string } | null>(null);

    const fetchShopData = useCallback(async (page: number, size: number, search: string) => {
        const res = await ShopService.getAllShops(page, size, search);
        return {
            content: res.content.map(shop => ({ label: shop.nameEn || shop.name, value: String(shop.id) })),
            last: res.last
        };
    }, []);

    const fetchCategoryData = useCallback(async (page: number, size: number, search: string) => {
        const res = await ShopService.getAdminCategories(page, size, search);
        return {
            content: res.content.map((cat: any) => {
                const catId = cat.id || cat.menuCategoryId || cat.categoryId;
                return { 
                    label: cat.nameEn || cat.name || cat.nameMm || cat.nameTh || "Unnamed Category", 
                    value: String(catId) 
                };
            }),
            last: res.last
        };
    }, []);

    const fetchMasterCategoryData = useCallback(async (page: number, size: number, search: string) => {
        const res = await menuService.getAllMasterMenuCategories(page, size);
        const filtered = search
            ? res.content.filter(c => (c.nameEn || c.name || "").toLowerCase().includes(search.toLowerCase()))
            : res.content;
        return {
            content: filtered.map(c => ({ label: c.nameEn || c.name, value: String(c.id) })),
            last: res.last
        };
    }, []);

    const loadItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await menuService.getAllMenuItems(
                currentPage - 1, 
                pageSize, 
                searchTerm,
                shopId ? parseInt(shopId) : undefined,
                categoryId ? parseInt(categoryId) : undefined,
                masterCategoryId ? parseInt(masterCategoryId) : undefined
            );
            if (response && response.content !== undefined) {
                const list = response.content;
                setItems(list);
                
                // Robustly resolve total items and pages locally to bypass typescript error:
                const resAny = response as any;
                const returnedTotalElements = response.totalElements ?? resAny.total ?? resAny.count ?? resAny.totalCount;
                const total = returnedTotalElements !== undefined ? returnedTotalElements : list.length;
                
                const returnedTotalPages = response.totalPages ?? resAny.lastPage;
                const pages = returnedTotalPages !== undefined ? returnedTotalPages : Math.max(1, Math.ceil(total / pageSize));
                
                setTotalItems(total);
                setTotalPages(pages);
                
                // If the backend didn't provide total count info but returned more items than pageSize, 
                // we treat it as client paginated to be safe
                setIsClientPaginated(returnedTotalElements === undefined && list.length > pageSize);
            } else if (Array.isArray(response)) {
                setItems(response);
                setTotalItems(response.length);
                setTotalPages(Math.ceil(response.length / pageSize));
                setIsClientPaginated(true);
            }
        } catch (error) {
            handleApiError(error, "Failed to load menu items");
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, searchTerm, shopId, categoryId, masterCategoryId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadItems();
        }, 300);
        return () => clearTimeout(timer);
    }, [currentPage, pageSize, searchTerm, shopId, categoryId, masterCategoryId, loadItems]);

    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key));

    const sortedItems = sortData(items, sortConfig);
    const displayItems = isClientPaginated 
        ? sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        : sortedItems;

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
            handleApiError(error, "Failed to update item status");
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
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="flex-1 min-w-0">
                                <CardTitle className="leading-tight">Menu Items</CardTitle>
                                <CardDescription className="line-clamp-2 md:line-clamp-none">
                                    Manage menu items and prices across all shops.
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
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

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative w-full sm:w-[250px]">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search items..."
                                    className="pl-8 w-full"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                            <div className="w-full sm:w-[200px]">
                                <InfiniteSearchableSelect
                                    fetchData={fetchShopData}
                                    valueKey="value"
                                    labelKey="label"
                                    selectedValue={selectedShopData}
                                    onChange={(val) => {
                                        setSelectedShopData(val);
                                        setShopId(val ? val.value : "");
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Filter by Shop"
                                />
                            </div>
                            <div className="w-full sm:w-[200px]">
                                <InfiniteSearchableSelect
                                    fetchData={fetchCategoryData}
                                    valueKey="value"
                                    labelKey="label"
                                    selectedValue={selectedCategoryData}
                                    onChange={(val) => {
                                        setSelectedCategoryData(val);
                                        setCategoryId(val ? val.value : "");
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Filter by Category"
                                />
                            </div>
                            <div className="w-full sm:w-[200px]">
                                <InfiniteSearchableSelect
                                    fetchData={fetchMasterCategoryData}
                                    valueKey="value"
                                    labelKey="label"
                                    selectedValue={selectedMasterCategoryData}
                                    onChange={(val) => {
                                        setSelectedMasterCategoryData(val);
                                        setMasterCategoryId(val ? val.value : "");
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Filter by Master Category"
                                />
                            </div>
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
                                        {displayItems.length > 0 ? (
                                            displayItems.map((item) => (
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
