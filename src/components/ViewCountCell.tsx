import { Eye } from "lucide-react";

type ViewCountCellProps = {
  count?: number | null;
};

export function ViewCountCell({ count = 0 }: ViewCountCellProps) {
  const value = count ?? 0;

  return (
    <div
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
      title={`${value.toLocaleString()} views`}
    >
      <Eye className="h-4 w-4 shrink-0" />
      <span className="tabular-nums font-medium text-foreground">
        {value.toLocaleString()}
      </span>
    </div>
  );
}
