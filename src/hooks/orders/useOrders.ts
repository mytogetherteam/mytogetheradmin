import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderService, ActiveOrderFilters, UpdateOrderStatusPayload } from '@/services/orderService';
import { driverService, CreateDriverPayload } from '@/services/driverService';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';

export const orderKeys = {
  all: ['orders'] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
  history: (id: string) => [...orderKeys.all, 'history', id] as const,
  active: () => [...orderKeys.all, 'active'] as const,
};

/** Live order board feed (server-side filtered + paginated). */
export function useActiveOrders(filters: ActiveOrderFilters) {
  return useQuery({
    queryKey: [...orderKeys.active(), filters],
    queryFn: () => orderService.getActiveOrders(filters),
    // Keep the previous page visible while the next loads — no flicker on
    // page/filter changes.
    placeholderData: keepPreviousData,
    // 30-second polling as a safety net: if a WebSocket event is missed
    // (disconnect gap, network blip) the board self-heals within 30 s.
    refetchInterval: 30_000,
    // Keep polling even while the tab is not focused so the board is always
    // up-to-date when the admin switches back to it.
    refetchIntervalInBackground: true,
  });
}

export const driverKeys = {
  all: ['shop-drivers'] as const,
  byShop: (shopId: number) => [...driverKeys.all, shopId] as const,
};

/** Single order detail. */
export function useOrderDetail(id?: string) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ''),
    queryFn: () => orderService.getOrderDetail(id!),
    enabled: !!id,
  });
}

/** Order status-change timeline (empty list when unavailable). */
export function useOrderHistory(id?: string) {
  return useQuery({
    queryKey: orderKeys.history(id ?? ''),
    queryFn: () => orderService.getOrderHistory(id!).catch(() => []),
    enabled: !!id,
  });
}

/** SuperAdmin order status override; refreshes the detail/history/board on success. */
export function useUpdateOrderStatusMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateOrderStatusPayload) =>
      orderService.updateOrderStatus(id, payload),
    onSuccess: (_data, payload) => {
      toast.success(`Order status changed to ${payload.status}`);
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: orderKeys.history(id) });
      void queryClient.invalidateQueries({ queryKey: orderKeys.active() });
    },
    onError: (error) => handleApiError(error, 'Failed to update order status'),
  });
}

/** Drivers belonging to a shop. */
export function useShopDrivers(shopId: number) {
  return useQuery({
    queryKey: driverKeys.byShop(shopId),
    queryFn: () => driverService.listByShop(shopId),
    enabled: !!shopId,
  });
}

/** Create a driver for a shop; refreshes that shop's driver list on success. */
export function useCreateDriverMutation(shopId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDriverPayload) => driverService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: driverKeys.byShop(shopId) });
    },
    onError: (error) => handleApiError(error, 'Failed to create driver'),
  });
}
