import ConfirmDialog from '@/components/common/ConfirmDialog';
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
    <ConfirmDialog
      open={state.open}
      onOpenChange={onOpenChange}
      title="Delete shop?"
      description={`Are you sure you want to delete ${state.name}? This will hide the shop from public listings (soft delete), but its data will remain in the system.`}
      confirmText="Delete shop"
      cancelText="Cancel"
      variant="destructive"
      loading={isLoading}
      onConfirm={onConfirm}
    />
  );
}
