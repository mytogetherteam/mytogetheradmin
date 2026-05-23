import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Store } from "lucide-react";
import type { ShopFeedbackGroup } from "@/schemas/shop-feedback.schema";
import { ShopFeedbackMessageRow } from "./ShopFeedbackMessageRow";
import type { ShopFeedback } from "@/schemas/shop-feedback.schema";

type ShopFeedbackShopGroupProps = {
  group: ShopFeedbackGroup;
  onDelete: (feedback: ShopFeedback) => void;
  onToggleRead: (feedback: ShopFeedback, isRead: boolean) => void;
  deleting?: boolean;
  updatingRead?: boolean;
};

export function ShopFeedbackShopGroup({
  group,
  onDelete,
  onToggleRead,
  deleting,
  updatingRead,
}: ShopFeedbackShopGroupProps) {
  return (
    <AccordionItem value={`shop-${group.shopId}`} className="border rounded-lg px-4 mb-3">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex flex-1 items-center gap-3 text-left">
          <Store className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate">{group.shopName}</div>
            {group.shopNameMm ? (
              <div className="text-xs text-muted-foreground truncate">
                {group.shopNameMm}
              </div>
            ) : null}
          </div>
          <Badge variant="secondary" className="shrink-0">
            {group.messages.length} message
            {group.messages.length === 1 ? "" : "s"}
          </Badge>
          {group.unreadCount > 0 ? (
            <Badge className="shrink-0">
              {group.unreadCount} unread
            </Badge>
          ) : null}
          <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
            ID {group.shopId}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-3 pb-4">
        {group.messages.map((feedback) => (
          <ShopFeedbackMessageRow
            key={feedback.id}
            feedback={feedback}
            onDelete={onDelete}
            onToggleRead={onToggleRead}
            deleting={deleting}
            updatingRead={updatingRead}
          />
        ))}
      </AccordionContent>
    </AccordionItem>
  );
}
