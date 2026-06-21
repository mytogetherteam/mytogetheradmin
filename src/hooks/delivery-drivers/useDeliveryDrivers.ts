import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deliveryDriverService,
  type DeliveryDriverListParams,
} from "@/services/deliveryDriverService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";

export const deliveryDriverKeys = {
  all: ["delivery-drivers"] as const,
  list: (params?: DeliveryDriverListParams) =>
    [...deliveryDriverKeys.all, "list", params] as const,
  detail: (id?: number) => [...deliveryDriverKeys.all, "detail", id] as const,
};

export function useDeliveryDriversList(params: DeliveryDriverListParams) {
  return useQuery({
    queryKey: deliveryDriverKeys.list(params),
    queryFn: () => deliveryDriverService.getList(params),
    retry: 1,
  });
}

export function useDeliveryDriverDetail(id?: number) {
  return useQuery({
    queryKey: deliveryDriverKeys.detail(id),
    queryFn: () => deliveryDriverService.getById(id as number),
    enabled: typeof id === "number" && id > 0,
  });
}

export function useHardDeleteDeliveryDriverMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deliveryDriverService.hardDelete(id),
    onSuccess: () => {
      toast.success("Delivery driver permanently deleted");
      void queryClient.invalidateQueries({ queryKey: deliveryDriverKeys.all });
    },
    onError: (error) => {
      handleApiError(error, "Failed to delete delivery driver");
    },
  });
}
