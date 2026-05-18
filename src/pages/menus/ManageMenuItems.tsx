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
import { MasterMenuCategoryService } from "@/services/masterMenuCategoryService";
import { InfiniteSearchableSelect } from "@/components/ui/infinite-searchable-select";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { Badge } from "@/components/ui/badge";

export default function ManageMenuItems() {
    const navigate = useNavigate();
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(localStorage.getItem("manage_menu_search") || "");
    const [currentPage, setCurrentPage] = useState(Number(localStorage.getItem("manage_menu_page")) || 1);
    const [pageSize, setPageSize] = useState(Number(localStorage.getItem("manage_menu_page_size")) || 20);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isClientPaginated, setIsClientPaginated] = useState(false);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    const [shopId, setShopId] = useState<string>(localStorage.getItem("manage_menu_shop_id") || "");
    const [selectedShopData, setSelectedShopData] = useState<{ label: string, value: string } | null>(
        localStorage.getItem("manage_menu_shop_data") ? JSON.parse(localStorage.getItem("manage_menu_shop_data")!) : null
    );
    const [categoryId, setCategoryId] = useState<string>(localStorage.getItem("manage_menu_category_id") || "");
    const [selectedCategoryData, setSelectedCategoryData] = useState<{ label: string, value: string } | null>(
        localStorage.getItem("manage_menu_category_data") ? JSON.parse(localStorage.getItem("manage_menu_category_data")!) : null
    );
    const [masterCategoryId, setMasterCategoryId] = useState<string>(localStorage.getItem("manage_menu_master_category_id") || "");
    const [selectedMasterCategoryData, setSelectedMasterCategoryData] = useState<{ label: string, value: string } | null>(
        localStorage.getItem("manage_menu_master_category_data") ? JSON.parse(localStorage.getItem("manage_menu_master_category_data")!) : null
    );

    const [selectedMenuItemId, setSelectedMenuItemId] = useState<number | null>(
        localStorage.getItem("lastSelectedMenuItemId") ? Number(localStorage.getItem("lastSelectedMenuItemId")) : null
    );

    const [extraCategoryNames, setExtraCategoryNames] = useState<Record<number, string>>({});
    const [extraMasterCategoryNames, setExtraMasterCategoryNames] = useState<Record<number, string>>({});

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
            content: res.content.map((cat: { id?: number; menuCategoryId?: number; categoryId?: number; nameEn?: string; name?: string; nameMm?: string; nameTh?: string }) => {
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

                // Fetch missing names
                const missingCategories = new Set<number>();
                const missingMasterCategories = new Set<number>();

                list.forEach(item => {
                    const typedItem = item as any;
                    const catId = item.menuCategoryId || typedItem.categoryId;
                    if (catId && !item.categoryName && !item.menuCategoryName) missingCategories.add(catId);
                    if (item.masterCategoryId && !item.masterCategoryName) missingMasterCategories.add(item.masterCategoryId);
                });

                missingCategories.forEach(id => {
                    ShopService.getCategoryById(id).then((cat: any) => {
                        setExtraCategoryNames(prev => ({ ...prev, [id]: cat.nameEn || cat.nameMm || cat.name || `Category ${id}` }));
                    }).catch(() => { });
                });
                missingMasterCategories.forEach(id => {
                    MasterMenuCategoryService.getMasterMenuCategoryById(id).then((mc: any) => {
                        setExtraMasterCategoryNames(prev => ({ ...prev, [id]: mc.nameEn || mc.nameMm || mc.nameTh || mc.name || String(id) }));
                    }).catch(() => { });
                });

                // Robustly resolve total items and pages locally to bypass typescript error:
                const resAny = response as { total?: number; count?: number; totalCount?: number; lastPage?: number; page?: { totalElements?: number; totalPages?: number; } };
                const returnedTotalElements = resAny.page?.totalElements ?? response.totalElements ?? resAny.total ?? resAny.count ?? resAny.totalCount;
                const total = returnedTotalElements !== undefined ? returnedTotalElements : list.length;

                const returnedTotalPages = resAny.page?.totalPages ?? response.totalPages ?? resAny.lastPage;
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

    useEffect(() => {
        localStorage.setItem("manage_menu_search", searchTerm);
        localStorage.setItem("manage_menu_page", String(currentPage));
        localStorage.setItem("manage_menu_page_size", String(pageSize));
        localStorage.setItem("manage_menu_shop_id", shopId);
        localStorage.setItem("manage_menu_shop_data", JSON.stringify(selectedShopData));
        localStorage.setItem("manage_menu_category_id", categoryId);
        localStorage.setItem("manage_menu_category_data", JSON.stringify(selectedCategoryData));
        localStorage.setItem("manage_menu_master_category_id", masterCategoryId);
        localStorage.setItem("manage_menu_master_category_data", JSON.stringify(selectedMasterCategoryData));
    }, [searchTerm, currentPage, pageSize, shopId, selectedShopData, categoryId, selectedCategoryData, masterCategoryId, selectedMasterCategoryData]);

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

    const exportToExcel = async () => {
        try {
            const XLSX = await import("xlsx");
            const data = items.map(i => ({
                ID: i.id,
                Name: i.name,
                Price: i.price,
                Currency: i.currency,
                Shop: i.shopName || i.shopId,
                Category: i.categoryName || i.menuCategoryName || extraCategoryNames[i.menuCategoryId || (i as any).categoryId || -1] || 'Uncategorized',
                'Master Category': i.masterCategoryName || extraMasterCategoryNames[i.masterCategoryId!] || i.masterCategoryId || '-'
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "MenuItems");
            XLSX.writeFile(wb, "Menu_Items.xlsx");
        } catch (error) {
            handleApiError(error, "Failed to export Excel file");
        }
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
                                            <TableHead>M. Category</TableHead>
                                            <TableHead>Flags</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {displayItems.length > 0 ? (
                                            displayItems.map((item) => (
                                                <TableRow
                                                    key={item.id}
                                                    className={`cursor-pointer transition-colors ${selectedMenuItemId === item.id ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted/50'}`}
                                                    onClick={() => {
                                                        localStorage.setItem("lastSelectedMenuItemId", String(item.id));
                                                        setSelectedMenuItemId(item.id ?? null);
                                                        navigate(`/menus/items/create?id=${item.id}`);
                                                    }}
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
                                                        {item.nameMm && (item.nameEn || item.name) !== item.nameMm && (
                                                            <div className="text-xs text-muted-foreground">{item.nameMm}</div>
                                                        )}
                                                        <div className="text-xs text-muted-foreground/70 truncate max-w-[150px] mt-1">{item.descriptionEn || item.description}</div>
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
                                                    <TableCell className="text-sm">{item.shopName || item.shopId}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-normal whitespace-nowrap">
                                                            {item.categoryName || item.menuCategoryName || extraCategoryNames[item.menuCategoryId || (item as any).categoryId || -1] || "Uncategorized"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {(item.masterCategoryName || item.masterCategoryId) ? (
                                                            <Badge variant="outline" className="font-normal whitespace-nowrap bg-muted/20">
                                                                {item.masterCategoryName || extraMasterCategoryNames[item.masterCategoryId!] || item.masterCategoryId}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">-</span>
                                                        )}
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
                                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
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
