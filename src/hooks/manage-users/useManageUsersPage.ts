import { useState } from "react";
import { useDebounce } from "use-debounce";
import { useNavigate } from "react-router-dom";
import { SortConfig, sortData, toggleSort } from "@/lib/sort-utils";
import {
  useDeleteManageUserMutation,
  useManageUsers,
} from "@/hooks/manage-users/useManageUsers";
import type { ManageUser } from "@/schemas/manage-user.schema";
import { authService } from "@/services/authService";
import {
  AccountFilter,
  exportManageUsersToExcel,
} from "@/pages/manage-users/manageUsersHelpers";

const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 500;

type DeleteDialogState = { open: boolean; user: ManageUser | null };

/**
 * Owns all state, data-fetching and handlers for the Manage Users page so the
 * page component stays a thin layout shell.
 */
export function useManageUsersPage() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);
  const [accountType, setAccountType] = useState<AccountFilter>("user");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    user: null,
  });

  const currentAdmin = authService.getUserData();

  const { data, isPending: loading } = useManageUsers({
    page: currentPage,
    size: pageSize,
    search: debouncedSearch.trim() || undefined,
    accountType,
  });
  const { mutateAsync: deleteUser, isPending: deleting } =
    useDeleteManageUserMutation();

  const users = sortData(data?.content ?? [], sortConfig);
  const totalItems = data?.totalElements ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const rowOffset = (currentPage - 1) * pageSize;

  /** An admin cannot deactivate their own account. */
  const isCurrentAdmin = (user: ManageUser) =>
    user.accountType === "admin" && user.id === currentAdmin?.id;

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleAccountTypeChange = (value: AccountFilter) => {
    setAccountType(value);
    setCurrentPage(1);
  };

  const handleSort = (key: string) =>
    setSortConfig((prev) => toggleSort(prev, key));

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const goToEdit = (user: ManageUser) =>
    navigate(`/users/edit/${user.accountType}/${user.id}`);

  const requestDelete = (user: ManageUser) => {
    if (isCurrentAdmin(user)) return;
    setDeleteDialog({ open: true, user });
  };

  const setDeleteDialogOpen = (open: boolean) =>
    setDeleteDialog((dialog) => ({ ...dialog, open }));

  const closeDeleteDialog = () => setDeleteDialog({ open: false, user: null });

  const confirmDelete = async () => {
    const user = deleteDialog.user;
    if (!user || isCurrentAdmin(user)) {
      closeDeleteDialog();
      return;
    }
    await deleteUser({ accountType: user.accountType, id: user.id });
    closeDeleteDialog();
  };

  const exportToExcel = () => exportManageUsersToExcel(users, rowOffset);

  return {
    // filters
    searchTerm,
    accountType,
    handleSearchChange,
    handleAccountTypeChange,
    onExport: exportToExcel,

    // table
    users,
    loading,
    sortConfig,
    handleSort,
    rowOffset,
    isCurrentAdmin,
    goToEdit,
    requestDelete,

    // pagination
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    setCurrentPage,
    handlePageSizeChange,

    // delete dialog
    deleteDialog,
    setDeleteDialogOpen,
    closeDeleteDialog,
    confirmDelete,
    deleting,
  };
}
