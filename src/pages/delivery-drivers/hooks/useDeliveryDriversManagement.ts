import { useEffect, useRef, useState } from "react";
import {
  type DeliveryDriver,
  type DeliveryDriverActiveFilter,
  type DeliveryDriverDeletedFilter,
} from "@/schemas/delivery-driver.schema";
import {
  useDeliveryDriversList,
  useHardDeleteDeliveryDriverMutation,
} from "@/hooks/delivery-drivers/useDeliveryDrivers";

function buildListSearchParams(
  debouncedSearch: string,
  shopFilter: string,
): { search?: string; shopId?: number } {
  const shopFilterTrim = shopFilter.trim();
  const shopIdParsed = Number.parseInt(shopFilterTrim, 10);
  const shopId =
    shopFilterTrim &&
    !Number.isNaN(shopIdParsed) &&
    shopIdParsed > 0 &&
    String(shopIdParsed) === shopFilterTrim
      ? shopIdParsed
      : undefined;

  const searchParts = [debouncedSearch.trim()];
  if (shopFilterTrim && shopId === undefined) {
    searchParts.push(shopFilterTrim);
  }

  const search = searchParts.filter(Boolean).join(" ").trim();

  return {
    search: search || undefined,
    shopId,
  };
}

export function useDeliveryDriversManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const isFirstSearchDebounce = useRef(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [shopIdFilter, setShopIdFilter] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<DeliveryDriverActiveFilter>("all");
  const [deletedFilter, setDeletedFilter] =
    useState<DeliveryDriverDeletedFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<DeliveryDriver | null>(null);
  const [detailTarget, setDetailTarget] = useState<DeliveryDriver | null>(null);

  useEffect(() => {
    const delayMs = isFirstSearchDebounce.current ? 0 : 400;
    isFirstSearchDebounce.current = false;
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), delayMs);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { search, shopId } = buildListSearchParams(
    debouncedSearch,
    shopIdFilter,
  );

  const isActiveParam =
    activeFilter === "all"
      ? undefined
      : activeFilter === "active";

  const includeDeleted = deletedFilter === "all";

  const listQuery = useDeliveryDriversList({
    page: currentPage,
    size: pageSize,
    search,
    shopId,
    isActive: isActiveParam,
    includeDeleted,
  });

  const deleteMutation = useHardDeleteDeliveryDriverMutation();

  const openDelete = (driver: DeliveryDriver) => setDeleteTarget(driver);

  const closeDelete = () => {
    if (!deleteMutation.isPending) setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
    if (detailTarget?.id === deleteTarget.id) {
      setDetailTarget(null);
    }
  };

  return {
    search: {
      term: searchTerm,
      setTerm: (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
      },
    },
    shopId: {
      value: shopIdFilter,
      setValue: (value: string) => {
        setShopIdFilter(value);
        setCurrentPage(1);
      },
    },
    activeFilter: {
      value: activeFilter,
      setValue: (value: DeliveryDriverActiveFilter) => {
        setActiveFilter(value);
        setCurrentPage(1);
      },
    },
    deletedFilter: {
      value: deletedFilter,
      setValue: (value: DeliveryDriverDeletedFilter) => {
        setDeletedFilter(value);
        setCurrentPage(1);
      },
    },
    pagination: {
      currentPage,
      pageSize,
      totalPages: Math.max(1, listQuery.data?.totalPages ?? 1),
      totalItems: listQuery.data?.totalElements ?? 0,
      setPage: setCurrentPage,
      setPageSize: (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
      },
    },
    list: {
      drivers: listQuery.data?.content ?? [],
      loading: listQuery.isPending,
      isError: listQuery.isError,
      error: listQuery.error,
    },
    detail: {
      target: detailTarget,
      open: (driver: DeliveryDriver) => setDetailTarget(driver),
      close: () => setDetailTarget(null),
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
  };
}
