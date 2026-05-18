import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Plus,
    Search,
    Loader2,
    ArrowUpDown,
    Edit,
    Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PaymentMethodDTO } from "@/services/shopService";
import { DataTablePagination } from "@/components/DataTablePagination";
import {
    usePaymentMethods,
    useDeletePaymentMethodMutation
} from "@/hooks/payment-methods/usePaymentMethod";

export default function PaymentMethods() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: "" });

    const { data: response, isLoading } = usePaymentMethods({
        page: currentPage - 1,
        size: pageSize,
        search: searchTerm
    });

    const items = response?.content || [];
    const totalPages = response?.totalPages || 0;
    const totalElements = response?.totalElements || 0;

    const { mutateAsync: deletePaymentMethod, isPending: deleting } = useDeletePaymentMethodMutation();

    const handleSort = (key: keyof PaymentMethodDTO) => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key: String(key), direction });
        // Note: Real sorting should ideally happen on the server, but keeping local sort logic for now if needed.
    };

    const handleDeleteClick = (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        setDeleteDialog({ open: true, id, name });
    };

    const handleDeleteConfirm = async () => {
        await deletePaymentMethod(deleteDialog.id);
        setDeleteDialog({ open: false, id: 0, name: "" });
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
                            <Button onClick={() => navigate("/payment-methods/create")}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create New
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
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
                                            <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                                                <div className="flex items-center gap-2">Name <ArrowUpDown className="h-3 w-3" /></div>
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
                                                    onClick={() => navigate(`/payment-methods/edit/${item.id}`)}
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
                                                    <TableCell className="font-medium">{item.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={item.isActive ? "default" : "secondary"}>
                                                            {item.isActive ? "Active" : "Inactive"}
                                                        </Badge>
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
                                                                            onClick={() => navigate(`/payment-methods/edit/${item.id}`)}
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
                                                                            onClick={(e) => handleDeleteClick(e, item.id, item.name)}
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
                                    totalItems={totalElements}
                                    totalPages={totalPages}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !deleting && setDeleteDialog((d) => ({ ...d, open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Payment Method?</DialogTitle>
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
