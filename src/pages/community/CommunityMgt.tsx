import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { moderationService, Post, Comment } from "@/services/moderationService";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Search, User, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { DataTablePagination } from "@/components/DataTablePagination";
import { SortableTableHead } from "@/components/SortableTableHead";
import { SortConfig, toggleSort, sortData } from "@/lib/sort-utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";

export default function CommunityMgt() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Post[]>([]);

    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = (searchParams.get("tab") || "posts") as "posts" | "comments";
    const setTab = (v: "posts" | "comments") => setSearchParams({ tab: v });
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [postType, setPostType] = useState<string>("ALL");
    const [pageSize, setPageSize] = useState(20);
    const [totalElements, setTotalElements] = useState(0);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    // Delete Confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<"post" | "comment">("post");

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await moderationService.getPosts(
                page, pageSize, postType === "ALL" ? undefined : postType, search
            );
            setPosts(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements ?? data.content.length);
        } catch {
            toast.error("Failed to load posts");
        } finally {
            setLoading(false);
        }
    }, [page, postType, search, pageSize]);

    const fetchComments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await moderationService.getComments(page, pageSize, undefined, search);
            setComments(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements ?? data.content.length);
        } catch {
            toast.error("Failed to load comments");
        } finally {
            setLoading(false);
        }
    }, [page, search, pageSize]);

    useEffect(() => {
        if (tab === "posts") fetchPosts();
        else fetchComments();
    }, [tab, fetchPosts, fetchComments]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            if (deleteTarget === "post") {
                await moderationService.deletePost(deleteId);
                setPosts(prev => prev.filter(p => p.id !== deleteId));
            } else {
                await moderationService.deleteComment(deleteId);
                setComments(prev => prev.filter(c => c.id !== deleteId));
            }
            toast.success(`${deleteTarget === "post" ? "Post" : "Comment"} deleted`);
        } catch {
            toast.error("Action failed");
        } finally {
            setDeleteId(null);
        }
    };



    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key));
    const sortedPosts = sortData(posts, sortConfig);
    const sortedComments = sortData(comments, sortConfig);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-semibold md:text-2xl">Community Management</h1>
            </div>

            { }
            <Tabs value={tab} onValueChange={(v) => { setTab(v as "posts" | "comments"); setPage(0); }}>
                <TabsList>
                    <TabsTrigger value="posts">Posts Feed</TabsTrigger>
                    <TabsTrigger value="comments">Comment Board</TabsTrigger>
                </TabsList>

                <div className="flex flex-col md:flex-row gap-3 mt-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={`Search ${tab}...`}
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {tab === "posts" && (
                        <Select value={postType} onValueChange={setPostType}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="All Post Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Types</SelectItem>
                                <SelectItem value="GENERAL">General</SelectItem>
                                <SelectItem value="NEWS">News</SelectItem>
                                <SelectItem value="ALERT">Alert</SelectItem>
                                <SelectItem value="EVENT">Event</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <TabsContent value="posts" className="space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Community Posts</CardTitle>
                            <CardDescription>Manage user-generated content and platform updates.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <SortableTableHead label="Author" sortKey="authorName" sortConfig={sortConfig} onSort={handleSort} />
                                        <TableHead>Content</TableHead>
                                        <TableHead>Stats</TableHead>
                                        <SortableTableHead label="Status" sortKey="isHidden" sortConfig={sortConfig} onSort={handleSort} />
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
                                    ) : sortedPosts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                No posts found.
                                            </TableCell>
                                        </TableRow>
                                    ) : sortedPosts.map((p) => (
                                        <TableRow 
                                            key={p.id} 
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => navigate(`/community/posts/${p.id}`)}
                                        >
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{p.authorName}</p>
                                                        <p className="text-[10px] text-muted-foreground">ID: {p.authorId}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <div className="flex flex-col">
                                                    <p className="text-sm truncate">{p.content}</p>
                                                    {p.imageUrl && <p className="text-[10px] text-accent mt-1 flex items-center gap-1"><Shield className="h-2 w-2" /> Has Attachment</p>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-3 text-xs text-muted-foreground">
                                                    <span>{p.likeCount} Likes</span>
                                                    <span>{p.commentCount} Comments</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {p.isHidden ? (
                                                    <Badge className="text-destructive border-destructive/20 bg-destructive/5">Hidden</Badge>
                                                ) : (
                                                    <Badge className="text-green-600 border-green-200 bg-green-50">Active</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(p.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <TooltipProvider>
                                                    <div className="flex gap-1">

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm" variant="ghost" className="text-destructive"
                                                                    onClick={() => { setDeleteId(p.id); setDeleteTarget("post"); }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Delete post permanently</TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TooltipProvider>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="comments" className="space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Recent Comments</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <SortableTableHead label="Comment Author" sortKey="authorName" sortConfig={sortConfig} onSort={handleSort} />
                                        <SortableTableHead label="Post Author" sortKey="postAuthorName" sortConfig={sortConfig} onSort={handleSort} />
                                        <TableHead>Comment</TableHead>
                                        <TableHead>Post Reference</TableHead>
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
                                            <TableCell className="text-sm font-medium">{c.authorName || "Unknown"}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{c.postAuthorName || "Unknown"}</TableCell>
                                            <TableCell className="max-w-sm">
                                                <p className="text-sm truncate">{c.content}</p>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                ID: {c.postId || "Unknown"}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(c.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="sm" variant="ghost" className="text-destructive"
                                                                onClick={() => { setDeleteId(c.id); setDeleteTarget("comment"); }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Delete comment</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Pagination */}
                <DataTablePagination
                    currentPage={page + 1}
                    totalPages={totalPages}
                    totalItems={totalElements}
                    pageSize={pageSize}
                    onPageChange={(p) => setPage(p - 1)}
                    onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
                />
            </Tabs>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Permanent Deletion</DialogTitle>
                        <DialogDescription>
                            {deleteTarget === "post"
                                ? "This will permanently delete the post and all comments. This action cannot be undone."
                                : "This will permanently delete this comment. This action cannot be undone."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleDelete} variant="destructive">
                            Delete Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Re-using Badge from UI if possible, or simple span
function Badge({ className, children }: { className?: string, children: React.ReactNode }) {
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${className}`}>
            {children}
        </span>
    )
}
