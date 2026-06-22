import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  groupShopFeedbackByShop,
  type ShopFeedback,
  type ShopFeedbackReadFilter,
} from "@/schemas/shop-feedback.schema";
import {
  useBulkMarkShopFeedbackReadMutation,
  useDeleteShopFeedbackMutation,
  useShopFeedbackList,
  useUpdateShopFeedbackReadMutation,
} from "./useShopFeedback";

export function useShopFeedbackManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const isFirstSearchDebounce = useRef(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState<ShopFeedback | null>(null);
  const [readFilter, setReadFilter] = useState<ShopFeedbackReadFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const delayMs = isFirstSearchDebounce.current ? 0 : 400;
    isFirstSearchDebounce.current = false;
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), delayMs);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const isReadParam =
    readFilter === "all"
      ? undefined
      : readFilter === "read";

  const listQuery = useShopFeedbackList({
    page: currentPage,
    size: pageSize,
    search: debouncedSearch.trim() || undefined,
    isRead: isReadParam,
  });

  const deleteMutation = useDeleteShopFeedbackMutation();
  const readMutation = useUpdateShopFeedbackReadMutation();
  const bulkReadMutation = useBulkMarkShopFeedbackReadMutation();

  const items = listQuery.data?.content ?? [];

  const groups = useMemo(
    () => groupShopFeedbackByShop(items),
    [items],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  useEffect(() => {
    clearSelection();
  }, [currentPage, pageSize, debouncedSearch, readFilter, clearSelection]);

  const toggleSelect = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) {
      clearSelection();
      return;
    }
    setSelectedIds(new Set(items.map((item) => item.id)));
  };

  const allSelected =
    items.length > 0 && items.every((item) => selectedIds.has(item.id));
  const someSelected =
    items.some((item) => selectedIds.has(item.id)) && !allSelected;

  const unreadOnPage = items.filter((m) => !m.isRead).length;

  const selectedUnreadIds = useMemo(
    () =>
      items
        .filter((item) => selectedIds.has(item.id) && !item.isRead)
        .map((item) => item.id),
    [items, selectedIds],
  );

  const openDelete = (item: ShopFeedback) => setDeleteTarget(item);

  const closeDelete = () => {
    if (!deleteMutation.isPending) setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(deleteTarget.id);
      return next;
    });
  };

  const markRead = (item: ShopFeedback, isRead: boolean) => {
    void readMutation.mutateAsync({ id: item.id, isRead });
  };

  const markSelectedAsRead = async () => {
    if (selectedUnreadIds.length === 0) return;
    await bulkReadMutation.mutateAsync(selectedUnreadIds);
    clearSelection();
  };

  return {
    readFilter: {
      value: readFilter,
      setValue: (value: ShopFeedbackReadFilter) => {
        setReadFilter(value);
        setCurrentPage(1);
      },
      unreadOnPage,
    },
    search: {
      term: searchTerm,
      setTerm: (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
      },
    },
    pagination: {
      currentPage,
      pageSize,
      totalPages: listQuery.data?.totalPages ?? 1,
      totalItems: listQuery.data?.totalElements ?? 0,
      setPage: setCurrentPage,
      setPageSize: (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
      },
    },
    selection: {
      selectedIds,
      allSelected,
      someSelected,
      selectedCount: selectedIds.size,
      toggleSelect,
      toggleSelectAll,
      clearSelection,
    },
    list: {
      groups,
      raw: items,
      loading: listQuery.isPending,
      isError: listQuery.isError,
      error: listQuery.error,
    },
    deleteDialog: {
      target: deleteTarget,
      open: !!deleteTarget,
      loading: deleteMutation.isPending,
      onOpenChange: (open: boolean) => {
        if (!open) closeDelete();
      },
      openDelete,
      onCancel: closeDelete,
      onConfirm: confirmDelete,
    },
    read: {
      markRead,
      markSelectedAsRead,
      updating: readMutation.isPending || bulkReadMutation.isPending,
      canMarkSelected: selectedUnreadIds.length > 0,
      selectedUnreadCount: selectedUnreadIds.length,
    },
  };
}
