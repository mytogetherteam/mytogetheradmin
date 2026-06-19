import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { AdminSessionDTO } from "@/services/adminsService";
import { Loader2, LogOut, Users } from "lucide-react";

const COLUMN_COUNT = 5;

interface AdminSessionsTableProps {
  sessions: AdminSessionDTO[];
  loading: boolean;
  rowOffset: number;
  onForceLogout: (admin: AdminSessionDTO) => void;
}

function initials(admin: AdminSessionDTO): string {
  const source = admin.name || admin.username || admin.email || "?";
  const parts = source.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}

export function AdminSessionsTable({
  sessions,
  loading,
  rowOffset,
  onForceLogout,
}: AdminSessionsTableProps) {
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
            <TableHead className="w-[64px]">#</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Shops</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="h-32">
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Users className="h-8 w-8 opacity-50" />
                  <span>No users are currently logged in.</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            sessions.map((admin, index) => (
              <AdminSessionRow
                key={admin.id}
                admin={admin}
                rowNumber={rowOffset + index + 1}
                onForceLogout={onForceLogout}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

interface AdminSessionRowProps {
  admin: AdminSessionDTO;
  rowNumber: number;
  onForceLogout: (admin: AdminSessionDTO) => void;
}

function AdminSessionRow({
  admin,
  rowNumber,
  onForceLogout,
}: AdminSessionRowProps) {
  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell className="font-mono text-xs text-muted-foreground">
        {rowNumber}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {admin.profileUrl && (
              <AvatarImage src={admin.profileUrl} alt={admin.name ?? ""} />
            )}
            <AvatarFallback className="text-xs font-medium">
              {initials(admin)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-medium truncate">
              {admin.name || admin.username || "—"}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {admin.email}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-normal">
          {admin.role?.name}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[280px]">
        {admin.shops.length > 0 ? (
          <span className="text-sm">
            {admin.shops.map((s) => s.shop.nameEn).join(", ")}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => onForceLogout(admin)}
        >
          <LogOut className="h-4 w-4" />
          Force Logout
        </Button>
      </TableCell>
    </TableRow>
  );
}
