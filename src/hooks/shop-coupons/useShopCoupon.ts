import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import {
  ShopCouponService,
  type ShopCouponPayload,
  type UpdateShopCouponPayload,
} from "@/services/shopCouponService";

export const shopCouponKeys = {
  all: ["shop-coupons"] as const,
};

export function useShopCoupons(params?: {
  page?: number;
  size?: number;
  search?: string;
  shopId?: number;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: [...shopCouponKeys.all, params],
    queryFn: () => ShopCouponService.getShopCoupons(params),
  });
}

export function useShopCoupon(id: number) {
  return useQuery({
    queryKey: [...shopCouponKeys.all, id],
    queryFn: () => ShopCouponService.getShopCouponById(id),
    enabled: !!id,
  });
}

export function useCreateShopCouponMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ShopCouponPayload) =>
      ShopCouponService.createShopCoupon(payload),
    onSuccess: () => {
      toast.success("Shop coupon created successfully");
      void queryClient.invalidateQueries({ queryKey: shopCouponKeys.all });
      navigate("/shop-coupons/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to create shop coupon");
    },
  });
}

export function useUpdateShopCouponMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateShopCouponPayload;
    }) => ShopCouponService.updateShopCoupon(id, payload),
    onSuccess: () => {
      toast.success("Shop coupon updated successfully");
      void queryClient.invalidateQueries({ queryKey: shopCouponKeys.all });
      navigate("/shop-coupons/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to update shop coupon");
    },
  });
}

export function useDeleteShopCouponMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ShopCouponService.deleteShopCoupon(id),
    onSuccess: () => {
      toast.success("Shop coupon deleted successfully");
      void queryClient.invalidateQueries({ queryKey: shopCouponKeys.all });
    },
    onError: (error) => {
      handleApiError(error, "Failed to delete shop coupon");
    },
  });
}
