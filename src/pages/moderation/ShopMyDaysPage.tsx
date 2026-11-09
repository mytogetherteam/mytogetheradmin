import { useCallback, useEffect, useState } from "react";
import { ImageIcon, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { handleApiError } from "@/lib/error-utils";
import { resolveMediaUrl } from "@/lib/resolveMediaUrl";
import { AdminMyDay, myDaysService } from "@/services/myDaysService";

export default function ShopMyDaysPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdminMyDay[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminMyDay | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await myDaysService.list(page, 24);
      if (result.items.length === 0 && result.page > 1) {
        setPage(result.page - 1);
        return;
      }
      setItems(result.items);
      setTotal(result.total);
      setPageSize(result.pageSize || 24);
    } catch (error) {
      handleApiError(error, "Failed to load shop photos");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async () => {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    try {
      await myDaysService.remove(pendingDelete.id);
      toast.success("Photo taken down");
      await load();
    } catch (error) {
      handleApiError(error, "Failed to take down the photo");
    } finally {
      setBusyId(null);
    }
  };

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <ImageIcon className="h-6 w-6" />
            Shop MyDays
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Photos restaurants posted in the last 24 hours. Taking one down
            removes it from the app and deletes the file.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-md border py-16 text-center text-sm text-muted-foreground">
          No photos are up right now.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const src = resolveMediaUrl(item.imageUrl);
            return (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-square bg-muted">
                  {src ? (
                    <img
                      src={src}
                      alt={item.shopName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <CardContent className="space-y-3 p-4">
                  <div>
                    <div className="font-medium">{item.shopName}</div>
                    <div className="text-xs text-muted-foreground">
                      Posted {new Date(item.createdAt).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Comes down {new Date(item.expiresAt).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full"
                    disabled={busyId === item.id}
                    onClick={() => setPendingDelete(item)}
                  >
                    Take down
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{total === 0 ? "0 photos" : `${from}–${to} of ${total}`}</span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= lastPage || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Take down this photo?"
        description={
          pendingDelete
            ? `${pendingDelete.shopName}'s photo will be removed from the app.`
            : "This photo will be removed from the app."
        }
        confirmText="Take down"
        variant="destructive"
        onConfirm={remove}
      />
    </div>
  );
}
