import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableImage } from "@/components/TableImage";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ListStateView from "@/components/common/ListStateView";
import { BannerFormDialog } from "@/components/marketing/BannerFormDialog";
import {
  getBannerDisplayName,
  useBannerManagement,
} from "@/hooks/banner-images/useBannerManagement";
import type { BannerImage, BannerPosition } from "@/schemas/banner-image.schema";
import { GripVertical, Plus, Trash2 } from "lucide-react";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableRow({
  banner,
  disabled,
  children,
}: {
  banner: BannerImage;
  disabled?: boolean;
  children: (args: {
    setActivatorNodeRef: (el: HTMLElement | null) => void;
    attributes: ReturnType<typeof useSortable>["attributes"];
    listeners: ReturnType<typeof useSortable>["listeners"];
  }) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: "relative",
    background: isDragging ? "hsl(var(--muted) / 0.5)" : undefined,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="hover:bg-muted/50 transition-colors"
    >
      {children({ setActivatorNodeRef, attributes, listeners })}
    </TableRow>
  );
}

const POSITION_LABELS: Record<BannerPosition, string> = {
  Ads: "Ads",
  Promotions: "Promo",
  Order: "Order Waiting",
  Splash: "Splash",
};

function allowedPositionsFor(
  position?: BannerPosition,
): BannerPosition[] {
  if (position === "Order") return ["Order"];
  if (position === "Splash") return ["Splash"];
  // Banner tab (All / Promo / Ads): only promo + ads
  return ["Promotions", "Ads"];
}

interface BannersTabProps {
  /** Single position filter (Order / Splash / Promo / Ads). */
  position?: BannerPosition;
  /** Limit list to these positions (Banner page All = Promo + Ads only). */
  scope?: BannerPosition[];
  /** Larger image thumbnails (promo / ads). */
  largePreview?: boolean;
}

export function BannersTab({
  position,
  scope,
  largePreview = false,
}: BannersTabProps) {
  const { list, form, deleteDialog, actions } = useBannerManagement(
    position,
    scope,
  );
  const showAll = !position;
  const allowedPositions = allowedPositionsFor(position);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = async (event: DragEndEvent) => {
    if (!list.canReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = list.banners.findIndex((b) => b.id === active.id);
    const newIndex = list.banners.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(list.banners, oldIndex, newIndex);
    await list.onReorder(next);
  };

  const hint = showAll
    ? "Showing promo and ads banners. Filter by type to drag-reorder."
    : `Drag rows to reorder ${POSITION_LABELS[position].toLowerCase()} items.`;

  const emptyMessage = showAll
    ? "No promo or ads banners yet. Create your first banner."
    : `No ${POSITION_LABELS[position].toLowerCase()} items yet. Create your first one.`;

  const newButtonLabel =
    position === "Order"
      ? "New Order Waiting"
      : position === "Splash"
        ? "New Splash"
        : "New";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{hint}</p>
        <Button onClick={actions.openCreate}>
          <Plus className="h-4 w-4 mr-2" /> {newButtonLabel}
        </Button>
      </div>

      <ListStateView
        isLoading={list.loading}
        isError={list.isError}
        isEmpty={list.banners.length === 0}
        loadingMessage="Loading banners…"
        errorMessage={
          list.error instanceof Error
            ? list.error.message
            : "Failed to load banners. Check that the API is running and the database migration for banner fields is applied."
        }
        emptyMessage={emptyMessage}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={list.banners.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead className={largePreview ? "w-56" : "w-28"}>
                    Image
                  </TableHead>
                  <TableHead>Name</TableHead>
                  {showAll && <TableHead className="w-24">Type</TableHead>}
                  <TableHead className="w-20">#</TableHead>
                  <TableHead className="hidden md:table-cell">Dates</TableHead>
                  <TableHead className="w-20">On</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.banners.map((banner) => {
                  const displayName = getBannerDisplayName(banner);
                  return (
                    <SortableRow
                      key={banner.id}
                      banner={banner}
                      disabled={!list.canReorder}
                    >
                      {({ setActivatorNodeRef, attributes, listeners }) => (
                        <>
                          <TableCell>
                            <button
                              type="button"
                              ref={setActivatorNodeRef}
                              className="cursor-grab touch-none text-muted-foreground hover:text-foreground disabled:cursor-default disabled:opacity-40"
                              disabled={list.reordering || !list.canReorder}
                              aria-label="Drag to reorder"
                              {...attributes}
                              {...listeners}
                            >
                              <GripVertical className="h-4 w-4" />
                            </button>
                          </TableCell>
                          <TableCell>
                            <TableImage
                              src={banner.imageUrl}
                              alt={displayName}
                              className={
                                largePreview
                                  ? "h-28 w-52 object-cover rounded-md"
                                  : "h-12 w-24 object-cover rounded"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {displayName}
                              </p>
                              {(banner.descriptionEn ||
                                banner.descriptionMm ||
                                banner.descriptionTh) && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {banner.descriptionEn ||
                                    banner.descriptionMm ||
                                    banner.descriptionTh}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          {showAll && (
                            <TableCell className="text-xs text-muted-foreground">
                              {POSITION_LABELS[banner.position]}
                            </TableCell>
                          )}
                          <TableCell className="text-muted-foreground text-sm">
                            {banner.displayOrder}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                            {new Date(banner.startDate).toLocaleDateString()} –{" "}
                            {new Date(banner.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={banner.isActive}
                              onCheckedChange={(checked) =>
                                actions.onToggleActive(banner.id, checked)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => actions.openEdit(banner)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  actions.openDelete(banner.id, displayName)
                                }
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </SortableRow>
                  );
                })}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      </ListStateView>

      <BannerFormDialog
        open={form.open}
        onOpenChange={form.onOpenChange}
        banner={form.editing}
        defaultPosition={form.defaultPosition}
        allowedPositions={allowedPositions}
        submitting={form.submitting}
        onSubmit={form.onSubmit}
      />

      <ConfirmDialog
        open={deleteDialog.state.open}
        onOpenChange={deleteDialog.onOpenChange}
        title={
          position === "Order"
            ? "Delete Order Waiting"
            : position === "Splash"
              ? "Delete Splash"
              : "Delete banner"
        }
        description={`Remove "${deleteDialog.state.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        loading={deleteDialog.loading}
        onCancel={deleteDialog.onCancel}
        onConfirm={deleteDialog.onConfirm}
      />
    </div>
  );
}
