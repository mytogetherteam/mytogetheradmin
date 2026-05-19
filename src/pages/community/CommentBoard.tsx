import { useEffect, useState, useCallback } from "react";
import { moderationService } from "@/services/moderationService";
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
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { DataTablePagination } from "@/components/DataTablePagination";
import { SortableTableHead } from "@/components/SortableTableHead";
import { SortConfig, toggleSort, sortData } from "@/lib/sort-utils";

interface Comment {
    id: string;
    authorName: string;
    authorId: string;
    content: string;
    postId?: string;
    postTitle?: string;
    createdAt: string;
}

export default function CommentBoard() {
    const [comments, setComments] = useState<Comment[]>([]);
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
            const data = await moderationService.getComments(currentPage - 1, pageSize, postIdFilter || undefined, search);
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
            await moderationService.deleteComment(deleteId);
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

            {/* Filters */}
            <form onSubmit={handleSearch} className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search comments..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Input
                    placeholder="Filter by Post ID (optional)"
                    value={postIdFilter}
                    onChange={(e) => setPostIdFilter(e.target.value)}
                    className="max-w-[200px]"
                />
                <Button type="submit" variant="secondary" size="sm">Search</Button>
            </form>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">All Comments</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="rounded-md border-t overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableTableHead label="Author" sortKey="authorName" sortConfig={sortConfig} onSort={handleSort} />
                                    <TableHead>Comment</TableHead>
                                    <TableHead>Parent Post</TableHead>
                                    <SortableTableHead label="Date" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} />
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            {[...Array(5)].map((__, j) => (
                                                <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : sortedComments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                            No comments found.
                                        </TableCell>
                                    </TableRow>
                                ) : sortedComments.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="text-sm font-medium">{c.authorName}</TableCell>
                                        <TableCell className="max-w-[300px]">
                                            <p className="text-sm truncate">{c.content}</p>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground font-mono">
                                            {c.postId?.slice(-8) ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(c.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm" variant="ghost"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => setDeleteId(c.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalElements}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => { if (!open) setDeleteId(null); }}
                title="Delete Comment"
                description="This action cannot be undone. The comment will be permanently removed."
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
                onCancel={() => setDeleteId(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
}
