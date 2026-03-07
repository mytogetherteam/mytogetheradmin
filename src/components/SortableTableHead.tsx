import { TableHead } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface SortConfig {
    key: string;
    direction: "asc" | "desc";
}

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

/**
 * Generic sort toggle helper.
 * Returns a new SortConfig — asc on first click, desc on second, asc on third…
 */
export function toggleSort(currentSort: SortConfig | null, key: string): SortConfig {
    if (currentSort?.key === key && currentSort.direction === "asc") {
        return { key, direction: "desc" };
    }
    return { key, direction: "asc" };
}

/**
 * Client-side sort utility.
 * Sorts an array of objects by the given SortConfig.
 */
export function sortData<T extends Record<string, any>>(data: T[], sortConfig: SortConfig | null): T[] {
    if (!sortConfig) return data;
    const { key, direction } = sortConfig;
    return [...data].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;
        const aComp = typeof aVal === "string" ? aVal.toLowerCase() : aVal;
        const bComp = typeof bVal === "string" ? bVal.toLowerCase() : bVal;
        if (aComp < bComp) return direction === "asc" ? -1 : 1;
        if (aComp > bComp) return direction === "asc" ? 1 : -1;
        return 0;
    });
}
