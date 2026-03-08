import { useState, useEffect } from "react";
import { ShopService } from "@/services/shopService";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function CreateCategory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const isEditMode = !!id;

  const [name, setName] = useState("");
  const [nameMm, setNameMm] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [displayOrder, setDisplayOrder] = useState<number | "">(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Shop selector state (for create mode)
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [loadingShops, setLoadingShops] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Main Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);

  // Gallery state removed

  useEffect(() => {
    if (isEditMode && id) {
      loadCategory(parseInt(id));
    } else {
      // Reset form for create mode
      setName("");
      setNameMm("");
      setNameTh("");
      setNameEn("");
      setDisplayOrder(0);
      setIsActive(true);
      setExistingImage(null);
      setImageFile(null);
      setImagePreview(null);
      loadShops();
    }
  }, [id, isEditMode]);

  const loadShops = async () => {
    setLoadingShops(true);
    try {
      const res = await ShopService.getAllShops(0, 200);
      const list = res?.content || [];
      setShops(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingShops(false);
    }
  };

  const loadCategory = async (catId: number) => {
    setLoading(true);
    try {
      const res = await ShopService.getCategoryById(catId);
      const cat = res?.data || res;
      setName(cat.name || "");
      setNameMm(cat.nameMm || "");
      setNameTh(cat.nameTh || "");
      setNameEn(cat.nameEn || "");
      setDisplayOrder(cat.displayOrder ?? 1);
      setIsActive(cat.isActive !== false);
      if (cat.imageUrl || cat.image || cat.icon) {
        setExistingImage(cat.imageUrl || cat.image || cat.icon);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load menu category");
    } finally {
      setLoading(false);
    }
  };

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

    if (!isEditMode && !selectedShopId) {
      toast.error("Please select a shop first");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      const data = {
        name,
        nameMm: nameMm || undefined,
        nameTh: nameTh || undefined,
        nameEn: nameEn || undefined,
        displayOrder,
        isActive,
      };
      formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));

      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (isEditMode && id) {
        await ShopService.updateCategory(parseInt(id), formData);
        toast.success("Menu category updated successfully");
      } else {
        await ShopService.createCategory(parseInt(selectedShopId), formData);
        toast.success("Menu category created successfully");
      }
      navigate("/categories/manage");
    } catch (error) {
      console.error(error);
      toast.error(isEditMode ? "Failed to update menu category" : "Failed to create menu category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await ShopService.deleteCategory(parseInt(id));
      toast.success("Menu category deleted successfully");
      navigate("/categories/manage");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete menu category");
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
          {isEditMode ? "Edit Menu Category" : "Create Menu Category"}
        </h2>
        <p className="text-muted-foreground">
          {isEditMode ? "Update menu category details and media." : "Add a new menu category to a shop."}
        </p>
      </div>

      <Card className="border-solid">
        <CardHeader>
          <CardTitle>Menu Category Details</CardTitle>
          <CardDescription>Enter the category information and upload representative media.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onSubmit}>

            {/* Shop selector — create mode only */}
            {!isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="shopSelect">Shop <span className="text-red-500">*</span></Label>
                {loadingShops ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading shops...
                  </div>
                ) : (
                  <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                    <SelectTrigger id="shopSelect">
                      <SelectValue placeholder="Select a shop" />
                    </SelectTrigger>
                    <SelectContent>
                      {shops.map((shop) => (
                        <SelectItem key={shop.id} value={shop.id.toString()}>
                          {shop.nameEn || shop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="categoryName">Name <span className="text-red-500">*</span></Label>
                <Input
                  id="categoryName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Appetizers"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryNameMm">Name (Myanmar)</Label>
                <Input
                  id="categoryNameMm"
                  value={nameMm}
                  onChange={(e) => setNameMm(e.target.value)}
                  placeholder="e.g. ဆာလောင်မှု"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryNameEn">Name (English)</Label>
                <Input
                  id="categoryNameEn"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Appetizers"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryNameTh">Name (Thai)</Label>
                <Input
                  id="categoryNameTh"
                  value={nameTh}
                  onChange={(e) => setNameTh(e.target.value)}
                  placeholder="e.g. อาหารเรียกน้ำย่อย"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="text"
                  value={displayOrder}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d+$/.test(val)) setDisplayOrder(val === "" ? 1 : parseInt(val));
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
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              {/* Main Image */}
              <div className="space-y-2">
                <Label>Main Image</Label>
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg hover:bg-muted/50 cursor-pointer relative transition-colors">
                  <Input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleImageChange}
                  />
                  <div className="text-center space-y-2 pointer-events-none">
                    <div className="flex justify-center">
                      <Upload className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium">Upload Main Image</div>
                    <div className="text-xs text-muted-foreground">PNG, JPG or WebP</div>
                  </div>
                </div>
                {(imagePreview || existingImage) && (
                  <div className="relative mt-4 aspect-video rounded-md overflow-hidden border group w-full max-w-xs">
                    <img src={imagePreview || existingImage!} className="w-full h-full object-cover" alt="Main" />
                    <div className="absolute top-2 right-2 z-20">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 shadow-sm"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Gallery Photos removed */}
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
                  onClick={() => navigate("/categories/manage")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!name || submitting || (!isEditMode && !selectedShopId)}
                >
                  {submitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                  ) : isEditMode ? "Update" : "Create"}
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
              This action cannot be undone. This will permanently delete the menu category
              <strong> {name}</strong> and remove its data from the server.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
