import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { DataTablePagination } from "@/components/DataTablePagination";
import { ManageUsersToolbar } from "./components/ManageUsersToolbar";
import { ManageUsersTable } from "./components/ManageUsersTable";
import { useManageUsersPage } from "@/hooks/manage-users/useManageUsersPage";
import { getUserDisplayName } from "./manageUsersHelpers";

export default function ManageUsers() {
  const page = useManageUsersPage();
  const deleteTarget = page.deleteDialog.user;

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="leading-tight">Manage Users</CardTitle>
              <CardDescription className="line-clamp-2 md:line-clamp-none">
                Manage platform admins and user accounts in one place.
              </CardDescription>
            </div>

            <ManageUsersToolbar
              searchTerm={page.searchTerm}
              accountType={page.accountType}
              onSearchChange={page.handleSearchChange}
              onAccountTypeChange={page.handleAccountTypeChange}
              onExport={page.onExport}
            />
          </div>
        </CardHeader>

        <CardContent>
          <ManageUsersTable
            users={page.users}
            loading={page.loading}
            sortConfig={page.sortConfig}
            rowOffset={page.rowOffset}
            onSort={page.handleSort}
            isCurrentAdmin={page.isCurrentAdmin}
            onEdit={page.goToEdit}
            onDelete={page.requestDelete}
          />

          {!page.loading && (
            <DataTablePagination
              currentPage={page.currentPage}
              totalPages={page.totalPages}
              totalItems={page.totalItems}
              pageSize={page.pageSize}
              onPageChange={page.setCurrentPage}
              onPageSizeChange={page.handlePageSizeChange}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={page.deleteDialog.open}
        onOpenChange={page.setDeleteDialogOpen}
        title="Deactivate user?"
        description={`This will soft-delete ${
          deleteTarget ? getUserDisplayName(deleteTarget) : "this user"
        }: they are removed from this list and cannot sign in. Records are kept in the database.`}
        confirmText="Deactivate"
        cancelText="Cancel"
        variant="destructive"
        loading={page.deleting}
        onCancel={page.closeDeleteDialog}
        onConfirm={page.confirmDelete}
      />
    </div>
  );
}
