import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  socialPostsService,
  SocialPost,
  SocialPostMedia,
} from "@/services/socialPostsService";
import { ShopSelect } from "@/components/ShopSelect";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, Trash2, Upload, X } from "lucide-react";

type LocalMedia = {
  file: File;
  previewUrl: string;
  kind: "image" | "video";
};

export default function SocialPostForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const editId = id || searchParams.get("id");
  const isEditMode = !!editId;

  const [content, setContent] = useState("");
  const [shopId, setShopId] = useState<number | null>(null);
  /** Shop id loaded from the server (edit only) — used so clearShop still works after ShopSelect clears. */
  const [initialShopId, setInitialShopId] = useState<number | null>(null);
  /** Only admin-published posts may change shop attribution (Nest rule). */
  const [canEditShopAttribution, setCanEditShopAttribution] = useState(true);
  const [clearShop, setClearShop] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [existingMedia, setExistingMedia] = useState<SocialPostMedia[]>([]);
  const [removeMediaIds, setRemoveMediaIds] = useState<number[]>([]);
  const [localMedia, setLocalMedia] = useState<LocalMedia[]>([]);
  const [currentShopLabel, setCurrentShopLabel] = useState<string | null>(null);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditMode || !editId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const post = await socialPostsService.getPostDetail(editId);
        if (cancelled) return;
        applyPost(post);
      } catch (error) {
        handleApiError(error, "Failed to load post");
        navigate("/community/posts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, isEditMode, navigate]);

  useEffect(() => {
    return () => {
      localMedia.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPost = (post: SocialPost) => {
    setContent(post.content || "");
    setIsActive(post.isActive !== false);
    setExistingMedia(post.media || []);
    setRemoveMediaIds([]);
    setClearShop(false);
    setCanEditShopAttribution(post.createdByAdminId != null);
    if (post.shopId) {
      setShopId(post.shopId);
      setInitialShopId(post.shopId);
      const shopName =
        post.author?.type === "SHOP"
          ? post.author.nameEn || post.author.nameMm || `Shop #${post.shopId}`
          : `Shop #${post.shopId}`;
      setCurrentShopLabel(shopName);
    } else {
      setShopId(null);
      setInitialShopId(null);
      setCurrentShopLabel(
        post.author?.type === "USER"
          ? post.author.name || post.author.username || `User #${post.author.id}`
          : post.author?.type === "ADMIN"
            ? post.author.name || post.author.username || "Admin"
            : null,
      );
    }
  };

  const remainingExisting = useMemo(
    () => existingMedia.filter((m) => !removeMediaIds.includes(m.id)),
    [existingMedia, removeMediaIds],
  );

  const totalMediaCount = remainingExisting.length + localMedia.length;

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const next: LocalMedia[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        toast.error(`Unsupported file: ${file.name}`);
        continue;
      }
      if (totalMediaCount + next.length >= 10) {
        toast.error("A post may have at most 10 media items");
        break;
      }
      next.push({
        file,
        previewUrl: URL.createObjectURL(file),
        kind: file.type.startsWith("video/") ? "video" : "image",
      });
    }
    if (next.length) setLocalMedia((prev) => [...prev, ...next]);
  };

  const removeLocal = (index: number) => {
    setLocalMedia((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && totalMediaCount === 0) {
      toast.error("Add a caption or at least one media file");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode && editId) {
        await socialPostsService.updatePost(editId, {
          content,
          isActive,
          // Only send attribution fields when they actually change on admin-published posts.
          ...(canEditShopAttribution && clearShop
            ? { clearShop: true }
            : canEditShopAttribution &&
                shopId != null &&
                shopId !== initialShopId
              ? { shopId }
              : {}),
          mediaFiles: localMedia.map((m) => m.file),
          removeMediaIds,
        });
        toast.success("Post updated");
      } else {
        await socialPostsService.createPost({
          content,
          shopId,
          isActive,
          mediaFiles: localMedia.map((m) => m.file),
        });
        toast.success("Post published");
      }
      navigate("/community/posts");
    } catch (error) {
      handleApiError(error, isEditMode ? "Failed to update post" : "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading post…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/community/posts")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">
            {isEditMode ? "Edit Social Post" : "Create Social Post"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Publish images and uploaded video to the Social feed. Shop is optional.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content</CardTitle>
            <CardDescription>Caption and optional shop attribution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Caption</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Write a caption…"
                maxLength={5000}
              />
            </div>

            <div className="space-y-2">
              <Label>Shop (optional)</Label>
              {currentShopLabel && !clearShop && (
                <p className="text-xs text-muted-foreground">
                  {canEditShopAttribution ? "Current: " : "Author: "}
                  {currentShopLabel}
                </p>
              )}
              {!canEditShopAttribution && isEditMode && (
                <p className="text-xs text-muted-foreground">
                  Shop attribution can only be changed on admin-published posts.
                  You can still edit caption, media, and visibility.
                </p>
              )}
              {canEditShopAttribution && clearShop && (
                <p className="text-xs text-amber-700">
                  Shop attribution will be cleared on save (admin-authored).
                </p>
              )}
              {canEditShopAttribution && (
                <>
                  <ShopSelect
                    placeholder="Attribute to a shop (optional)"
                    onSelect={(id) => {
                      setShopId(id);
                      if (id == null) {
                        // Edit with an existing shop: clearing the picker must send clearShop.
                        setClearShop(isEditMode && initialShopId != null);
                        setCurrentShopLabel(null);
                      } else {
                        setClearShop(false);
                      }
                    }}
                  />
                  {isEditMode && initialShopId != null && (
                    <div className="flex items-center gap-2 pt-1">
                      <Switch
                        checked={clearShop}
                        onCheckedChange={(v) => {
                          setClearShop(v);
                          if (v) {
                            setShopId(null);
                            setCurrentShopLabel(null);
                          } else {
                            setShopId(initialShopId);
                          }
                        }}
                      />
                      <Label className="text-sm font-normal">
                        Clear shop attribution (publish as admin)
                      </Label>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="isActive" />
              <Label htmlFor="isActive" className="font-normal">
                Visible in feed
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Media</CardTitle>
            <CardDescription>
              Images and videos (max 10). Video thumbnails are generated automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {remainingExisting.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {remainingExisting.map((m) => (
                  <div key={m.id} className="relative rounded-md border overflow-hidden bg-muted">
                    {m.type === "VIDEO" ? (
                      <video
                        src={m.url}
                        poster={m.thumbnailUrl || undefined}
                        className="h-36 w-full object-cover"
                        muted
                      />
                    ) : (
                      <img src={m.url} alt="" className="h-36 w-full object-cover" />
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => setRemoveMediaIds((prev) => [...prev, m.id])}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                      {m.type}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {localMedia.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {localMedia.map((m, index) => (
                  <div key={`${m.file.name}-${index}`} className="relative rounded-md border overflow-hidden bg-muted">
                    {m.kind === "video" ? (
                      <video src={m.previewUrl} className="h-36 w-full object-cover" muted />
                    ) : (
                      <img src={m.previewUrl} alt="" className="h-36 w-full object-cover" />
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => removeLocal(index)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 cursor-pointer hover:bg-muted/40">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to add images or videos ({totalMediaCount}/10)
              </span>
              <Input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/community/posts")}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Save changes" : "Publish"}
          </Button>
        </div>
      </form>
    </div>
  );
}
