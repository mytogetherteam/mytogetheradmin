import { MessageSquare, Search } from "lucide-react";
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
import { Accordion } from "@/components/ui/accordion";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ListStateView from "@/components/common/ListStateView";
import { DataTablePagination } from "@/components/DataTablePagination";
import { ShopFeedbackShopGroup } from "@/components/shop-feedback/ShopFeedbackShopGroup";
import { useShopFeedbackManagement } from "@/hooks/shop-feedback/useShopFeedbackManagement";
import { getShopDisplayName } from "@/schemas/shop-feedback.schema";

export default function ManageShopFeedback() {
  const { search, pagination, list, deleteDialog, readFilter, read } =
    useShopFeedbackManagement();

  const deleteShopName = deleteDialog.target
    ? getShopDisplayName(deleteDialog.target)
    : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">Shop Feedback</h1>
          <p className="text-sm text-muted-foreground">
            Messages from shop admins, grouped by shop
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Search message text. Results on this page are grouped by shop name.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search feedback messages..."
              className="pl-9"
              value={search.term}
              onChange={(e) => search.setTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={readFilter.value}
              onValueChange={(v) =>
                readFilter.setValue(v as "all" | "unread" | "read")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Read status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All messages</SelectItem>
                <SelectItem value="unread">Unread only</SelectItem>
                <SelectItem value="read">Read only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {readFilter.unreadOnPage > 0 ? (
            <Badge variant="default">
              {readFilter.unreadOnPage} unread on this page
            </Badge>
          ) : null}
        </CardContent>
      </Card>

      <ListStateView
        isLoading={list.loading}
        isError={list.isError}
        isEmpty={!list.loading && list.groups.length === 0}
        loadingMessage="Loading shop feedback…"
        errorMessage={
          list.error instanceof Error
            ? list.error.message
            : "Failed to load shop feedback. Ensure the API is running and migrations are applied."
        }
        emptyMessage="No shop feedback found."
      >
        <Accordion
          type="multiple"
          defaultValue={list.groups.map((g) => `shop-${g.shopId}`)}
          className="w-full"
        >
          {list.groups.map((group) => (
            <ShopFeedbackShopGroup
              key={group.shopId}
              group={group}
              onDelete={deleteDialog.openDelete}
              onToggleRead={read.markRead}
              deleting={deleteDialog.loading}
              updatingRead={read.updating}
            />
          ))}
        </Accordion>

        <DataTablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </ListStateView>

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
