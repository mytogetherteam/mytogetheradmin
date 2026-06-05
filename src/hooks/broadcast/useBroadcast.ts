import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import {
  BroadcastService,
  type SendBroadcastPayload,
} from "@/services/broadcastService";

export const broadcastKeys = {
  all: ["broadcasts"] as const,
  history: (page: number, size: number) =>
    [...broadcastKeys.all, "history", page, size] as const,
};

export function useBroadcastHistory(page: number, size: number) {
  return useQuery({
    queryKey: broadcastKeys.history(page, size),
    queryFn: () => BroadcastService.getHistory(page, size),
  });
}

export function useSendBroadcastMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendBroadcastPayload) =>
      BroadcastService.send(payload),
    onSuccess: () => {
      toast.success("Broadcast queued successfully");
      void queryClient.invalidateQueries({ queryKey: broadcastKeys.all });
    },
    onError: (error) => {
      handleApiError(error, "Failed to send broadcast");
    },
  });
}
