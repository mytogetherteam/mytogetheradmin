import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  bannerFormSchema,
  bannerToggleSchema,
  type BannerFormValues,
  type BannerImage,
} from "@/schemas/banner-image.schema";
import {
  useBanners,
  useCreateBannerMutation,
  useDeleteBannerMutation,
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

export function useBannerManagement() {
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerImage | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<BannerDeleteDialogState>(
    closedDeleteDialog,
  );

  const {
    data: bannersPage,
    isPending: bannersLoading,
    isError: bannersError,
    error: bannersLoadError,
    refetch: refetchBanners,
  } = useBanners({ page: 1, size: 100 });

  const banners = useMemo(() => bannersPage?.content ?? [], [bannersPage]);
  const sortedBanners = useMemo(
    () =>
      [...banners].sort((a, b) => Number(b.isActive) - Number(a.isActive)),
    [banners],
  );

  const { mutateAsync: createBanner, isPending: creatingBanner } =
    useCreateBannerMutation();
  const { mutateAsync: updateBanner, isPending: updatingBanner } =
    useUpdateBannerMutation();
  const { mutateAsync: deleteBanner, isPending: deletingBanner } =
    useDeleteBannerMutation();

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

  return {
    list: {
      banners: sortedBanners,
      loading: bannersLoading,
      isError: bannersError,
      error: bannersLoadError,
      refetch: refetchBanners,
    },
    form: {
      open: showBannerForm,
      editing: editingBanner,
      submitting: creatingBanner || updatingBanner,
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
