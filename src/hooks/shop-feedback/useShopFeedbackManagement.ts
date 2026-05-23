import { useEffect, useMemo, useRef, useState } from "react";
import {
  groupShopFeedbackByShop,
  type ShopFeedback,
  type ShopFeedbackReadFilter,
} from "@/schemas/shop-feedback.schema";
import {
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

  const groups = useMemo(
    () => groupShopFeedbackByShop(listQuery.data?.content ?? []),
    [listQuery.data?.content],
  );

  const openDelete = (item: ShopFeedback) => setDeleteTarget(item);

  const closeDelete = () => {
    if (!deleteMutation.isPending) setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const markRead = (item: ShopFeedback, isRead: boolean) => {
    void readMutation.mutateAsync({ id: item.id, isRead });
  };

  const unreadOnPage = (listQuery.data?.content ?? []).filter((m) => !m.isRead)
    .length;

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
    list: {
      groups,
      raw: listQuery.data?.content ?? [],
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
      updating: readMutation.isPending,
    },
  };
}
