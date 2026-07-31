import { Card, CardContent } from '@/components/ui/card';
import { ShopTable } from '@/components/shop/ShopTable';
import { DataTablePagination } from '@/components/DataTablePagination';
import { ManageShopRestaurantHeader } from '@/components/shop/manage/ManageShopRestaurantHeader';
import { DeleteShopDialog } from '@/components/shop/manage/DeleteShopDialog';
import { AssignAdminDialog } from '@/components/shop/manage/AssignAdminDialog';
import { EditShopSlugDialog } from '@/components/shop/manage/EditShopSlugDialog';
import { useManageShopRestaurant } from '@/hooks/shops/profiles/useManageShopRestaurant';

export default function ManageShopRestaurant() {
  const { table, pagination, search, deleteDialog, assignDialog, slugDialog, filters, actions } =
    useManageShopRestaurant();

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <Card className="flex flex-col h-full">
        <ManageShopRestaurantHeader
          searchTerm={search.searchTerm}
          onSearchChange={search.onSearchChange}
          onExport={actions.onExport}
          onCreateShop={actions.onCreateShop}
          filters={filters}
        />
        <CardContent>
          <ShopTable
            shopList={table.shopRows}
            isLoading={table.shopsLoading}
            selectedShopId={table.selectedShopId}
            sortConfig={table.sortConfig}
            onSort={actions.onSort}
            onReorder={actions.onReorder}
            reordering={table.reordering}
            toggleBusyShopId={table.toggleBusyShopId}
            onToggleStatus={actions.onToggleStatus}
            onToggleVerified={actions.onToggleVerified}
            onToggleTaxEnable={actions.onToggleTaxEnable}
            onEditShop={actions.onEditShop}
            onEditSlug={actions.onEditSlug}
            onOpenReject={() => console.log('open reject')}
            onOpenDelete={actions.onOpenDelete}
            onAssignAdmin={actions.onOpenAssign}
          />
          {!table.shopsLoading && (
            <DataTablePagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalElements}
              pageSize={pagination.pageSize}
              onPageChange={pagination.onPageChange}
              onPageSizeChange={pagination.onPageSizeChange}
              pageSizeOptions={[10, 20, 30, 40, 50]}
            />
          )}
        </CardContent>
      </Card>

      <DeleteShopDialog {...deleteDialog} />
      <AssignAdminDialog
        state={assignDialog.state}
        isLoading={assignDialog.isLoading}
        onOpenChange={assignDialog.onOpenChange}
        onConfirm={assignDialog.mutate}
      />
      <EditShopSlugDialog
        state={slugDialog.state}
        onOpenChange={slugDialog.onOpenChange}
      />
    </div>
  );
}
