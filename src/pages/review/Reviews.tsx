import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar as CalendarIcon } from "lucide-react";
import { reviewService, Review, ReviewType } from "@/services/reviewService";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Trash2, MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Badge } from "@/components/ui/badge";
import { SortableTableHead } from "@/components/SortableTableHead";
import { SortConfig, toggleSort, sortData } from "@/lib/sort-utils";
import { toast } from "sonner";

export default function Reviews() {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<ReviewType>("SHOPS");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key));

    // Delete Confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState("");
    const [rating, setRating] = useState<string>("ALL");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const data = await reviewService.getReviews(type, currentPage - 1, pageSize, {
                search,
                rating,
                startDate,
                endDate
            });
            setReviews(data.content);
            setTotalPages(data.totalPages);
        } catch {
            toast.error("Failed to load reviews");
        } finally {
            setLoading(false);
        }
    }, [type, currentPage, pageSize, search, rating, startDate, endDate]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchReviews(); }, [type, currentPage, pageSize, search, rating, startDate, endDate]);

    const handleToggleVisibility = async (id: string, visible: boolean) => {
        try {
            await reviewService.toggleVisibility(type, id, !visible);
            setReviews(prev => prev.map(r => r.id === id ? { ...r, isVisible: !visible } : r));
            toast.success(`Review visibility updated`);
        } catch {
            toast.error("Failed to update visibility");
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await reviewService.deleteReview(type, deleteId);
            setReviews(prev => prev.filter(r => r.id !== deleteId));
            toast.success("Review deleted");
        } catch {
            toast.error("Failed to delete review");
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-semibold md:text-2xl">Reviews Moderation</h1>
            </div>

            <Tabs value={type} onValueChange={(v) => { setType(v as ReviewType); setCurrentPage(1); }}>
                <TabsList>
                    <TabsTrigger value="SHOPS">Shop Reviews</TabsTrigger>
                    <TabsTrigger value="ITEMS">Menu Item Reviews</TabsTrigger>
                </TabsList>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search reviews..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <Select value={rating} onValueChange={(val) => { setRating(val); setCurrentPage(1); }}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Ratings" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Ratings</SelectItem>
                            <SelectItem value="5">5 Stars</SelectItem>
                            <SelectItem value="4">4 Stars</SelectItem>
                            <SelectItem value="3">3 Stars</SelectItem>
                            <SelectItem value="2">2 Stars</SelectItem>
                            <SelectItem value="1">1 Star</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="date"
                            className="pl-9"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                        />
                        <span className="absolute -top-5 left-1 text-[10px] text-muted-foreground uppercase font-bold">Start Date</span>
                    </div>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="date"
                            className="pl-9"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                        />
                        <span className="absolute -top-5 left-1 text-[10px] text-muted-foreground uppercase font-bold">End Date</span>
                    </div>
                </div>

                <TabsContent value={type} className="mt-4 space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                                {type === "SHOPS" ? "Shop" : "Menu Item"} Reviews
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <SortableTableHead label="Reviewer" sortKey="reviewerName" sortConfig={sortConfig} onSort={handleSort} />
                                        <SortableTableHead label="Target" sortKey="targetName" sortConfig={sortConfig} onSort={handleSort} />
                                        <SortableTableHead label="Rating" sortKey="rating" sortConfig={sortConfig} onSort={handleSort} />
                                        <TableHead>Comment</TableHead>
                                        <TableHead>Verified</TableHead>
                                        <TableHead>Visible</TableHead>
                                        <SortableTableHead label="Date" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} />
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}>
                                                {[...Array(7)].map((__, j) => (
                                                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : reviews.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                                No reviews found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sortData(reviews, sortConfig).map((r) => (
                                            <TableRow
                                                key={r.id}
                                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => navigate(`/review/${type.toLowerCase()}/${r.id}`)}
                                            >
                                                <TableCell className="font-medium text-sm">{r.reviewerName}</TableCell>
                                                <TableCell className="text-sm">{r.targetName || "N/A"}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-0.5">
                                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                        <span className="text-sm">{r.rating ?? 0}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-xs text-sm truncate" title={r.comment}>
                                                    {r.comment || "No comment"}
                                                </TableCell>
                                                <TableCell>
                                                    {r.isVerified ? (
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Yes
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 gap-1">
                                                            <XCircle className="h-3 w-3" />
                                                            No
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <Switch
                                                        checked={r.isVisible}
                                                        onCheckedChange={() => handleToggleVisibility(r.id, r.isVisible)}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                                                </TableCell>
                                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10"
                                                                    onClick={() => setDeleteId(r.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Delete review permanently</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <DataTablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={reviews.length * totalPages} // Approximation since we don't have totalItems from API
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                    />
                </TabsContent>
            </Tabs>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This review will be permanently deleted from the platform.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleDelete} variant="destructive">
                            Delete Review
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
