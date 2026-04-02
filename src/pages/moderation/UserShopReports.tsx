import { useEffect, useState, useCallback } from "react";
import { moderationService, UserShopReport } from "@/services/moderationService";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, Pencil } from "lucide-react";

import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DataTablePagination } from "@/components/DataTablePagination";
import { SortableTableHead } from "@/components/SortableTableHead";
import { SortConfig, toggleSort, sortData } from "@/lib/sort-utils";

type UserShopReportStatus = "OPEN" | "PENDING" | "REVIEWED" | "ACTION_TAKEN" | "DISMISSED" | "RESOLVED";

const STATUS_COLORS: Record<string, string> = {
    OPEN: "bg-yellow-100 text-yellow-800",
    PENDING: "bg-orange-100 text-orange-800",
    REVIEWED: "bg-blue-100 text-blue-800",
    ACTION_TAKEN: "bg-indigo-100 text-indigo-800",
    RESOLVED: "bg-green-100 text-green-800",
    DISMISSED: "bg-gray-100 text-gray-600",
};

export default function UserShopReports() {
    const [reports, setReports] = useState<UserShopReport[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalElements, setTotalElements] = useState(0);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    // Update Status dialog
    const [editReport, setEditReport] = useState<UserShopReport | null>(null);
    const [viewReport, setViewReport] = useState<UserShopReport | null>(null);
    const [newStatus, setNewStatus] = useState<UserShopReportStatus>("OPEN");
    const [resolutionNotes, setResolutionNotes] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const filterStatus = statusFilter === "ALL" ? undefined : statusFilter as UserShopReportStatus;
            const data = await moderationService.getUserShopReports(
                filterStatus,
                currentPage - 1,
                pageSize,
            );
            setReports(data.content);
            setTotalElements(data.totalElements ?? data.content.length);
        } catch (e) {
            handleApiError(e, "Failed to load reports");
        } finally {
            setLoading(false);
        }
    }, [statusFilter, currentPage, pageSize]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchReports(); }, [statusFilter, currentPage, pageSize]);

    const openUpdateDialog = (report: UserShopReport) => {
        setEditReport(report);
        setNewStatus(report.status === "PENDING" ? "OPEN" : (report.status as UserShopReportStatus));
        setResolutionNotes(report.resolutionNotes || "");
    };

    const handleUpdateStatus = async () => {
        if (!editReport) return;
        if (newStatus === "RESOLVED" && !resolutionNotes.trim()) {
            toast.error("Please add resolution notes before resolving.");
            return;
        }
        setActionLoading(true);
        try {
            await moderationService.updateUserShopReportStatus(editReport.id, newStatus, resolutionNotes.trim() || undefined);
            toast.success(`Report status updated to ${newStatus}`);
            setEditReport(null);
            setResolutionNotes("");
            fetchReports();
        } catch (e) {
            handleApiError(e, "Failed to update report status");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key));
    const sortedReports = sortData(reports, sortConfig);
    const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-semibold md:text-2xl">User & Shop Reports</h1>
            </div>

            {/* Filter Tabs */}
            <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <TabsList>
                    <TabsTrigger value="ALL">All</TabsTrigger>
                    <TabsTrigger value="OPEN">Open</TabsTrigger>
                    <TabsTrigger value="PENDING">Pending</TabsTrigger>
                    <TabsTrigger value="REVIEWED">Reviewed</TabsTrigger>
                    <TabsTrigger value="ACTION_TAKEN">Action Taken</TabsTrigger>
                    <TabsTrigger value="DISMISSED">Dismissed</TabsTrigger>
                    <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
                </TabsList>
            </Tabs>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Reports</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="rounded-md border-t overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableTableHead label="ID" sortKey="id" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Reporter" sortKey="reporterUserName" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Shop" sortKey="reportedShopName" sortConfig={sortConfig} onSort={handleSort} />
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Description</TableHead>
                                    <SortableTableHead label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
                                    <TableHead>Resolution Notes</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(6)].map((_, i) => (
                                        <TableRow key={i}>
                                            {[...Array(8)].map((__, j) => (
                                                <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : sortedReports.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                            No reports found.
                                        </TableCell>
                                    </TableRow>
                                ) : sortedReports.map((r) => (
                                    <TableRow 
                                        key={r.id} 
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => setViewReport(r)}
                                    >
                                        <TableCell className="text-xs font-mono text-muted-foreground">
                                            {String(r.id).slice(-8)}
                                        </TableCell>
                                        <TableCell className="text-sm">{r.reporterUserName || "—"}</TableCell>
                                        <TableCell className="text-sm">{r.reportedShopName || "—"}</TableCell>
                                        <TableCell className="text-sm max-w-[150px]">
                                            <p className="truncate">{r.subject}</p>
                                        </TableCell>
                                        <TableCell className="max-w-[200px]">
                                            <p className="text-sm truncate">{r.description}</p>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[r.status] ?? STATUS_COLORS['OPEN']}`}>
                                                {r.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground max-w-[150px]">
                                            <p className="truncate">{r.resolutionNotes || "—"}</p>
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            {r.status !== 'RESOLVED' && (
                                                <Button
                                                    size="sm" variant="outline"
                                                    onClick={() => openUpdateDialog(r)}
                                                >
                                                    <Pencil className="h-3 w-3 mr-1" /> Update
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalElements}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />

            {/* View Report Details Dialog */}
            <Dialog open={!!viewReport} onOpenChange={() => setViewReport(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Report Details</DialogTitle>
                        <DialogDescription>View full information about this user/shop report.</DialogDescription>
                    </DialogHeader>
                    {viewReport && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase">Report ID</Label>
                                    <p className="font-mono text-sm">#{viewReport.id}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase">Status</Label>
                                    <p>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[viewReport.status]}`}>
                                            {viewReport.status}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase">Reporter</Label>
                                    <p className="text-sm">{viewReport.reporterUserName || `User ID: ${viewReport.reporterUserId}`}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase">Reported Shop</Label>
                                    <p className="text-sm">{viewReport.reportedShopName || `Shop ID: ${viewReport.reportedShopId}`}</p>
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-muted-foreground text-xs uppercase">Subject</Label>
                                    <p className="text-sm font-medium">{viewReport.subject}</p>
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-muted-foreground text-xs uppercase">Description</Label>
                                    <p className="text-sm whitespace-pre-wrap">{viewReport.description}</p>
                                </div>
                                {viewReport.reportedUserId !== undefined && viewReport.reportedUserId > 0 && (
                                    <div>
                                        <Label className="text-muted-foreground text-xs uppercase">Reported User</Label>
                                        <p className="text-sm">{viewReport.reportedUserName || `User ID: ${viewReport.reportedUserId}`}</p>
                                    </div>
                                )}
                                {viewReport.orderId !== undefined && viewReport.orderId > 0 && (
                                    <div>
                                        <Label className="text-muted-foreground text-xs uppercase">Order ID</Label>
                                        <p className="text-sm font-mono">#{viewReport.orderId}</p>
                                    </div>
                                )}
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase">Created At</Label>
                                    <p className="text-sm">{new Date(viewReport.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase">Updated At</Label>
                                    <p className="text-sm">{new Date(viewReport.updatedAt).toLocaleString()}</p>
                                </div>
                                {viewReport.resolutionNotes && (
                                    <div className="col-span-2">
                                        <Label className="text-muted-foreground text-xs uppercase">Resolution Notes</Label>
                                        <p className="text-sm whitespace-pre-wrap">{viewReport.resolutionNotes}</p>
                                    </div>
                                )}
                            </div>
                            {viewReport.status !== 'RESOLVED' && (
                                <div className="flex justify-end pt-4 border-t">
                                    <Button onClick={() => { setViewReport(null); openUpdateDialog(viewReport); }}>
                                        <Pencil className="h-4 w-4 mr-2" /> Update Status
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Update Status Dialog */}
            <Dialog open={!!editReport} onOpenChange={() => setEditReport(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Report Status</DialogTitle>
                        <DialogDescription>Change the status and add resolution notes for this report.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Report subject: <strong>{editReport?.subject}</strong>
                        </p>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={newStatus}
                                onValueChange={(v) => setNewStatus(v as UserShopReportStatus)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OPEN">OPEN</SelectItem>
                                    <SelectItem value="PENDING">PENDING</SelectItem>
                                    <SelectItem value="REVIEWED">REVIEWED</SelectItem>
                                    <SelectItem value="DISMISSED">DISMISSED</SelectItem>
                                    <SelectItem value="ACTION_TAKEN">ACTION_TAKEN</SelectItem>
                                    <SelectItem value="RESOLVED">RESOLVED</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Resolution Notes
                            </Label>
                            <Textarea
                                placeholder="Describe the investigation or resolution action taken..."
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditReport(null)}>Cancel</Button>
                        <Button
                            onClick={handleUpdateStatus}
                            disabled={actionLoading || (newStatus === "RESOLVED" && !resolutionNotes.trim())}
                        >
                            Update Status
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
