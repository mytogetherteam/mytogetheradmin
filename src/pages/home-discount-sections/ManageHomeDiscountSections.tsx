import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useDebounce } from '@/hooks/use-debounce';
import {
  HomeDiscountSectionDTO,
  HomeDiscountSectionService,
} from '@/services/homeDiscountSectionService';

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function resolveStatus(section: HomeDiscountSectionDTO): 'active' | 'scheduled' | 'expired' {
  if (section.status) return section.status;
  return section.isCurrentlyActive ? 'active' : 'expired';
}

function statusBadge(status: 'active' | 'scheduled' | 'expired') {
  switch (status) {
    case 'active':
      return <Badge>Active</Badge>;
    case 'scheduled':
      return <Badge variant="secondary">Scheduled</Badge>;
    case 'expired':
      return <Badge variant="outline">Expired</Badge>;
  }
}

export default function ManageHomeDiscountSections() {
  const navigate = useNavigate();
  const [sections, setSections] = useState<HomeDiscountSectionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debouncedSearch = useDebounce(search, 500);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const data = await HomeDiscountSectionService.getSections({
        page,
        size: 20,
        search: debouncedSearch || undefined,
      });
      setSections(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      handleApiError(error, 'Failed to load home discount sections');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await HomeDiscountSectionService.deleteSection(deletingId);
      toast.success('Home discount section deleted');
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchSections();
    } catch (error) {
      handleApiError(error, 'Failed to delete home discount section');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Home Discount Sections</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Create multiple sections with different schedules. Overlapping time windows are not
                allowed — only one section can run at the same time.
              </p>
            </div>
            <Button asChild>
              <Link to="/home-discount-sections/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Section
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-sm mb-6">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Discount %</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : sections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No home discount sections found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sections.map((section) => (
                    <TableRow
                      key={section.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        navigate(`/home-discount-sections/create?id=${section.id}`)
                      }
                    >
                      <TableCell>{section.title || 'MyTogether {} Off (default)'}</TableCell>
                      <TableCell>{section.discountPercent}%</TableCell>
                      <TableCell>{formatDateTime(section.startTime)}</TableCell>
                      <TableCell>{formatDateTime(section.endTime)}</TableCell>
                      <TableCell>{statusBadge(resolveStatus(section))}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/home-discount-sections/create?id=${section.id}`);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(section.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete home discount section?"
        description="This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  );
}
