import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface DataTablePaginationProps {
    currentPage: number;          // 1-indexed
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
}

export function DataTablePagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100, 200],
}: DataTablePaginationProps) {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    // Generate page numbers to show (max 5 around current)
    const getPageNumbers = () => {
        const pages: number[] = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        const end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="flex flex-col items-center gap-4 py-4 md:flex-row md:justify-between px-2">
            <div className="text-sm text-muted-foreground">
                Showing {totalItems ? startIndex + 1 : 0} to {endIndex} of {totalItems} entries
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline" className="h-8 w-8 p-0"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline" className="h-8 w-8 p-0"
                    onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                    {getPageNumbers().map((pageNum) => (
                        <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            className="h-8 w-8 p-0"
                            onClick={() => onPageChange(pageNum)}
                        >
                            {pageNum}
                        </Button>
                    ))}
                </div>
                <Button
                    variant="outline" className="h-8 w-8 p-0"
                    onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline" className="h-8 w-8 p-0"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex items-center space-x-2">
                <Select value={`${pageSize}`} onValueChange={(v) => onPageSizeChange(Number(v))}>
                    <SelectTrigger className="h-8 w-[70px]"><SelectValue /></SelectTrigger>
                    <SelectContent side="top">
                        {pageSizeOptions.map((s) => (
                            <SelectItem key={s} value={`${s}`}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
