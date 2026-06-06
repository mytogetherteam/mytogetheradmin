import { useState, useEffect } from "react";
import { useNewsList } from "@/hooks/news/useNews";
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
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Heart,
  MessageSquare,
} from "lucide-react";
import { DataTablePagination } from "@/components/DataTablePagination";
import { TableImage } from "@/components/TableImage";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import { NewsService } from "@/services/newsService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";

export default function ManageNews() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: number;
    name: string;
  }>({ open: false, id: 0, name: "" });
  const [deleting, setDeleting] = useState(false);

  const {
    data,
    isPending: loading,
    refetch,
  } = useNewsList({ page: currentPage, size: pageSize });

  const news = data?.content || [];
  const totalItems = data?.totalElements ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  useEffect(() => {
    if (!loading && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [loading, currentPage, totalPages]);

  const handleDeleteClick = (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    setDeleteDialog({ open: true, id, name });
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await NewsService.deleteNews(deleteDialog.id);
      toast.success("News deleted successfully");
      setDeleteDialog({ open: false, id: 0, name: "" });
      void refetch();
    } catch (e) {
      handleApiError(e, "Failed to delete news");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="leading-tight">Manage News</CardTitle>
              <CardDescription className="line-clamp-2 md:line-clamp-none">
                Create and manage news articles shown to app users.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button onClick={() => navigate("/news/create")}>
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
                      <TableHead>Photo</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {news.length > 0 ? (
                      news.map((item) => (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigate(`/news/create?id=${item.id}`)}
                        >
                          <TableCell className="font-mono text-xs">
                            {item.id}
                          </TableCell>
                          <TableCell>
                            <TableImage
                              src={item.photos?.[0]?.url}
                              alt={item.title}
                              size="sm"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{item.title}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Heart className="h-3.5 w-3.5" />
                                {item.likeCount ?? 0}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <MessageSquare className="h-3.5 w-3.5" />
                                {item.commentCount ?? 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                item.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {item.isActive ? "Published" : "Hidden"}
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
                                        navigate(`/news/create?id=${item.id}`);
                                      }}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit News</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-destructive"
                                      onClick={(e) =>
                                        handleDeleteClick(e, item.id, item.title)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete News</TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No news found.
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
        title="Delete News?"
        description={`This will permanently delete "${deleteDialog.name}". This action cannot be undone.`}
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
