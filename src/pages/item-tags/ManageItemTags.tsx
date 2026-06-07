import { useState, useEffect, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Loader2,
    Plus,
    Search,
    FileSpreadsheet,
    Trash2,
    Pencil,
    GripVertical,
} from "lucide-react";
import { TableImage } from "@/components/TableImage";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import { ItemTagService, ItemTagDTO } from "@/services/itemTagService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import * as XLSX from "xlsx";
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
    tag,
    children,
}: {
    tag: ItemTagDTO;
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
    } = useSortable({ id: tag.id });

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

export default function ManageItemTags() {
    const navigate = useNavigate();
    const [tags, setTags] = useState<ItemTagDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [reordering, setReordering] = useState(false);

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

    const loadTags = useCallback(async () => {
        setLoading(true);
        try {
            const res = await ItemTagService.getItemTags({
                page: 0,
                size: 500,
                search: searchTerm,
            });
            const list = res.content || [];
            setTags(
                [...list].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
            );
        } catch (e) {
            handleApiError(e, "Failed to load item tags");
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => loadTags(), 500);
        return () => clearTimeout(timer);
    }, [searchTerm, loadTags]);

    const exportToExcel = () => {
        const data = tags.map((t) => ({
            ID: t.id,
            "Name (EN)": t.nameEn || "",
            "Name (MM)": t.nameMm || "",
            "Name (TH)": t.nameTh || "",
            "Tag Type": t.tagType || "",
            "Color Code": t.colorCode || "",
            "Display Order": t.displayOrder ?? "",
            "Is Active": t.isActive !== false ? "Yes" : "No",
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Item Tags");
        XLSX.writeFile(wb, "ItemTags.xlsx");
    };

    const handleDeleteClick = (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        setDeleteDialog({ open: true, id, name });
    };

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            await ItemTagService.deleteItemTag(deleteDialog.id);
            toast.success("Item tag deleted successfully");
            setDeleteDialog({ open: false, id: 0, name: "" });
            loadTags();
        } catch (e) {
            handleApiError(e, "Failed to delete item tag");
        } finally {
            setDeleting(false);
        }
    };

    const onDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = tags.findIndex((t) => t.id === active.id);
        const newIndex = tags.findIndex((t) => t.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;

        const previous = [...tags];
        const next = arrayMove(tags, oldIndex, newIndex);
        setTags(next);
        setReordering(true);
        try {
            await ItemTagService.reorderItemTags(next.map((t) => t.id));
            toast.success("Order updated");
        } catch (e) {
            setTags(previous);
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
                            <CardTitle className="leading-tight">Manage Item Discovery Tags</CardTitle>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search tags..."
                                    className="pl-8 w-full sm:w-[200px] lg:w-[300px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" className="gap-2 shrink-0" onClick={exportToExcel}>
                                <FileSpreadsheet className="h-4 w-4" />
                                Export
                            </Button>
                            <Button onClick={() => navigate("/item-tags/create")}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create New
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border overflow-x-auto">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-10" aria-label="Reorder" />
                                                <TableHead className="w-[80px]">ID</TableHead>
                                                <TableHead>Icon</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Tag Type</TableHead>
                                                <TableHead>Color</TableHead>
                                                <TableHead>Order</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <SortableContext items={tags.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                                                {tags.length > 0 ? (
                                                    tags.map((tag) => (
                                                        <SortableRow key={tag.id} tag={tag}>
                                                            {({ setActivatorNodeRef, attributes, listeners }) => (
                                                                <>
                                                                    <TableCell className="w-10 p-2">
                                                                        <button
                                                                            type="button"
                                                                            ref={setActivatorNodeRef}
                                                                            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 rounded disabled:opacity-40"
                                                                            disabled={reordering}
                                                                            {...attributes}
                                                                            {...listeners}
                                                                        >
                                                                            <GripVertical className="h-5 w-5" />
                                                                        </button>
                                                                    </TableCell>
                                                                    <TableCell
                                                                        className="font-mono text-xs cursor-pointer"
                                                                        onClick={() => navigate(`/item-tags/create?id=${tag.id}`)}
                                                                    >
                                                                        {tag.id}
                                                                    </TableCell>
                                                                    <TableCell
                                                                        className="cursor-pointer"
                                                                        onClick={() => navigate(`/item-tags/create?id=${tag.id}`)}
                                                                    >
                                                                        <TableImage src={tag.iconUrl} alt={tag.nameEn || "Tag"} size="sm" />
                                                                    </TableCell>
                                                                    <TableCell
                                                                        className="cursor-pointer"
                                                                        onClick={() => navigate(`/item-tags/create?id=${tag.id}`)}
                                                                    >
                                                                        <div className="font-medium">
                                                                            {tag.nameEn || tag.nameMm || tag.nameTh || `Tag ${tag.id}`}
                                                                        </div>
                                                                        {(tag.nameMm || tag.nameTh) && (
                                                                            <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                                                                                {tag.nameMm && <span>{tag.nameMm}</span>}
                                                                                {tag.nameTh && <span>• {tag.nameTh}</span>}
                                                                            </div>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell
                                                                        className="cursor-pointer"
                                                                        onClick={() => navigate(`/item-tags/create?id=${tag.id}`)}
                                                                    >
                                                                        <span className="text-sm border px-2 py-0.5 rounded text-muted-foreground bg-muted/20">
                                                                            {tag.tagType || "Default"}
                                                                        </span>
                                                                    </TableCell>
                                                                    <TableCell
                                                                        className="cursor-pointer"
                                                                        onClick={() => navigate(`/item-tags/create?id=${tag.id}`)}
                                                                    >
                                                                        {tag.colorCode ? (
                                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                                                                                <div
                                                                                    className="w-4 h-4 rounded-full border shadow-sm"
                                                                                    style={{ backgroundColor: tag.colorCode }}
                                                                                />
                                                                                {tag.colorCode}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-xs text-muted-foreground">-</span>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell
                                                                        className="text-muted-foreground cursor-pointer"
                                                                        onClick={() => navigate(`/item-tags/create?id=${tag.id}`)}
                                                                    >
                                                                        {tag.displayOrder ?? "—"}
                                                                    </TableCell>
                                                                    <TableCell
                                                                        className="cursor-pointer"
                                                                        onClick={() => navigate(`/item-tags/create?id=${tag.id}`)}
                                                                    >
                                                                        <span
                                                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tag.isActive !== false
                                                                                ? "bg-green-100 text-green-800"
                                                                                : "bg-red-100 text-red-800"
                                                                                }`}
                                                                        >
                                                                            {tag.isActive !== false ? "Active" : "Inactive"}
                                                                        </span>
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <TooltipProvider>
                                                                            <div className="flex justify-end gap-1">
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            className="h-8 w-8 p-0"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                navigate(`/item-tags/create?id=${tag.id}`);
                                                                                            }}
                                                                                        >
                                                                                            <Pencil className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>Edit Tag</TooltipContent>
                                                                                </Tooltip>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            className="h-8 w-8 p-0 text-destructive"
                                                                                            onClick={(e) =>
                                                                                                handleDeleteClick(
                                                                                                    e,
                                                                                                    tag.id,
                                                                                                    tag.nameEn ||
                                                                                                    tag.nameMm ||
                                                                                                    tag.nameTh ||
                                                                                                    `Tag ${tag.id}`,
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <Trash2 className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>Delete Tag</TooltipContent>
                                                                                </Tooltip>
                                                                            </div>
                                                                        </TooltipProvider>
                                                                    </TableCell>
                                                                </>
                                                            )}
                                                        </SortableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                                            No item tags found.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </SortableContext>
                                        </TableBody>
                                    </Table>
                                </DndContext>
                            </div>
                            {reordering && (
                                <p className="text-xs text-muted-foreground mt-2">Saving order…</p>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            <ConfirmDialog
                open={deleteDialog.open}
                onOpenChange={(open) => !deleting && setDeleteDialog((d) => ({ ...d, open }))}
                title="Delete Item Tag?"
                description={`This will permanently delete ${deleteDialog.name}. This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
                loading={deleting}
                onCancel={() => setDeleteDialog({ open: false, id: 0, name: "" })}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}
