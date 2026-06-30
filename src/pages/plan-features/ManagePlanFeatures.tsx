import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Loader2, Plus, Search } from "lucide-react";

import {
  useDeletePlanFeatureMutation,
  usePlanFeatures,
  useReorderPlanFeaturesMutation,
} from "@/hooks/plans/usePlanFeature";
import type { PlanFeatureListItem } from "@/services/planService";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { PlanFeaturesTable } from "@/components/plans/PlanFeaturesTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ManagePlanFeatures() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [features, setFeatures] = useState<PlanFeatureListItem[]>([]);
  const [reordering, setReordering] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: number;
    name: string;
  }>({ open: false, id: 0, name: "" });
  const isFirstSearchDebounce = useRef(true);

  useEffect(() => {
    const delayMs = isFirstSearchDebounce.current ? 0 : 500;
    isFirstSearchDebounce.current = false;
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), delayMs);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isPending: loading } = usePlanFeatures({
    page: 1,
    size: 500,
    search: debouncedSearch.trim() || undefined,
  });
  const { mutateAsync: deleteFeature, isPending: deleting } =
    useDeletePlanFeatureMutation();
  const { mutateAsync: reorderFeatures } = useReorderPlanFeaturesMutation();

  useEffect(() => {
    const list = data?.content ?? [];
    setFeatures(
      [...list].sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
      ),
    );
  }, [data]);

  const handleDeleteConfirm = async () => {
    await deleteFeature(deleteDialog.id);
    setDeleteDialog({ open: false, id: 0, name: "" });
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = features.findIndex((feature) => feature.id === active.id);
    const newIndex = features.findIndex((feature) => feature.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previous = [...features];
    const next = arrayMove(features, oldIndex, newIndex).map(
      (feature, index) => ({
        ...feature,
        displayOrder: index,
      }),
    );
    setFeatures(next);
    setReordering(true);
    try {
      await reorderFeatures(next.map((feature) => feature.id));
    } catch {
      setFeatures(previous);
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl py-10">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Plan Features</CardTitle>
              <CardDescription>
                Drag rows to reorder. New features are appended automatically.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search features..."
                  className="w-full pl-8 sm:w-[220px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => navigate("/plan-features/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Feature
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : features.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No plan features found.
            </p>
          ) : (
            <>
              <PlanFeaturesTable
                features={features}
                reordering={reordering}
                onDragEnd={onDragEnd}
                onEdit={(featureId) =>
                  navigate(`/plan-features/create?id=${featureId}`)
                }
                onDelete={({ id, nameEn }) =>
                  setDeleteDialog({ open: true, id, name: nameEn })
                }
              />
              {reordering ? (
                <p className="text-xs text-muted-foreground">Saving order…</p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((prev) => ({ ...prev, open }))
        }
        title="Delete plan feature"
        description={`Delete "${deleteDialog.name}"? Plans using this feature must be updated first.`}
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
