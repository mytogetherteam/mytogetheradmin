import { useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { DataTablePagination } from "@/components/DataTablePagination";
import { SortableTableHead } from "@/components/SortableTableHead";
import { SortConfig, sortData, toggleSort } from "@/lib/sort-utils";
import { useDeleteManageUserMutation, useManageUsers } from "@/hooks/manage-users/useManageUsers";
import type { ManageUser, ManageUserAccountType } from "@/schemas/manage-user.schema";
import { authService } from "@/services/authService";
import { FileSpreadsheet, Loader2, Pencil, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

type AccountFilter = ManageUserAccountType | "all";

function getDisplayName(user: ManageUser) {
  return user.name || user.username || `User ${user.id}`;
}

export default function ManageUsers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const isFirstSearchDebounce = useRef(true);
  const [accountType, setAccountType] = useState<AccountFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: ManageUser | null;
  }>({ open: false, user: null });
  const currentAdmin = authService.getUserData();

  useEffect(() => {
    const delayMs = isFirstSearchDebounce.current ? 0 : 500;
    isFirstSearchDebounce.current = false;
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), delayMs);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isPending: loading } = useManageUsers({
    page: currentPage,
    size: pageSize,
    search: debouncedSearch.trim() || undefined,
    accountType: accountType === "all" ? undefined : accountType,
  });

  const { mutateAsync: deleteUser, isPending: deleting } =
    useDeleteManageUserMutation();

  const users = data?.content || [];
  const totalItems = data?.totalElements ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  useEffect(() => {
    if (!loading && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, loading, totalPages]);

  const handleSort = (key: string) => {
    setSortConfig(toggleSort(sortConfig, key));
  };

  const sortedUsers = sortData(users, sortConfig);

  const exportToExcel = () => {
    const rows = sortedUsers.map((user, index) => ({
      ID: (currentPage - 1) * pageSize + index + 1,
      Type: user.accountType,
      Name: getDisplayName(user),
      Email: user.email,
      Username: user.username || "",
      Role: user.role,
      Status: user.status,
      "Created At": user.createdAt,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Manage Users");
    XLSX.writeFile(wb, "ManageUsers.xlsx");
  };

  const handleEditClick = (e: React.MouseEvent, user: ManageUser) => {
    e.stopPropagation();
    navigate(`/users/edit/${user.accountType}/${user.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, user: ManageUser) => {
    e.stopPropagation();
    if (user.accountType === "admin" && user.id === currentAdmin?.id) return;
    setDeleteDialog({ open: true, user });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.user) return;
    if (
      deleteDialog.user.accountType === "admin" &&
      deleteDialog.user.id === currentAdmin?.id
    ) {
      setDeleteDialog({ open: false, user: null });
      return;
    }

    await deleteUser({
      accountType: deleteDialog.user.accountType,
      id: deleteDialog.user.id,
    });
    setDeleteDialog({ open: false, user: null });
  };

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="leading-tight">Manage Users</CardTitle>
              <CardDescription className="line-clamp-2 md:line-clamp-none">
                Manage platform admins and customer accounts in one place.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Select
                value={accountType}
                onValueChange={(value: AccountFilter) => {
                  setAccountType(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-8 w-full sm:w-[200px] lg:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <Button
                variant="outline"
                className="gap-2 shrink-0"
                onClick={exportToExcel}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export
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
                      <TableHead>Type</TableHead>
                      <SortableTableHead
                        label="Name"
                        sortKey="name"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                      <SortableTableHead
                        label="Email"
                        sortKey="email"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.length > 0 ? (
                      sortedUsers.map((user, index) => {
                        const isCurrentAdmin =
                          user.accountType === "admin" &&
                          user.id === currentAdmin?.id;
                        const rowNumber = (currentPage - 1) * pageSize + index + 1;

                        return (
                          <TableRow
                            key={`${user.accountType}-${user.id}`}
                            className="hover:bg-muted/50 transition-colors"
                          >
                            <TableCell className="font-mono text-xs">
                              {rowNumber}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">
                                {user.accountType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {getDisplayName(user)}
                              </div>
                              {user.username && (
                                <div className="text-xs text-muted-foreground">
                                  @{user.username}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal">
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  user.status === "Active"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {user.status}
                              </Badge>
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
                                        onClick={(e) => handleEditClick(e, user)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit User</TooltipContent>
                                  </Tooltip>
                                  {!isCurrentAdmin && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 text-destructive"
                                          onClick={(e) =>
                                            handleDeleteClick(e, user)
                                          }
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Delete User</TooltipContent>
                                    </Tooltip>
                                  )}
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
                          No users found.
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
          setDeleteDialog((dialog) => ({ ...dialog, open }))
        }
        title="Delete User?"
        description={`This will permanently delete ${
          deleteDialog.user ? getDisplayName(deleteDialog.user) : "this user"
        }. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={deleting}
        onCancel={() => setDeleteDialog({ open: false, user: null })}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
