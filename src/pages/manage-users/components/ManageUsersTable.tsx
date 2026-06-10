import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { SortableTableHead } from "@/components/SortableTableHead";
import type { SortConfig } from "@/lib/sort-utils";
import type { ManageUser } from "@/schemas/manage-user.schema";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { getUserDisplayName } from "../manageUsersHelpers";

const COLUMN_COUNT = 8;

interface ManageUsersTableProps {
  users: ManageUser[];
  loading: boolean;
  sortConfig: SortConfig | null;
  rowOffset: number;
  onSort: (key: string) => void;
  isCurrentAdmin: (user: ManageUser) => boolean;
  onEdit: (user: ManageUser) => void;
  onDelete: (user: ManageUser) => void;
}

export function ManageUsersTable({
  users,
  loading,
  sortConfig,
  rowOffset,
  onSort,
  isCurrentAdmin,
  onEdit,
  onDelete,
}: ManageUsersTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
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
              onSort={onSort}
            />
            <SortableTableHead
              label="Email"
              sortKey="email"
              sortConfig={sortConfig}
              onSort={onSort}
            />
            <SortableTableHead
              label="Phone"
              sortKey="phone"
              sortConfig={sortConfig}
              onSort={onSort}
            />
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COLUMN_COUNT}
                className="h-24 text-center text-muted-foreground"
              >
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user, index) => (
              <ManageUserRow
                key={`${user.accountType}-${user.id}`}
                user={user}
                rowNumber={rowOffset + index + 1}
                canDelete={!isCurrentAdmin(user)}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

interface ManageUserRowProps {
  user: ManageUser;
  rowNumber: number;
  canDelete: boolean;
  onEdit: (user: ManageUser) => void;
  onDelete: (user: ManageUser) => void;
}

function ManageUserRow({
  user,
  rowNumber,
  canDelete,
  onEdit,
  onDelete,
}: ManageUserRowProps) {
  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell className="font-mono text-xs">{rowNumber}</TableCell>
      <TableCell>
        <Badge variant="secondary" className="capitalize">
          {user.accountType}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="font-medium">{getUserDisplayName(user)}</div>
        {user.username && (
          <div className="text-xs text-muted-foreground">@{user.username}</div>
        )}
      </TableCell>
      <TableCell className="text-sm">{user.email}</TableCell>
      <TableCell className="text-sm">
        {user.phone || <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-normal">
          {user.role}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={user.status === "Active" ? "default" : "secondary"}>
          {user.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <UserRowActions
          user={user}
          canDelete={canDelete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}

interface UserRowActionsProps {
  user: ManageUser;
  canDelete: boolean;
  onEdit: (user: ManageUser) => void;
  onDelete: (user: ManageUser) => void;
}

function UserRowActions({
  user,
  canDelete,
  onEdit,
  onDelete,
}: UserRowActionsProps) {
  return (
    <TooltipProvider>
      <div className="flex justify-end gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onEdit(user)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit User</TooltipContent>
        </Tooltip>
        {canDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive"
                onClick={() => onDelete(user)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Deactivate user (soft delete)</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
