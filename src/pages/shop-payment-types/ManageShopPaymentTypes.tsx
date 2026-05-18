import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import { InfiniteSearchableSelect } from "@/components/ui/infinite-searchable-select";
import {
    Store,
    QrCode,
    Plus,
    Loader2,
    Edit,
    Trash2
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { ShopPaymentTypeService, ShopPaymentTypeDTO } from "@/services/shopPaymentTypeService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import * as XLSX from 'xlsx';
import { TableImage } from "@/components/TableImage";
import {
    useAdminShopProfilesBareInfiniteFetcher,
    type AdminShopProfileDropdownShop,
    shopRestaurantEditQueryKey,
} from "@/hooks/shops";
import { shopPaymentTypeKeys, useShopPaymentTypes } from "@/hooks/shop-payment-types/useShopPaymentType";

export default function ManageShopPaymentTypes() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedShopData, setSelectedShopData] = useState<AdminShopProfileDropdownShop | null>(null);
    const selectedShopId = selectedShopData?.id?.toString() || "";
    const { data: items = [], isLoading: loading } = useShopPaymentTypes(selectedShopId ? parseInt(selectedShopId) : undefined);
    const [selectedPaymentTypeId, setSelectedPaymentTypeId] = useState<number | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: "" });
    const [deleting, setDeleting] = useState(false);
    const { fetchShops: fetchShopData } = useAdminShopProfilesBareInfiniteFetcher();


    const handleToggleActive = async (item: ShopPaymentTypeDTO, value: boolean) => {
        try {
            const formData = new FormData();
            const requestBlob = new Blob([JSON.stringify({
                isActive: value,
                accountName: item.accountName,
                accountNumber: item.accountNumber,
                displayOrder: item.displayOrder
            })], { type: 'application/json' });
            formData.append('data', requestBlob);

            const updated = await ShopPaymentTypeService.updateShopPaymentType(item.shopId, item.id, formData);
            queryClient.setQueryData(
                shopPaymentTypeKeys.detail(item.shopId, item.id),
                updated,
            );
            void queryClient.invalidateQueries({
                queryKey: shopPaymentTypeKeys.byShop(item.shopId),
            });
            void queryClient.invalidateQueries({
                queryKey: shopRestaurantEditQueryKey(item.shopId),
            });
            toast.success("Status updated");
        } catch (error) {
            handleApiError(error, "Failed to update status");
        }
    };

    const handleDeleteClick = (id: number, name: string) => {
        setDeleteDialog({ open: true, id, name });
    };

    const handleDeleteConfirm = async () => {
        if (!selectedShopId) return;
        setDeleting(true);
        try {
            await ShopPaymentTypeService.deleteShopPaymentType(parseInt(selectedShopId), deleteDialog.id);
            toast.success("Deleted successfully");
            queryClient.removeQueries({
                queryKey: shopPaymentTypeKeys.detail(parseInt(selectedShopId), deleteDialog.id),
            });
            void queryClient.invalidateQueries({
                queryKey: shopPaymentTypeKeys.byShop(parseInt(selectedShopId)),
            });
            void queryClient.invalidateQueries({
                queryKey: shopRestaurantEditQueryKey(parseInt(selectedShopId)),
            });
            setDeleteDialog({ open: false, id: 0, name: "" });
        } catch (error) {
            handleApiError(error, "Failed to delete");
        } finally {
            setDeleting(false);
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

        const shopName = selectedShopData?.dropdownLabel || 'Shop';
        XLSX.writeFile(wb, `PaymentTypes_${shopName}.xlsx`);
    };

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
                            <InfiniteSearchableSelect
                                fetchData={fetchShopData}
                                valueKey="id"
                                labelKey="dropdownLabel"
                                selectedValue={selectedShopData}
                                onChange={setSelectedShopData}
                                placeholder="Choose a shop"
                            />
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
                        <>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="w-[80px]">ID</TableHead>
                                            <TableHead>QR / Method</TableHead>
                                            <TableHead>Account Name</TableHead>
                                            <TableHead>Account Number</TableHead>
                                            <TableHead className="w-[100px]">Order</TableHead>
                                            <TableHead className="w-[100px]">Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.length > 0 ? (
                                            items.map((item) => (
                                                <TableRow
                                                    key={item.id}
                                                    className={`transition-colors cursor-pointer ${selectedPaymentTypeId === item.id ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted/50'}`}
                                                    onClick={() => {
                                                        setSelectedPaymentTypeId(item.id);
                                                        navigate(`/shop-payment-types/edit/${item.shopId}/${item.id}`);
                                                    }}
                                                >
                                                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <TableImage
                                                                src={item.qrImageUrl}
                                                                alt="QR"
                                                                fallbackIcon={<QrCode className="h-5 w-5 text-muted-foreground opacity-30" />}
                                                            />
                                                            <div>
                                                                <div className="font-medium">{item.paymentMethodName}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{item.accountName || '-'}</TableCell>
                                                    <TableCell className="font-mono text-sm">{item.accountNumber || '-'}</TableCell>
                                                    <TableCell>{item.displayOrder}</TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <Switch
                                                            checked={item.isActive}
                                                            onCheckedChange={(val) => handleToggleActive(item, val)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setSelectedPaymentTypeId(item.id);
                                                                    navigate(`/shop-payment-types/edit/${item.shopId}/${item.id}`);
                                                                }}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => handleDeleteClick(item.id, item.paymentMethodName)}
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
                                                    This shop has no payment types configured yet.
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
                        <DialogTitle>Delete Shop Payment Type?</DialogTitle>
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
