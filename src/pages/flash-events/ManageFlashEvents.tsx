import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  useFlashEvents,
  useDeleteFlashEventMutation,
} from "@/hooks/flash-events/useFlashEvent";
import type { FlashStatus, FlashType } from "@/services/flashEventService";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search, Trash2, Pencil, LayoutGrid } from "lucide-react";
import { DataTablePagination } from "@/components/DataTablePagination";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const TYPE_FILTERS = ["ALL", "DROP", "DEAL"] as const;
const STATUS_FILTERS = ["ALL", "ACTIVE", "INACTIVE"] as const;

function formatDateTime(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

/** Live / upcoming / ended relative to the current time. */
function phaseOf(startTime: string, endTime: string) {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (now < start) return { label: "Upcoming", cls: "bg-blue-100 text-blue-800" };
  if (now > end) return { label: "Ended", cls: "bg-gray-100 text-gray-600" };
  return { label: "Live", cls: "bg-green-100 text-green-800" };
}

export default function ManageFlashEvents() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]>(
    "ALL",
  );
  const [statusFilter, setStatusFilter] = useState<
    (typeof STATUS_FILTERS)[number]
  >("ALL");
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

  const { data, isPending: loading } = useFlashEvents({
    page: currentPage,
    size: pageSize,
    search: debouncedSearch.trim() || undefined,
    type: typeFilter === "ALL" ? undefined : (typeFilter as FlashType),
    status: statusFilter === "ALL" ? undefined : (statusFilter as FlashStatus),
  });
  const { mutateAsync: deleteFlashEvent, isPending: deleting } =
    useDeleteFlashEventMutation();

  const flashEvents = data?.content || [];
  const totalItems = data?.totalElements ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  if (!loading && currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  const handleDeleteConfirm = async () => {
    await deleteFlashEvent(deleteDialog.id);
    setDeleteDialog({ open: false, id: 0, name: "" });
  };

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="leading-tight">Manage Flash Events</CardTitle>
              <CardDescription className="line-clamp-2 md:line-clamp-none">
                Time-scheduled flash drops &amp; deals. Drops are hidden until
                they launch; deals show as a teaser beforehand. Both are
                orderable once they go live.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search flash events..."
                  className="pl-8 w-full sm:w-[200px] lg:w-[260px]"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <Select
                value={typeFilter}
                onValueChange={(v) => {
                  setTypeFilter(v as (typeof TYPE_FILTERS)[number]);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  <SelectItem value="DROP">Drop</SelectItem>
                  <SelectItem value="DEAL">Deal</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as (typeof STATUS_FILTERS)[number]);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => navigate("/flash-events/create")}>
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
                      <TableHead className="w-[70px]">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-[90px]">Type</TableHead>
                      <TableHead className="w-[200px]">Window</TableHead>
                      <TableHead className="w-[90px]">Items</TableHead>
                      <TableHead className="w-[110px]">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flashEvents.length > 0 ? (
                      flashEvents.map((flash) => {
                        const phase = phaseOf(flash.startTime, flash.endTime);
                        return (
                          <TableRow
                            key={flash.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() =>
                              navigate(`/flash-events/create?id=${flash.id}`)
                            }
                          >
                            <TableCell className="font-mono text-xs">
                              {flash.id}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{flash.name}</div>
                              {flash.description && (
                                <div className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                                  {flash.description}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  flash.type === "DROP"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {flash.type === "DROP" ? "Drop" : "Deal"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDateTime(flash.startTime)} →{" "}
                                {formatDateTime(flash.endTime)}
                              </div>
                              <span
                                className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${phase.cls}`}
                              >
                                {phase.label}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                <LayoutGrid className="h-3.5 w-3.5" />
                                {flash.itemCount}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  flash.status === "ACTIVE"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {flash.status === "ACTIVE"
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
                                            `/flash-events/create?id=${flash.id}`,
                                          );
                                        }}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Edit Flash Event
                                    </TooltipContent>
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
                                            id: flash.id,
                                            name: flash.name,
                                          });
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Delete Flash Event
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TooltipProvider>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No flash events found.
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
        title="Delete Flash Event?"
        description={`This will remove "${deleteDialog.name}" from the app. The menu items themselves are not affected.`}
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
