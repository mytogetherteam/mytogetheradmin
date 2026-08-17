import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    socialPostsService,
    mapSocialPostToRow,
    CommunityPostRow,
    CommunityCommentRow,
    SocialPost,
} from "@/services/socialPostsService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    Calendar,
    Clock,
    User,
    Heart,
    MessageSquare,
    Trash2,
    Shield,
    Image as ImageIcon,
    AlertCircle,
    EyeOff,
    Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function PostDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<CommunityPostRow | null>(null);
    const [rawPost, setRawPost] = useState<SocialPost | null>(null);
    const [comments, setComments] = useState<CommunityCommentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<"post" | "comment">("post");

    const fetchPostDetail = useCallback(async (postId: string) => {
        setLoading(true);
        try {
            const [postData, commentsData] = await Promise.all([
                socialPostsService.getPostDetail(postId),
                socialPostsService.getComments(0, 100, postId).catch(() => ({
                    content: [],
                    totalPages: 0,
                    totalElements: 0,
                    number: 0,
                    size: 100,
                })),
            ]);
            setRawPost(postData);
            setPost(mapSocialPostToRow(postData));
            setComments(commentsData.content);
        } catch (error) {
            handleApiError(error, "Failed to load post details");
            setPost(null);
            setRawPost(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (id) fetchPostDetail(id);
    }, [id, fetchPostDetail]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            if (deleteTarget === "post") {
                await socialPostsService.deletePost(deleteId);
                toast.success("Post deleted");
                navigate("/community/posts");
            } else {
                await socialPostsService.deleteComment(deleteId);
                setComments((prev) => prev.filter((c) => c.id !== deleteId));
                setPost((prev) =>
                    prev ? { ...prev, commentCount: Math.max(0, prev.commentCount - 1) } : null,
                );
                toast.success("Comment deleted");
            }
        } catch (error) {
            handleApiError(error, "Action failed");
        } finally {
            setDeleteId(null);
        }
    };

    const handleHide = async () => {
        if (!post) return;
        try {
            const updated = await socialPostsService.hidePost(post.id);
            setRawPost(updated);
            setPost(mapSocialPostToRow(updated));
            toast.success("Post hidden from feed");
        } catch (error) {
            handleApiError(error, "Failed to hide post");
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2"><Skeleton className="h-[400px] w-full" /></Card>
                    <Card><Skeleton className="h-[400px] w-full" /></Card>
                </div>
            </div>
        );
    }

    if (!post || !rawPost) {
        return (
            <div className="container mx-auto py-20 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold">Post Not Found</h2>
                <p className="text-sm text-muted-foreground mb-4">Request ID: {id}</p>
                <Button variant="outline" onClick={() => navigate("/community/posts")}>
                    Back to Feed
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 max-w-6xl space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/community/posts")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Post Detail</h1>
                    <p className="text-muted-foreground">ID: {post.id}</p>
                </div>
                <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
                    <Badge variant={post.isHidden ? "destructive" : "secondary"}>
                        {post.isHidden ? "Hidden" : "Active"}
                    </Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/community/posts/${post.id}/edit`)}
                    >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                    {!post.isHidden && (
                        <Button variant="outline" size="sm" onClick={handleHide}>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Hide
                        </Button>
                    )}
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => { setDeleteId(post.id); setDeleteTarget("post"); }}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Post
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <User className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{post.authorName}</CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                        <span className="text-xs">ID: {post.authorId}</span>
                                        <span className="text-muted-foreground">•</span>
                                        <Calendar className="h-3 w-3" />
                                        <span className="text-xs">{new Date(post.createdAt).toLocaleString()}</span>
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-base whitespace-pre-wrap">
                                {post.content || <span className="text-muted-foreground italic">(no caption)</span>}
                            </div>

                            {rawPost.media?.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {rawPost.media.map((m) => (
                                        <div key={m.id} className="rounded-lg border overflow-hidden bg-muted relative">
                                            {m.type === "VIDEO" ? (
                                                <video
                                                    src={m.url}
                                                    poster={m.thumbnailUrl || undefined}
                                                    controls
                                                    className="w-full max-h-[420px] object-contain bg-black"
                                                />
                                            ) : (
                                                <img
                                                    src={m.url}
                                                    alt=""
                                                    className="w-full max-h-[420px] object-contain"
                                                />
                                            )}
                                            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-md text-[10px] flex items-center gap-1">
                                                <ImageIcon className="h-3 w-3" />
                                                {m.type}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Separator />

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Heart className="h-4 w-4" />
                                    <span className="text-sm font-medium">{post.likeCount} Likes</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MessageSquare className="h-4 w-4" />
                                    <span className="text-sm font-medium">{post.commentCount} Comments</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Comments ({comments.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {comments.length > 0 ? (
                                <div className="divide-y">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="p-4 space-y-2 hover:bg-muted/30 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-bold">{comment.authorName}</span>
                                                    <span className="text-[10px] text-muted-foreground">ID: {comment.authorId}</span>
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(comment.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-destructive"
                                                                onClick={() => { setDeleteId(comment.id); setDeleteTarget("comment"); }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Delete comment</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <p className="text-sm">{comment.content}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-muted-foreground">
                                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm italic">No comments yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Moderation Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase text-muted-foreground font-bold">Visibility</p>
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${post.isHidden ? "bg-destructive" : "bg-green-500"}`} />
                                    <span className="text-sm font-medium">
                                        {post.isHidden ? "Hidden from public" : "Publicly visible"}
                                    </span>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase text-muted-foreground font-bold">Author type</p>
                                <p className="text-sm font-medium">{rawPost.author?.type || "Unknown"}</p>
                            </div>
                            {rawPost.shopId != null && (
                                <>
                                    <Separator />
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Shop ID</p>
                                        <p className="text-sm font-medium">{rawPost.shopId}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Permanent Deletion</DialogTitle>
                        <DialogDescription>
                            {deleteTarget === "post"
                                ? "This will permanently delete the post and all associated comments. This action cannot be undone."
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
