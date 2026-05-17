import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PaymentMethodService,
  CreatePaymentMethodRequest,
  UpdatePaymentMethodRequest,
} from "@/services/paymentMethodService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { useNavigate } from "react-router-dom";

export const paymentKeys = {
  all: ["payment-methods"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (params: { page: number; size: number; search?: string }) =>
    [...paymentKeys.lists(), params] as const,
  details: () => [...paymentKeys.all, "detail"] as const,
  detail: (id: number) => [...paymentKeys.details(), id] as const,
};

export function usePaymentMethods(params: {
  page: number;
  size: number;
  search?: string;
}) {
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => PaymentMethodService.getPaymentMethods(params),
  });
}

export function usePaymentMethod(id: number) {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => PaymentMethodService.getPaymentMethodById(id),
    enabled: !!id,
  });
}

export function useCreatePaymentMethodMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: FormData | CreatePaymentMethodRequest) =>
      PaymentMethodService.createPaymentMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      toast.success("Payment method created successfully!");
      navigate("/payment-methods/manage");
    },
    onError: (error) =>
      handleApiError(error, "Failed to create payment method"),
  });
}

export function useUpdatePaymentMethodMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: FormData | UpdatePaymentMethodRequest;
    }) => PaymentMethodService.updatePaymentMethod(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      toast.success("Payment method updated successfully!");
      navigate("/payment-methods/manage");
    },
    onError: (error) =>
      handleApiError(error, "Failed to update payment method"),
  });
}

export function useDeletePaymentMethodMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => PaymentMethodService.deletePaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      toast.success("Payment method deleted successfully");
    },
    onError: (error) =>
      handleApiError(error, "Failed to delete payment method"),
  });
}
