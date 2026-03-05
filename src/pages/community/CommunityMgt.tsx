import { useEffect, useState, useCallback } from "react";
import { moderationService, Post } from "@/services/moderationService";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Search, ChevronLeft, ChevronRight, User, EyeOff, Shield, Users } from "lucide-react";
import { toast } from "sonner";
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
    const [posts, setPosts] = useState<Post[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<"posts" | "comments">("posts");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [postType, setPostType] = useState<string>("ALL");

    // Delete Confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<"post" | "comment">("post");

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await moderationService.getPosts(
                page, 20, postType === "ALL" ? undefined : postType, search
            );
            setPosts(data.content);
            setTotalPages(data.totalPages);
        } catch {
            toast.error("Failed to load posts");
        } finally {
            setLoading(false);
        }
    }, [page, postType, search]);

    const fetchComments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await moderationService.getComments(page, 20, undefined, search);
            setComments(data.content);
            setTotalPages(data.totalPages);
        } catch {
            toast.error("Failed to load comments");
        } finally {
            setLoading(false);
        }
    }, [page, search]);

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

    const handleHidePost = async (id: string) => {
        try {
            await moderationService.hidePost(id);
            setPosts(prev => prev.map(p => p.id === id ? { ...p, isHidden: !p.isHidden } : p));
            toast.success("Post visibility toggled");
        } catch {
            toast.error("Failed to hide post");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-semibold md:text-2xl">Community Management</h1>
            </div>

            <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setPage(0); }}>
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
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="All Post Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Types</SelectItem>
                                <SelectItem value="GENERAL">General</SelectItem>
                                <SelectItem value="LOST">Lost</SelectItem>
                                <SelectItem value="FOUND">Found</SelectItem>
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
                                        <TableHead>Author</TableHead>
                                        <TableHead>Content</TableHead>
                                        <TableHead>Stats</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
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
                                    ) : posts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                No posts found.
                                            </TableCell>
                                        </TableRow>
                                    ) : posts.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell>
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
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button size="sm" variant="ghost" onClick={() => handleHidePost(p.id)}>
                                                        <EyeOff className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm" variant="ghost" className="text-destructive"
                                                        onClick={() => { setDeleteId(p.id); setDeleteTarget("post"); }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
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
                                        <TableHead>Author</TableHead>
                                        <TableHead>Comment</TableHead>
                                        <TableHead>Post Reference</TableHead>
                                        <TableHead>Date</TableHead>
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
                                    ) : comments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                                No comments found.
                                            </TableCell>
                                        </TableRow>
                                    ) : comments.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell className="text-sm font-medium">{c.authorName}</TableCell>
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
                                                <Button
                                                    size="sm" variant="ghost" className="text-destructive"
                                                    onClick={() => { setDeleteId(c.id); setDeleteTarget("comment"); }}
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
                </TabsContent>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
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
            </Tabs>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Permanent Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this {deleteTarget}? This action cannot be undone.
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
