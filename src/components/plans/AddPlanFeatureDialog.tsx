import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import {
  planFeatureKeys,
  useCreatePlanFeatureMutation,
} from "@/hooks/plans/usePlanFeature";
import { DISPLAY_ONLY_FEATURE_KEY } from "@/schemas/plan-feature.schema";
import type {
  PlanFeatureKey,
  PlanFeatureKeyOption,
  PlanFeatureListItem,
} from "@/services/planService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface AddPlanFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogueFeatures: PlanFeatureListItem[];
  /** Features already on this plan — they cannot be added twice. */
  usedFeatureIds: number[];
  keyOptions: PlanFeatureKeyOption[];
  onAdd: (featureIds: number[]) => void;
}

export function AddPlanFeatureDialog({
  open,
  onOpenChange,
  catalogueFeatures,
  usedFeatureIds,
  keyOptions,
  onAdd,
}: AddPlanFeatureDialogProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [tab, setTab] = useState("existing");

  const [newName, setNewName] = useState("");
  const [newKey, setNewKey] = useState<string>(DISPLAY_ONLY_FEATURE_KEY);
  const [newTooltip, setNewTooltip] = useState("");

  const { mutateAsync: createFeature, isPending: isCreating } =
    useCreatePlanFeatureMutation({ redirectTo: false });

  const used = useMemo(() => new Set(usedFeatureIds), [usedFeatureIds]);

  const available = useMemo(() => {
    const term = search.trim().toLowerCase();
    return catalogueFeatures
      .filter((feature) => !used.has(feature.id))
      .filter((feature) =>
        term
          ? feature.nameEn.toLowerCase().includes(term) ||
            feature.code.toLowerCase().includes(term) ||
            (feature.featureKeyInfo?.label.toLowerCase().includes(term) ?? false)
          : true,
      );
  }, [catalogueFeatures, search, used]);

  const alreadyAddedCount = catalogueFeatures.length - available.length;

  const reset = () => {
    setSearch("");
    setSelectedIds([]);
    setTab("existing");
    setNewName("");
    setNewKey(DISPLAY_ONLY_FEATURE_KEY);
    setNewTooltip("");
  };

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const handleAddSelected = () => {
    if (selectedIds.length === 0) return;
    // Keep the catalogue's display order rather than click order.
    const ordered = catalogueFeatures
      .filter((feature) => selectedIds.includes(feature.id))
      .map((feature) => feature.id);
    onAdd(ordered);
    close();
  };

  const handleCreateAndAdd = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Feature name (EN) is required");
      return;
    }

    const created = await createFeature({
      nameEn: name,
      featureKey:
        newKey === DISPLAY_ONLY_FEATURE_KEY
          ? null
          : (newKey as PlanFeatureKey),
      descriptionEn: newTooltip.trim() || undefined,
    });

    // Wait for the catalogue to refetch so the new row can resolve its name.
    await queryClient.invalidateQueries({ queryKey: planFeatureKeys.all });
    onAdd([created.id]);
    close();
  };

  const takenKeyIds = new Set(
    keyOptions
      .filter((option) => option.usedByFeatureId != null)
      .map((option) => option.key),
  );
  const selectedKeyInfo = keyOptions.find((option) => option.key === newKey);

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add feature to this plan</DialogTitle>
          <DialogDescription>
            Pick from the shared catalogue, or create a new feature without
            leaving this plan.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">
              Use existing ({available.length})
            </TabsTrigger>
            <TabsTrigger value="new">Create new</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                className="pl-9"
                placeholder="Search features…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {available.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {catalogueFeatures.length === 0
                  ? "The catalogue is empty. Use “Create new” to add your first feature."
                  : search.trim()
                    ? "No feature matches that search."
                    : "Every catalogue feature is already on this plan."}
              </p>
            ) : (
              <ScrollArea className="h-64 rounded-md border">
                <div className="divide-y">
                  {available.map((feature) => {
                    const checked = selectedIds.includes(feature.id);
                    return (
                      <label
                        key={feature.id}
                        htmlFor={`add-feature-${feature.id}`}
                        className="flex cursor-pointer items-start gap-3 p-3 hover:bg-muted/50"
                      >
                        <Checkbox
                          id={`add-feature-${feature.id}`}
                          checked={checked}
                          onCheckedChange={(next) =>
                            setSelectedIds((current) =>
                              next === true
                                ? [...current, feature.id]
                                : current.filter((id) => id !== feature.id),
                            )
                          }
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{feature.nameEn}</span>
                            {feature.featureKeyInfo ? (
                              <Badge variant="secondary">
                                {feature.featureKeyInfo.valueType}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Display only</Badge>
                            )}
                            {feature.options.length > 0 ? (
                              <Badge variant="outline">
                                {feature.options.length} option
                                {feature.options.length > 1 ? "s" : ""}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {feature.featureKeyInfo?.description ??
                              "Shown on the pricing page; nothing enforces it."}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {alreadyAddedCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                {alreadyAddedCount} feature
                {alreadyAddedCount > 1 ? "s are" : " is"} hidden because
                {alreadyAddedCount > 1 ? " they are" : " it is"} already on this
                plan.
              </p>
            ) : null}
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-feature-name">Name (EN)</Label>
              <Input
                id="new-feature-name"
                placeholder="Flash Drop"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-feature-key">Linked capability</Label>
              <Select value={newKey} onValueChange={setNewKey}>
                <SelectTrigger id="new-feature-key" hideClear>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DISPLAY_ONLY_FEATURE_KEY}>
                    Display only — nothing to enforce
                  </SelectItem>
                  {keyOptions.map((option) => (
                    <SelectItem
                      key={option.key}
                      value={option.key}
                      disabled={takenKeyIds.has(option.key)}
                    >
                      {option.label}
                      {takenKeyIds.has(option.key)
                        ? ` — already used by "${option.usedByFeatureName}"`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedKeyInfo?.description ??
                  "Leave as display only for marketing rows such as “No Ads”."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-feature-tooltip">Tooltip (EN)</Label>
              <Textarea
                id="new-feature-tooltip"
                rows={2}
                placeholder="Push notifications sent to local users about sudden discounts."
                value={newTooltip}
                onChange={(e) => setNewTooltip(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional. Names in other languages and package options can be
                added later from Manage Features.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          {tab === "existing" ? (
            <Button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={handleAddSelected}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add
              {selectedIds.length > 0 ? ` ${selectedIds.length}` : ""} feature
              {selectedIds.length > 1 ? "s" : ""}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isCreating || !newName.trim()}
              onClick={handleCreateAndAdd}
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create &amp; add
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
