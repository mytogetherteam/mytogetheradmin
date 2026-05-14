import { useEffect, useState, useMemo } from "react"
import debounce from "debounce"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { ShopService, Shop, resolveShopCityLabel, resolveShopDistrictLabel, mapAdminShopProfileRowToShop } from "@/services/shopService"
import { useAdminShopProfilesQuery } from "@/hooks/shops/useAdminShopProfilesQuery"
import { useToggleShopStatusMutation } from "@/hooks/shops/useToggleShopStatusMutation"
import { adminShopProfilesQueryRoot } from "@/hooks/shops/adminShopProfilesQueryKeys"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTablePagination } from "@/components/DataTablePagination"
import { ShopTable } from "@/components/shop/ShopTable"
import { SortConfig, toggleSort } from "@/lib/sort-utils"
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
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Plus,
    Search,
    FileSpreadsheet,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
} from "lucide-react"
import { toast } from "sonner"
import { handleApiError } from "@/lib/error-utils"
// import * as XLSX from "xlsx" // Removed for dynamic import

export default function ManageShopRestaurant() {
    const pendingTotalElements = 0
    const [searchTerm, setSearchTerm] = useState(localStorage.getItem("manage_shop_search") || "")
    const [debouncedSearch, setDebouncedSearch] = useState(localStorage.getItem("manage_shop_search") || "")
    const [currentPage, setCurrentPage] = useState(Number(localStorage.getItem("manage_shop_page")) || 1)
    const [pageSize, setPageSize] = useState(Number(localStorage.getItem("manage_shop_page_size")) || 20)
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
    const [pendingCurrentPage, setPendingCurrentPage] = useState(1)
    const [pendingPageSize, setPendingPageSize] = useState(20)
    const [activeTab, setActiveTab] = useState(localStorage.getItem("manage_shop_tab") || "all")
    const [selectedShopId, setSelectedShopId] = useState<number | null>(
        localStorage.getItem("lastSelectedShopId") ? Number(localStorage.getItem("lastSelectedShopId")) : null
    )
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        data: shopListData,
        isPending: shopsLoading,
    } = useAdminShopProfilesQuery(currentPage, pageSize, debouncedSearch)

    const toggleShopStatusMutation = useToggleShopStatusMutation()
    const toggleBusyShopId =
        toggleShopStatusMutation.isPending && toggleShopStatusMutation.variables
            ? toggleShopStatusMutation.variables.id
            : null

    const shopRows = useMemo(
        () => (shopListData?.content ?? []).map(mapAdminShopProfileRowToShop),
        [shopListData],
    )
    const totalElements = shopListData?.totalElements ?? 0
    const totalPages = Math.max(1, shopListData?.totalPages ?? 1)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = totalElements === 0 ? 0 : startIndex + shopRows.length

    // Reject dialog
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: "" })
    const [rejectReason, setRejectReason] = useState("")
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: "" })
    const [actionLoading, setActionLoading] = useState<number | null>(null)

    const setDebouncedSearchDelayed = useMemo(
        () => debounce((next: string) => setDebouncedSearch(next), 300),
        [],
    )

    useEffect(() => {
        setDebouncedSearchDelayed(searchTerm)
    }, [searchTerm, setDebouncedSearchDelayed])

    useEffect(() => {
        return () => {
            setDebouncedSearchDelayed.clear()
        }
    }, [setDebouncedSearchDelayed])

    const handleToggleStatus = (shop: Shop, nextActive: boolean) => {
        const currentlyActive = shop.isActive !== false
        if (currentlyActive === nextActive) return
        toggleShopStatusMutation.mutate({ id: shop.id, isActive: nextActive })
    }

    const handleVerify = async (e: React.MouseEvent, shop: Shop) => {
        e.stopPropagation()
        setActionLoading(shop.id)
        try {
            await ShopService.verifyShop(shop.id)
            toast.success(`${shop.nameEn || shop.name} has been verified`)
            void queryClient.invalidateQueries({
                queryKey: [...adminShopProfilesQueryRoot],
            })
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
            void queryClient.invalidateQueries({
                queryKey: [...adminShopProfilesQueryRoot],
            })
        } catch (err) {
            handleApiError(err, "Failed to reject shop")
        } finally {
            setActionLoading(null)
        }
    }

    const openDeleteDialog = (shop: Shop) => {
        setDeleteDialog({ open: true, id: shop.id, name: shop.nameEn || shop.nameMm || shop.name || `Shop #${shop.id}` })
    }

    const handleDeleteConfirm = async () => {
        setActionLoading(deleteDialog.id)
        try {
            await ShopService.deleteShop(deleteDialog.id)
            toast.success("Shop deleted")
            setDeleteDialog({ open: false, id: 0, name: "" })
            setSelectedShopId((prev) => (prev === deleteDialog.id ? null : prev))
            void queryClient.invalidateQueries({
                queryKey: [...adminShopProfilesQueryRoot],
            })
        } catch (err) {
            handleApiError(err, "Failed to delete shop")
        } finally {
            setActionLoading(null)
        }
    }

    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key))

    const handleEditShop = (shop: Shop) => {
        localStorage.setItem("lastSelectedShopId", String(shop.id))
        setSelectedShopId(shop.id)
        navigate(`/shops/create?id=${shop.id}`)
    }

    const exportToExcel = async () => {
        try {
            const XLSX = await import("xlsx")
            const data = shopRows.map((shop) => ({
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

    return (
        <div className="container mx-auto py-10 max-w-7xl">
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="leading-tight">Shops &amp; Restaurants</CardTitle>
                            <CardDescription>
                                Toggle active status inline, verify or reject vetting, edit, or delete a shop.
                            </CardDescription>
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
                            <ShopTable
                                shopList={shopRows}
                                isLoading={shopsLoading}
                                variant="adminList"
                                selectedShopId={selectedShopId}
                                sortConfig={sortConfig}
                                onSort={handleSort}
                                actionLoading={actionLoading}
                                toggleBusyShopId={toggleBusyShopId}
                                onToggleStatus={handleToggleStatus}
                                onEditShop={handleEditShop}
                                onVerify={handleVerify}
                                onOpenReject={openRejectDialog}
                                onOpenDelete={openDeleteDialog}
                            />
                            {!shopsLoading && (
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
                            )}
                        </TabsContent>
                        <TabsContent value="pending">
                            {/* //<ShopTable shopList={displayedPendingShops} isLoading={pendingLoading} variant="full" /> */}
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
            <AlertDialog
                open={deleteDialog.open}
                onOpenChange={(open) => !open && setDeleteDialog({ open: false, id: 0, name: "" })}
            >
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete shop?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove <strong>{deleteDialog.name}</strong> and its related data where the API allows. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading === deleteDialog.id}>Cancel</AlertDialogCancel>
                        <Button
                            variant="destructive"
                            disabled={actionLoading === deleteDialog.id}
                            onClick={() => void handleDeleteConfirm()}
                        >
                            {actionLoading === deleteDialog.id ? "Deleting…" : "Delete shop"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    )
}
