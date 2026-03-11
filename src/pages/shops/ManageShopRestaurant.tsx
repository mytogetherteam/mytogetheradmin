import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { ShopService, Shop } from "@/services/shopService"
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
import * as XLSX from "xlsx"

export default function ManageShopRestaurant() {
    const [shops, setShops] = useState<Shop[]>([])
    const [pendingShops, setPendingShops] = useState<Shop[]>([])
    const [loading, setLoading] = useState(true)
    const [pendingLoading, setPendingLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
    const [pendingCurrentPage, setPendingCurrentPage] = useState(1)
    const [pendingPageSize, setPendingPageSize] = useState(20)
    const [pendingTotalElements, setPendingTotalElements] = useState(0)
    const [activeTab, setActiveTab] = useState("all")
    const navigate = useNavigate()

    // Reject dialog
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: "" })
    const [rejectReason, setRejectReason] = useState("")
    const [actionLoading, setActionLoading] = useState<number | null>(null)

    const loadShops = useCallback(async () => {
        setLoading(true)
        try {
            const response = await ShopService.getAllShops(0, 200, debouncedSearch)
            const list = response?.content || []
            setShops(Array.isArray(list) ? list : [])
        } catch (error) {
            console.error("Failed to load shops:", error)
            toast.error("Failed to load shops")
        } finally {
            setLoading(false)
        }
    }, [debouncedSearch])

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const loadPendingShops = useCallback(async () => {
        setPendingLoading(true)
        try {
            const response = await ShopService.getPendingVettingShops(pendingCurrentPage - 1, pendingPageSize)
            const content = response?.content || []
            setPendingShops(content)
            setPendingTotalElements(response?.totalElements ?? content.length)
        } catch (error) {
            console.error("Failed to load pending shops:", error)
        } finally {
            setPendingLoading(false)
        }
    }, [pendingCurrentPage, pendingPageSize])

    useEffect(() => {
        loadShops()
    }, [loadShops])

    useEffect(() => {
        loadPendingShops()
    }, [loadPendingShops])

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
            console.error(err)
            toast.error("Failed to toggle shop status")
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
            console.error(err)
            toast.error("Failed to verify shop")
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
            console.error(err)
            toast.error("Failed to reject shop")
        } finally {
            setActionLoading(null)
        }
    }

    const sortedShops = sortData(shops, sortConfig)

    const totalItems = sortedShops.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)
    const currentShops = sortedShops.slice(startIndex, endIndex)

    if (currentPage > totalPages && totalPages > 0) setCurrentPage(1)

    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key))

    const exportToExcel = () => {
        const data = sortedShops.map((shop) => ({
            ID: shop.id,
            Name: shop.name,
            NameMM: shop.nameMm || "",
            Category: shop.category,
            SubCategory: shop.subCategory || "",
            Address: shop.address,
            District: shop.district || "",
            City: shop.city || "",
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
    }

    const ShopTable = ({ shopList, isLoading }: { shopList: Shop[]; isLoading: boolean }) => (
        isLoading ? (
            <div className="flex justify-center items-center py-12"><Loader /></div>
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
                                    onClick={() => navigate(`/shops/create?id=${shop.id}`)}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                >
                                    <TableCell>
                                        <div className="w-10 h-10 rounded-md overflow-hidden border bg-muted shrink-0">
                                            {shop.logoUrl ? (
                                                <img
                                                    src={shop.logoUrl}
                                                    alt={shop.nameEn || shop.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">N/A</div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{shop.id}</TableCell>
                                    <TableCell className="font-medium">
                                        <div>{shop.nameEn || shop.name}</div>
                                        {shop.nameMm && <div className="text-xs text-muted-foreground">{shop.nameMm}</div>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">{shop.category}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {[shop.district, shop.city].filter(Boolean).join(", ") || "—"}
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
                                                onClick={(e) => { e.stopPropagation(); navigate(`/shops/create?id=${shop.id}`) }}
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
                                {pendingShops.length > 0 && (
                                    <span className="ml-1 bg-orange-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">
                                        {pendingShops.length}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                            {loading ? (
                                <div className="flex justify-center items-center py-12"><Loader /></div>
                            ) : (
                                <>
                                    <ShopTable shopList={currentShops} isLoading={false} />

                                    {/* Pagination */}
                                    <div className="flex flex-col items-center gap-4 py-4 md:flex-row md:justify-between px-2">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {totalItems ? startIndex + 1 : 0} to {endIndex} of {totalItems} entries
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
                                                <SelectTrigger className="h-8 w-[70px]"><SelectValue /></SelectTrigger>
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
                            <ShopTable shopList={pendingShops} isLoading={pendingLoading} />
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
