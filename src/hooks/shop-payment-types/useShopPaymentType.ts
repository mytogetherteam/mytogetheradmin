import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ShopPaymentTypeService,
  type CreateShopPaymentMethodRequest,
} from "@/services/shopPaymentTypeService";
import { shopRestaurantEditQueryKey } from "@/hooks/shops";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";

export const shopPaymentTypeKeys = {
  all: ["shop-payment-types"] as const,
  byShop: (shopId?: number) => [...shopPaymentTypeKeys.all, "shop", shopId] as const,
  detail: (shopId?: number, id?: number) =>
    [...shopPaymentTypeKeys.byShop(shopId), "detail", id] as const,
};

export function useShopPaymentType(shopId?: number, id?: number) {
  return useQuery({
    queryKey: shopPaymentTypeKeys.detail(shopId, id),
    queryFn: () =>
      ShopPaymentTypeService.getShopPaymentTypeById(shopId as number, id as number),
    enabled:
      typeof shopId === "number" &&
      Number.isFinite(shopId) &&
      typeof id === "number" &&
      Number.isFinite(id),
  });
}

export function useShopPaymentTypes(shopId?: number) {
  return useQuery({
    queryKey: shopPaymentTypeKeys.byShop(shopId),
    queryFn: () => ShopPaymentTypeService.getShopPaymentTypes(shopId as number),
    enabled: typeof shopId === "number" && Number.isFinite(shopId),
  });
}

export function useCreateShopPaymentTypeMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateShopPaymentMethodRequest) =>
      ShopPaymentTypeService.createShopPaymentMethod(request),
    onSuccess: (_data, variables) => {
      toast.success("Shop payment type created");
      void queryClient.invalidateQueries({ queryKey: shopPaymentTypeKeys.all });
      void queryClient.invalidateQueries({
        queryKey: shopPaymentTypeKeys.byShop(variables.shopId),
      });
      void queryClient.invalidateQueries({
        queryKey: shopRestaurantEditQueryKey(variables.shopId),
      });
      navigate(`/shop-payment-types/manage?shopId=${variables.shopId}`);
    },
    onError: (error) => {
      handleApiError(error, "Failed to create");
    },
  });
}

export function useUpdateShopPaymentTypeMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      shopId,
      id,
      data,
    }: {
      shopId: number;
      id: number;
      data: FormData;
    }) => ShopPaymentTypeService.updateShopPaymentType(shopId, id, data),
    onSuccess: (_data, variables) => {
      toast.success("Shop payment type updated");
      void queryClient.invalidateQueries({ queryKey: shopPaymentTypeKeys.all });
      void queryClient.invalidateQueries({
        queryKey: shopPaymentTypeKeys.byShop(variables.shopId),
      });
      void queryClient.invalidateQueries({
        queryKey: shopPaymentTypeKeys.detail(variables.shopId, variables.id),
      });
      void queryClient.invalidateQueries({
        queryKey: shopRestaurantEditQueryKey(variables.shopId),
      });
      navigate(`/shop-payment-types/manage?shopId=${variables.shopId}`);
    },
    onError: (error) => {
      handleApiError(error, "Failed to update");
    },
  });
}
