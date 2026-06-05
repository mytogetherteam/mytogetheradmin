import { useState, useEffect, useCallback } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  InfiniteSearchableSelect,
  type PageableResponse,
} from "@/components/ui/infinite-searchable-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  useCollection,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
} from "@/hooks/collections/useCollection";
import { menuService } from "@/services/menuService";
import {
  collectionSchema,
  type CollectionFormValues,
} from "@/schemas/collection.schema";
import { CollectionItemSortableRow } from "./components/CollectionItemSortableRow";

/** Option shape for the menu-item picker (type alias → assignable to the select's index-signature constraint). */
type MenuItemOption = {
  label: string;
  value: string;
  imageUrl?: string;
  shopName?: string;
  price?: number;
};

export default function CreateCollection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get("id");
  const id = idParam ? parseInt(idParam, 10) : 0;
  const isEditMode = !!id;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<MenuItemOption[]>([]);

  const { data: collection, isPending: loadingCollection } = useCollection(id);
  const { mutateAsync: createCollection, isPending: isCreating } =
    useCreateCollectionMutation();
  const { mutateAsync: updateCollection, isPending: isUpdating } =
    useUpdateCollectionMutation();
  const { mutateAsync: deleteCollection, isPending: isDeleting } =
    useDeleteCollectionMutation();

  const submitting = isCreating || isUpdating;
  const loading = isEditMode && loadingCollection;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema) as Resolver<CollectionFormValues>,
    defaultValues: { name: "", description: "", status: "ACTIVE" },
  });

  const name = watch("name");

  useEffect(() => {
    if (isEditMode && collection) {
      reset({
        name: collection.name,
        description: collection.description ?? "",
        status: collection.status,
      });
      setSelectedItems(
        collection.items.map((item) => ({
          label:
            item.nameEn || item.nameMm || item.nameTh || `Item #${item.id}`,
          value: String(item.id),
          imageUrl: item.imageUrl ?? undefined,
          shopName: item.shopName,
          price: item.price,
        })),
      );
    }
  }, [isEditMode, collection, reset]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const fetchMenuItems = useCallback(
    async (
      page: number,
      size: number,
      search: string,
    ): Promise<PageableResponse<MenuItemOption>> => {
      const res = await menuService.getAllMenuItems(page, size, search);
      return {
        content: res.content.map((item) => ({
          label: item.nameEn || item.name || `Item #${item.id}`,
          value: String(item.id),
          imageUrl: item.imageUrl,
          shopName: item.shopName,
          price: item.price,
        })),
        last: res.last,
      };
    },
    [],
  );

  const handleSelectItem = (item: MenuItemOption | null) => {
    if (!item) return;
    setSelectedItems((prev) =>
      prev.some((i) => i.value === item.value) ? prev : [...prev, item],
    );
  };

  const handleRemoveItem = (value: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.value !== value));
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSelectedItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.value === active.id);
      const newIndex = prev.findIndex((i) => i.value === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const onSubmit = async (values: CollectionFormValues) => {
    const payload = {
      name: values.name,
      description: values.description?.trim() || undefined,
      status: values.status,
      menuItemIds: selectedItems.map((i) => Number(i.value)),
    };

    if (isEditMode) {
      await updateCollection({ id, payload });
    } else {
      await createCollection(payload);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteCollection(id);
    setDeleteDialogOpen(false);
    navigate("/collections/manage");
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
          {isEditMode ? "Edit Collection" : "Create Collection"}
        </h2>
        <p className="text-muted-foreground">
          {isEditMode
            ? "Update collection details and its menu items."
            : "Group published menu items into a curated collection."}
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Collection Details</CardTitle>
            <CardDescription>
              Give the collection a name and description, and set whether it is
              visible to customers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g. Ramadan Specials"
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                {...register("description")}
                placeholder="Optional short description shown with the collection."
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="status"
                    checked={field.value === "ACTIVE"}
                    onCheckedChange={(checked) =>
                      field.onChange(checked ? "ACTIVE" : "INACTIVE")
                    }
                  />
                )}
              />
              <div>
                <Label htmlFor="status">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Only active collections appear in the customer app.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Menu Items</CardTitle>
            <CardDescription>
              Search and add published, available menu items. Drag to set the
              order they appear in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfiniteSearchableSelect<MenuItemOption>
              fetchData={fetchMenuItems}
              valueKey="value"
              labelKey="label"
              selectedValue={null}
              onChange={handleSelectItem}
              placeholder="Search menu items to add..."
            />

            {selectedItems.length === 0 ? (
              <div className="text-center py-10 border rounded-lg border-dashed text-muted-foreground text-sm">
                No items added yet. Use the search above to add menu items.
              </div>
            ) : (
              <>
                <div className="text-xs text-muted-foreground">
                  {selectedItems.length} item
                  {selectedItems.length === 1 ? "" : "s"} in this collection
                </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}
                >
                  <SortableContext
                    items={selectedItems.map((i) => i.value)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {selectedItems.map((item, index) => (
                        <CollectionItemSortableRow
                          key={item.value}
                          id={item.value}
                          index={index}
                          label={item.label}
                          imageUrl={item.imageUrl}
                          shopName={item.shopName}
                          price={item.price}
                          onRemove={() => handleRemoveItem(item.value)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-2">
          {isEditMode ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={submitting || isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-3 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/collections/manage")}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditMode ? (
                "Update Collection"
              ) : (
                "Create Collection"
              )}
            </Button>
          </div>
        </div>
      </form>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              collection
              <strong> {name || "this collection"}</strong>. The menu items
              themselves are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
