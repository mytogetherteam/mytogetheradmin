import { Bike, Eye, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TableImage } from "@/components/TableImage";
import { DataTablePagination } from "@/components/DataTablePagination";
import { useDeliveryDriversManagement } from "@/pages/delivery-drivers/hooks/useDeliveryDriversManagement";
import {
  getDeliveryDriverShopName,
  isDeliveryDriverDeleted,
} from "@/schemas/delivery-driver.schema";
import { DeliveryDriverDetailModal } from "./DeliveryDriverDetailModal";
import { DeliveryDriversFilters } from "./DeliveryDriversFilters";

export function DeliveryDriversPanel() {
  const {
    search,
    shopId,
    activeFilter,
    deletedFilter,
    pagination,
    list,
    detail,
    deleteDialog,
  } = useDeliveryDriversManagement();

  const deleteDriverName = deleteDialog.target?.name ?? "";

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Search and filter delivery drivers across all shops.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeliveryDriversFilters
            search={search.term}
            onSearchChange={search.setTerm}
            shopId={shopId.value}
            onShopIdChange={shopId.setValue}
            activeFilter={activeFilter.value}
            onActiveFilterChange={activeFilter.setValue}
            deletedFilter={deletedFilter.value}
            onDeletedFilterChange={deletedFilter.setValue}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm border-muted/60">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center justify-between">
            <span>All drivers</span>
            <Badge variant="secondary" className="rounded-full px-3">
              {pagination.totalItems} drivers
            </Badge>
          </CardTitle>
          <CardDescription>
            Shops soft-delete drivers; use hard delete to remove records
            permanently.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {list.loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : list.isError ? (
            <div className="py-16 text-center text-sm text-destructive px-4">
              {list.error instanceof Error
                ? list.error.message
                : "Failed to load delivery drivers."}
            </div>
          ) : list.drivers.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No delivery drivers found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="w-[56px]">Photo</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Shop</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.drivers.map((driver) => (
                      <TableRow
                        key={driver.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <TableCell>
                          <TableImage
                            src={driver.profileUrl}
                            alt={driver.name}
                            size="sm"
                            fallbackIcon={
                              <Bike className="h-4 w-4 text-muted-foreground" />
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {driver.name}
                        </TableCell>
                        <TableCell>{driver.phone}</TableCell>
                        <TableCell>{driver.vehicleNo}</TableCell>
                        <TableCell>
                          {getDeliveryDriverShopName(driver)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {driver.isActive ? (
                              <Badge variant="default">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            {driver.isBusy ? (
                              <Badge variant="outline">Busy</Badge>
                            ) : null}
                            {isDeliveryDriverDeleted(driver) ? (
                              <Badge variant="destructive">Soft deleted</Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="View details"
                              onClick={() => detail.open(driver)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Permanently delete"
                              onClick={() => deleteDialog.openDelete(driver)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="p-4 border-t">
                <DataTablePagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalItems}
                  pageSize={pagination.pageSize}
                  onPageChange={pagination.setPage}
                  onPageSizeChange={pagination.setPageSize}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <DeliveryDriverDetailModal
        driver={detail.target}
        open={!!detail.target}
        onOpenChange={(open) => {
          if (!open) detail.close();
        }}
        onHardDelete={deleteDialog.openDelete}
      />

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={deleteDialog.onOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete driver?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.target
                ? `Remove ${deleteDriverName} from the database. This cannot be undone. Orders referencing this driver may block deletion.`
                : "Permanently remove this delivery driver?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteDialog.loading}
              onClick={deleteDialog.onCancel}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteDialog.loading}
              onClick={(e) => {
                e.preventDefault();
                void deleteDialog.onConfirm();
              }}
            >
              {deleteDialog.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete permanently"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
