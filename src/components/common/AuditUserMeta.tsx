import { format } from "date-fns";
import { User } from "lucide-react";
import { AdminAuditUser, adminAuditUserLabel } from "@/lib/audit-user";

type AuditUserMetaProps = {
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: AdminAuditUser | null;
  updatedBy?: AdminAuditUser | null;
  className?: string;
};

function formatAuditDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "MMM d, yyyy HH:mm");
}

export function AuditUserMeta({
  createdAt,
  updatedAt,
  createdBy,
  updatedBy,
  className = "",
}: AuditUserMetaProps) {
  if (!createdAt && !updatedAt && !createdBy && !updatedBy) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm ${className}`}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <User className="h-3.5 w-3.5" />
        Record information
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        <div className="flex justify-between gap-4 sm:block">
          <dt className="text-muted-foreground">Created by</dt>
          <dd className="font-medium">{adminAuditUserLabel(createdBy)}</dd>
        </div>
        <div className="flex justify-between gap-4 sm:block">
          <dt className="text-muted-foreground">Created at</dt>
          <dd>{formatAuditDate(createdAt)}</dd>
        </div>
        <div className="flex justify-between gap-4 sm:block">
          <dt className="text-muted-foreground">Updated by</dt>
          <dd className="font-medium">{adminAuditUserLabel(updatedBy)}</dd>
        </div>
        <div className="flex justify-between gap-4 sm:block">
          <dt className="text-muted-foreground">Updated at</dt>
          <dd>{formatAuditDate(updatedAt)}</dd>
        </div>
      </dl>
    </div>
  );
}
