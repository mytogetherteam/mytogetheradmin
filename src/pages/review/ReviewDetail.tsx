import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { reviewService, Review, ReviewType } from "@/services/reviewService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    Star,
    Calendar,
    Mail,
    Phone,
    Store,
    MessageSquare,
    CheckCircle2,
    XCircle,
    Info,
    ThumbsUp,
    Camera,
    Trash2
} from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export default function ReviewDetail() {
    const { type, id } = useParams<{ type: string; id: string }>();
    const navigate = useNavigate();
    const [review, setReview] = useState<Review | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchReviewDetail = useCallback(async (reviewType: ReviewType, reviewId: string) => {
        setLoading(true);
        try {
            const data = await reviewService.getReviewDetail(reviewType, reviewId);
            setReview(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load review details");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (id && type) {
            const reviewType = type.toUpperCase() as ReviewType;
            fetchReviewDetail(reviewType, id);
        }
    }, [id, type, fetchReviewDetail]);

    if (loading) {
        return (
            <div className="container mx-auto py-10 space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2"><Skeleton className="h-[400px] w-full" /></Card>
                    <Card><Skeleton className="h-[400px] w-full" /></Card>
                </div>
            </div>
        );
    }

    if (!review) {
        return (
            <div className="container mx-auto py-20 text-center">
                <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold">Review Not Found</h2>
                <Button variant="link" onClick={() => navigate("/review/reviews")}>Back to Reviews</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 max-w-5xl space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Review Details</h1>
                    <p className="text-muted-foreground">ID: #{review.id}</p>
                </div>
                <div className="ml-auto">
                    {review.isVisible ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">Visible</Badge>
                    ) : (
                        <Badge variant="secondary">Hidden</Badge>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>Feedback</span>
                                <div className="flex items-center gap-1 text-yellow-500">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`h-5 w-5 ${i < review.rating ? 'fill-current' : 'text-muted'}`} />
                                    ))}
                                    <span className="ml-2 text-foreground font-bold">{review.rating}/5</span>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Comment
                                </h3>
                                <p className="text-lg bg-muted/30 p-4 rounded-lg italic">
                                    "{review.comment || 'No comment provided'}"
                                </p>
                                {review.commentMm && (
                                    <p className="mt-4 text-lg bg-muted/20 p-4 rounded-lg italic text-muted-foreground">
                                        "{review.commentMm}"
                                    </p>
                                )}
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        <ThumbsUp className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Helpful Count</p>
                                        <p className="font-bold text-lg">{review.helpfulCount}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                        <Camera className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Photos</p>
                                        <p className="font-bold text-lg">{review.photoCount}</p>
                                    </div>
                                </div>
                            </div>

                            {(review.photos && review.photos.length > 0) || (review.photoUrls && review.photoUrls.length > 0) ? (
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Photo Gallery</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {/* Prefer photos with IDs for deletion, fallback to photoUrls for display */}
                                        {review.photos && review.photos.length > 0 ? (
                                            review.photos.map((photo) => (
                                                <div key={photo.id} className="aspect-square rounded-lg border overflow-hidden bg-muted relative group">
                                                    <img src={photo.url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity">
                                                        <a
                                                            href={photo.url} target="_blank" rel="noreferrer"
                                                            className="text-white text-xs font-medium hover:underline flex items-center gap-1"
                                                        >
                                                            View Original
                                                        </a>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="h-8 px-2"
                                                            onClick={async () => {
                                                                if (window.confirm("Are you sure you want to delete this photo?")) {
                                                                    try {
                                                                        await reviewService.deleteReviewPhoto(type?.toUpperCase() as ReviewType, photo.id);
                                                                        toast.success("Photo deleted successfully");
                                                                        // Refresh data
                                                                        if (type && id) fetchReviewDetail(type.toUpperCase() as ReviewType, id);
                                                                    } catch (error) {
                                                                        console.error(error);
                                                                        toast.error("Failed to delete photo");
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-3 w-3 mr-1" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            review.photoUrls?.map((url, i) => (
                                                <div key={i} className="aspect-square rounded-lg border overflow-hidden bg-muted relative group">
                                                    <img src={url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                                    <a
                                                        href={url} target="_blank" rel="noreferrer"
                                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                                    >
                                                        <span className="text-white text-xs font-medium">View Original</span>
                                                    </a>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    {/* Owner Response Section if applicable */}
                    <Card className={review.ownerResponse ? "border-primary/20 bg-primary/5 shadow-inner" : ""}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Store className="h-4 w-4" />
                                Shop Response
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {review.ownerResponse ? (
                                <div className="space-y-2">
                                    <p className="text-sm">{review.ownerResponse}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        Responded on {review.ownerResponseAt ? new Date(review.ownerResponseAt).toLocaleString() : '—'}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No response from the shop owner yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Reviewer Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {review.reviewerName?.charAt(0)}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-semibold truncate">{review.reviewerName}</p>
                                    <p className="text-xs text-muted-foreground">User ID: #{review.userId || 'Guest'}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div className="overflow-hidden">
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="text-sm truncate" title={review.reviewerEmail}>{review.reviewerEmail || '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Phone</p>
                                        <p className="text-sm">{review.userPhone || '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {review.isVerified ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-gray-400" />
                                    )}
                                    <span className={`text-sm font-medium ${review.isVerified ? 'text-green-600' : 'text-muted-foreground'}`}>
                                        {review.isVerified ? 'Verified Reviewer' : 'Unverified'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Store className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs text-muted-foreground">{type === 'SHOPS' ? 'Shop' : 'Menu Item'}</p>
                                    <p className="text-sm font-bold">{review.targetName}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Review Date</p>
                                    <p className="text-sm">{new Date(review.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
