import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/use-debounce";
import {
  AdminsService,
  PlatformAdminDTO,
  PlatformAdminRole,
} from "@/services/adminsService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";

const ROLE_LABEL: Record<PlatformAdminRole, string> = {
  SuperAdmin: "Super Admin",
  OperationAdmin: "Operation Admin",
};

export default function ManageAdmins() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<PlatformAdminDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [roleFilter, setRoleFilter] = useState<"all" | PlatformAdminRole>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const data = await AdminsService.getAdminsPaginated({
        page,
        size: 10,
        search: debouncedSearch,
        role: roleFilter === "all" ? undefined : roleFilter,
      });
      setAdmins(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      handleApiError(error, "Failed to load platform admins");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await AdminsService.deleteAdmin(deleteId);
      toast.success("Admin deleted successfully");
      fetchAdmins();
    } catch (error) {
      handleApiError(error, "Failed to delete admin");
    } finally {
      setDeleteId(null);
    }
  };

  const handleToggleStatus = async (admin: PlatformAdminDTO, next: boolean) => {
    setStatusUpdatingId(admin.id);
    try {
      await AdminsService.changeStatus(admin.id, next);
      toast.success(
        next ? "Admin activated successfully" : "Admin deactivated successfully",
      );
      fetchAdmins();
    } catch (error) {
      handleApiError(error, "Failed to update admin status");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Management</h1>
          <p className="text-muted-foreground">
            Manage Super Admin and Operation Admin accounts for the platform panel.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/admins/create">
            <Plus className="h-4 w-4" />
            Add Platform Admin
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Platform Admins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, username..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value as "all" | PlatformAdminRole);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="SuperAdmin">Super Admin</SelectItem>
                <SelectItem value="OperationAdmin">Operation Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(6)].map((__, j) => (
                        <TableCell key={j}>
                          <div className="h-4 w-full max-w-[120px] bg-muted animate-pulse rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : admins.length > 0 ? (
                  admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.name || "—"}
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{admin.username || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ROLE_LABEL[admin.role.name]}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={admin.isActive}
                            disabled={statusUpdatingId === admin.id}
                            onCheckedChange={(checked) =>
                              handleToggleStatus(admin, checked)
                            }
                          />
                          <Badge
                            variant={admin.isActive ? "default" : "secondary"}
                            className={
                              admin.isActive
                                ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                                : ""
                            }
                          >
                            {admin.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit"
                            onClick={() => navigate(`/admins/edit/${admin.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {admin.role.name === "OperationAdmin" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(admin.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No platform admins found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="text-sm font-medium">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete admin?"
        description="This will deactivate and soft-delete the Operation Admin account. They will no longer be able to sign in."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
