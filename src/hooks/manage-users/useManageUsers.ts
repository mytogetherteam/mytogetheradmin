import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  manageUsersService,
  type EditManageUserFormValues,
  type ManageUserAccountType,
  type ManageUsersListParams,
} from "@/services/manageUsersService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";

export const manageUserKeys = {
  all: ["manage-users"] as const,
  list: (params?: ManageUsersListParams) =>
    [...manageUserKeys.all, "list", params] as const,
  detail: (accountType?: ManageUserAccountType, id?: number) =>
    [...manageUserKeys.all, "detail", accountType, id] as const,
  roles: () => [...manageUserKeys.all, "roles"] as const,
};

export function useManageUsers(params: ManageUsersListParams) {
  return useQuery({
    queryKey: manageUserKeys.list(params),
    queryFn: () => manageUsersService.getManageUsers(params),
  });
}

export function useManageUser(accountType?: ManageUserAccountType, id?: number) {
  return useQuery({
    queryKey: manageUserKeys.detail(accountType, id),
    queryFn: () =>
      manageUsersService.getManageUserById(
        accountType as ManageUserAccountType,
        id as number,
      ),
    enabled:
      !!accountType &&
      typeof id === "number" &&
      Number.isFinite(id) &&
      id > 0,
  });
}

export function useManageUserRoles() {
  return useQuery({
    queryKey: manageUserKeys.roles(),
    queryFn: manageUsersService.getRoles,
  });
}

export function useUpdateManageUserMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountType,
      id,
      data,
    }: {
      accountType: ManageUserAccountType;
      id: number;
      data: EditManageUserFormValues;
    }) => manageUsersService.updateManageUser(accountType, id, data),
    onSuccess: (_data, variables) => {
      toast.success("User updated successfully");
      void queryClient.invalidateQueries({ queryKey: manageUserKeys.all });
      void queryClient.invalidateQueries({
        queryKey: manageUserKeys.detail(variables.accountType, variables.id),
      });
      navigate("/users/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to update user");
    },
  });
}

export function useDeleteManageUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountType,
      id,
    }: {
      accountType: ManageUserAccountType;
      id: number;
    }) => manageUsersService.deleteManageUser(accountType, id),
    onSuccess: () => {
      toast.success("User deleted successfully");
      void queryClient.invalidateQueries({ queryKey: manageUserKeys.all });
    },
    onError: (error) => {
      handleApiError(error, "Failed to delete user");
    },
  });
}
