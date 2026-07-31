import type { CSSProperties, MouseEvent, ReactNode } from "react"
import {
    type Shop,
    resolveShopCityLabel,
    resolveShopDistrictLabel,
} from "@/services/shopService"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Loader } from "@/components/ui/loader";
import { resolveMediaUrl } from "@/lib/resolveMediaUrl"
import type { SortConfig } from "@/lib/sort-utils"
import { Edit, GripVertical, Link2, Trash2, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableImage } from "../TableImage"
import { ViewCountCell } from "../ViewCountCell"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

export type ShopTableVariant = "full" | "adminList"

function clickableShopRowClass(selectedShopId: number | null, shopId: number) {
    return cn(
        "cursor-pointer transition-colors",
        selectedShopId === shopId
            ? "bg-primary/10 hover:bg-primary/20 active:bg-primary/25"
            : "hover:bg-muted/60 active:bg-muted/80",
    )
}

/** Sortable table row that still forwards its own onClick + className. */
function SortableShopRow({
    id,
    className,
    onClick,
    children,
}: {
    id: number
    className?: string
    onClick?: () => void
    children: (args: {
        setActivatorNodeRef: (el: HTMLElement | null) => void
        attributes: ReturnType<typeof useSortable>["attributes"]
        listeners: ReturnType<typeof useSortable>["listeners"]
    }) => ReactNode
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        position: "relative",
        background: isDragging ? "hsl(var(--muted) / 0.5)" : undefined,
    }

    return (
        <TableRow ref={setNodeRef} style={style} className={className} onClick={onClick}>
            {children({ setActivatorNodeRef, attributes, listeners })}
        </TableRow>
    )
}

export type ShopTableProps = {
    shopList: Shop[]
    isLoading: boolean
    selectedShopId: number | null
    sortConfig: SortConfig | null
    onSort: (key: string) => void
    toggleBusyShopId: number | null
    onToggleStatus: (shop: Shop, nextActive: boolean) => void
    onToggleVerified?: (shop: Shop, nextVerified: boolean) => void
    onToggleTaxEnable?: (shop: Shop, nextTaxEnable: boolean) => void
    onEditShop: (shop: Shop) => void
    onEditSlug?: (shop: Shop) => void
    onVerify?: (e: MouseEvent, shop: Shop) => void
    onOpenReject: (e: MouseEvent, shop: Shop) => void
    onOpenDelete: (shop: Shop) => void
    onAssignAdmin: (shop: Shop) => void
    /** Persist a drag-reorder; receives the page's shop ids in new order. */
    onReorder?: (orderedIds: number[]) => void
    reordering?: boolean
}

