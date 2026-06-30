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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InfiniteSearchableSelect,
  type PageableResponse,
} from "@/components/ui/infinite-searchable-select";
import { AsyncSelectField } from "@/components/common/AsyncSelectField";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  useFlashEvent,
  useCreateFlashEventMutation,
  useUpdateFlashEventMutation,
  useDeleteFlashEventMutation,
} from "@/hooks/flash-events/useFlashEvent";
import { useAdminShopProfilesBareInfiniteFetcher } from "@/hooks/shops";
import { menuService } from "@/services/menuService";
import {
  flashEventSchema,
  type FlashEventFormValues,
} from "@/schemas/flashEvent.schema";
import {
  FlashEventItemSortableRow,
  type FlashDiscountType,
} from "./components/FlashEventItemSortableRow";

/** Option shape for the menu-item picker. */
type MenuItemOption = {
  label: string;
  value: string;
  imageUrl?: string;
  shopName?: string;
  price?: number;
  originalPrice?: number;
  discountAmount?: number | null;
  discountPercentage?: number | null;
};

/** A selected item plus the editor for its (menu item) discount. */
type FlashItemDraft = {
  value: string;
  label: string;
  imageUrl?: string;
  shopName?: string;
  originalPrice?: number;
  discountType: FlashDiscountType;
  discountValue: string;
};

/** Build a draft, pre-filling the editor from the menu item's current discount. */
function optionToDraft(o: {
  value: string;
  label: string;
  imageUrl?: string;
  shopName?: string;
  originalPrice?: number | null;
  discountAmount?: number | null;
  discountPercentage?: number | null;
}): FlashItemDraft {
  const hasPct = (o.discountPercentage ?? 0) > 0;
  return {
    value: o.value,
    label: o.label,
    imageUrl: o.imageUrl,
    shopName: o.shopName,
    originalPrice: o.originalPrice ?? undefined,
    discountType: hasPct ? "PERCENT" : "AMOUNT",
    discountValue: (o.discountAmount ?? 0) > 0
      ? String(o.discountAmount)
      : hasPct
        ? String(o.discountPercentage)
        : "",
  };
}

/** Live preview of the item's selling price after the edited discount. */
function previewPrice(d: FlashItemDraft): {
  sellingPrice: number;
  hasDiscount: boolean;
} {
  const original = d.originalPrice ?? 0;
  const raw = d.discountValue.trim();
  const v = raw === "" ? NaN : Number(raw);
  let price = original;
  if (raw !== "" && !Number.isNaN(v) && v > 0) {
    price =
      d.discountType === "AMOUNT"
        ? Math.max(0, original - v)
        : Math.max(0, original * (1 - v / 100));
  }
  return { sellingPrice: price, hasDiscount: price < original };
}

