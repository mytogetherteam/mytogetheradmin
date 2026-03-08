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
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Loader2,
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Trash2,
    Edit,
    User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { shopRiderService, ShopRider } from "@/services/shopRiderService";
import { toast } from "sonner";

export default function ManageRiders() {
    const navigate = useNavigate();
    const [riders, setRiders] = useState<ShopRider[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // Delete confirmation dialog
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: "" });
    const [deleting, setDeleting] = useState(false);

    const loadRiders = async () => {
        setLoading(true);
        try {
            // Spring Boot pagination is 0-indexed
            const data = await shopRiderService.getAllRiders(currentPage - 1, pageSize, searchTerm);
            if (data && data.content) {
                setRiders(data.content);
                setTotalItems(data.totalElements);
                setTotalPages(data.totalPages);
            } else {
                setRiders([]);
                setTotalItems(0);
                setTotalPages(1);
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to load shop riders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRiders();
    }, [currentPage, pageSize, searchTerm]);

    const getShopName = (rider: ShopRider) => {
        return rider.shopName || `Shop #${rider.shopId}`;
    };

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const currentRiders = riders;

    const handleDeleteClick = (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        setDeleteDialog({ open: true, id, name });
    };

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            await shopRiderService.deleteRider(deleteDialog.id);
            toast.success("Rider deleted successfully");
            setDeleteDialog({ open: false, id: 0, name: "" });
            loadRiders();
        } catch (e) {
            console.error(e);
            toast.error("Failed to delete rider");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-7xl">
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="leading-tight flex items-center gap-2">
                                <User className="h-5 w-5" /> Manage Shop Riders
                            </CardTitle>
                            <CardDescription className="line-clamp-2 md:line-clamp-none">
                                Manage delivery personnel and riders for shops.
                            </CardDescription>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search riders or shop..."
                                    className="pl-8 w-full sm:w-[250px]"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                            <Button onClick={() => navigate("/shops/riders/create")}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Rider
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
                                            <TableHead className="w-[80px]">
                                                <div className="flex items-center gap-2">ID</div>
                                            </TableHead>
                                            <TableHead>
                                                <div className="flex items-center gap-2">Name</div>
                                            </TableHead>
                                            <TableHead>
                                                <div className="flex items-center gap-2">Phone</div>
                                            </TableHead>
                                            <TableHead>Shop</TableHead>
                                            <TableHead>Vehicle</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentRiders.length > 0 ? (
                                            currentRiders.map((rider) => (
                                                <TableRow
                                                    key={rider.id}
                                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                    onClick={() => navigate(`/shops/riders/create?id=${rider.id}`)}
                                                >
                                                    <TableCell className="font-mono text-xs">{rider.id}</TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{rider.name}</div>
                                                    </TableCell>
                                                    <TableCell>{rider.phoneNo}</TableCell>
                                                    <TableCell>
                                                        <div className="text-sm font-medium">{getShopName(rider)}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            {rider.motorcycleNo || "—"}
                                                            {rider.vehicleType && <span className="text-xs text-muted-foreground ml-1">({rider.vehicleType})</span>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${rider.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                            {rider.isActive ? "Active" : "Inactive"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => { e.stopPropagation(); navigate(`/shops/riders/create?id=${rider.id}`); }}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                onClick={(e) => handleDeleteClick(e, rider.id, rider.name)}
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
                                                    No riders found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex flex-col items-center gap-4 py-4 md:flex-row md:justify-between px-2">
                                <div className="text-sm text-muted-foreground">
                                    Showing {totalItems ? startIndex + 1 : 0} to {endIndex} of {totalItems} entries
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                            let pageNum = i + 1;
                                            if (totalPages > 5 && currentPage > 3) pageNum = currentPage - 2 + i;
                                            if (pageNum > totalPages) return null;
                                            return (
                                                <Button key={i} variant={currentPage === pageNum ? "default" : "outline"} className="h-8 w-8 p-0" onClick={() => setCurrentPage(pageNum)}>
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Select value={`${pageSize}`} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                                        <SelectTrigger className="h-8 w-[70px]">
                                            <SelectValue placeholder={pageSize} />
                                        </SelectTrigger>
                                        <SelectContent side="top">
                                            {[10, 20, 30, 40, 50].map((size) => (
                                                <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !deleting && setDeleteDialog((d) => ({ ...d, open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Shop Rider?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete rider <strong>{deleteDialog.name}</strong>. This action cannot be undone.
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
