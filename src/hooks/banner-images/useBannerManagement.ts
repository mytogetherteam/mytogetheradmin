import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  bannerFormSchema,
  bannerToggleSchema,
  type BannerFormValues,
  type BannerImage,
  type BannerPosition,
} from "@/schemas/banner-image.schema";
import {
  useBanners,
  useCreateBannerMutation,
  useDeleteBannerMutation,
  useReorderBannersMutation,
  useUpdateBannerMutation,
} from "./useBannerImages";

export interface BannerDeleteDialogState {
  open: boolean;
  id: number;
  name: string;
}

const closedDeleteDialog = (): BannerDeleteDialogState => ({
  open: false,
  id: 0,
  name: "",
});

/** At most two labels: EN + (MM or TH). MM is preferred when all three exist. */
export function getBannerDisplayName(banner: BannerImage): string {
  const en = banner.nameEn?.trim();
  const mm = banner.nameMm?.trim();
  const th = banner.nameTh?.trim();

  if (en) {
    const secondary = mm || th;
    return secondary ? `${en} (${secondary})` : en;
  }
  if (mm && th) return `${mm} (${th})`;
  return mm || th || "Untitled Banner";
}

export function useBannerManagement(
  position?: BannerPosition,
  /** When set, only these positions are shown (e.g. Banner page All = Promo + Ads). */
  scope?: BannerPosition[],
) {
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerImage | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<BannerDeleteDialogState>(
    closedDeleteDialog,
  );
  const [orderedBanners, setOrderedBanners] = useState<BannerImage[]>([]);

  const {
    data: bannersPage,
    isPending: bannersLoading,
    isError: bannersError,
    error: bannersLoadError,
    refetch: refetchBanners,
  } = useBanners({ page: 1, size: 100, position });

  const canReorder = Boolean(position);

  const banners = useMemo(() => {
    let list = bannersPage?.content ?? [];
    if (scope?.length) {
      const allowed = new Set(scope);
      list = list.filter((banner) => allowed.has(banner.position));
    }
    return [...list].sort(
      (a, b) =>
        (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.id - b.id,
    );
  }, [bannersPage, scope]);

  useEffect(() => {
    setOrderedBanners(banners);
  }, [banners]);

  const { mutateAsync: createBanner, isPending: creatingBanner } =
    useCreateBannerMutation();
  const { mutateAsync: updateBanner, isPending: updatingBanner } =
    useUpdateBannerMutation();
  const { mutateAsync: deleteBanner, isPending: deletingBanner } =
    useDeleteBannerMutation();
  const { mutateAsync: reorderBanners, isPending: reordering } =
    useReorderBannersMutation();

  const handleToggle = useCallback(
    async (id: number, isActive: boolean) => {
      const values = bannerToggleSchema.parse({ isActive });
      await updateBanner({ id, values });
    },
    [updateBanner],
  );

  const openDeleteDialog = useCallback((id: number, name: string) => {
    setDeleteDialog({ open: true, id, name });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog(closedDeleteDialog());
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    await deleteBanner(deleteDialog.id);
    closeDeleteDialog();
  }, [deleteBanner, deleteDialog.id, closeDeleteDialog]);

  const openCreate = useCallback(() => {
    setEditingBanner(null);
    setShowBannerForm(true);
  }, []);

  const openEdit = useCallback((banner: BannerImage) => {
    setEditingBanner(banner);
    setShowBannerForm(true);
  }, []);

  const handleFormOpenChange = useCallback((open: boolean) => {
    setShowBannerForm(open);
    if (!open) setEditingBanner(null);
  }, []);

  const handleSubmit = useCallback(
    async (values: BannerFormValues, imageFile?: File) => {
      const parsed = bannerFormSchema.safeParse(values);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Invalid banner data");
        return;
      }
      if (editingBanner) {
        await updateBanner({
          id: editingBanner.id,
          values: parsed.data,
          imageFile,
        });
        return;
      }
      if (!imageFile) return;
      await createBanner({ values: parsed.data, imageFile });
    },
    [createBanner, editingBanner, updateBanner],
  );

  const handleReorder = useCallback(
    async (next: BannerImage[]) => {
      if (!canReorder) return;
      const previous = orderedBanners;
      setOrderedBanners(
        next.map((banner, index) => ({
          ...banner,
          displayOrder: index + 1,
        })),
      );
      try {
        await reorderBanners(next.map((banner) => banner.id));
      } catch {
        setOrderedBanners(previous);
      }
    },
    [canReorder, orderedBanners, reorderBanners],
  );

  return {
    list: {
      banners: orderedBanners,
      loading: bannersLoading,
      isError: bannersError,
      error: bannersLoadError,
      refetch: refetchBanners,
      reordering,
      canReorder,
      onReorder: handleReorder,
    },
    form: {
      open: showBannerForm,
      editing: editingBanner,
      submitting: creatingBanner || updatingBanner,
      defaultPosition: position ?? "Promotions",
      onOpenChange: handleFormOpenChange,
      onSubmit: handleSubmit,
    },
    deleteDialog: {
      state: deleteDialog,
      loading: deletingBanner,
      onOpenChange: (open: boolean) => {
        if (!open) closeDeleteDialog();
        else setDeleteDialog((prev) => ({ ...prev, open }));
      },
      onCancel: closeDeleteDialog,
      onConfirm: handleDeleteConfirm,
    },
    actions: {
      openCreate,
      openEdit,
      openDelete: openDeleteDialog,
      onToggleActive: handleToggle,
    },
  };
}
