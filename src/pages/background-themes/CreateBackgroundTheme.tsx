import { useState, useEffect } from "react";
import { BackgroundThemeService } from "@/services/backgroundThemeService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
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

export default function CreateBackgroundTheme() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const isEditMode = !!id;

    const [name, setName] = useState("");
    const [displayOrder, setDisplayOrder] = useState<string>("");
    const [isActive, setIsActive] = useState<boolean>(true);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);

    const loadTheme = async (themeId: number) => {
        setLoading(true);
        try {
            const theme = await BackgroundThemeService.getBackgroundThemeById(themeId);
            setName(theme.name || "");
            setDisplayOrder(theme.displayOrder ? String(theme.displayOrder) : "");
            setIsActive(theme.isActive !== false);
            setExistingImage(theme.imageUrl || null);
            setImageFile(null);
            setImagePreview(null);
        } catch (error) {
            handleApiError(error, "Failed to load background theme");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isEditMode && id) {
            loadTheme(parseInt(id));
        } else {
            setName("");
            setDisplayOrder("");
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

        if (!isEditMode && !imageFile) {
            toast.error("Background image is required");
            return;
        }

        setSubmitting(true);
        try {
            const dto: {
                name: string;
                displayOrder?: number;
                isActive: boolean;
            } = {
                name: name.trim(),
                isActive,
            };

            const order = parseInt(displayOrder, 10);
            if (!Number.isNaN(order) && order >= 1) {
                dto.displayOrder = order;
            }

            if (isEditMode && id) {
                await BackgroundThemeService.updateBackgroundTheme(
                    parseInt(id),
                    dto,
                    imageFile ?? undefined,
                );
                toast.success("Background theme updated successfully");
            } else {
                await BackgroundThemeService.createBackgroundTheme(dto, imageFile!);
                toast.success("Background theme created successfully");
            }
            navigate("/background-themes/manage");
        } catch (error) {
            handleApiError(
                error,
                isEditMode ? "Failed to update background theme" : "Failed to create background theme",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        setDeleting(true);
        try {
            await BackgroundThemeService.deleteBackgroundTheme(parseInt(id));
            toast.success("Background theme deleted successfully");
            navigate("/background-themes/manage");
        } catch (error) {
            handleApiError(error, "Failed to delete background theme");
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
                    {isEditMode ? "Edit Background Theme" : "Create Background Theme"}
                </h2>
                <p className="text-muted-foreground">
                    {isEditMode
                        ? "Update the app background theme details."
                        : "Add a new background image for the user app."}
                </p>
            </div>

            <Card className="border-solid">
                <CardHeader>
                    <CardTitle>Theme Details</CardTitle>
                    <CardDescription>Enter a name and upload a background image.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-6" onSubmit={onSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="name">
                                    Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Summer Gradient"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="displayOrder">Display Order</Label>
                                <Input
                                    id="displayOrder"
                                    type="number"
                                    min={1}
                                    value={displayOrder}
                                    onChange={(e) => setDisplayOrder(e.target.value)}
                                    placeholder="Auto-assigned if empty"
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
                            <Label>
                                Background Image {!isEditMode && <span className="text-destructive">*</span>}
                            </Label>
                            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg hover:bg-muted/50 cursor-pointer relative transition-colors h-56">
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
                                        <div className="text-sm font-medium">Upload Background Image</div>
                                        <div className="text-xs text-muted-foreground">PNG or JPG, up to 5MB</div>
                                    </div>
                                ) : (
                                    <div className="relative h-full w-full group">
                                        <img
                                            src={imagePreview || existingImage || ""}
                                            className="h-full w-full object-cover rounded"
                                            alt="Background preview"
                                        />
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
                                    onClick={() => navigate("/background-themes/manage")}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={!name.trim() || submitting}>
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : isEditMode ? (
                                        "Update Theme"
                                    ) : (
                                        "Create Theme"
                                    )}
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
                            This action cannot be undone. This will permanently delete the background theme
                            <strong> {name || "this theme"}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? "Deleting..." : "Delete Theme"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
