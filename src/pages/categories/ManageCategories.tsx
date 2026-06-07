import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { DataTablePagination } from "@/components/DataTablePagination";
import {
  Loader2,
  Plus,
  Search,
  FileSpreadsheet,
  Trash2,
  Edit,
  GripVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ShopService, MenuCategory } from "@/services/shopService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import * as XLSX from "xlsx";
import { InfiniteSearchableSelect } from "@/components/ui/infinite-searchable-select";
import { TableImage } from "@/components/TableImage";
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

function SortableCatRow({
  cat,
  children,
}: {
  cat: MenuCategory;
  children: (args: {
    setActivatorNodeRef: (el: HTMLElement | null) => void;
    attributes: ReturnType<typeof useSortable>["attributes"];
    listeners: ReturnType<typeof useSortable>["listeners"];
  }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id, disabled: false });

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

export default function ManageCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [shopId, setShopId] = useState<string>("");
  const [selectedShopData, setSelectedShopData] = useState<{ label: string; value: string } | null>(null);
  const [reordering, setReordering] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({
    open: false,
    id: 0,
    name: "",
  });
  const [deleting, setDeleting] = useState(false);

  const canReorder = Boolean(shopId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      // When a shop is selected, load all its categories so drag-reorder stays accurate.
      const apiPage = shopId ? 0 : currentPage - 1;
      const apiSize = shopId ? 500 : pageSize;

      const res = await ShopService.getAdminCategories(
        apiPage,
        apiSize,
        searchTerm,
        shopId ? parseInt(shopId, 10) : undefined,
      );
      const list = res?.content || [];
      const arr = Array.isArray(list) ? list : [];
      setCategories(
        [...arr].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
      );
      setTotalItems(res.totalElements ?? arr.length);
      setTotalPages(
        shopId
          ? 1
          : Math.max(1, res.totalPages ?? Math.ceil((res.totalElements ?? arr.length) / pageSize)),
      );
    } catch (e) {
      handleApiError(e, "Failed to load menu categories");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, shopId, currentPage, pageSize]);

  const fetchShopData = useCallback(async (page: number, size: number, search: string) => {
    const res = await ShopService.getAllShops(page, size, search);
    return {
      content: res.content.map((shop) => ({ label: shop.nameEn || shop.name, value: String(shop.id) })),
      last: res.last,
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCategories();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, shopId, currentPage, pageSize, loadCategories]);

  const exportToExcel = () => {
    const data = categories.map((c) => ({
      ID: c.id,
      Shop: c.shopName || c.shopId || "",
      "Name (EN)": c.nameEn || c.name || "",
      "Name (MM)": c.nameMm || "",
      "Name (TH)": c.nameTh || "",
      "Display Order": c.displayOrder ?? "",
      "Is Active": c.isActive !== false ? "Yes" : "No",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Menu Categories");
    XLSX.writeFile(wb, "MenuCategories.xlsx");
  };

  const handleDeleteClick = (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    setDeleteDialog({ open: true, id, name });
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await ShopService.deleteCategory(deleteDialog.id);
      toast.success("Menu category deleted successfully");
      setDeleteDialog({ open: false, id: 0, name: "" });
      loadCategories();
    } catch (e) {
      handleApiError(e, "Failed to delete menu category");
    } finally {
      setDeleting(false);
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    if (!canReorder) return;
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
      await ShopService.reorderMenuCategories(next.map((c) => c.id));
      toast.success("Order updated");
    } catch (e) {
      setCategories(previous);
      handleApiError(e, "Failed to update order");
    } finally {
      setReordering(false);
    }
  };

  const displayName = (cat: MenuCategory) =>
    cat.name || cat.nameEn || cat.nameMm || cat.nameTh || `Category ${cat.id}`;

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="leading-tight">Manage Menu Categories</CardTitle>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8 w-full sm:w-[200px] lg:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="w-full sm:w-[200px]">
                <InfiniteSearchableSelect
                  placeholder="Filter by shop..."
                  fetchData={fetchShopData}
                  valueKey="value"
                  labelKey="label"
                  selectedValue={selectedShopData}
                  onChange={(data) => {
                    setShopId(data?.value || "");
                    setSelectedShopData(data);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <Button variant="outline" className="gap-2 shrink-0" onClick={exportToExcel}>
                <FileSpreadsheet className="h-4 w-4" />
                Export
              </Button>
              <Button onClick={() => navigate("/categories/create")}>
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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {canReorder && <TableHead className="w-10" aria-label="Reorder" />}
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>Image</TableHead>
                        <TableHead>Shop</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {canReorder ? (
                        <SortableContext
                          items={categories.map((c) => c.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {categories.length > 0 ? (
                            categories.map((cat) => (
                              <SortableCatRow key={cat.id} cat={cat}>
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
                                      onClick={() => navigate(`/categories/create?id=${cat.id}`)}
                                    >
                                      {cat.id}
                                    </TableCell>
                                    <TableCell
                                      className="cursor-pointer"
                                      onClick={() => navigate(`/categories/create?id=${cat.id}`)}
                                    >
                                      <TableImage
                                        src={cat.imageUrl || cat.image || cat.icon}
                                        alt={displayName(cat)}
                                        size="sm"
                                      />
                                    </TableCell>
                                    <TableCell
                                      className="cursor-pointer"
                                      onClick={() => navigate(`/categories/create?id=${cat.id}`)}
                                    >
                                      <div className="text-xs font-mono text-muted-foreground mb-1">
                                        ID: {cat.shopId}
                                      </div>
                                      <div className="font-medium text-sm line-clamp-1">
                                        {cat.shopName || "Unknown Shop"}
                                      </div>
                                    </TableCell>
                                    <TableCell
                                      className="cursor-pointer"
                                      onClick={() => navigate(`/categories/create?id=${cat.id}`)}
                                    >
                                      <div className="font-medium">{displayName(cat)}</div>
                                      {(cat.nameMm || cat.nameEn || cat.nameTh) && (
                                        <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                                          {cat.nameMm && <span>{cat.nameMm}</span>}
                                          {cat.nameTh && <span>• {cat.nameTh}</span>}
                                          {cat.nameEn && cat.nameEn !== cat.name && (
                                            <span>• {cat.nameEn}</span>
                                          )}
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell
                                      className="text-muted-foreground cursor-pointer"
                                      onClick={() => navigate(`/categories/create?id=${cat.id}`)}
                                    >
                                      {cat.displayOrder ?? "—"}
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                      <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cat.isActive !== false
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                          }`}
                                      >
                                        {cat.isActive !== false ? "Active" : "Inactive"}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/categories/create?id=${cat.id}`);
                                          }}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                          onClick={(e) =>
                                            handleDeleteClick(e, cat.id, displayName(cat))
                                          }
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </>
                                )}
                              </SortableCatRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={8}
                                className="h-24 text-center text-muted-foreground"
                              >
                                No menu categories found.
                              </TableCell>
                            </TableRow>
                          )}
                        </SortableContext>
                      ) : (
                        <>
                          {categories.length > 0 ? (
                            categories.map((cat) => (
                              <TableRow
                                key={cat.id}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => navigate(`/categories/create?id=${cat.id}`)}
                              >
                                <TableCell className="font-mono text-xs">{cat.id}</TableCell>
                                <TableCell>
                                  <TableImage
                                    src={cat.imageUrl || cat.image || cat.icon}
                                    alt={displayName(cat)}
                                    size="sm"
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="text-xs font-mono text-muted-foreground mb-1">
                                    ID: {cat.shopId}
                                  </div>
                                  <div className="font-medium text-sm line-clamp-1">
                                    {cat.shopName || "Unknown Shop"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">{displayName(cat)}</div>
                                  {(cat.nameMm || cat.nameEn || cat.nameTh) && (
                                    <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                                      {cat.nameMm && <span>{cat.nameMm}</span>}
                                      {cat.nameTh && <span>• {cat.nameTh}</span>}
                                      {cat.nameEn && cat.nameEn !== cat.name && (
                                        <span>• {cat.nameEn}</span>
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {cat.displayOrder ?? "—"}
                                </TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cat.isActive !== false
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                      }`}
                                  >
                                    {cat.isActive !== false ? "Active" : "Inactive"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/categories/create?id=${cat.id}`);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                      onClick={(e) =>
                                        handleDeleteClick(e, cat.id, displayName(cat))
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="h-24 text-center text-muted-foreground"
                              >
                                No menu categories found.
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </DndContext>
              </div>
              {reordering && (
                <p className="text-xs text-muted-foreground mt-2">Saving order…</p>
              )}
              {!shopId && totalItems > 0 && (
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={totalItems}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !deleting && setDeleteDialog((d) => ({ ...d, open }))}
        title="Delete Menu Category?"
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
