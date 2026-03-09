import { TableHead } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

import { SortConfig } from "@/lib/sort-utils";

interface SortableTableHeadProps {
    label: string;
    sortKey: string;
    sortConfig: SortConfig | null;
    onSort: (key: string) => void;
    className?: string;
}

export function SortableTableHead({ label, sortKey, sortConfig, onSort, className }: SortableTableHeadProps) {
    const isActive = sortConfig?.key === sortKey;
    return (
        <TableHead
            className={`cursor-pointer select-none hover:bg-muted/50 ${className ?? ""}`}
            onClick={() => onSort(sortKey)}
        >
            <div className="flex items-center gap-1">
                {label}
                {isActive ? (
                    sortConfig.direction === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                    ) : (
                        <ArrowDown className="h-3 w-3" />
                    )
                ) : (
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                )}
            </div>
        </TableHead>
    );
}

export { type SortConfig };
