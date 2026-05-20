import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { marketingService } from "@/services/marketingService";
import { ShopService, type Shop } from "@/services/shopService";
import type { SortConfig } from "@/components/SortableTableHead";

const SEARCH_DEBOUNCE_MS = 500;

export interface UseFeaturedShopsManagementOptions {
  /**
   * Only fetch when this is true. The hook is otherwise idle so it can sit
   * inside a tab that is not currently visible.
   */
  enabled: boolean;
}

export function useFeaturedShopsManagement({
  enabled,
}: UseFeaturedShopsManagementOptions) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [shopSearch, setShopSearch] = useState("");
  const [featuringId, setFeaturingId] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({
    key: "createdAt",
    direction: "desc",
  });

  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [boostShop, setBoostShop] = useState<Shop | null>(null);
  const [boostScore, setBoostScore] = useState("10");
  const [boosting, setBoosting] = useState(false);

  const loadShops = useCallback(async () => {
    setShopsLoading(true);
    try {
      const sortStr = sortConfig
        ? `${sortConfig.key},${sortConfig.direction}`
        : "";
      const data = await ShopService.getAllShops(
        page - 1,
        pageSize,
        shopSearch,
        undefined,
        sortStr,
      );
      setShops(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      handleApiError(error, "Failed to load shops");
    } finally {
      setShopsLoading(false);
    }
  }, [page, pageSize, shopSearch, sortConfig]);

  // Debounced search refetch
  useEffect(() => {
    if (!enabled) return;
    const timeoutId = setTimeout(() => {
      setPage(1);
      void loadShops();
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [shopSearch, enabled, loadShops]);

  // Refetch on pagination / sort changes
  useEffect(() => {
    if (!enabled) return;
    void loadShops();
  }, [page, pageSize, sortConfig, enabled, loadShops]);

  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
    setPage(1);
  }, []);

  const handleToggleFeatured = useCallback(
    async (shop: Shop) => {
      setFeaturingId(shop.id);
      try {
        const newVal = !shop.isFeatured;
        await marketingService.setFeatured(String(shop.id), newVal);
        setShops((prev) =>
          prev.map((s) =>
            s.id === shop.id ? { ...s, isFeatured: newVal } : s,
          ),
        );
        setSelectedShop((current) =>
          current && current.id === shop.id
            ? { ...current, isFeatured: newVal }
            : current,
        );
        toast.success(`Shop ${newVal ? "featured ⭐" : "unfeatured"}`);
      } catch (error) {
        handleApiError(error, "Failed to update featured status");
      } finally {
        setFeaturingId(null);
      }
    },
    [],
  );

  const openBoost = useCallback((shop: Shop) => {
    setBoostShop(shop);
    setBoostScore("10");
  }, []);

  const closeBoost = useCallback(() => setBoostShop(null), []);

  const handleBoostSubmit = useCallback(async () => {
    if (!boostShop) return;
    const score = parseFloat(boostScore);
    if (isNaN(score) || score <= 0) {
      toast.error("Please enter a valid boost score");
      return;
    }
    setBoosting(true);
    try {
      await marketingService.boostShop(String(boostShop.id), score);
      toast.success(
        `Boost applied (+${score}) to ${boostShop.nameEn || boostShop.nameMm}`,
      );
      setBoostShop(null);
    } catch (error) {
      handleApiError(error, "Failed to boost shop");
    } finally {
      setBoosting(false);
    }
  }, [boostShop, boostScore]);

  const openShopDetail = useCallback((shop: Shop) => {
    setSelectedShop(shop);
    setSheetOpen(true);
  }, []);

  const closeShopDetail = useCallback(() => setSheetOpen(false), []);

  return {
    table: {
      shops,
      shopsLoading,
      featuringId,
      sortConfig,
    },
    pagination: {
      page,
      pageSize,
      totalElements,
      totalPages,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    },
    search: {
      value: shopSearch,
      onChange: setShopSearch,
    },
    detailSheet: {
      shop: selectedShop,
      open: sheetOpen,
      onOpen: openShopDetail,
      onClose: closeShopDetail,
    },
    boost: {
      shop: boostShop,
      score: boostScore,
      submitting: boosting,
      onScoreChange: setBoostScore,
      onSubmit: handleBoostSubmit,
      onClose: closeBoost,
    },
    actions: {
      onSort: handleSort,
      onToggleFeatured: handleToggleFeatured,
      onOpenBoost: openBoost,
    },
  };
}
