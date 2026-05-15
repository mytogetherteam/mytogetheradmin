import { Card, CardContent } from '@/components/ui/card';
import { ShopTable } from '@/components/shop/ShopTable';
import { DataTablePagination } from '@/components/DataTablePagination';
import { ManageShopRestaurantHeader } from '@/components/shop/manage/ManageShopRestaurantHeader';
import { DeleteShopDialog } from '@/components/shop/manage/DeleteShopDialog';
import { useManageShopRestaurant } from '@/hooks/shops/profiles/useManageShopRestaurant';

export default function ManageShopRestaurant() {
  const { table, pagination, search, deleteDialog, actions } =
    useManageShopRestaurant();

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <Card className="flex flex-col h-full">
        <ManageShopRestaurantHeader
          searchTerm={search.searchTerm}
          onSearchChange={search.onSearchChange}
          onExport={actions.onExport}
          onCreateShop={actions.onCreateShop}
        />
        <CardContent>
          <ShopTable
            shopList={table.shopRows}
            isLoading={table.shopsLoading}
            variant="adminList"
            selectedShopId={table.selectedShopId}
            sortConfig={table.sortConfig}
            onSort={actions.onSort}
            toggleBusyShopId={table.toggleBusyShopId}
            onToggleStatus={actions.onToggleStatus}
            onToggleVerified={actions.onToggleVerified}
            onEditShop={actions.onEditShop}
            onOpenReject={()=>console.log('open reject')}
            onOpenDelete={actions.onOpenDelete}
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
    </div>
  );
}
