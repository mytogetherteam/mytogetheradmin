import { useEffect, useState, useCallback } from "react";
import { systemService, AuditLog } from "@/services/systemService";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShieldAlert, User, Clock, FileText, Eye } from "lucide-react";
import { DataTablePagination } from "@/components/DataTablePagination";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function AuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [search, setSearch] = useState("");

    // Detail view
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await systemService.getAuditLogs(currentPage - 1, pageSize, search);
            setLogs(data.content);
            setTotalPages(data.totalPages);
        } catch {
            toast.error("Failed to load audit logs");
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, search]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchLogs(); }, [currentPage, pageSize, search]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-semibold md:text-2xl">Audit Logs</h1>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base">System-wide Audit Trail</CardTitle>
                    <CardDescription>Monitor all administrative actions and data changes.</CardDescription>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by action, target or admin name..."
                            className="pl-9 max-w-md"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><div className="flex items-center gap-1"><Clock className="h-3 w-3" /> Timestamp</div></TableHead>
                                <TableHead><div className="flex items-center gap-1"><User className="h-3 w-3" /> Admin</div></TableHead>
                                <TableHead><div className="flex items-center gap-1"><FileText className="h-3 w-3" /> Action</div></TableHead>
                                <TableHead>Target Entity</TableHead>
                                <TableHead className="text-right">Detail</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(10)].map((_, i) => (
                                    <TableRow key={i}>
                                        {[...Array(5)].map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                        No audit logs found.
                                    </TableCell>
                                </TableRow>
                            ) : logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{log.adminName}</span>
                                            <span className="text-[10px] text-muted-foreground">ID: {log.adminId}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded border">
                                            {log.action}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium uppercase text-muted-foreground">{log.entityType}</span>
                                            <span className="text-[10px] text-muted-foreground">Ref: {log.entityId}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <DataTablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={logs.length * totalPages} // Approximation
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                />
            </Card>

            {/* Log Detail Dialog */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Audit Log Entry Detail</DialogTitle>
                        <DialogDescription>
                            Full trail of action performed on {selectedLog && new Date(selectedLog.createdAt).toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/30">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Administrator</p>
                                    <p className="text-sm">{selectedLog.adminName} ({selectedLog.adminId})</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Primary Action</p>
                                    <p className="text-sm font-mono">{selectedLog.action}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Description</p>
                                    <p className="text-sm">{selectedLog.description}</p>
                                </div>
                            </div>

                            {(selectedLog.beforeData || selectedLog.afterData) && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">Data Changes (JSON Diff)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-red-600">Before Change</p>
                                            <pre className="p-3 bg-red-50 text-[10px] overflow-auto max-h-[200px] border border-red-100 rounded">
                                                {selectedLog.beforeData ? JSON.stringify(JSON.parse(selectedLog.beforeData), null, 2) : "EMPTY"}
                                            </pre>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-green-600">After Change</p>
                                            <pre className="p-3 bg-green-50 text-[10px] overflow-auto max-h-[200px] border border-green-100 rounded">
                                                {selectedLog.afterData ? JSON.stringify(JSON.parse(selectedLog.afterData), null, 2) : "EMPTY"}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