export function ShopTable({
    shopList,
    isLoading,
    selectedShopId,
    toggleBusyShopId,
    onToggleStatus,
    onToggleVerified,
    onToggleTaxEnable,
    onEditShop,
    onEditSlug,
    onOpenDelete,
    onAssignAdmin,
    onReorder,
    reordering = false,
}: ShopTableProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return
        const oldIndex = shopList.findIndex((s) => s.id === active.id)
        const newIndex = shopList.findIndex((s) => s.id === over.id)
        if (oldIndex < 0 || newIndex < 0) return
        const next = arrayMove(shopList, oldIndex, newIndex)
        onReorder?.(next.map((s) => s.id))
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader />
            </div>
        )
    }


    return (
        <div className="rounded-md border overflow-x-auto">
             <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
             <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10" aria-label="Reorder" />
                            <TableHead className="w-[52px]">Photo</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead className="w-[100px]">Active</TableHead>
                            <TableHead className="w-[100px]">Verified</TableHead>
                            <TableHead className="w-[100px]">Tax Enable</TableHead>
                            <TableHead className="w-[100px]">Views</TableHead>
                            <TableHead className="w-[140px]">Slug</TableHead>
                            <TableHead className="text-right min-w-[188px] w-[188px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {shopList.length > 0 ? (
                          <SortableContext items={shopList.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                            {shopList.map((shop) => {
                                const coverSrc = resolveMediaUrl(shop.coverUrl || shop.logoUrl)
                                const locality = [resolveShopDistrictLabel(shop), resolveShopCityLabel(shop)]
                                    .filter(Boolean)
                                    .join(", ")
                                const street = shop.addressEn || shop.address || ""
                                const addressDisplay =
                                    [street, locality].filter(Boolean).join(street && locality ? " · " : "") || "—"
                                return (
                                    <SortableShopRow
                                        key={shop.id}
                                        id={shop.id}
                                        onClick={() => onEditShop(shop)}
                                        className={clickableShopRowClass(selectedShopId, shop.id)}
                                    >
                                    {({ setActivatorNodeRef, attributes, listeners }) => (
                                      <>
                                        <TableCell className="w-10 p-2 align-middle" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                ref={setActivatorNodeRef}
                                                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 rounded disabled:opacity-40"
                                                disabled={reordering}
                                                aria-label="Drag to reorder"
                                                {...attributes}
                                                {...listeners}
                                            >
                                                <GripVertical className="h-5 w-5" />
                                            </button>
                                        </TableCell>
                                        <TableCell className="align-middle">
                                            <TableImage
                                                src={coverSrc}
                                                alt={shop.nameEn || shop.nameMm || shop.name || "Shop cover"}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div>{shop.nameEn || shop.nameMm || shop.name}</div>
                                            {shop.nameMm && shop.nameEn && shop.nameMm !== shop.nameEn && (
                                                <div className="text-xs text-muted-foreground">{shop.nameMm}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="max-w-[200px] truncate">
                                                {shop.shopCategory?.nameEn ||
                                                    shop.category ||
                                                    shop.shopCategory?.nameMm ||
                                                    "—"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[280px] text-sm text-muted-foreground">
                                            <span className="line-clamp-2">{addressDisplay}</span>
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <div className="flex flex-col gap-1 items-start">
                                                <Switch
                                                    checked={shop.isActive !== false}
                                                    disabled={toggleBusyShopId === shop.id}
                                                    onCheckedChange={(checked) => onToggleStatus(shop, checked)}
                                                />
                                                <span
                                                    className={`text-xs font-medium ${shop.isActive !== false ? "text-green-600" : "text-red-500"}`}
                                                >
                                                    {shop.isActive !== false ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <div className="flex flex-col gap-1 items-start">
                                                <Switch
                                                    checked={shop.isVerified === true}
                                                    disabled={
                                                        toggleBusyShopId === shop.id ||
                                                        !onToggleVerified
                                                    }
                                                    onCheckedChange={(checked) =>
                                                        onToggleVerified?.(shop, checked)
                                                    }
                                                />
                                                <span
                                                    className={cn(
                                                        "text-xs font-medium",
                                                        shop.isVerified === true
                                                            ? "text-blue-600"
                                                            : "text-muted-foreground",
                                                    )}
                                                >
                                                    {shop.isVerified === true ? "Verified" : "Unverified"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <div className="flex flex-col gap-1 items-start">
                                                <Switch
                                                    checked={shop.taxEnable !== false}
                                                    disabled={
                                                        toggleBusyShopId === shop.id ||
                                                        !onToggleTaxEnable
                                                    }
                                                    onCheckedChange={(checked) =>
                                                        onToggleTaxEnable?.(shop, checked)
                                                    }
                                                />
                                                <span
                                                    className={cn(
                                                        "text-xs font-medium",
                                                        shop.taxEnable !== false
                                                            ? "text-emerald-600"
                                                            : "text-muted-foreground",
                                                    )}
                                                >
                                                    {shop.taxEnable !== false ? "Enabled" : "Disabled"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="align-middle">
                                            <ViewCountCell count={shop.viewCount} />
                                        </TableCell>
                                        <TableCell
                                            className="align-middle max-w-[140px]"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                type="button"
                                                className={cn(
                                                    "inline-flex max-w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm transition-colors",
                                                    "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                                    shop.slug
                                                        ? "text-foreground"
                                                        : "text-muted-foreground",
                                                )}
                                                title={shop.slug ? `Edit slug: ${shop.slug}` : "Set slug"}
                                                onClick={() => onEditSlug?.(shop)}
                                            >
                                                <Link2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                                <span className="truncate font-mono text-xs">
                                                    {shop.slug || "Set slug"}
                                                </span>
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-right align-middle p-2">
                                            <div
                                                className="inline-flex flex-nowrap items-center justify-end gap-0.5 rounded-md border border-border/60 bg-muted/30 p-0.5"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 shrink-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                                    title="Assign admin"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onAssignAdmin(shop)
                                                    }}
                                                >
                                                    <UserPlus className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 shrink-0"
                                                    title="Edit shop"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onEditShop(shop)
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    title="Delete shop"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onOpenDelete(shop)
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                      </>
                                    )}
                                    </SortableShopRow>
                                )
                            })}
                          </SortableContext>
                        ) : (
                            <TableRow>
                                <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
             </DndContext>
        </div>
    )
}
