import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  shopFeedbackService,
  type ShopFeedbackListParams,
} from "@/services/shopFeedbackService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";

export const shopFeedbackKeys = {
  all: ["shop-feedback"] as const,
  list: (params?: ShopFeedbackListParams) =>
    [...shopFeedbackKeys.all, "list", params] as const,
  detail: (id?: number) => [...shopFeedbackKeys.all, "detail", id] as const,
};

export function useShopFeedbackList(params: ShopFeedbackListParams) {
  return useQuery({
    queryKey: shopFeedbackKeys.list(params),
    queryFn: () => shopFeedbackService.getList(params),
    retry: 1,
  });
}

export function useShopFeedbackDetail(id?: number) {
  return useQuery({
    queryKey: shopFeedbackKeys.detail(id),
    queryFn: () => shopFeedbackService.getById(id as number),
    enabled: typeof id === "number" && id > 0,
  });
}

export function useDeleteShopFeedbackMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => shopFeedbackService.delete(id),
    onSuccess: () => {
      toast.success("Feedback deleted");
      void queryClient.invalidateQueries({ queryKey: shopFeedbackKeys.all });
    },
    onError: (error) => {
      handleApiError(error, "Failed to delete feedback");
    },
  });
}

export function useUpdateShopFeedbackReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isRead }: { id: number; isRead: boolean }) =>
      shopFeedbackService.updateReadStatus(id, isRead),
    onSuccess: (_data, variables) => {
      toast.success(
        variables.isRead ? "Marked as read" : "Marked as unread",
      );
      void queryClient.invalidateQueries({ queryKey: shopFeedbackKeys.all });
    },
    onError: (error) => {
      handleApiError(error, "Failed to update read status");
    },
  });
}

export function useBulkMarkShopFeedbackReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => shopFeedbackService.markManyAsRead(ids),
    onSuccess: (_data, ids) => {
      toast.success(
        ids.length === 1
          ? "Marked 1 message as read"
          : `Marked ${ids.length} messages as read`,
      );
      void queryClient.invalidateQueries({ queryKey: shopFeedbackKeys.all });
    },
    onError: (error) => {
      handleApiError(error, "Failed to mark messages as read");
    },
  });
}
