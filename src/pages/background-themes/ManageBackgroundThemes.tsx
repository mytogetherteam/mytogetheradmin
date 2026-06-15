import { useState, useEffect, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Loader2,
    Plus,
    Search,
    Trash2,
    Pencil,
    GripVertical,
} from "lucide-react";
import { TableImage } from "@/components/TableImage";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import {
    BackgroundThemeService,
    BackgroundThemeDTO,
} from "@/services/backgroundThemeService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableRow({
    theme,
    children,
}: {
    theme: BackgroundThemeDTO;
    children: (args: {
        setActivatorNodeRef: (el: HTMLElement | null) => void;
        attributes: ReturnType<typeof useSortable>["attributes"];
        listeners: ReturnType<typeof useSortable>["listeners"];
    }) => React.ReactNode;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: theme.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        position: "relative",
        background: isDragging ? "hsl(var(--muted) / 0.5)" : undefined,
    };

    return (
        <TableRow ref={setNodeRef} style={style} className="hover:bg-muted/50 transition-colors">
            {children({ setActivatorNodeRef, attributes, listeners })}
        </TableRow>
    );
}

export default function ManageBackgroundThemes() {
    const navigate = useNavigate();
    const [themes, setThemes] = useState<BackgroundThemeDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [reordering, setReordering] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({
        open: false,
        id: 0,
        name: "",
    });
    const [deleting, setDeleting] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const loadThemes = useCallback(async () => {
        setLoading(true);
        try {
            const res = await BackgroundThemeService.getBackgroundThemes({
                page: 1,
                size: 500,
                search: searchTerm,
            });
            const list = res.content || [];
            setThemes(
                [...list].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
            );
        } catch (e) {
            handleApiError(e, "Failed to load background themes");
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => loadThemes(), 500);
        return () => clearTimeout(timer);
    }, [searchTerm, loadThemes]);

    const handleDeleteClick = (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        setDeleteDialog({ open: true, id, name });
    };

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            await BackgroundThemeService.deleteBackgroundTheme(deleteDialog.id);
            toast.success("Background theme deleted successfully");
            setDeleteDialog({ open: false, id: 0, name: "" });
            loadThemes();
        } catch (e) {
            handleApiError(e, "Failed to delete background theme");
        } finally {
            setDeleting(false);
        }
    };

    const handleToggleActive = async (theme: BackgroundThemeDTO, isActive: boolean) => {
        setTogglingId(theme.id);
        try {
            await BackgroundThemeService.updateBackgroundTheme(theme.id, { isActive });
            setThemes((prev) =>
                prev.map((t) => (t.id === theme.id ? { ...t, isActive } : t)),
            );
            toast.success(isActive ? "Theme activated" : "Theme deactivated");
        } catch (e) {
            handleApiError(e, "Failed to update theme status");
        } finally {
            setTogglingId(null);
        }
    };

    const onDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = themes.findIndex((t) => t.id === active.id);
        const newIndex = themes.findIndex((t) => t.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;

        const previous = [...themes];
        const next = arrayMove(themes, oldIndex, newIndex);
        setThemes(next);
        setReordering(true);
        try {
            await BackgroundThemeService.reorderBackgroundThemes(next.map((t) => t.id));
            toast.success("Order updated");
        } catch (e) {
            setThemes(previous);
            handleApiError(e, "Failed to update order");
        } finally {
            setReordering(false);
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-7xl">
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="leading-tight">Manage Background Themes</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                App background images shown to users in the mobile app.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search themes..."
                                    className="pl-8 w-full sm:w-[200px] lg:w-[300px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button onClick={() => navigate("/background-themes/create")}>
                                <Plus className="h-4 w-4 mr-2" />
                                New Theme
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : themes.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            No background themes yet. Create your first theme.
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={onDragEnd}
                        >
                            <SortableContext
                                items={themes.map((t) => t.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-10" />
                                            <TableHead className="w-20">Image</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead className="w-24">Order</TableHead>
                                            <TableHead className="w-24">Active</TableHead>
                                            <TableHead className="w-28 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {themes.map((theme) => (
                                            <SortableRow key={theme.id} theme={theme}>
                                                {({ setActivatorNodeRef, attributes, listeners }) => (
                                                    <>
                                                        <TableCell>
                                                            <button
                                                                type="button"
                                                                ref={setActivatorNodeRef}
                                                                className="cursor-grab touch-none text-muted-foreground hover:text-foreground disabled:opacity-50"
                                                                disabled={reordering}
                                                                {...attributes}
                                                                {...listeners}
                                                            >
                                                                <GripVertical className="h-4 w-4" />
                                                            </button>
                                                        </TableCell>
                                                        <TableCell>
                                                            <TableImage
                                                                src={theme.imageUrl}
                                                                alt={theme.name}
                                                                className="h-12 w-20 object-cover rounded"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium">{theme.name}</TableCell>
                                                        <TableCell>{theme.displayOrder}</TableCell>
                                                        <TableCell>
                                                            <Switch
                                                                checked={theme.isActive}
                                                                disabled={togglingId === theme.id}
                                                                onCheckedChange={(checked) =>
                                                                    handleToggleActive(theme, checked)
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        navigate(
                                                                            `/background-themes/create?id=${theme.id}`,
                                                                        )
                                                                    }
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={(e) =>
                                                                        handleDeleteClick(e, theme.id, theme.name)
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </>
                                                )}
                                            </SortableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </SortableContext>
                        </DndContext>
                    )}
                </CardContent>
            </Card>

            <ConfirmDialog
                open={deleteDialog.open}
                onOpenChange={(open) => !open && setDeleteDialog({ open: false, id: 0, name: "" })}
                title="Delete background theme"
                description={`Remove "${deleteDialog.name}"? This cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
                loading={deleting}
                onCancel={() => setDeleteDialog({ open: false, id: 0, name: "" })}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}
