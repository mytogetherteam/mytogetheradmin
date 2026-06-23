import { Bike, Eye, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableImage } from "@/components/TableImage";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ListStateView from "@/components/common/ListStateView";
import { DataTablePagination } from "@/components/DataTablePagination";
import { useDeliveryDriversManagement } from "@/hooks/delivery-drivers/useDeliveryDriversManagement";
import {
  getDeliveryDriverShopName,
  isDeliveryDriverDeleted,
  type DeliveryDriver,
} from "@/schemas/delivery-driver.schema";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function DriverDetailBody({ driver }: { driver: DeliveryDriver }) {
  return (
    <dl className="grid gap-3 text-sm">
      <div className="flex items-center gap-3">
        <TableImage
          src={driver.profileUrl}
          alt={driver.name}
          size="lg"
          fallbackIcon={<Bike className="h-5 w-5 text-muted-foreground" />}
        />
        <div>
          <p className="font-medium">{driver.name}</p>
          <p className="text-muted-foreground">{driver.phone}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <dt className="text-muted-foreground">Vehicle</dt>
          <dd className="font-medium">{driver.vehicleNo}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Shop</dt>
          <dd className="font-medium">{getDeliveryDriverShopName(driver)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Active</dt>
          <dd>{driver.isActive ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Busy</dt>
          <dd>{driver.isBusy ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Created</dt>
          <dd>{formatDate(driver.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Updated</dt>
          <dd>{formatDate(driver.updatedAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Soft deleted</dt>
          <dd>{formatDate(driver.deletedAt)}</dd>
        </div>
      </div>
    </dl>
  );
}

export function DeliveryDriversTab() {
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
    <div className="flex flex-col gap-4 pt-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, or vehicle no…"
            className="pl-9"
            value={search.term}
            onChange={(e) => search.setTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-40">
          <Input
            placeholder="Shop ID"
            value={shopId.value}
            onChange={(e) => shopId.setValue(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            value={activeFilter.value}
            onValueChange={(v) =>
              activeFilter.setValue(v as "all" | "active" | "inactive")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Active status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-44">
          <Select
            value={deletedFilter.value}
            onValueChange={(v) =>
              deletedFilter.setValue(v as "all" | "active-only")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Deleted filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Include soft-deleted</SelectItem>
              <SelectItem value="active-only">Active records only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ListStateView
        isLoading={list.loading}
        isError={list.isError}
        isEmpty={!list.loading && list.drivers.length === 0}
        loadingMessage="Loading delivery drivers…"
        errorMessage={
          list.error instanceof Error
            ? list.error.message
            : "Failed to load delivery drivers."
        }
        emptyMessage="No delivery drivers found."
      >
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
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
                <TableRow key={driver.id}>
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
                  <TableCell className="font-medium">{driver.name}</TableCell>
                  <TableCell>{driver.phone}</TableCell>
                  <TableCell>{driver.vehicleNo}</TableCell>
                  <TableCell>{getDeliveryDriverShopName(driver)}</TableCell>
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

        <DataTablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </ListStateView>

      <Dialog
        open={!!detail.target}
        onOpenChange={(open) => {
          if (!open) detail.close();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delivery driver</DialogTitle>
            <DialogDescription>
              Driver #{detail.target?.id ?? "—"}
            </DialogDescription>
          </DialogHeader>
          {detail.target ? <DriverDetailBody driver={detail.target} /> : null}
          {detail.target ? (
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => deleteDialog.openDelete(detail.target!)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hard delete
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={deleteDialog.onOpenChange}
        title="Permanently delete driver?"
        description={
          deleteDialog.target
            ? `Remove ${deleteDriverName} from the database. This cannot be undone. Orders referencing this driver may block deletion.`
            : "Permanently remove this delivery driver?"
        }
        confirmText="Delete permanently"
        variant="destructive"
        loading={deleteDialog.loading}
        onCancel={deleteDialog.onCancel}
        onConfirm={deleteDialog.onConfirm}
      />
    </div>
  );
}
