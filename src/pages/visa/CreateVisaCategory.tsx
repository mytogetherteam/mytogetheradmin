import { useState, useEffect } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateVisaCategoryMutation,
  useDeleteVisaCategoryMutation,
  useUpdateVisaCategoryMutation,
  useVisaCategory,
} from "@/hooks/visa/useVisaCategory";
import {
  visaCategoryFormSchema,
  visaCategoryToFormValues,
  type VisaCategoryFormValues,
} from "@/schemas/visa-category.schema";

export default function CreateVisaCategory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get("id");
  const categoryId = idParam ? parseInt(idParam, 10) : undefined;
  const isEditMode = !!categoryId && !Number.isNaN(categoryId);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: categoryData, isPending: fetching } = useVisaCategory(
    isEditMode ? categoryId : undefined,
  );
  const { mutate: createCategory, isPending: isCreating } = useCreateVisaCategoryMutation();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateVisaCategoryMutation();
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteVisaCategoryMutation({
    navigateOnSuccess: true,
  });

  const submitting = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<VisaCategoryFormValues>({
    resolver: zodResolver(visaCategoryFormSchema) as Resolver<VisaCategoryFormValues>,
    defaultValues: {
      title: "",
      section: "VISA_TYPES",
      displayOrder: undefined,
      isActive: true,
    },
  });

  useEffect(() => {
    if (isEditMode && categoryData) {
      reset(visaCategoryToFormValues(categoryData));
    }
  }, [isEditMode, categoryData, reset]);

  const onSubmit = (values: VisaCategoryFormValues) => {
    if (isEditMode && categoryId) {
      updateCategory({ id: categoryId, values });
    } else {
      createCategory(values);
    }
  };

  const handleDelete = () => {
    if (!categoryId) return;
    deleteCategory(categoryId, {
      onSuccess: () => setDeleteDialogOpen(false),
    });
  };

  if (isEditMode && fetching) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Visa Category" : "Create Visa Category"}</CardTitle>
          <CardDescription>
            Categories group visa items in the app (e.g. Short-Term & Tourist).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...register("title")} placeholder="Short-Term & Tourist" />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Section</Label>
              <Controller
                name="section"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VISA_TYPES">Visa Types</SelectItem>
                      <SelectItem value="IMMIGRATION_SERVICES">Immigration Services</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display order</Label>
              <Input id="displayOrder" type="number" min={1} {...register("displayOrder")} />
              {errors.displayOrder && (
                <p className="text-sm text-destructive">{errors.displayOrder.message}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Update Category" : "Create Category"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/visa/categories/manage")}>
                Cancel
              </Button>
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  className="ml-auto"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Categories with linked visas cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
