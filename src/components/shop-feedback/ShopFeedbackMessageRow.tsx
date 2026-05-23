import { format } from "date-fns";
import { Check, Mail, MailOpen, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ShopFeedback } from "@/schemas/shop-feedback.schema";

type ShopFeedbackMessageRowProps = {
  feedback: ShopFeedback;
  onDelete: (feedback: ShopFeedback) => void;
  onToggleRead: (feedback: ShopFeedback, isRead: boolean) => void;
  deleting?: boolean;
  updatingRead?: boolean;
};

export function ShopFeedbackMessageRow({
  feedback,
  onDelete,
  onToggleRead,
  deleting,
  updatingRead,
}: ShopFeedbackMessageRowProps) {
  const adminLabel =
    feedback.admin?.name ||
    feedback.admin?.email ||
    (feedback.adminId ? `Admin #${feedback.adminId}` : "Unknown admin");

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between",
        feedback.isRead ? "bg-card" : "border-primary/30 bg-primary/5",
      )}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
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
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {feedback.message}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {adminLabel}
          </span>
          <Badge variant="outline" className="font-mono text-[10px]">
            #{feedback.id}
          </Badge>
          <span>
            {format(new Date(feedback.createdAt), "MMM d, yyyy HH:mm")}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={updatingRead || feedback.isRead}
          onClick={() => onToggleRead(feedback, true)}
          className="text-muted-foreground"
        >
          <Check className="mr-1 h-4 w-4" />
          Mark read
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          disabled={deleting}
          onClick={() => onDelete(feedback)}
          aria-label="Delete feedback"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
