import { format } from "date-fns";
import { Check, Loader2, Mail, MailOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ShopFeedback } from "@/schemas/shop-feedback.schema";
import { getShopDisplayName } from "@/schemas/shop-feedback.schema";

type ShopFeedbackTableProps = {
  items: ShopFeedback[];
  loading?: boolean;
  selectedIds: Set<number>;
  allSelected: boolean;
  someSelected: boolean;
  onToggleSelect: (id: number, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onDelete: (feedback: ShopFeedback) => void;
  onToggleRead: (feedback: ShopFeedback, isRead: boolean) => void;
  deleting?: boolean;
  updatingRead?: boolean;
};

function getAdminLabel(feedback: ShopFeedback): string {
  return (
    feedback.admin?.name ||
    feedback.admin?.email ||
    (feedback.adminId ? `Admin #${feedback.adminId}` : "—")
  );
}

export function ShopFeedbackTable({
  items,
  loading,
  selectedIds,
  allSelected,
  someSelected,
  onToggleSelect,
  onToggleSelectAll,
  onDelete,
  onToggleRead,
  deleting,
  updatingRead,
}: ShopFeedbackTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[44px]">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
                aria-label="Select all on this page"
              />
            </TableHead>
            <TableHead className="w-[70px]">ID</TableHead>
            <TableHead className="min-w-[180px]">Shop</TableHead>
            <TableHead className="min-w-[280px]">Message</TableHead>
            <TableHead className="min-w-[140px]">Submitted by</TableHead>
            <TableHead className="w-[110px]">Status</TableHead>
            <TableHead className="w-[150px]">Date</TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="h-24 text-center text-muted-foreground"
              >
                No shop feedback found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((feedback) => (
              <TableRow
                key={feedback.id}
                className={cn(
                  !feedback.isRead && "bg-primary/5",
                  selectedIds.has(feedback.id) && "bg-muted/40",
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(feedback.id)}
                    onCheckedChange={(checked) =>
                      onToggleSelect(feedback.id, checked === true)
                    }
                    aria-label={`Select feedback #${feedback.id}`}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  #{feedback.id}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{getShopDisplayName(feedback)}</div>
                  {feedback.shop?.nameMm ? (
                    <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                      {feedback.shop.nameMm}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>
                  <p className="text-sm line-clamp-3 whitespace-pre-wrap">
                    {feedback.message}
                  </p>
                </TableCell>
                <TableCell className="text-sm">{getAdminLabel(feedback)}</TableCell>
                <TableCell>
                  <Badge variant={feedback.isRead ? "secondary" : "default"}>
                    {feedback.isRead ? (
                      <>
                        <MailOpen className="mr-1 h-3 w-3" />
                        Read
                      </>
                    ) : (
                      <>
                        <Mail className="mr-1 h-3 w-3" />
                        Unread
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {format(new Date(feedback.createdAt), "MMM d, yyyy HH:mm")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={updatingRead || feedback.isRead}
                      onClick={() => onToggleRead(feedback, true)}
                      aria-label="Mark as read"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      disabled={deleting}
                      onClick={() => onDelete(feedback)}
                      aria-label="Delete feedback"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
