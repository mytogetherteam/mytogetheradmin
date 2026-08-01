import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { handleApiError } from "@/lib/error-utils";
import {
  SubscriptionService,
  type GrantSubscriptionPayload,
  type RecordDeliveryPayload,
  type SubscriptionListParams,
} from "@/services/subscriptionService";

export const subscriptionKeys = {
  all: ["subscriptions"] as const,
};

export function useSubscriptions(params?: SubscriptionListParams) {
  return useQuery({
    queryKey: [...subscriptionKeys.all, params],
    queryFn: () => SubscriptionService.getSubscriptions(params),
  });
}

/** Status counts for the filter tabs — pass `shopId` to match a filtered list. */
export function useSubscriptionSummary(shopId?: number) {
  return useQuery({
    queryKey: [...subscriptionKeys.all, "summary", shopId ?? null],
    queryFn: () => SubscriptionService.getSummary(shopId),
  });
}

export function useSubscription(id: number) {
  return useQuery({
    queryKey: [...subscriptionKeys.all, id],
    queryFn: () => SubscriptionService.getSubscriptionById(id),
    enabled: !!id,
  });
}

export function useApproveSubscriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body?: { startDate?: string; adminNote?: string };
    }) => SubscriptionService.approve(id, body ?? {}),
    onSuccess: () => {
      toast.success("Subscription approved — the plan is now active");
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
    onError: (error) => handleApiError(error, "Failed to approve subscription"),
  });
}

export function useRejectSubscriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      SubscriptionService.reject(id, reason),
    onSuccess: () => {
      toast.success("Subscription rejected — the shop can upload a new slip");
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
    onError: (error) => handleApiError(error, "Failed to reject subscription"),
  });
}

export function useCancelSubscriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      SubscriptionService.cancel(id, reason),
    onSuccess: () => {
      toast.success("Subscription cancelled");
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
    onError: (error) => handleApiError(error, "Failed to cancel subscription"),
  });
}

export function useUpdateSubscriptionOptionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      selectedOptionIds,
    }: {
      id: number;
      selectedOptionIds: number[];
    }) => SubscriptionService.updateOptions(id, selectedOptionIds),
    onSuccess: () => {
      toast.success("Package options updated");
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
    onError: (error) => handleApiError(error, "Failed to update options"),
  });
}

export function useRecordDeliveryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: RecordDeliveryPayload;
    }) => SubscriptionService.recordDelivery(id, payload),
    onSuccess: () => {
      toast.success("Delivery recorded");
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
    onError: (error) => handleApiError(error, "Failed to record delivery"),
  });
}

export function useRemoveDeliveryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, deliveryId }: { id: number; deliveryId: number }) =>
      SubscriptionService.removeDelivery(id, deliveryId),
    onSuccess: () => {
      toast.success("Delivery removed");
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
    onError: (error) => handleApiError(error, "Failed to remove delivery"),
  });
}

export function useGrantSubscriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GrantSubscriptionPayload) =>
      SubscriptionService.grant(payload),
    onSuccess: (subscription) => {
      toast.success(
        `${subscription.plan?.nameEn ?? "Plan"} granted to ${subscription.shop?.nameEn ?? "the shop"}`,
      );
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
    onError: (error) => handleApiError(error, "Failed to grant plan"),
  });
}
