import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Loader2, Plus, Search } from "lucide-react";

import {
  useDeletePlanMutation,
  usePlans,
  useReorderPlansMutation,
} from "@/hooks/plans/usePlan";
import type { PlanListItem } from "@/services/planService";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { PlansTable } from "@/components/plans/PlansTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ManagePlans() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [plans, setPlans] = useState<PlanListItem[]>([]);
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

  const { data, isPending: loading } = usePlans({
    page: 1,
    size: 500,
    search: debouncedSearch.trim() || undefined,
    isActive:
      activeFilter === "all" ? undefined : activeFilter === "active",
  });
  const { mutateAsync: deletePlan, isPending: deleting } =
    useDeletePlanMutation();
  const { mutateAsync: reorderPlans } = useReorderPlansMutation();

  useEffect(() => {
    const list = data?.content ?? [];
    setPlans(
      [...list].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    );
  }, [data]);

  const handleDeleteConfirm = async () => {
    await deletePlan(deleteDialog.id);
    setDeleteDialog({ open: false, id: 0, name: "" });
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = plans.findIndex((plan) => plan.id === active.id);
    const newIndex = plans.findIndex((plan) => plan.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previous = [...plans];
    const next = arrayMove(plans, oldIndex, newIndex).map((plan, index) => ({
      ...plan,
      displayOrder: index,
    }));
    setPlans(next);
    setReordering(true);
    try {
      await reorderPlans(next.map((plan) => plan.id));
    } catch {
      setPlans(previous);
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl py-10">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>
                Drag rows to reorder. New plans are appended automatically.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search plans..."
                  className="w-full pl-8 sm:w-[220px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={activeFilter}
                onValueChange={(value: "all" | "active" | "inactive") =>
                  setActiveFilter(value)
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => navigate("/plans/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : plans.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No plans found.
            </p>
          ) : (
            <>
              <PlansTable
                plans={plans}
                reordering={reordering}
                onDragEnd={onDragEnd}
                onEdit={(planId) => navigate(`/plans/create?id=${planId}`)}
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
        title="Delete plan"
        description={`Delete "${deleteDialog.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
