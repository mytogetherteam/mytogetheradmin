import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cuisineService, CuisineDTO } from "@/services/cuisineService";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { TableImage } from "@/components/TableImage";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";

export default function ManageCuisines() {
    const navigate = useNavigate();
    const [cuisines, setCuisines] = useState<CuisineDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const fetchCuisines = useCallback(async () => {
        setLoading(true);
        try {
            const data = await cuisineService.getCuisines({
                page: page + 1,
                size: 10,
                search: searchTerm || undefined,
            });
            setCuisines(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            handleApiError(error, "Failed to load cuisines");
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm]);

    useEffect(() => {
        fetchCuisines();
    }, [page, searchTerm, fetchCuisines]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await cuisineService.deleteCuisine(deleteId);
            toast.success("Cuisine deleted successfully");
            fetchCuisines();
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
                                                <Badge variant={cuisine.active !== false ? "default" : "secondary"} className={cuisine.active !== false ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200" : ""}>
                                                    {cuisine.active !== false ? "Active" : "Inactive"}
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

                    {totalPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                            >
                                Previous
                            </Button>
                            <div className="text-sm font-medium">
                                Page {page + 1} of {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page === totalPages - 1}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the cuisine type
                            from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
