import { useCallback, useMemo, useState } from 'react';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { mapAdminShopProfileRowToShop, type Shop } from '@/services/shopService';
import { useDebounce } from '@/hooks/use-debounce';
import type { SortConfig } from '@/lib/sort-utils';
import { toggleSort } from '@/lib/sort-utils';
import {
  adminShopProfilesManageListIncludes,
} from '@/hooks/shops/shared/adminShopProfilesQueryKeys';
import { useAdminShopProfilesQuery } from './useAdminShopProfilesQuery';
import { useToggleShopStatusMutation } from './useToggleShopStatusMutation';
import { exportAdminShopProfilesToExcel } from './exportAdminShopProfiles';
import { useDeleteShopMutation } from './useDeleteShopMutation';
import { useAssignAdminMutation } from './useAssignAdminMutation';
import type { ShopActionDialogState } from './manageShopRestaurantTypes';

export type { ShopActionDialogState } from './manageShopRestaurantTypes';

const closedDialog = (): ShopActionDialogState => ({
  open: false,
  id: 0,
  name: '',
});

function shopDisplayName(shop: Shop): string {
  return shop.nameEn || shop.nameMm || shop.nameTh  || `Shop #${shop.id}`;
}

export function useManageShopRestaurant() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<ShopActionDialogState>(closedDialog);
  const [assignDialog, setAssignDialog] = useState<ShopActionDialogState>(closedDialog);

  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>();
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | undefined>();

  const { data: shopListData, isPending: shopsLoading } = useAdminShopProfilesQuery(
    currentPage,
    pageSize,
    debouncedSearch,
    selectedCategory,
    activeFilter,
    verifiedFilter,
    adminShopProfilesManageListIncludes,
  );

  const toggleShopStatusMutation = useToggleShopStatusMutation();
  const deleteShopMutation = useDeleteShopMutation();
  const assignAdminMutation = useAssignAdminMutation();

  const toggleBusyShopId =
    toggleShopStatusMutation.isPending && toggleShopStatusMutation.variables
      ? toggleShopStatusMutation.variables.id
      : null;

  
  const shopRows = useMemo(
    () => (shopListData?.content ?? []).map(mapAdminShopProfileRowToShop),
    [shopListData],
  );

  const totalElements = shopListData?.totalElements ?? 0;
  const totalPages = Math.max(1, shopListData?.totalPages ?? 1);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handleToggleStatus = useCallback(
    (shop: Shop, nextActive: boolean) => {
      const currentlyActive = shop.isActive !== false;
      if (currentlyActive === nextActive) return;
      toggleShopStatusMutation.mutate({
        id: shop.id,
        isActive: nextActive,
        isVerified: shop.isVerified === true,
      });
    },
    [toggleShopStatusMutation],
  );

  const handleToggleVerified = useCallback(
    (shop: Shop, nextVerified: boolean) => {
      const currentlyVerified = shop.isVerified === true;
      if (currentlyVerified === nextVerified) return;
      const label = shopDisplayName(shop);
      toggleShopStatusMutation.mutate({
        id: shop.id,
        isActive: shop.isActive !== false,
        isVerified: nextVerified,
        successToast: nextVerified
          ? `${label} marked verified`
          : `${label} marked unverified`,
      });
    },
    [toggleShopStatusMutation],
  );

  const openDeleteDialog = useCallback((shop: Shop) => {
    setDeleteDialog({ open: true, id: shop.id, name: shopDisplayName(shop) });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog(closedDialog());
  }, []);

  const openAssignDialog = useCallback((shop: Shop) => {
    setAssignDialog({ open: true, id: shop.id, name: shopDisplayName(shop) });
  }, []);

  const closeAssignDialog = useCallback(() => {
    setAssignDialog(closedDialog());
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    deleteShopMutation.mutate(
      { id: deleteDialog.id, name: deleteDialog.name },
      {
        onSuccess: () => {
          setSelectedShopId((prev) => (prev === deleteDialog.id ? null : prev));
          closeDeleteDialog();
        },
      },
    );
  }, [deleteShopMutation, deleteDialog.id, closeDeleteDialog]);

  const handleSort = useCallback(
    (key: string) => setSortConfig((prev) => toggleSort(prev, key)),
    [],
  );

  const handleEditShop = useCallback(
    (shop: Shop) => {
      setSelectedShopId(shop.id);
      navigate({
        pathname: '/shops/create',
        search: createSearchParams({ id: String(shop.id) }).toString(),
      });
    },
    [navigate],
  );

  const handleCreateShop = useCallback(() => {
    navigate('/shops/create');
  }, [navigate]);

  const handleExport = useCallback(() => {
    void exportAdminShopProfilesToExcel(shopRows);
  }, [shopRows]);

  return {
    table: {
      shopRows,
      shopsLoading,
      selectedShopId,
      sortConfig,
      toggleBusyShopId,
    },
    pagination: {
      currentPage,
      pageSize,
      totalElements,
      totalPages,
      onPageChange: setCurrentPage,
      onPageSizeChange: handlePageSizeChange,
    },
    search: {
      searchTerm,
      onSearchChange: handleSearchChange,
    },
    deleteDialog: {
      state: deleteDialog,
      isLoading: deleteShopMutation.isPending,
      onOpenChange: (open: boolean) => !open && closeDeleteDialog(),
      onConfirm: handleDeleteConfirm,
    },
    assignDialog: {
      state: assignDialog,
      isLoading: assignAdminMutation.isPending,
      onOpenChange: (open: boolean) => !open && closeAssignDialog(),
      mutate: assignAdminMutation.mutate,
    },
    filters: {
      selectedCategory,
      activeFilter,
      verifiedFilter,
      setSelectedCategory: (val?: number) => { setSelectedCategory(val); setCurrentPage(1); },
      setActiveFilter: (val?: boolean) => { setActiveFilter(val); setCurrentPage(1); },
      setVerifiedFilter: (val?: boolean) => { setVerifiedFilter(val); setCurrentPage(1); },
    },
    actions: {
      onToggleStatus: handleToggleStatus,
      onToggleVerified: handleToggleVerified,
      onEditShop: handleEditShop,
      onOpenDelete: openDeleteDialog,
      onOpenAssign: openAssignDialog,
      onSort: handleSort,
      onCreateShop: handleCreateShop,
      onExport: handleExport,
    },
  };
}
