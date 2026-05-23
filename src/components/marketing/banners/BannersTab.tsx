import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ListStateView from "@/components/common/ListStateView";
import { BannerFormDialog } from "@/components/marketing/BannerFormDialog";
import { BannerCard } from "./BannerCard";
import { useBannerManagement } from "@/hooks/banner-images/useBannerManagement";

export function BannersTab() {
  const { list, form, deleteDialog, actions } = useBannerManagement();

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-end">
        <Button onClick={actions.openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Banner
        </Button>
      </div>

      <ListStateView
        isLoading={list.loading}
        isError={list.isError}
        isEmpty={list.banners.length === 0}
        loadingMessage="Loading banners…"
        errorMessage={
          list.error instanceof Error
            ? list.error.message
            : "Failed to load banners. Check that the API is running and the database migration for banner fields is applied."
        }
        emptyMessage="No banners yet. Create your first banner."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.banners.map((banner) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              onToggle={actions.onToggleActive}
              onEdit={actions.openEdit}
              onDelete={actions.openDelete}
            />
          ))}
        </div>
      </ListStateView>

      <BannerFormDialog
        open={form.open}
        onOpenChange={form.onOpenChange}
        banner={form.editing}
        submitting={form.submitting}
        onSubmit={form.onSubmit}
      />

      <ConfirmDialog
        open={deleteDialog.state.open}
        onOpenChange={deleteDialog.onOpenChange}
        title="Delete banner"
        description={`Remove "${deleteDialog.state.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        loading={deleteDialog.loading}
        onCancel={deleteDialog.onCancel}
        onConfirm={deleteDialog.onConfirm}
      />
    </div>
  );
}
