import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCollections,
  useDeleteCollectionMutation,
} from "@/hooks/collections/useCollection";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search, Trash2, Pencil, LayoutGrid } from "lucide-react";
import { DataTablePagination } from "@/components/DataTablePagination";
import ConfirmDialog from "@/components/common/ConfirmDialog";

export default function ManageCollections() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const isFirstSearchDebounce = useRef(true);

  useEffect(() => {
    const delayMs = isFirstSearchDebounce.current ? 0 : 500;
    isFirstSearchDebounce.current = false;
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), delayMs);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: number;
    name: string;
  }>({ open: false, id: 0, name: "" });

  const { data, isPending: loading } = useCollections({
    page: currentPage,
    size: pageSize,
    search: debouncedSearch.trim() || undefined,
  });
  const { mutateAsync: deleteCollection, isPending: deleting } =
    useDeleteCollectionMutation();

  const collections = data?.content || [];
  const totalItems = data?.totalElements ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  // Adjust during render (not in an effect) when the current page falls out of
  // range — e.g. after deleting the last row on the last page.
  if (!loading && currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  const handleDeleteConfirm = async () => {
    await deleteCollection(deleteDialog.id);
    setDeleteDialog({ open: false, id: 0, name: "" });
  };

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="leading-tight">Manage Collections</CardTitle>
              <CardDescription className="line-clamp-2 md:line-clamp-none">
                Curated groups of menu items shown to customers. Only active
                collections are visible in the app.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search collections..."
                  className="pl-8 w-full sm:w-[200px] lg:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <Button onClick={() => navigate("/collections/create")}>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-[120px]">Items</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collections.length > 0 ? (
                      collections.map((collection) => (
                        <TableRow
                          key={collection.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() =>
                            navigate(`/collections/create?id=${collection.id}`)
                          }
                        >
                          <TableCell className="font-mono text-xs">
                            {collection.id}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{collection.name}</div>
                            {collection.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                                {collection.description}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                              <LayoutGrid className="h-3.5 w-3.5" />
                              {collection.itemCount}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                collection.status === "ACTIVE"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {collection.status === "ACTIVE"
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
                                          `/collections/create?id=${collection.id}`,
                                        );
                                      }}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit Collection</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteDialog({
                                          open: true,
                                          id: collection.id,
                                          name: collection.name,
                                        });
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Delete Collection
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No collections found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !deleting && setDeleteDialog((d) => ({ ...d, open }))
        }
        title="Delete Collection?"
        description={`This will permanently delete "${deleteDialog.name}". The menu items themselves are not affected. This action cannot be undone.`}
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