/** ISO string → "YYYY-MM-DDTHH:mm" in local time for a datetime-local input. */
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** datetime-local value (local time) → ISO 8601 (UTC) for the API. */
function toIso(local: string): string {
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export default function CreateFlashEvent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get("id");
  const id = idParam ? parseInt(idParam, 10) : 0;
  const isEditMode = !!id;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<FlashItemDraft[]>([]);
  const [initialShopOption, setInitialShopOption] = useState<{
    value: string;
    label: string;
  } | null>(null);

  const { fetchShops: fetchShopData } =
    useAdminShopProfilesBareInfiniteFetcher();
  const { data: flashEvent, isPending: loadingFlashEvent } = useFlashEvent(id);
  const { mutateAsync: createFlashEvent, isPending: isCreating } =
    useCreateFlashEventMutation();
  const { mutateAsync: updateFlashEvent, isPending: isUpdating } =
    useUpdateFlashEventMutation();
  const { mutateAsync: deleteFlashEvent, isPending: isDeleting } =
    useDeleteFlashEventMutation();

  const submitting = isCreating || isUpdating;
  const loading = isEditMode && loadingFlashEvent;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FlashEventFormValues>({
    resolver: zodResolver(flashEventSchema) as Resolver<FlashEventFormValues>,
    defaultValues: {
      name: "",
      description: "",
      type: "DROP",
      startTime: "",
      endTime: "",
      status: "ACTIVE",
      shopId: undefined,
    },
  });

  const name = watch("name");
  const type = watch("type");

  useEffect(() => {
    if (isEditMode && flashEvent) {
      reset({
        name: flashEvent.name,
        description: flashEvent.description ?? "",
        type: flashEvent.type,
        startTime: toDatetimeLocal(flashEvent.startTime),
        endTime: toDatetimeLocal(flashEvent.endTime),
        status: flashEvent.status,
        shopId: flashEvent.shopId ?? undefined,
      });
      if (flashEvent.shopId != null) {
        setInitialShopOption({
          value: String(flashEvent.shopId),
          label: `Shop #${flashEvent.shopId}`,
        });
      }
      setSelectedItems(
        flashEvent.items.map((item) =>
          optionToDraft({
            value: String(item.id),
            label:
              item.nameEn || item.nameMm || item.nameTh || `Item #${item.id}`,
            imageUrl: item.imageUrl ?? undefined,
            shopName: item.shopName,
            originalPrice: item.originalPrice,
            discountAmount: item.discountAmount,
            discountPercentage: item.discountPercentage,
          }),
        ),
      );
    }
  }, [isEditMode, flashEvent, reset]);

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
      const res = await menuService.getAllMenuItems(
        page,
        size,
        search,
        undefined,
        undefined,
        undefined,
        { isAvailable: true, pendingStatus: "APPROVED", publishStatus: "PUBLISHED" },
      );
      return {
        content: res.content.map((item) => ({
          label: item.nameEn || item.name || `Item #${item.id}`,
          value: String(item.id),
          imageUrl: item.imageUrl,
          shopName: item.shopName,
          price: item.price,
          originalPrice: item.originalPrice,
          discountAmount: item.discountAmount ?? null,
          discountPercentage: item.discountPercentage ?? null,
        })),
        last: res.last,
      };
    },
    [],
  );

  const handleSelectItem = (item: MenuItemOption | null) => {
    if (!item) return;
    setSelectedItems((prev) =>
      prev.some((i) => i.value === item.value)
        ? prev
        : [...prev, optionToDraft(item)],
    );
  };

  const updateItem = (value: string, patch: Partial<FlashItemDraft>) =>
    setSelectedItems((prev) =>
      prev.map((it) => (it.value === value ? { ...it, ...patch } : it)),
    );

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

  const onSubmit = async (values: FlashEventFormValues) => {
    const payload = {
      name: values.name,
      description: values.description?.trim() || undefined,
      type: values.type,
      startTime: toIso(values.startTime),
      endTime: toIso(values.endTime),
      status: values.status,
      shopId: values.shopId && values.shopId > 0 ? values.shopId : undefined,
      items: selectedItems.map((d) => {
        const raw = d.discountValue.trim();
        const v = raw === "" ? NaN : Number(raw);
        const hasDiscount = raw !== "" && !Number.isNaN(v) && v > 0;
        return {
          menuItemId: Number(d.value),
          discountAmount:
            hasDiscount && d.discountType === "AMOUNT" ? v : undefined,
          discountPercentage:
            hasDiscount && d.discountType === "PERCENT" ? v : undefined,
        };
      }),
    };

    if (isEditMode) {
      await updateFlashEvent({ id, payload });
    } else {
      await createFlashEvent(payload);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteFlashEvent(id);
    setDeleteDialogOpen(false);
    navigate("/flash-events/manage");
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
          {isEditMode ? "Edit Flash Event" : "Create Flash Event"}
        </h2>
        <p className="text-muted-foreground">
          {isEditMode
            ? "Update the flash event, its schedule and menu items."
            : "Schedule a flash drop or deal over published menu items."}
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Flash Event Details</CardTitle>
            <CardDescription>
              A <strong>Drop</strong> stays hidden until it launches; a{" "}
              <strong>Deal</strong> shows as a teaser beforehand. Both become
              orderable between the start and end time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g. Midnight Ramen Drop"
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
                placeholder="Optional short description shown with the flash event."
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DROP">
                          Drop (hidden until launch)
                        </SelectItem>
                        <SelectItem value="DEAL">
                          Deal (teaser before launch)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {type === "DEAL"
                    ? "Visible early as a teaser; orderable once it starts."
                    : "Hidden until the start time, then orderable."}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-7">
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
                    Only active flash events appear in the app.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  {...register("startTime")}
                />
                {errors.startTime && (
                  <p className="text-xs text-destructive">
                    {errors.startTime.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  {...register("endTime")}
                />
                {errors.endTime && (
                  <p className="text-xs text-destructive">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Controller
                name="shopId"
                control={control}
                render={({ field }) => (
                  <AsyncSelectField
                    label="Shop (optional)"
                    placeholder="Scope to a shop, or leave for all shops..."
                    showAllOption
                    allOptionLabel="All shops (no scope)"
                    value={
                      field.value && field.value > 0 ? String(field.value) : ""
                    }
                    initialValue={
                      initialShopOption
                        ? {
                            value: initialShopOption.value,
                            label: initialShopOption.label,
                          }
                        : undefined
                    }
                    onValueChange={(value) => {
                      const parsed = parseInt(value, 10);
                      field.onChange(Number.isNaN(parsed) ? undefined : parsed);
                      setInitialShopOption(null);
                    }}
                    fetchFunction={async (
                      page: number,
                      pageSize: number,
                      searchTerm?: string,
                    ) => {
                      const res = await fetchShopData(
                        page - 1,
                        pageSize,
                        searchTerm || "",
                      );
                      return {
                        data: res.content.map((shop) => ({
                          value: shop.id.toString(),
                          label: shop.dropdownLabel,
                        })),
                        totalCount: res.totalElements ?? 0,
                      };
                    }}
                    error={errors.shopId?.message}
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">
                Optional. Leave empty for a cross-shop flash event.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Menu Items</CardTitle>
            <CardDescription>
              Search and add published, available menu items. Drag to reorder.
              Set each item's discount here — this updates the item's own
              discount everywhere it appears, not just in this flash.
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
              startPage={1}
            />

            {selectedItems.length === 0 ? (
              <div className="text-center py-10 border rounded-lg border-dashed text-muted-foreground text-sm">
                No items added yet. Use the search above to add menu items.
              </div>
            ) : (
              <>
                <div className="text-xs text-muted-foreground">
                  {selectedItems.length} item
                  {selectedItems.length === 1 ? "" : "s"} in this flash event
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
                      {selectedItems.map((item, index) => {
                        const { sellingPrice, hasDiscount } =
                          previewPrice(item);
                        return (
                          <FlashEventItemSortableRow
                            key={item.value}
                            id={item.value}
                            index={index}
                            label={item.label}
                            imageUrl={item.imageUrl}
                            shopName={item.shopName}
                            originalPrice={item.originalPrice}
                            discountType={item.discountType}
                            discountValue={item.discountValue}
                            sellingPrice={sellingPrice}
                            hasDiscount={hasDiscount}
                            onTypeChange={(t) =>
                              updateItem(item.value, { discountType: t })
                            }
                            onValueChange={(val) =>
                              updateItem(item.value, { discountValue: val })
                            }
                            onRemove={() => handleRemoveItem(item.value)}
                          />
                        );
                      })}
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
              onClick={() => navigate("/flash-events/manage")}
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
                "Update Flash Event"
              ) : (
                "Create Flash Event"
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
              This will remove the flash event
              <strong> {name || "this flash event"}</strong> from the app. The
              menu items themselves are not affected.
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
              {isDeleting ? "Deleting..." : "Delete Flash Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
