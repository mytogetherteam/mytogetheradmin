import { useState, useEffect } from "react";
import { ShopService } from "@/services/shopService";
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
import { InfiniteSearchableSelect } from "@/components/ui/infinite-searchable-select";
import { useCallback } from "react";

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
  const [shopId, setShopId] = useState("");
  const [selectedShopData, setSelectedShopData] = useState<{ label: string, value: string } | null>(null);


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
      setDisplayOrder(1);
      setIsActive(true);
      setShopId("");
      setSelectedShopData(null);
      setExistingImage(null);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [id, isEditMode]);

  const fetchShopData = useCallback(async (page: number, size: number, search: string) => {
    const res = await ShopService.getAllShops(page, size, search);
    return {
      content: res.content.map(shop => ({ label: shop.nameEn || shop.name, value: String(shop.id) })),
      last: res.last
    };
  }, []);


  const loadCategory = async (catId: number) => {
    setLoading(true);
    try {
      const cat = await ShopService.getCategoryById(catId);
      setName(cat.nameEn || cat.name || "");
      setNameMm(cat.nameMm || "");
      setNameTh(cat.nameTh || "");
      setNameEn(cat.nameEn || "");
      setDisplayOrder(cat.displayOrder || 1);
      setIsActive(cat.isActive !== false);
      if (cat.shopId) {
        setShopId(cat.shopId.toString());
        setSelectedShopData({ label: cat.shopName || `Shop #${cat.shopId}`, value: cat.shopId.toString() });
        
        // Fetch real name if backend didn't provide it
        if (!cat.shopName) {
          ShopService.getShopById(cat.shopId).then((shop) => {
            setSelectedShopData({ label: shop.nameEn || shop.nameMm || `Shop ${shop.id}`, value: String(shop.id) });
          }).catch((e) => console.log("Failed to load shop name fallback", e));
        }
      }
      if (cat.imageUrl || cat.image || cat.icon) {
        setExistingImage(cat.imageUrl || cat.image || cat.icon || null);
      }
    } catch (error) {
      handleApiError(error, "Failed to load category");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { compressImage } = await import("@/utils/imageCompression");
        const compressed = await compressImage(file);
        setImageFile(compressed);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(compressed);
      } catch (error) {
        console.error("Image compression failed:", error);
        // Fallback to original file if compression fails
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      }
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
      const dtoData: Record<string, unknown> = {
        nameEn: name || nameEn || "",
        nameMm: nameMm || "",
        nameTh: nameTh || "",
        displayOrder: displayOrder === "" || displayOrder < 1 ? 1 : displayOrder,
        isActive: isActive,
        shopId: shopId ? parseInt(shopId) : undefined
      };


      const formData = new FormData();
      formData.append("data", new Blob([JSON.stringify(dtoData)], { type: 'application/json' }));

      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (isEditMode && id) {
        await ShopService.updateCategory(parseInt(id), formData);
        toast.success("Menu category updated successfully");
      } else {
        await ShopService.createCategory(formData);
        toast.success("Menu category created successfully");
      }
      navigate("/categories/manage");
    } catch (error) {
      handleApiError(error, isEditMode ? "Failed to update menu category" : "Failed to create menu category");
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
      handleApiError(error, "Failed to delete menu category");
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
            <div className="space-y-2">
              <Label>Select Shop</Label>
              <InfiniteSearchableSelect
                placeholder="Search and select shop..."
                fetchData={fetchShopData}
                valueKey="value"
                labelKey="label"
                selectedValue={selectedShopData}
                onChange={(data) => {
                  setShopId(data?.value || "");
                  setSelectedShopData(data);
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="categoryName">Name</Label>
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

            <div className="space-y-4 pt-4 border-t">
              <Label>Category Image</Label>
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg hover:bg-muted/50 cursor-pointer relative transition-colors h-64 md:w-2/3 mx-auto">
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
                    <div className="text-sm font-medium">Upload Category Image</div>
                    <div className="text-xs text-muted-foreground">PNG, JPG or WEBP</div>
                  </div>
                ) : (
                  <div className="relative h-full aspect-video group bg-muted rounded overflow-hidden">
                    <img
                      src={imagePreview || existingImage || ""}
                      className="h-full w-full object-cover"
                      alt="Category Preview"
                    />
                    <div className="absolute top-2 right-2 z-20">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-sm"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
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
                  onClick={() => navigate("/categories/manage")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!name || submitting}
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
