import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ShopActionDialogState } from '@/hooks/shops/profiles/manageShopRestaurantTypes';

type RejectShopDialogProps = {
  state: ShopActionDialogState;
  reason: string;
  isLoading: boolean;
  onReasonChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function RejectShopDialog({
  state,
  reason,
  isLoading,
  onReasonChange,
  onOpenChange,
  onConfirm,
}: RejectShopDialogProps) {
  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Shop</DialogTitle>
          <DialogDescription>
            Rejecting <strong>{state.name}</strong> will set it as unverified and inactive.
            Optionally add a reason.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Input
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Rejecting...' : 'Reject Shop'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
