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
import { useNavigate } from "react-router-dom";
import { MasterMenuCategoryService, MasterMenuCategoryDTO } from "@/services/masterMenuCategoryService";
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
import ConfirmDialog from "@/components/common/ConfirmDialog";

function SortableRow({
    category,
    children,
}: {
    category: MasterMenuCategoryDTO;
    children: (args: {
        setActivatorNodeRef: (el: HTMLElement | null) => void;
        attributes: ReturnType<typeof useSortable>["attributes"];
        listeners: ReturnType<typeof useSortable>["listeners"];
        isDragging: boolean;
    }) => React.ReactNode;
}) {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
        useSortable({ id: category.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        position: "relative",
        background: isDragging ? "hsl(var(--muted) / 0.5)" : undefined,
    };

    return (
        <TableRow ref={setNodeRef} style={style} className="hover:bg-muted/50 transition-colors">
            {children({ setActivatorNodeRef, attributes, listeners, isDragging })}
        </TableRow>
    );
}

export default function ManageMasterMenuCategories() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<MasterMenuCategoryDTO[]>([]);
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

    const loadCategories = useCallback(async () => {
        setLoading(true);
        try {
            const res = await MasterMenuCategoryService.getMasterMenuCategories({
                page: 0,
                size: 500,
                search: searchTerm,
            });
            const list = res.content || [];
            setCategories([...list].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
        } catch (e) {
            handleApiError(e, "Failed to load master menu categories");
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadCategories();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, loadCategories]);

    const exportToExcel = () => {
        const data = categories.map((c) => ({
            ID: c.id,
            "Name (EN)": c.nameEn || "",
            "Name (MM)": c.nameMm || "",
            "Name (TH)": c.nameTh || "",
            "Display Order": c.displayOrder || 0,
            "Cuisine Type": c.cuisineTypeNameEn || c.cuisineTypeId || "",
            "Is Active": c.isActive !== false ? "Yes" : "No",
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Master Menu Categories");
        XLSX.writeFile(wb, "MasterMenuCategories.xlsx");
    };

    const handleDeleteClick = (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        setDeleteDialog({ open: true, id, name });
    };

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            await MasterMenuCategoryService.deleteMasterMenuCategory(deleteDialog.id);
            toast.success("Master menu category deleted successfully");
            setDeleteDialog({ open: false, id: 0, name: "" });
            loadCategories();
        } catch (e) {
            handleApiError(e, "Failed to delete master menu category");
        } finally {
            setDeleting(false);
        }
    };

    const onDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = categories.findIndex((c) => c.id === active.id);
        const newIndex = categories.findIndex((c) => c.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;

        const previous = [...categories];
        const next = arrayMove(categories, oldIndex, newIndex);
        setCategories(next);
        setReordering(true);
        try {
            await MasterMenuCategoryService.reorderMasterMenuCategories(next.map((c) => c.id));
            toast.success("Order updated");
        } catch (e) {
            setCategories(previous);
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
                            <CardTitle className="leading-tight">Manage Master Menu Categories</CardTitle>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search categories..."
                                    className="pl-8 w-full sm:w-[200px] lg:w-[300px]"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                    }}
                                />
                            </div>
                            <Button variant="outline" className="gap-2 shrink-0" onClick={exportToExcel}>
                                <FileSpreadsheet className="h-4 w-4" />
                                Export
                            </Button>
                            <Button onClick={() => navigate("/master-menu-categories/create")}>
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
                                                <TableHead>Image</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Cuisine Type</TableHead>
                                                <TableHead>Order</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <SortableContext
                                                items={categories.map((c) => c.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {categories.length > 0 ? (
                                                    categories.map((category) => (
                                                        <SortableRow key={category.id} category={category}>
                                                            {({ setActivatorNodeRef, attributes, listeners }) => (
                                                                <>
                                                                    <TableCell className="w-10 p-2">
                                                                        <button
                                                                            type="button"
                                                                            ref={setActivatorNodeRef}
                                                                            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 rounded"
                                                                            disabled={reordering}
                                                                            {...attributes}
                                                                            {...listeners}
                                                                        >
                                                                            <GripVertical className="h-5 w-5" />
                                                                        </button>
                                                                    </TableCell>
                                                                    <TableCell
                                                                        className="font-mono text-xs cursor-pointer"
                                                                        onClick={() =>
                                                                            navigate(
                                                                                `/master-menu-categories/create?id=${category.id}`,
                                                                            )
                                                                        }
                                                                    >
                                                                        {category.id}
                                                                    </TableCell>
                                                                    <TableCell
                                                                        className="cursor-pointer"
                                                                        onClick={() =>
                                                                            navigate(
                                                                                `/master-menu-categories/create?id=${category.id}`,
                                                                            )
                                                                        }
                                                                    >
                                                                        <TableImage
                                                                            src={category.imageUrl}
                                                                            alt={category.nameEn || "Category"}
                                                                            size="sm"
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell
                                                                        className="cursor-pointer"
                                                                        onClick={() =>
                                                                            navigate(
                                                                                `/master-menu-categories/create?id=${category.id}`,
                                                                            )
                                                                        }
                                                                    >
                                                                        <div className="font-medium">
                                                                            {category.nameEn ||
                                                                                category.nameMm ||
                                                                                category.nameTh ||
                                                                                `Category ${category.id}`}
                                                                        </div>
                                                                        {(category.nameMm || category.nameTh) && (
                                                                            <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                                                                                {category.nameMm && (
                                                                                    <span>{category.nameMm}</span>
                                                                                )}
                                                                                {category.nameTh && (
                                                                                    <span>• {category.nameTh}</span>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell
                                                                        className="cursor-pointer"
                                                                        onClick={() =>
                                                                            navigate(
                                                                                `/master-menu-categories/create?id=${category.id}`,
                                                                            )
                                                                        }
                                                                    >
                                                                        {category.cuisineTypeNameEn ||
                                                                            category.cuisineTypeId ? (
                                                                            <span className="text-sm px-2 py-0.5 rounded text-muted-foreground bg-muted/20">
                                                                                {category.cuisineTypeNameEn ||
                                                                                    `ID: ${category.cuisineTypeId}`}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                -
                                                                            </span>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell
                                                                        className="cursor-pointer"
                                                                        onClick={() =>
                                                                            navigate(
                                                                                `/master-menu-categories/create?id=${category.id}`,
                                                                            )
                                                                        }
                                                                    >
                                                                        {category.displayOrder ?? 0}
                                                                    </TableCell>
                                                                    <TableCell
                                                                        className="cursor-pointer"
                                                                        onClick={() =>
                                                                            navigate(
                                                                                `/master-menu-categories/create?id=${category.id}`,
                                                                            )
                                                                        }
                                                                    >
                                                                        <span
                                                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${category.isActive !== false
                                                                                ? "bg-green-100 text-green-800"
                                                                                : "bg-red-100 text-red-800"
                                                                                }`}
                                                                        >
                                                                            {category.isActive !== false
                                                                                ? "Active"
                                                                                : "Inactive"}
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
                                                                                                navigate(
                                                                                                    `/master-menu-categories/create?id=${category.id}`,
                                                                                                );
                                                                                            }}
                                                                                        >
                                                                                            <Pencil className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>
                                                                                        Edit Category
                                                                                    </TooltipContent>
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
                                                                                                    category.id,
                                                                                                    category.nameEn ||
                                                                                                    category.nameMm ||
                                                                                                    category.nameTh ||
                                                                                                    `Category ${category.id}`,
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <Trash2 className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>
                                                                                        Delete Category
                                                                                    </TooltipContent>
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
                                                        <TableCell
                                                            colSpan={8}
                                                            className="h-24 text-center text-muted-foreground"
                                                        >
                                                            No master menu categories found.
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
                title="Delete Master Menu Category?"
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
