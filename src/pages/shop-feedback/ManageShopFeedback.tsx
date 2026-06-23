import { CheckCheck, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { DataTablePagination } from "@/components/DataTablePagination";
import { ShopFeedbackTable } from "@/components/shop-feedback/ShopFeedbackTable";
import { useShopFeedbackManagement } from "@/hooks/shop-feedback/useShopFeedbackManagement";
import { getShopDisplayName } from "@/schemas/shop-feedback.schema";

export default function ManageShopFeedback() {
  const { search, pagination, list, deleteDialog, readFilter, read, selection } =
    useShopFeedbackManagement();

  const deleteShopName = deleteDialog.target
    ? getShopDisplayName(deleteDialog.target)
    : "";

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <MessageSquare className="h-6 w-6 shrink-0 text-primary" />
              <div>
                <CardTitle className="leading-tight">Shop Feedback</CardTitle>
                <CardDescription>
                  Messages from shop admins. Unread rows are highlighted.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full md:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search feedback messages..."
                  className="pl-9"
                  value={search.term}
                  onChange={(e) => search.setTerm(e.target.value)}
                />
              </div>
              <Select
                value={readFilter.value}
                onValueChange={(v) =>
                  readFilter.setValue(v as "all" | "unread" | "read")
                }
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Read status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All messages</SelectItem>
                  <SelectItem value="unread">Unread only</SelectItem>
                  <SelectItem value="read">Read only</SelectItem>
                </SelectContent>
              </Select>
              {readFilter.unreadOnPage > 0 ? (
                <Badge variant="default" className="shrink-0">
                  {readFilter.unreadOnPage} unread on this page
                </Badge>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!read.canMarkSelected || read.updating}
              onClick={() => void read.markSelectedAsRead()}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark selected as read
              {selection.selectedCount > 0
                ? ` (${read.selectedUnreadCount} unread)`
                : ""}
            </Button>
            {selection.selectedCount > 0 ? (
              <span className="text-sm text-muted-foreground">
                {selection.selectedCount} selected
              </span>
            ) : null}
          </div>

          <ShopFeedbackTable
            items={list.raw}
            loading={list.loading}
            selectedIds={selection.selectedIds}
            allSelected={selection.allSelected}
            someSelected={selection.someSelected}
            onToggleSelect={selection.toggleSelect}
            onToggleSelectAll={selection.toggleSelectAll}
            onDelete={deleteDialog.openDelete}
            onToggleRead={read.markRead}
            deleting={deleteDialog.loading}
            updatingRead={read.updating}
          />

          {!list.loading && (
            <DataTablePagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={deleteDialog.onOpenChange}
        title="Delete feedback"
        description={
          deleteDialog.target
            ? `Remove this message from ${deleteShopName}? This cannot be undone.`
            : "Remove this feedback message?"
        }
        confirmText="Delete"
        variant="destructive"
        loading={deleteDialog.loading}
        onCancel={deleteDialog.onCancel}
        onConfirm={deleteDialog.onConfirm}
      />
    </div>
  );
}
