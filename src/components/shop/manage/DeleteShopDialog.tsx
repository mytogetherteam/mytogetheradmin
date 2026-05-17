import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ShopActionDialogState } from '@/hooks/shops/profiles/manageShopRestaurantTypes';

type DeleteShopDialogProps = {
  state: ShopActionDialogState;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DeleteShopDialog({
  state,
  isLoading,
  onOpenChange,
  onConfirm,
}: DeleteShopDialogProps) {
  return (
    <AlertDialog open={state.open} onOpenChange={onOpenChange}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete shop?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{state.name}</strong>?
            This will hide the shop from public listings (soft delete), but its data will remain in the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={isLoading} onClick={() => void onConfirm()}>
            {isLoading ? 'Deleting…' : 'Delete shop'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
