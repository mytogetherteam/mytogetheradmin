import { useMutation } from '@tanstack/react-query';
import { menuService } from '@/services/menuService';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import { useNavigate } from 'react-router-dom';

export function useCreateMenuItemMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: FormData) => menuService.createMenuItem(data),
    onSuccess: () => {
      toast.success('Menu item created successfully');
      navigate('/menus/items/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to create menu item');
    },
  });
}

export function useUpdateMenuItemMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      menuService.updateMenuItem(id, data),
    onSuccess: () => {
      toast.success('Menu item updated successfully');
      navigate('/menus/items/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to update menu item');
    },
  });
}
