import { useEffect, useState, useCallback } from "react";
import { socialPostsService, CommunityCommentRow } from "@/services/socialPostsService";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTablePagination } from "@/components/DataTablePagination";
import { SortableTableHead } from "@/components/SortableTableHead";
import { SortConfig, toggleSort, sortData } from "@/lib/sort-utils";

export default function CommentBoard() {
    const [comments, setComments] = useState<CommunityCommentRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalElements, setTotalElements] = useState(0);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [search, setSearch] = useState("");
    const [postIdFilter, setPostIdFilter] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchComments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await socialPostsService.getComments(
                currentPage - 1,
                pageSize,
                postIdFilter || undefined,
                search,
            );
            const content = data?.content ?? [];
            setComments(content);
            setTotalElements(data?.totalElements ?? content.length);
        } catch (e) {
            handleApiError(e, "Failed to load comments");
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, search, postIdFilter]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchComments(); }, [currentPage, pageSize, search, postIdFilter]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await socialPostsService.deleteComment(deleteId);
            toast.success("Comment deleted");
            setDeleteId(null);
            fetchComments();
        } catch (e) {
            handleApiError(e, "Failed to delete comment");
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchComments();
    };

    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key));
    const sortedComments = sortData(comments, sortConfig);
    const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-semibold md:text-2xl">Comment Board</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Social post comments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search comments..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Input
                            placeholder="Filter by post ID"
                            className="md:w-48"
                            value={postIdFilter}
                            onChange={(e) => setPostIdFilter(e.target.value)}
                        />
                        <Button type="submit">Search</Button>
                    </form>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableTableHead label="Author" sortKey="authorName" sortConfig={sortConfig} onSort={handleSort} />
                                <SortableTableHead label="Post Author" sortKey="postAuthorName" sortConfig={sortConfig} onSort={handleSort} />
                                <TableHead>Comment</TableHead>
                                <TableHead>Post</TableHead>
                                <SortableTableHead label="Date" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} />
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        {[...Array(6)].map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : sortedComments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        No comments found.
                                    </TableCell>
                                </TableRow>
                            ) : sortedComments.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell className="text-sm font-medium">{c.authorName}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{c.postAuthorName}</TableCell>
                                    <TableCell className="max-w-sm">
                                        <p className="text-sm truncate">{c.content}</p>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">#{c.postId}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(c.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive"
                                            onClick={() => setDeleteId(c.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <DataTablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalElements}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                    />
                </CardContent>
            </Card>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This permanently deletes the comment. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
