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
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Search,
    Loader2,
    ArrowUpDown,
    Edit,
    Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PaymentService } from "@/services/paymentService";
import { PaymentMethodDTO } from "@/services/shopService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { DataTablePagination } from "@/components/DataTablePagination";

export default function PaymentMethods() {
    const navigate = useNavigate();
    const [items, setItems] = useState<PaymentMethodDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

    const loadItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await PaymentService.getPaymentMethods({
                page: currentPage - 1,
                size: pageSize,
                search: searchTerm
            });

            setItems(response.content);
            setTotalPages(response.totalPages);
            setTotalItems(response.totalElements);
        } catch (error) {
            handleApiError(error, "Failed to load payment methods");
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadItems();
        }, 300);
        return () => clearTimeout(timer);
    }, [loadItems]);

    const handleSort = (key: keyof PaymentMethodDTO) => {
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

    const handleToggleActive = async (item: PaymentMethodDTO, value: boolean) => {
        try {
            await PaymentService.updatePaymentMethod(item.id, { active: value });
            setItems(prevItems =>
                prevItems.map(i => i.id === item.id ? { ...i, active: value } : i)
            );
            toast.success(`Payment method updated successfully`);
        } catch (error) {
            handleApiError(error, "Failed to update status");
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this payment method?")) return;

        try {
            await PaymentService.deletePaymentMethod(id);
            toast.success("Payment method deleted");
            loadItems(); // Reload the list
        } catch (error) {
            handleApiError(error, "Failed to delete payment method");
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-7xl">
            <Card className="flex flex-col h-full border-solid">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="leading-tight">Payment Methods</CardTitle>
                            <CardDescription className="line-clamp-2 md:line-clamp-none">
                                Manage payment methods available for shops.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search payment methods..."
                                    className="pl-8 w-full sm:w-[200px] lg:w-[300px]"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                            <Button onClick={() => navigate("/payment/methods/create")}>
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
                                            <TableHead>Icon</TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort("code")}>
                                                <div className="flex items-center gap-2">Code <ArrowUpDown className="h-3 w-3" /></div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                                                <div className="flex items-center gap-2">Name (EN) <ArrowUpDown className="h-3 w-3" /></div>
                                            </TableHead>
                                            <TableHead>Name (MM)</TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort("displayOrder")}>
                                                <div className="flex items-center gap-2">Order <ArrowUpDown className="h-3 w-3" /></div>
                                            </TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.length > 0 ? (
                                            items.map((item) => (
                                                <TableRow
                                                    key={item.id}
                                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                    onClick={() => navigate(`/payment/methods/edit/${item.id}`)}
                                                >
                                                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                                                    <TableCell>
                                                        {item.iconUrl ? (
                                                            <img
                                                                src={item.iconUrl}
                                                                alt={item.name}
                                                                className="h-8 w-8 rounded object-cover border"
                                                            />
                                                        ) : (
                                                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">N/A</div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        <Badge variant="outline">{item.code}</Badge>
                                                    </TableCell>
                                                    <TableCell>{item.name}</TableCell>
                                                    <TableCell>{item.nameMm || '-'}</TableCell>
                                                    <TableCell>{item.displayOrder}</TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <Switch
                                                            checked={item.active}
                                                            onCheckedChange={(val) => handleToggleActive(item, val)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                        <TooltipProvider>
                                                            <div className="flex justify-end gap-2">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-8 w-8"
                                                                            onClick={() => navigate(`/payment/methods/edit/${item.id}`)}
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Edit Payment Method</TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-8 w-8 text-destructive"
                                                                            onClick={(e) => handleDelete(e, item.id)}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Delete Payment Method</TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </TooltipProvider>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                                    No payment methods found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="py-4">
                                <DataTablePagination
                                    pageSize={pageSize}
                                    onPageSizeChange={setPageSize}
                                    currentPage={currentPage}
                                    onPageChange={setCurrentPage}
                                    totalItems={totalItems}
                                    totalPages={totalPages}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
