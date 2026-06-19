import { useState } from "react";
import { useDebounce } from "use-debounce";
import {
  useAdminSessions,
  useForceLogoutMutation,
} from "@/hooks/admins/useAdminSessions";
import type { AdminSessionDTO } from "@/services/adminsService";

const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 500;

type LogoutDialogState = { open: boolean; admin: AdminSessionDTO | null };

/**
 * Owns all state, data-fetching and handlers for the Active Sessions page so
 * the page component stays a thin layout shell.
 */
export function useAdminSessionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [logoutDialog, setLogoutDialog] = useState<LogoutDialogState>({
    open: false,
    admin: null,
  });

  const { data, isPending: loading } = useAdminSessions({
    page: currentPage,
    size: pageSize,
    search: debouncedSearch.trim() || undefined,
  });
  const { mutateAsync: forceLogout, isPending: loggingOut } =
    useForceLogoutMutation();

  const sessions = data?.content ?? [];
  const totalItems = data?.totalElements ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const rowOffset = (currentPage - 1) * pageSize;

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const requestLogout = (admin: AdminSessionDTO) =>
    setLogoutDialog({ open: true, admin });

  const setLogoutDialogOpen = (open: boolean) =>
    setLogoutDialog((dialog) => ({ ...dialog, open }));

  const closeLogoutDialog = () =>
    setLogoutDialog({ open: false, admin: null });

  const confirmLogout = async () => {
    const admin = logoutDialog.admin;
    if (!admin) {
      closeLogoutDialog();
      return;
    }
    await forceLogout(admin.id);
    closeLogoutDialog();
  };

  return {
    // filters
    searchTerm,
    handleSearchChange,

    // table
    sessions,
    loading,
    rowOffset,
    requestLogout,

    // pagination
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    setCurrentPage,
    handlePageSizeChange,

    // logout dialog
    logoutDialog,
    setLogoutDialogOpen,
    closeLogoutDialog,
    confirmLogout,
    loggingOut,
  };
}
