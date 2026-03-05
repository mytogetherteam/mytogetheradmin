import { useEffect, useState, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { reviewService, Review, ReviewType } from "@/services/reviewService";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Trash2, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function Reviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<ReviewType>("SHOPS");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Delete Confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const data = await reviewService.getReviews(type, page);
            setReviews(data.content);
            setTotalPages(data.totalPages);
        } catch {
            toast.error("Failed to load reviews");
        } finally {
            setLoading(false);
        }
    }, [type, page]);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

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

            <Tabs value={type} onValueChange={(v) => { setType(v as ReviewType); setPage(0); }}>
                <TabsList>
                    <TabsTrigger value="SHOPS">Shop Reviews</TabsTrigger>
                    <TabsTrigger value="ITEMS">Menu Item Reviews</TabsTrigger>
                </TabsList>

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
                                        <TableHead>Reviewer</TableHead>
                                        <TableHead>Target</TableHead>
                                        <TableHead>Rating</TableHead>
                                        <TableHead>Comment</TableHead>
                                        <TableHead>Photos</TableHead>
                                        <TableHead>Visible</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}>
                                                {[...Array(8)].map((__, j) => (
                                                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : reviews.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                                No reviews found.
                                            </TableCell>
                                        </TableRow>
                                    ) : reviews.map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell className="font-medium text-sm">{r.reviewerName}</TableCell>
                                            <TableCell className="text-sm">{r.targetName}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-0.5">
                                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                    <span className="text-sm">{r.rating}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <p className="text-sm truncate" title={r.comment}>{r.comment}</p>
                                            </TableCell>
                                            <TableCell>
                                                {r.photoUrls && r.photoUrls.length > 0 ? (
                                                    <div className="flex -space-x-2">
                                                        {r.photoUrls.slice(0, 3).map((url, i) => (
                                                            <div key={i} className="h-6 w-6 rounded-full border border-background overflow-hidden bg-muted">
                                                                <img src={url} alt="" className="h-full w-full object-cover" />
                                                            </div>
                                                        ))}
                                                        {r.photoUrls.length > 3 && (
                                                            <div className="h-6 w-6 rounded-full border border-background bg-muted flex items-center justify-center text-[8px] font-bold">
                                                                +{r.photoUrls.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">No photos</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Switch
                                                    checked={r.isVisible}
                                                    onCheckedChange={() => handleToggleVisibility(r.id, r.isVisible)}
                                                />
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(r.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => setDeleteId(r.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Pagination */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page === 0 || loading} onClick={() => setPage((p) => p - 1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" disabled={page >= totalPages - 1 || loading} onClick={() => setPage((p) => p + 1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
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
