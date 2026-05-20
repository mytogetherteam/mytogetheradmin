import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, Plus } from "lucide-react";
import ConfirmDialog from "@/components/common/ConfirmDialog";
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

      {list.loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : list.isError ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-destructive font-medium">Failed to load banners</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {list.error instanceof Error
              ? list.error.message
              : "Check that the API is running and the database migration for banner fields is applied."}
          </p>
          <Button variant="outline" onClick={() => void list.refetch()}>
            Retry
          </Button>
        </div>
      ) : list.banners.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No banners yet. Create your first banner.</p>
        </div>
      ) : (
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
      )}

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
