import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { DataTablePagination } from "@/components/DataTablePagination";
import { AdminSessionsTable } from "./components/AdminSessionsTable";
import { useAdminSessionsPage } from "@/hooks/admins/useAdminSessionsPage";
import { Search } from "lucide-react";

export default function AdminSessions() {
  const page = useAdminSessionsPage();
  const target = page.logoutDialog.admin;
  const targetLabel =
    target?.name || target?.username || target?.email || "this admin";

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="leading-tight">Active Sessions</CardTitle>
              <CardDescription className="line-clamp-2 md:line-clamp-none">
                Admins with a live single-device session. Force-logout an admin
                to clear their session and require a fresh login.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-auto shrink-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, email, username..."
                className="pl-8 w-full sm:w-[260px] lg:w-[320px]"
                value={page.searchTerm}
                onChange={(e) => page.handleSearchChange(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <AdminSessionsTable
            sessions={page.sessions}
            loading={page.loading}
            rowOffset={page.rowOffset}
            onForceLogout={page.requestLogout}
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
        open={page.logoutDialog.open}
        onOpenChange={page.setLogoutDialogOpen}
        title="Force logout?"
        description={`This will clear the active session for ${targetLabel}. They will be signed out and must log in again.`}
        confirmText="Force Logout"
        cancelText="Cancel"
        variant="destructive"
        loading={page.loggingOut}
        onCancel={page.closeLogoutDialog}
        onConfirm={page.confirmLogout}
      />
    </div>
  );
}
