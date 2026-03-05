import { useState, useEffect } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Plus,
    Search,
    Loader2,
    FileSpreadsheet,
    ArrowUpDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { menuService } from "@/services/menuService";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";

export default function ManageMenuItems() {
    const navigate = useNavigate();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

    const loadItems = async () => {
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
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadItems();
        }, 300);
        return () => clearTimeout(timer);
    }, [currentPage, pageSize, searchTerm]);

    const handleSort = (key: string) => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });

        const sorted = [...items].sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (aVal < bVal) return direction === "asc" ? -1 : 1;
            if (aVal > bVal) return direction === "asc" ? 1 : -1;
            return 0;
        });
        setItems(sorted);
    };

    const handleToggleFlag = async (item: any, flagType: 'recommended' | 'popular' | 'available' | 'hotdeal', value: boolean) => {
        try {
            switch (flagType) {
                case 'recommended':
                    await menuService.toggleRecommended(item.id, value);
                    break;
                case 'popular':
                    await menuService.togglePopular(item.id, value);
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
                            ...(flagType === 'popular' && { isPopular: value }),
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
                                            <TableHead className="w-[80px] cursor-pointer" onClick={() => handleSort("id")}>
                                                <div className="flex items-center gap-2">ID <ArrowUpDown className="h-3 w-3" /></div>
                                            </TableHead>
                                            <TableHead>Image</TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                                                <div className="flex items-center gap-2">Name <ArrowUpDown className="h-3 w-3" /></div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort("price")}>
                                                <div className="flex items-center gap-2">Price <ArrowUpDown className="h-3 w-3" /></div>
                                            </TableHead>
                                            <TableHead>Shop</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Flags</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.length > 0 ? (
                                            items.map((item) => (
                                                <TableRow
                                                    key={item.id}
                                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                    onClick={() => navigate(`/menus/items/create?id=${item.id}`)}
                                                >
                                                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                                                    <TableCell>
                                                        {item.imageUrl || item.imageUrls?.[0] ? (
                                                            <img
                                                                src={item.imageUrl || item.imageUrls?.[0]}
                                                                alt={item.name}
                                                                className="h-10 w-10 rounded object-cover border"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">No Img</div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{item.name}</div>
                                                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">{item.description}</div>
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
                                                        <Badge variant="outline" className="font-normal">{item.categoryName || "Uncategorized"}</Badge>
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center justify-between gap-2 max-w-[120px]">
                                                                <Label className="text-[10px] cursor-pointer" htmlFor={`avail-${item.id}`}>Avail</Label>
                                                                <Switch id={`avail-${item.id}`} className="scale-75 origin-right" checked={item.isAvailable} onCheckedChange={(val) => handleToggleFlag(item, 'available', val)} />
                                                            </div>
                                                            <div className="flex items-center justify-between gap-2 max-w-[120px]">
                                                                <Label className="text-[10px] cursor-pointer" htmlFor={`pop-${item.id}`}>Pop</Label>
                                                                <Switch id={`pop-${item.id}`} className="scale-75 origin-right" checked={item.isPopular} onCheckedChange={(val) => handleToggleFlag(item, 'popular', val)} />
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
                                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                    No results found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex flex-col items-center gap-4 py-4 md:flex-row md:justify-between px-2">
                                <div className="text-sm text-muted-foreground text-center md:text-left">
                                    Showing {totalItems ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                            let pageNum = i + 1;
                                            if (totalPages > 5) {
                                                if (currentPage > 3) pageNum = currentPage - 2 + i;
                                                if (pageNum > totalPages) return null;
                                            }
                                            return (
                                                <Button
                                                    key={i}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Select
                                        value={`${pageSize}`}
                                        onValueChange={(value) => {
                                            setPageSize(Number(value));
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-[70px]">
                                            <SelectValue placeholder={pageSize} />
                                        </SelectTrigger>
                                        <SelectContent side="top">
                                            {[10, 20, 30, 40, 50].map((size) => (
                                                <SelectItem key={size} value={`${size}`}>
                                                    {size}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
