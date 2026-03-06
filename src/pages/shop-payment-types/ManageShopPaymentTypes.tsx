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
    CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus,
    Search,
    Loader2,
    ArrowUpDown,
    Edit,
    Trash2,
    Store,
    QrCode
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ShopPaymentTypeService, ShopPaymentTypeDTO } from "@/services/shopPaymentTypeService";
import { ShopService, Shop } from "@/services/shopService";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

export default function ManageShopPaymentTypes() {
    const navigate = useNavigate();
    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedShopId, setSelectedShopId] = useState<string>("");
    const [items, setItems] = useState<ShopPaymentTypeDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingShops, setLoadingShops] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

    // Initial load: Fetch shops
    useEffect(() => {
        const fetchShops = async () => {
            try {
                const response = await ShopService.getAllShops(0, 100);
                setShops(response.content);
                // Pre-select first shop if available
                if (response.content.length > 0) {
                    setSelectedShopId(response.content[0].id.toString());
                }
            } catch (error) {
                console.error("Failed to load shops", error);
                toast.error("Failed to load shops");
            } finally {
                setLoadingShops(false);
            }
        };
        fetchShops();
    }, []);

    // Load payment types when shop changes
    useEffect(() => {
        if (selectedShopId) {
            loadItems(parseInt(selectedShopId));
        } else {
            setItems([]);
        }
    }, [selectedShopId]);

    const loadItems = async (shopId: number) => {
        setLoading(true);
        try {
            const data = await ShopPaymentTypeService.getShopPaymentTypes(shopId);
            setItems(data);
        } catch (error) {
            console.error("Failed to load payment types", error);
            toast.error("Failed to load payment types");
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: keyof ShopPaymentTypeDTO) => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key: String(key), direction });

        const sorted = [...items].sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];

            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (aVal !== undefined && bVal !== undefined) {
                if (aVal < bVal) return direction === "asc" ? -1 : 1;
                if (aVal > bVal) return direction === "asc" ? 1 : -1;
            }
            return 0;
        });
        setItems(sorted);
    };

    const handleToggleActive = async (item: ShopPaymentTypeDTO, value: boolean) => {
        try {
            const formData = new FormData();
            const requestBlob = new Blob([JSON.stringify({
                isActive: value,
                accountName: item.accountName,
                accountNumber: item.accountNumber,
                displayOrder: item.displayOrder
            })], { type: 'application/json' });
            formData.append('request', requestBlob);

            await ShopPaymentTypeService.updateShopPaymentType(item.shopId, item.id, formData);
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, isActive: value } : i));
            toast.success("Status updated");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this shop payment type?")) return;
        try {
            await ShopPaymentTypeService.deleteShopPaymentType(parseInt(selectedShopId), id);
            toast.success("Deleted successfully");
            loadItems(parseInt(selectedShopId));
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete");
        }
    };

    const exportToExcel = () => {
        const exportData = items.map(item => ({
            ID: item.id,
            'Payment Method': item.paymentMethodName,
            'Code': item.paymentMethodCode,
            'Account Name': item.accountName || '-',
            'Account Number': item.accountNumber || '-',
            'Order': item.displayOrder,
            'Status': item.isActive ? 'Active' : 'Inactive'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ShopPaymentTypes");

        const shopName = shops.find(s => s.id.toString() === selectedShopId)?.name || 'Shop';
        XLSX.writeFile(wb, `PaymentTypes_${shopName}.xlsx`);
    };

    const filteredItems = items.filter(item =>
        (item.paymentMethodName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.accountName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.accountNumber?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.paymentMethodCode?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto py-6 max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Shop Payment Types</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage QR codes and payment accounts for specific shops.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={exportToExcel} disabled={items.length === 0}>
                        Export Excel
                    </Button>
                    <Button onClick={() => navigate("/shop-payment-types/create" + (selectedShopId ? `?shopId=${selectedShopId}` : ""))}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Payment Type
                    </Button>
                </div>
            </div>

            <Card className="border-solid">
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 max-w-sm">
                            <div className="text-sm font-medium mb-1.5 flex items-center gap-2">
                                <Store className="h-4 w-4" /> Select Shop
                            </div>
                            <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingShops ? "Loading shops..." : "Choose a shop"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {shops.map((shop) => (
                                        <SelectItem key={shop.id} value={shop.id.toString()}>
                                            {shop.nameEn || shop.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 max-w-md ml-auto">
                            <div className="text-sm font-medium mb-1.5">Search</div>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, account..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {!selectedShopId ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                            <Store className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                            <h3 className="font-semibold text-lg">No Shop Selected</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto">
                                Please select a shop from the dropdown to see its available payment methods.
                            </p>
                        </div>
                    ) : loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-[80px]">ID</TableHead>
                                        <TableHead>QR / Method</TableHead>
                                        <TableHead className="cursor-pointer" onClick={() => handleSort("accountName")}>
                                            Account Name <ArrowUpDown className="ml-2 h-3 w-3 inline" />
                                        </TableHead>
                                        <TableHead>Account Number</TableHead>
                                        <TableHead className="w-[100px]">Order</TableHead>
                                        <TableHead className="w-[100px]">Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.length > 0 ? (
                                        filteredItems.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell className="font-mono text-xs">{item.id}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded border bg-white flex items-center justify-center overflow-hidden shrink-0">
                                                            {item.qrImageUrl ? (
                                                                <img src={item.qrImageUrl} alt="QR" className="h-full w-full object-contain" />
                                                            ) : (
                                                                <QrCode className="h-5 w-5 text-muted-foreground opacity-30" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{item.paymentMethodName}</div>
                                                            <Badge variant="outline" className="text-[10px] h-4">{item.paymentMethodCode}</Badge>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{item.accountName || '-'}</TableCell>
                                                <TableCell className="font-mono text-sm">{item.accountNumber || '-'}</TableCell>
                                                <TableCell>{item.displayOrder}</TableCell>
                                                <TableCell>
                                                    <Switch
                                                        checked={item.isActive}
                                                        onCheckedChange={(val) => handleToggleActive(item, val)}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => navigate(`/shop-payment-types/edit/${item.shopId}/${item.id}`)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleDelete(item.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-medium">
                                                {searchTerm ? "No payment types match your search." : "This shop has no payment types configured yet."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
