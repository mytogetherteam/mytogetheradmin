import { useState, useEffect } from "react";
import { ItemTagService } from "@/services/itemTagService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { formatImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Trash2, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

export default function CreateItemTag() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const isEditMode = !!id;

    const [nameMm, setNameMm] = useState("");
    const [nameTh, setNameTh] = useState("");
    const [nameEn, setNameEn] = useState("");
    const [tagType, setTagType] = useState("");
    const [colorCode, setColorCode] = useState("#000000");
    const [displayOrder, setDisplayOrder] = useState<number | "">(1);
    const [isActive, setIsActive] = useState<boolean>(true);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Main Image state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);

    const loadTag = async (tagId: number) => {
        setLoading(true);
        try {
            const tag = await ItemTagService.getItemTagById(tagId);
            setNameMm(tag.nameMm || "");
            setNameTh(tag.nameTh || "");
            setNameEn(tag.nameEn || "");
            setTagType(tag.tagType || "");
            setColorCode(tag.colorCode || "#000000");
            setDisplayOrder(tag.displayOrder || 1);
            setIsActive(tag.isActive !== false);
            if (tag.iconUrl) {
                setExistingImage(tag.iconUrl);
            }
        } catch (error) {
            handleApiError(error, "Failed to load item tag");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isEditMode && id) {
            loadTag(parseInt(id));
        } else {
            setNameMm("");
            setNameTh("");
            setNameEn("");
            setTagType("");
            setColorCode("#000000");
            setDisplayOrder(1);
            setIsActive(true);
            setExistingImage(null);
            setImageFile(null);
            setImagePreview(null);
        }
    }, [id, isEditMode]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setExistingImage(null);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setSubmitting(true);
        try {
            const dtoData = {
                nameMm: nameMm || "",
                nameTh: nameTh || "",
                nameEn: nameEn || "",
                tagType: tagType || "",
                colorCode: colorCode || "",
                displayOrder: displayOrder === "" || displayOrder < 1 ? 1 : displayOrder,
                isActive: isActive,
            };

            const formData = new FormData();
            formData.append("data", new Blob([JSON.stringify(dtoData)], { type: 'application/json' }));

            if (imageFile) {
                formData.append("image", imageFile);
            }

            if (isEditMode && id) {
                await ItemTagService.updateItemTag(parseInt(id), formData);
                toast.success("Item tag updated successfully");
            } else {
                await ItemTagService.createItemTag(formData);
                toast.success("Item tag created successfully");
            }
            navigate("/item-tags/manage");
        } catch (error) {
            handleApiError(error, isEditMode ? "Failed to update item tag" : "Failed to create item tag");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        setDeleting(true);
        try {
            await ItemTagService.deleteItemTag(parseInt(id));
            toast.success("Item tag deleted successfully");
            navigate("/item-tags/manage");
        } catch (error) {
            handleApiError(error, "Failed to delete item tag");
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight">
                    {isEditMode ? "Edit Item Tag" : "Create Item Tag"}
                </h2>
                <p className="text-muted-foreground">
                    {isEditMode ? "Update global item discovery tag details." : "Add a new global item discovery tag."}
                </p>
            </div>

            <Card className="border-solid">
                <CardHeader>
                    <CardTitle>Item Tag Details</CardTitle>
                    <CardDescription>Enter the tag information and upload an icon.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-6" onSubmit={onSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tagNameEn">Name (English)</Label>
                                <Input
                                    id="tagNameEn"
                                    value={nameEn}
                                    onChange={(e) => setNameEn(e.target.value)}
                                    placeholder="e.g. Mala"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tagNameMm">Name (Myanmar)</Label>
                                <Input
                                    id="tagNameMm"
                                    value={nameMm}
                                    onChange={(e) => setNameMm(e.target.value)}
                                    placeholder="e.g. မာလာ"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tagNameTh">Name (Thai)</Label>
                                <Input
                                    id="tagNameTh"
                                    value={nameTh}
                                    onChange={(e) => setNameTh(e.target.value)}
                                    placeholder="e.g. หม่าล่า"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tagType">Tag Type</Label>
                                <Input
                                    id="tagType"
                                    value={tagType}
                                    onChange={(e) => setTagType(e.target.value)}
                                    placeholder="e.g. FLAVOR, DIET, SPECIAL"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="colorCode">Color Code</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="colorPicker"
                                        type="color"
                                        value={colorCode}
                                        onChange={(e) => setColorCode(e.target.value)}
                                        className="w-12 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        id="colorCode"
                                        value={colorCode}
                                        onChange={(e) => setColorCode(e.target.value)}
                                        placeholder="#000000"
                                        className="flex-1 font-mono"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="displayOrder">Display Order</Label>
                                <Input
                                    id="displayOrder"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={displayOrder}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/^0+(?!$)/, "");
                                        if (val === "" || /^\d+$/.test(val)) {
                                            setDisplayOrder(val === "" ? "" : parseInt(val, 10));
                                        }
                                    }}
                                    onBlur={() => {
                                        if (displayOrder === "" || displayOrder < 1) setDisplayOrder(1);
                                    }}
                                    placeholder="1"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Switch
                                id="isActive"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                            <Label htmlFor="isActive">Active Status</Label>
                        </div>

                        <div className="space-y-2 pt-4 border-t">
                            <Label>Tag Icon</Label>
                            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg hover:bg-muted/50 cursor-pointer relative transition-colors h-48">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={handleImageChange}
                                />
                                {!imagePreview && !existingImage ? (
                                    <div className="text-center space-y-2 pointer-events-none">
                                        <div className="flex justify-center">
                                            <Upload className="h-10 w-10 text-muted-foreground" />
                                        </div>
                                        <div className="text-sm font-medium">Upload Tag Icon</div>
                                        <div className="text-xs text-muted-foreground">PNG, JPG or SVG</div>
                                    </div>
                                ) : (
                                    <div className="relative h-full aspect-square group">
                                        <img src={formatImageUrl(existingImage) || imagePreview || ""} className="h-full w-full object-contain rounded" alt="Main" />
                                        <div className="absolute top-1 right-1 z-20">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="h-6 w-6 rounded-full shadow-sm"
                                                onClick={removeImage}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                            {isEditMode && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => setDeleteDialogOpen(true)}
                                    disabled={submitting || deleting}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            )}
                            <div className="flex gap-3 ml-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/item-tags/manage")}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!nameEn || submitting}
                                >
                                    {submitting ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                                    ) : isEditMode ? "Update Tag" : "Create Tag"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the item tag
                            <strong> {nameEn || nameMm || "this tag"}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? "Deleting..." : "Delete Item Tag"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
