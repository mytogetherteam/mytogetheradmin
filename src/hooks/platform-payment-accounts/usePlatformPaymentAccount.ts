import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { handleApiError } from "@/lib/error-utils";
import {
  PlatformPaymentAccountService,
  type PlatformPaymentAccountListParams,
  type PlatformPaymentAccountPayload,
} from "@/services/platformPaymentAccountService";

export const platformPaymentAccountKeys = {
  all: ["platform-payment-accounts"] as const,
};

export function usePlatformPaymentAccounts(
  params?: PlatformPaymentAccountListParams,
) {
  return useQuery({
    queryKey: [...platformPaymentAccountKeys.all, params],
    queryFn: () => PlatformPaymentAccountService.getAccounts(params),
  });
}

export function usePlatformPaymentAccount(id: number) {
  return useQuery({
    queryKey: [...platformPaymentAccountKeys.all, id],
    queryFn: () => PlatformPaymentAccountService.getAccountById(id),
    enabled: !!id,
  });
}

export function useCreatePlatformPaymentAccountMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PlatformPaymentAccountPayload) =>
      PlatformPaymentAccountService.createAccount(payload),
    onSuccess: () => {
      toast.success("Payment account created successfully");
      void queryClient.invalidateQueries({
        queryKey: platformPaymentAccountKeys.all,
      });
      navigate("/platform-payment-accounts/manage");
    },
    onError: (error) => handleApiError(error, "Failed to create payment account"),
  });
}

export function useUpdatePlatformPaymentAccountMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: PlatformPaymentAccountPayload;
    }) => PlatformPaymentAccountService.updateAccount(id, payload),
    onSuccess: () => {
      toast.success("Payment account updated successfully");
      void queryClient.invalidateQueries({
        queryKey: platformPaymentAccountKeys.all,
      });
      navigate("/platform-payment-accounts/manage");
    },
    onError: (error) => handleApiError(error, "Failed to update payment account"),
  });
}

export function useDeletePlatformPaymentAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => PlatformPaymentAccountService.deleteAccount(id),
    onSuccess: () => {
      toast.success("Payment account deleted successfully");
      void queryClient.invalidateQueries({
        queryKey: platformPaymentAccountKeys.all,
      });
    },
    // The API refuses to delete an account that shops have already paid into —
    // surface that message rather than a generic failure.
    onError: (error) => handleApiError(error, "Failed to delete payment account"),
  });
}

export function useReorderPlatformPaymentAccountsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) =>
      PlatformPaymentAccountService.reorderAccounts(ids),
    onSuccess: () => {
      toast.success("Order updated");
      void queryClient.invalidateQueries({
        queryKey: platformPaymentAccountKeys.all,
      });
    },
    onError: (error) => handleApiError(error, "Failed to update order"),
  });
}
