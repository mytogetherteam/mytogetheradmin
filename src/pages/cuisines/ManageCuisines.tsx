import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cuisineService } from "@/services/cuisineService";
import { useCuisines } from "@/hooks/cuisine/useCuisine";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { TableImage } from "@/components/TableImage";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    MoreHorizontal,
    UtensilsCrossed,
    ArrowUpDown
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";

export default function ManageCuisines() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
    const isFirstSearchDebounce = useRef(true);

    useEffect(() => {
        const delayMs = isFirstSearchDebounce.current ? 0 : 500;
        isFirstSearchDebounce.current = false;
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), delayMs);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data, isPending: loading, refetch } = useCuisines({
        page: currentPage,
        size: pageSize,
        search: debouncedSearch.trim() || undefined,
    });

    const cuisines = data?.content || [];
    const totalItems = data?.totalElements ?? 0;
    const totalPages = Math.max(1, data?.totalPages ?? 1);

    useEffect(() => {
        if (!loading && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [loading, currentPage, totalPages]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await cuisineService.deleteCuisine(deleteId);
            toast.success("Cuisine deleted successfully");
            void refetch();
        } catch (error) {
            handleApiError(error, "Failed to delete cuisine");
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cuisine Management</h1>
                    <p className="text-muted-foreground">Manage and organize cuisine types for shops.</p>
                </div>
                <Button asChild className="gap-2">
                    <Link to="/cuisines/create">
                        <Plus className="h-4 w-4" />
                        Add New Cuisine
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <UtensilsCrossed className="h-5 w-5 text-primary" />
                        Cuisine Types
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search cuisines..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1 cursor-pointer hover:text-primary">
                                            Name (EN) <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                    </TableHead>
                                    <TableHead>MM Name</TableHead>
                                    <TableHead>TH Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Order</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><div className="h-10 w-10 rounded bg-muted animate-pulse" /></TableCell>
                                            <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                                            <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                                            <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                                            <TableCell><div className="h-6 w-16 bg-muted animate-pulse rounded-full" /></TableCell>
                                            <TableCell><div className="h-4 w-8 bg-muted animate-pulse rounded" /></TableCell>
                                            <TableCell className="text-right"><div className="h-8 w-8 ml-auto bg-muted animate-pulse rounded" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : cuisines.length > 0 ? (
                                    cuisines.map((cuisine) => (
                                        <TableRow 
                                            key={cuisine.id}
                                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => navigate(`/cuisines/edit/${cuisine.id}`)}
                                        >
                                            <TableCell>
                                                <TableImage src={cuisine.imageUrl} alt={cuisine.nameEn} />
                                            </TableCell>
                                            <TableCell className="font-medium">{cuisine.nameEn}</TableCell>
                                            <TableCell>{cuisine.nameMm}</TableCell>
                                            <TableCell>{cuisine.nameTh}</TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <Badge variant={cuisine.isActive !== false ? "default" : "secondary"} className={cuisine.isActive !== false ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200" : ""}>
                                                    {cuisine.isActive !== false ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{cuisine.displayOrder}</TableCell>
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/cuisines/edit/${cuisine.id}`); }}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={(e) => { e.stopPropagation(); setDeleteId(cuisine.id); }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            No cuisines found.
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
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setCurrentPage(1);
                        }}
                    />
                </CardContent>
            </Card>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Delete Cuisine?"
                description="This action cannot be undone. This will permanently delete the cuisine type from our servers."
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
                onCancel={() => setDeleteId(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
}
