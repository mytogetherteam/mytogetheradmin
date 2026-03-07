import { useEffect, useState, useCallback } from "react";
import { moderationService, Report, ReportStatus, ReportType } from "@/services/moderationService";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, CheckCircle, X } from "lucide-react";
import { SortableTableHead, SortConfig, toggleSort, sortData } from "@/components/SortableTableHead";
import { DataTablePagination } from "@/components/DataTablePagination";

import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const STATUS_COLORS: Record<ReportStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    RESOLVED: "bg-green-100 text-green-800",
    DISMISSED: "bg-gray-100 text-gray-600",
};

const TYPE_COLORS: Record<ReportType, string> = {
    POST: "bg-blue-100 text-blue-800",
    COMMENT: "bg-purple-100 text-purple-800",
    USER: "bg-red-100 text-red-800",
    SHOP: "bg-orange-100 text-orange-800",
};

export default function ContentReports() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">("PENDING");
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    // Resolve dialog
    const [resolveReport, setResolveReport] = useState<Report | null>(null);
    const [resolution, setResolution] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const data = await moderationService.getReports(
                statusFilter === "ALL" ? undefined : statusFilter,
                page,
                pageSize
            );
            setReports(data.content);
            setTotalElements(data.totalElements || data.content.length);
            setTotalPages(data.totalPages);
        } catch {
            toast.error("Failed to load reports");
        } finally {
            setLoading(false);
        }
    }, [statusFilter, page, pageSize]);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    const handleResolve = async () => {
        if (!resolveReport) return;
        setActionLoading(true);
        try {
            await moderationService.resolveReport(resolveReport.id, "RESOLVED");
            toast.success("Report resolved");
            setResolveReport(null);
            setResolution("");
            fetchReports();
        } catch {
            toast.error("Failed to resolve report");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDismiss = async (id: string) => {
        try {
            await moderationService.dismissReport(id);
            toast.success("Report dismissed");
            fetchReports();
        } catch {
            toast.error("Failed to dismiss report");
        }
    };

    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key));
    const sortedReports = sortData(reports, sortConfig);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-semibold md:text-2xl">Content Moderation Reports</h1>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <Select
                    value={statusFilter}
                    onValueChange={(v) => { setStatusFilter(v as ReportStatus | "ALL"); setPage(0); }}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Reports</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="DISMISSED">Dismissed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Content Reports</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableTableHead label="Type" sortKey="reportType" sortConfig={sortConfig} onSort={handleSort} />
                                <SortableTableHead label="Reason" sortKey="reason" sortConfig={sortConfig} onSort={handleSort} />
                                <SortableTableHead label="Reporter" sortKey="reporterName" sortConfig={sortConfig} onSort={handleSort} />
                                <SortableTableHead label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
                                <SortableTableHead label="Date" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} />
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(6)].map((_, i) => (
                                    <TableRow key={i}>
                                        {[...Array(6)].map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : sortedReports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        No reports found.
                                    </TableCell>
                                </TableRow>
                            ) : sortedReports.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLORS[r.reportType]}`}>
                                            {r.reportType}
                                        </span>
                                    </TableCell>
                                    <TableCell className="max-w-xs">
                                        <p className="text-sm truncate">{r.reason}</p>
                                        {r.targetContent && (
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">"{r.targetContent}"</p>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm">{r.reporterName}</TableCell>
                                    <TableCell>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>
                                            {r.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(r.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {r.status === 'PENDING' && (
                                            <TooltipProvider>
                                                <div className="flex gap-1">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="sm" variant="outline"
                                                                className="text-green-600 border-green-200 hover:bg-green-50"
                                                                onClick={() => setResolveReport(r)}
                                                            >
                                                                <CheckCircle className="h-3 w-3 mr-1" /> Resolve
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Mark report as resolved</TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="sm" variant="ghost"
                                                                className="text-gray-500"
                                                                onClick={() => handleDismiss(r.id)}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Dismiss false report</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </TooltipProvider>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <DataTablePagination
                currentPage={page + 1}
                totalPages={totalPages}
                totalItems={totalElements}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p - 1)}
                onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
            />

            {/* Resolve Dialog */}
            <Dialog open={!!resolveReport} onOpenChange={() => setResolveReport(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Resolve Report</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Reason reported: <strong>{resolveReport?.reason}</strong>
                        </p>
                        <Textarea
                            placeholder="Describe the resolution action taken (e.g., 'Post removed and user warned')..."
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResolveReport(null)}>Cancel</Button>
                        <Button onClick={handleResolve} disabled={!resolution.trim() || actionLoading}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Resolve Report
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
