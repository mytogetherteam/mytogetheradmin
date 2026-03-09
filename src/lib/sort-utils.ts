export interface SortConfig {
    key: string;
    direction: "asc" | "desc";
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
export function sortData<T>(data: T[], sortConfig: SortConfig | null): T[] {
    if (!sortConfig) return data;
    const { key, direction } = sortConfig;
    return [...data].sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[key];
        const bVal = (b as Record<string, unknown>)[key];
        
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;
        
        const aComp = typeof aVal === "string" ? aVal.toLowerCase() : aVal;
        const bComp = typeof bVal === "string" ? bVal.toLowerCase() : bVal;
        
        if (aComp < bComp) return direction === "asc" ? -1 : 1;
        if (aComp > bComp) return direction === "asc" ? 1 : -1;
        return 0;
    });
}
