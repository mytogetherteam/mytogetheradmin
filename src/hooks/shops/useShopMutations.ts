import { useMutation } from '@tanstack/react-query';
import { ShopService } from '@/services/shopService';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import { useNavigate } from 'react-router-dom';

export const createShopMutationKey = ['shops', 'create'] as const;
export const updateShopMutationKey = ['shops', 'update'] as const;

export function useCreateShopMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationKey: [...createShopMutationKey],
    mutationFn: (formData: FormData) => ShopService.createShop(formData),
    onSuccess: () => {
      toast.success('Shop created successfully!');
      navigate('/shops/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to create shop');
    },
    retry: false,
  });
}

export function useUpdateShopMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationKey: [...updateShopMutationKey],
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) =>
      ShopService.updateShop(id, formData),
    onSuccess: () => {
      toast.success('Shop updated successfully!');
      navigate('/shops/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to update shop');
    },
    retry: false,
  });
}
