import type { MouseEvent } from "react"
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
import {  Edit, Trash2, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableImage } from "../TableImage"

export type ShopTableVariant = "full" | "adminList"

function clickableShopRowClass(selectedShopId: number | null, shopId: number) {
    return cn(
        "cursor-pointer transition-colors",
        selectedShopId === shopId
            ? "bg-primary/10 hover:bg-primary/20 active:bg-primary/25"
            : "hover:bg-muted/60 active:bg-muted/80",
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
    onEditShop: (shop: Shop) => void
    onVerify?: (e: MouseEvent, shop: Shop) => void
    onOpenReject: (e: MouseEvent, shop: Shop) => void
    onOpenDelete: (shop: Shop) => void
    onAssignAdmin: (shop: Shop) => void
}

export function ShopTable({
    shopList,
    isLoading,
    selectedShopId,
    toggleBusyShopId,
    onToggleStatus,
    onToggleVerified,
    onEditShop,
    onOpenDelete,
    onAssignAdmin,
}: ShopTableProps) {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader />
            </div>
        )
    }


    return (
        <div className="rounded-md border overflow-x-auto">
             <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[52px]">Photo</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead className="w-[100px]">Active</TableHead>
                            <TableHead className="w-[100px]">Verified</TableHead>
                            <TableHead className="text-right min-w-[188px] w-[188px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {shopList.length > 0 ? (
                            shopList.map((shop) => {
                                const coverSrc = resolveMediaUrl(shop.coverUrl || shop.logoUrl)
                                const locality = [resolveShopDistrictLabel(shop), resolveShopCityLabel(shop)]
                                    .filter(Boolean)
                                    .join(", ")
                                const street = shop.addressEn || shop.address || ""
                                const addressDisplay =
                                    [street, locality].filter(Boolean).join(street && locality ? " · " : "") || "—"
                                return (
                                    <TableRow
                                        key={shop.id}
                                        onClick={() => onEditShop(shop)}
                                        className={clickableShopRowClass(selectedShopId, shop.id)}
                                    >
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
                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
        </div>
    )
}
