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
import { Loader } from "@/components/ui/loader"
import { SortableTableHead } from "@/components/SortableTableHead"
import { LazyImage } from "@/components/common/LazyImage"
import { resolveMediaUrl } from "@/lib/resolveMediaUrl"
import type { SortConfig } from "@/lib/sort-utils"
import { Check, Edit, Trash2, X } from "lucide-react"
import { TableImage } from "../TableImage"

export type ShopTableVariant = "full" | "adminList"

export type ShopTableProps = {
    shopList: Shop[]
    isLoading: boolean
    variant?: ShopTableVariant
    selectedShopId: number | null
    sortConfig: SortConfig | null
    onSort: (key: string) => void
    actionLoading: number | null
    toggleBusyShopId: number | null
    onToggleStatus: (shop: Shop, nextActive: boolean) => void
    onEditShop: (shop: Shop) => void
    onVerify: (e: MouseEvent, shop: Shop) => void
    onOpenReject: (e: MouseEvent, shop: Shop) => void
    onOpenDelete: (shop: Shop) => void
}

export function ShopTable({
    shopList,
    isLoading,
    variant = "full",
    selectedShopId,
    sortConfig,
    onSort,
    actionLoading,
    toggleBusyShopId,
    onToggleStatus,
    onEditShop,
    onVerify,
    onOpenReject,
    onOpenDelete,
}: ShopTableProps) {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader />
            </div>
        )
    }

    if (variant === "adminList") {
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
                            <TableHead className="w-[110px]">Verified</TableHead>
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
                                        className={`cursor-pointer transition-colors ${selectedShopId === shop.id ? "bg-primary/10 hover:bg-primary/20" : "hover:bg-muted/50"}`}
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
                                                    disabled={actionLoading === shop.id || toggleBusyShopId === shop.id}
                                                    onCheckedChange={(checked) => onToggleStatus(shop, checked)}
                                                />
                                                <span
                                                    className={`text-xs font-medium ${shop.isActive !== false ? "text-green-600" : "text-red-500"}`}
                                                >
                                                    {shop.isActive !== false ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {shop.isVerified ? (
                                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                                    Verified
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">Unverified</Badge>
                                            )}
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
                                                    disabled={actionLoading === shop.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onOpenDelete(shop)
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 shrink-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                                    title="Verify shop"
                                                    disabled={shop.isVerified || actionLoading === shop.id}
                                                    onClick={(e) => onVerify(e, shop)}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 shrink-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                                    title="Reject application (marks unverified & inactive)"
                                                    disabled={actionLoading === shop.id}
                                                    onClick={(e) => onOpenReject(e, shop)}
                                                >
                                                    <X className="h-4 w-4" />
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

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[60px]">Photo</TableHead>
                        <SortableTableHead label="ID" sortKey="id" sortConfig={sortConfig} onSort={onSort} />
                        <SortableTableHead label="Name" sortKey="name" sortConfig={sortConfig} onSort={onSort} />
                        <SortableTableHead
                            label="Category"
                            sortKey="category"
                            sortConfig={sortConfig}
                            onSort={onSort}
                        />
                        <TableHead>Location</TableHead>
                        <TableHead>Flags</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead className="text-right min-w-[188px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {shopList.length > 0 ? (
                        shopList.map((shop) => (
                            <TableRow
                                key={shop.id}
                                onClick={() => onEditShop(shop)}
                                className={`cursor-pointer transition-colors ${selectedShopId === shop.id ? "bg-primary/10 hover:bg-primary/20" : "hover:bg-muted/50"}`}
                            >
                                <TableCell>
                                    <LazyImage
                                        src={resolveMediaUrl(shop.logoUrl || shop.coverUrl)}
                                        alt={shop.nameEn || shop.nameMm || shop.name || "Shop"}
                                    />
                                </TableCell>
                                <TableCell className="font-mono text-xs">{shop.id}</TableCell>
                                <TableCell className="font-medium">
                                    <div>{shop.nameEn || shop.nameMm || shop.name}</div>
                                    {shop.nameMm && shop.nameEn && shop.nameMm !== shop.nameEn && (
                                        <div className="text-xs text-muted-foreground">{shop.nameMm}</div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                        {shop.shopCategory?.nameEn ||
                                            shop.category ||
                                            shop.shopCategory?.nameMm ||
                                            "—"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {[resolveShopDistrictLabel(shop), resolveShopCityLabel(shop)].filter(Boolean).join(", ") ||
                                        "—"}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                                        {shop.hasDelivery && (
                                            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                                Delv
                                            </Badge>
                                        )}
                                        {shop.isHalal && (
                                            <Badge
                                                variant="secondary"
                                                className="text-[10px] px-1 py-0 h-4 bg-green-50 text-green-700"
                                            >
                                                Halal
                                            </Badge>
                                        )}
                                        {shop.isVegetarian && (
                                            <Badge
                                                variant="secondary"
                                                className="text-[10px] px-1 py-0 h-4 bg-lime-50 text-lime-700"
                                            >
                                                Veg
                                            </Badge>
                                        )}
                                        {shop.hasWifi && (
                                            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                                Wifi
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {shop.isVerified ? (
                                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Verified</Badge>
                                    ) : (
                                        <Badge variant="secondary">Unverified</Badge>
                                    )}
                                </TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={shop.isActive !== false}
                                            disabled={actionLoading === shop.id || toggleBusyShopId === shop.id}
                                            onCheckedChange={(checked) => onToggleStatus(shop, checked)}
                                        />
                                        <span
                                            className={`text-xs font-medium ${shop.isActive !== false ? "text-green-600" : "text-red-500"}`}
                                        >
                                            {shop.isActive !== false ? "Active" : "Inactive"}
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
                                            className="h-9 w-9 shrink-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                            title="Verify shop"
                                            disabled={shop.isVerified || actionLoading === shop.id}
                                            onClick={(e) => onVerify(e, shop)}
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            title="Delete shop"
                                            disabled={actionLoading === shop.id}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onOpenDelete(shop)
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 shrink-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                            title="Reject application"
                                            disabled={actionLoading === shop.id}
                                            onClick={(e) => onOpenReject(e, shop)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
