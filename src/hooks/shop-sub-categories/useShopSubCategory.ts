import { useMutation } from '@tanstack/react-query';
import { ShopCategoryService, ShopSubCategoryRequest } from '@/services/shopCategoryService';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import { useNavigate } from 'react-router-dom';

export function useCreateShopSubCategoryMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: number; data: FormData }) =>
      ShopCategoryService.createShopSubCategory(categoryId, data),
    onSuccess: () => {
      toast.success('Sub-category created successfully');
      navigate('/shop-sub-categories/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to create sub-category');
    },
  });
}

export function useUpdateShopSubCategoryMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      ShopCategoryService.updateShopSubCategory(id, data),
    onSuccess: () => {
      toast.success('Sub-category updated successfully');
      navigate('/shop-sub-categories/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to update sub-category');
    },
  });
}

export function useDeleteShopSubCategoryMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (id: number) => ShopCategoryService.deleteShopSubCategory(id),
    onSuccess: () => {
      toast.success('Sub-category deleted successfully');
      navigate('/shop-sub-categories/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to delete sub-category');
    },
  });
}
