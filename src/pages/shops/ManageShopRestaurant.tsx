import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { ShopService, Shop, resolveShopCityLabel, resolveShopDistrictLabel, mapAdminShopProfileRowToShop } from "@/services/shopService"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Loader } from "@/components/ui/loader"
import { Input } from "@/components/ui/input"
import { DataTablePagination } from "@/components/DataTablePagination"
import { SortableTableHead } from "@/components/SortableTableHead"
import { LazyImage } from "@/components/common/LazyImage"
import { resolveMediaUrl } from "@/lib/resolveMediaUrl"
import { SortConfig, toggleSort, sortData } from "@/lib/sort-utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Plus,
    Search,
    FileSpreadsheet,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Edit,
    Clock,
    Check,
    X,
} from "lucide-react"
import { toast } from "sonner"
import { handleApiError } from "@/lib/error-utils"
// import * as XLSX from "xlsx" // Removed for dynamic import

export default function ManageShopRestaurant() {
    const [shops, setShops] = useState<Shop[]>([])
    const [pendingShops, setPendingShops] = useState<Shop[]>([])
    const [loading, setLoading] = useState(true)
    const [pendingLoading, setPendingLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState(localStorage.getItem("manage_shop_search") || "")
    const [debouncedSearch, setDebouncedSearch] = useState(localStorage.getItem("manage_shop_search") || "")
    const [currentPage, setCurrentPage] = useState(Number(localStorage.getItem("manage_shop_page")) || 1)
    const [pageSize, setPageSize] = useState(Number(localStorage.getItem("manage_shop_page_size")) || 20)
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
    const [pendingCurrentPage, setPendingCurrentPage] = useState(1)
    const [pendingPageSize, setPendingPageSize] = useState(20)
    const [totalElements, setTotalElements] = useState(0)
    const [pendingTotalElements, setPendingTotalElements] = useState(0)
    const [activeTab, setActiveTab] = useState(localStorage.getItem("manage_shop_tab") || "all")
    const [selectedShopId, setSelectedShopId] = useState<number | null>(
        localStorage.getItem("lastSelectedShopId") ? Number(localStorage.getItem("lastSelectedShopId")) : null
    )
    const navigate = useNavigate()

    // Reject dialog
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: "" })
    const [rejectReason, setRejectReason] = useState("")
    const [actionLoading, setActionLoading] = useState<number | null>(null)

    const loadShops = useCallback(async () => {
        setLoading(true)
        try {
            // Include sort if needed, but ShopService sort param format might vary. 
            // For now, let's keep it simple with page, size, and search.
            const response = await ShopService.getAdminShopProfiles(currentPage, pageSize, debouncedSearch)
            const raw = response?.content || []
            const list = Array.isArray(raw) ? raw.map(mapAdminShopProfileRowToShop) : []
            setShops(list)
            setTotalElements(response?.totalElements ?? list.length)
        } catch (error) {
            handleApiError(error, "Failed to load shops")
        } finally {
            setLoading(false)
        }
    }, [debouncedSearch, currentPage, pageSize])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== debouncedSearch) {
                setDebouncedSearch(searchTerm)
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [searchTerm, debouncedSearch])

    useEffect(() => {
        localStorage.setItem("manage_shop_search", debouncedSearch)
        localStorage.setItem("manage_shop_page", String(currentPage))
        localStorage.setItem("manage_shop_page_size", String(pageSize))
        localStorage.setItem("manage_shop_tab", activeTab)
    }, [debouncedSearch, currentPage, pageSize, activeTab])

    const loadPendingShops = useCallback(async () => {
        setPendingLoading(true)
        try {
            const response = await ShopService.getPendingVettingShops(pendingCurrentPage - 1, pendingPageSize)
            const content = response?.content || []
            setPendingShops(content)
            setPendingTotalElements(response?.page?.totalElements ?? response?.totalElements ?? content.length)
        } catch (error) {
            handleApiError(error, "Failed to load pending shops")
        } finally {
            setPendingLoading(false)
        }
    }, [pendingCurrentPage, pendingPageSize])

    useEffect(() => {
        loadShops()
    }, [loadShops]) // Only trigger when debounced search or pagination actually changes

    useEffect(() => {
        loadPendingShops()
    }, [loadPendingShops]) // Only trigger when pending pagination changes

    const handleToggleStatus = async (e: React.MouseEvent, shop: Shop) => {
        e.stopPropagation()
        const newStatus = !shop.isActive
        setActionLoading(shop.id)
        try {
            await ShopService.toggleShopStatus(shop.id, newStatus)
            toast.success(`Shop ${newStatus ? "activated" : "deactivated"} successfully`)
            loadShops()
            loadPendingShops()
        } catch (err) {
            handleApiError(err, "Failed to toggle shop status")
        } finally {
            setActionLoading(null)
        }
    }

    const handleVerify = async (e: React.MouseEvent, shop: Shop) => {
        e.stopPropagation()
        setActionLoading(shop.id)
        try {
            await ShopService.verifyShop(shop.id)
            toast.success(`${shop.nameEn || shop.name} has been verified`)
            loadShops()
            loadPendingShops()
        } catch (err) {
            handleApiError(err, "Failed to verify shop")
        } finally {
            setActionLoading(null)
        }
    }

    const openRejectDialog = (e: React.MouseEvent, shop: Shop) => {
        e.stopPropagation()
        setRejectReason("")
        setRejectDialog({ open: true, id: shop.id, name: shop.nameEn || shop.name })
    }

    const handleRejectConfirm = async () => {
        setActionLoading(rejectDialog.id)
        try {
            await ShopService.rejectShop(rejectDialog.id, rejectReason || undefined)
            toast.success(`${rejectDialog.name} has been rejected`)
            setRejectDialog({ open: false, id: 0, name: "" })
            loadShops()
            loadPendingShops()
        } catch (err) {
            handleApiError(err, "Failed to reject shop")
        } finally {
            setActionLoading(null)
        }
    }

    const displayedAllShops = shops
    const displayedPendingShops = sortData(pendingShops, sortConfig)
    const totalPages = Math.max(1, Math.ceil(totalElements / pageSize))
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalElements)

    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(1)
    }

    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key))

    const exportToExcel = async () => {
        try {
            const XLSX = await import("xlsx")
            const data = displayedAllShops.map((shop) => ({
                ID: shop.id,
                Name: shop.name,
                NameMM: shop.nameMm || "",
                Category: shop.category,
                SubCategory: shop.category || "",
                Address: shop.address,
                District: resolveShopDistrictLabel(shop) || "",
                City: resolveShopCityLabel(shop) || "",
                Phone: shop.phone || "",
                Rating: shop.ratingAvg || 0,
                ReviewCount: shop.ratingCount || 0,
                Verified: shop.isVerified ? "Yes" : "No",
                Active: shop.isActive ? "Yes" : "No",
            }))
            const ws = XLSX.utils.json_to_sheet(data)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Shops")
            XLSX.writeFile(wb, "Shops.xlsx")
        } catch (error) {
            handleApiError(error, "Failed to export to Excel")
        }
    }

    const ShopTable = ({
        shopList,
        isLoading,
        variant = "full",
    }: {
        shopList: Shop[]
        isLoading: boolean
        variant?: "full" | "adminList"
    }) => (
        isLoading ? (
            <div className="flex justify-center items-center py-12"><Loader /></div>
        ) : variant === "adminList" ? (
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
                            <TableHead className="text-right w-[120px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {shopList.length > 0 ? (
                            shopList.map((shop) => {
                                const coverSrc = resolveMediaUrl(shop.coverUrl || shop.logoUrl)
                                const locality = [resolveShopDistrictLabel(shop), resolveShopCityLabel(shop)].filter(Boolean).join(", ")
                                const street = shop.addressEn || shop.address || ""
                                const addressDisplay = [street, locality].filter(Boolean).join(street && locality ? " · " : "") || "—"
                                return (
                                    <TableRow
                                        key={shop.id}
                                        onClick={() => {
                                            localStorage.setItem("lastSelectedShopId", String(shop.id))
                                            setSelectedShopId(shop.id)
                                            navigate(`/shops/create?id=${shop.id}`)
                                        }}
                                        className={`cursor-pointer transition-colors ${selectedShopId === shop.id ? "bg-primary/10 hover:bg-primary/20" : "hover:bg-muted/50"}`}
                                    >
                                        <TableCell className="align-middle">
                                            <LazyImage
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
                                                {shop.shopCategory?.nameEn || shop.category || shop.shopCategory?.nameMm || "—"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[280px] text-sm text-muted-foreground">
                                            <span className="line-clamp-2">{addressDisplay}</span>
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <div className="flex flex-col gap-1">
                                                <Switch
                                                    checked={shop.isActive !== false}
                                                    disabled={actionLoading === shop.id}
                                                    onCheckedChange={() =>
                                                        handleToggleStatus({ stopPropagation: () => {} } as unknown as React.MouseEvent, shop)
                                                    }
                                                />
                                                <span className={`text-xs font-medium ${shop.isActive !== false ? "text-green-600" : "text-red-500"}`}>
                                                    {shop.isActive !== false ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {shop.isVerified ? (
                                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Verified</Badge>
                                            ) : (
                                                <Badge variant="secondary">Unverified</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Edit"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        localStorage.setItem("lastSelectedShopId", String(shop.id))
                                                        setSelectedShopId(shop.id)
                                                        navigate(`/shops/create?id=${shop.id}`)
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title={shop.isVerified ? "Already verified" : "Verify shop"}
                                                    disabled={shop.isVerified || actionLoading === shop.id}
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={(e) => handleVerify(e, shop)}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Reject shop"
                                                    disabled={actionLoading === shop.id}
                                                    className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                                                    onClick={(e) => openRejectDialog(e, shop)}
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
        ) : (
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60px]">Photo</TableHead>
                            <SortableTableHead label="ID" sortKey="id" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTableHead label="Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTableHead label="Category" sortKey="category" sortConfig={sortConfig} onSort={handleSort} />
                            <TableHead>Location</TableHead>
                            <TableHead>Flags</TableHead>
                            <TableHead>Verified</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {shopList.length > 0 ? (
                            shopList.map((shop) => (
                                <TableRow
                                    key={shop.id}
                                    onClick={() => {
                                        localStorage.setItem("lastSelectedShopId", String(shop.id));
                                        setSelectedShopId(shop.id);
                                        navigate(`/shops/create?id=${shop.id}`);
                                    }}
                                    className={`cursor-pointer transition-colors ${selectedShopId === shop.id ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted/50'}`}
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
                                        {shop.nameMm && shop.nameEn && shop.nameMm !== shop.nameEn && <div className="text-xs text-muted-foreground">{shop.nameMm}</div>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">{shop.shopCategory?.nameEn || shop.category || shop.shopCategory?.nameMm || "—"}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {[resolveShopDistrictLabel(shop), resolveShopCityLabel(shop)].filter(Boolean).join(", ") || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1 max-w-[120px]">
                                            {shop.hasDelivery && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Delv</Badge>}
                                            {shop.isHalal && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-green-50 text-green-700">Halal</Badge>}
                                            {shop.isVegetarian && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-lime-50 text-lime-700">Veg</Badge>}
                                            {shop.hasWifi && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Wifi</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {shop.isVerified ? (
                                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">✓ Verified</Badge>
                                        ) : (
                                            <Badge variant="secondary">Unverified</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={shop.isActive !== false}
                                                disabled={actionLoading === shop.id}
                                                onCheckedChange={() => handleToggleStatus({ stopPropagation: () => { } } as unknown as React.MouseEvent, shop)}
                                            />
                                            <span className={`text-xs font-medium ${shop.isActive !== false ? "text-green-600" : "text-red-500"}`}>
                                                {shop.isActive !== false ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Edit"
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    localStorage.setItem("lastSelectedShopId", String(shop.id));
                                                    setSelectedShopId(shop.id);
                                                    navigate(`/shops/create?id=${shop.id}`) 
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title={shop.isVerified ? "Already verified" : "Verify shop"}
                                                disabled={shop.isVerified || actionLoading === shop.id}
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={(e) => handleVerify(e, shop)}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Reject shop"
                                                disabled={actionLoading === shop.id}
                                                className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                                                onClick={(e) => openRejectDialog(e, shop)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No results.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        )
    )

    return (
        <div className="container mx-auto py-10 max-w-7xl">
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="leading-tight">Shops &amp; Restaurants</CardTitle>
                            <CardDescription>Manage shops — verify, reject, or toggle active status.</CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search..."
                                    className="pl-8 w-full sm:w-[200px] lg:w-[300px]"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                                />
                            </div>
                            <Button variant="outline" className="gap-2 shrink-0" onClick={exportToExcel}>
                                <FileSpreadsheet className="h-4 w-4" />Export
                            </Button>
                            <Button className="shrink-0" onClick={() => navigate("/shops/create")}>
                                <Plus className="mr-2 h-4 w-4" />Create New
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Vetting Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                        <TabsList>
                            <TabsTrigger value="all">All Shops</TabsTrigger>
                            <TabsTrigger value="pending" className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" />
                                Pending Vetting
                                {pendingTotalElements > 0 && (
                                    <span className="ml-1 bg-orange-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">
                                        {pendingTotalElements}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                            {loading ? (
                                <div className="flex justify-center items-center py-12"><Loader /></div>
                            ) : (
                                <>
                                    <ShopTable shopList={displayedAllShops} isLoading={false} variant="adminList" />

                                    {/* Pagination */}
                                    <div className="flex flex-col items-center gap-4 py-4 md:flex-row md:justify-between px-2">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {totalElements ? startIndex + 1 : 0} to {endIndex} of {totalElements} entries
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                                                <ChevronsLeft className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                                    let pageNum = i + 1
                                                    if (totalPages > 5 && currentPage > 3) pageNum = currentPage - 2 + i
                                                    if (pageNum > totalPages) return null
                                                    return (
                                                        <Button key={i} variant={currentPage === pageNum ? "default" : "outline"} className="h-8 w-8 p-0" onClick={() => setCurrentPage(pageNum)}>
                                                            {pageNum}
                                                        </Button>
                                                    )
                                                })}
                                            </div>
                                            <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                                                <ChevronsRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Select value={`${pageSize}`} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1) }}>
                                                <SelectTrigger className="h-8 w-[70px]" hideClear><SelectValue /></SelectTrigger>
                                                <SelectContent side="top">
                                                    {[10, 20, 30, 40, 50].map((s) => <SelectItem key={s} value={`${s}`}>{s}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </>
                            )}
                        </TabsContent>
                        <TabsContent value="pending">
                            <ShopTable shopList={displayedPendingShops} isLoading={pendingLoading} variant="full" />
                            <DataTablePagination
                                currentPage={pendingCurrentPage}
                                totalPages={Math.max(1, Math.ceil(pendingTotalElements / pendingPageSize))}
                                totalItems={pendingTotalElements}
                                pageSize={pendingPageSize}
                                onPageChange={setPendingCurrentPage}
                                onPageSizeChange={(size) => { setPendingPageSize(size); setPendingCurrentPage(1); }}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Reject Dialog */}
            <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ open: false, id: 0, name: "" })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Shop</DialogTitle>
                        <DialogDescription>
                            Rejecting <strong>{rejectDialog.name}</strong> will set it as unverified and inactive. Optionally add a reason.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Input
                            placeholder="Reason (optional)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: 0, name: "" })}>Cancel</Button>
                        <Button variant="destructive" onClick={handleRejectConfirm} disabled={actionLoading === rejectDialog.id}>
                            {actionLoading === rejectDialog.id ? "Rejecting..." : "Reject Shop"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
