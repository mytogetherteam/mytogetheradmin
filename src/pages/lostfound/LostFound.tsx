import { useEffect, useState, useCallback } from "react";
import { lostFoundService, LostFoundPost, Sighting, LostFoundType } from "@/services/lostFoundService";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, CheckCircle, Trash2, MapPin, Package } from "lucide-react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { DataTablePagination } from "@/components/DataTablePagination";
import { SortableTableHead } from "@/components/SortableTableHead";
import { SortConfig, toggleSort, sortData } from "@/lib/sort-utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function LostFound() {
    const [cases, setCases] = useState<LostFoundPost[]>([]);
    const [sightings, setSightings] = useState<Sighting[]>([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<"cases" | "sightings">("cases");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("LOST");
    const [pageSize, setPageSize] = useState(20);
    const [totalElements, setTotalElements] = useState(0);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    // Action dialogs
    const [confirmId, setConfirmId] = useState<string | number | null>(null);
    const [actionType, setActionType] = useState<"resolve" | "delete_case" | "delete_sighting">("resolve");

    const fetchCases = useCallback(async () => {
        setLoading(true);
        try {
            const data = await lostFoundService.getCases(
                typeFilter === "ALL" ? undefined : typeFilter as LostFoundType,
                page, pageSize, search
            );
            setCases(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements ?? data.content.length);
        } catch (e) {
            handleApiError(e, "Failed to load cases");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, typeFilter, search]);

    const fetchSightings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await lostFoundService.getSightings(undefined, page, pageSize, search);
            setSightings(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements ?? data.content.length);
        } catch (error) {
            handleApiError(error, "Failed to load sightings");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search]);

    useEffect(() => {
        if (tab === "cases") fetchCases();
        else fetchSightings();
    }, [tab, fetchCases, fetchSightings]);

    const handleAction = async () => {
        if (!confirmId) return;
        try {
            if (actionType === "resolve") {
                await lostFoundService.forceResolve(confirmId);
                setCases(prev => prev.map(c => c.id === confirmId ? { ...c, status: "RESOLVED" } : c));
                toast.success("Case resolved");
            } else if (actionType === "delete_case") {
                await lostFoundService.deleteCase(confirmId);
                setCases(prev => prev.filter(c => c.id !== confirmId));
                toast.success("Case deleted");
            } else {
                await lostFoundService.deleteSighting(confirmId);
                setSightings(prev => prev.filter(s => s.id !== confirmId));
                toast.success("Sighting removed");
            }
        } catch (e) {
            handleApiError(e, "Action failed");
        } finally {
            setConfirmId(null);
        }
    };

    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key));
    const sortedCases = sortData(cases, sortConfig);
    const sortedSightings = sortData(sightings, sortConfig);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-semibold md:text-2xl">Lost & Found Management</h1>
            </div>

            <Tabs value={tab} onValueChange={(v) => { setTab(v as "cases" | "sightings"); setPage(0); }}>
                <TabsList>
                    <TabsTrigger value="cases">Active Cases</TabsTrigger>
                    <TabsTrigger value="sightings">Sightings Log</TabsTrigger>
                </TabsList>

                <div className="flex flex-col md:flex-row gap-3 mt-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={`Search ${tab}...`}
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {tab === "cases" && (
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LOST">Lost Items</SelectItem>
                                <SelectItem value="FOUND">Found Items</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <TabsContent value="cases" className="space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base text-primary">Lost & Found Cases</CardTitle>
                            <CardDescription>Monitor and resolve community lost/found reports.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <SortableTableHead label="Type" sortKey="postType" sortConfig={sortConfig} onSort={handleSort} />
                                        <SortableTableHead label="Item" sortKey="title" sortConfig={sortConfig} onSort={handleSort} />
                                        <SortableTableHead label="Posted By" sortKey="postedBy" sortConfig={sortConfig} onSort={handleSort} />
                                        <TableHead>Location</TableHead>
                                        <SortableTableHead label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}>
                                                {[...Array(6)].map((__, j) => (
                                                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : sortedCases.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                No cases found.
                                            </TableCell>
                                        </TableRow>
                                    ) : sortedCases.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell>
                                                <Badge variant={c.postType === "LOST" ? "destructive" : "default"} className="text-[10px]">
                                                    {c.postType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <p className="text-sm font-medium truncate">{c.title}</p>
                                                <p className="text-[10px] text-muted-foreground">{c.itemType}</p>
                                            </TableCell>
                                            <TableCell className="text-sm">{c.postedBy}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[120px]">
                                                    <MapPin className="h-3 w-3" /> {c.location}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={c.status === "RESOLVED" ? "text-green-600 bg-green-50" : "text-yellow-600 bg-yellow-50"}>
                                                    {c.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    {c.status === "OPEN" && (
                                                        <Button size="sm" variant="outline" onClick={() => { setConfirmId(c.id); setActionType("resolve"); }}>
                                                            <CheckCircle className="h-3 w-3 mr-1" /> Resolve
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setConfirmId(c.id); setActionType("delete_case"); }}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sightings" className="space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base text-primary">Witness Sightings Log</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Case Ref</TableHead>
                                        <SortableTableHead label="Witness" sortKey="witnessName" sortConfig={sortConfig} onSort={handleSort} />
                                        <TableHead>Description</TableHead>
                                        <TableHead>Evidence</TableHead>
                                        <SortableTableHead label="Date" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} />
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}>
                                                {[...Array(6)].map((__, j) => (
                                                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : sortedSightings.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                No sightings logged.
                                            </TableCell>
                                        </TableRow>
                                    ) : sortedSightings.map((s) => (
                                        <TableRow key={s.id}>
                                            <TableCell className="text-xs font-medium max-w-[120px] truncate">{s.itemName}</TableCell>
                                            <TableCell className="text-sm">{s.witnessName}</TableCell>
                                            <TableCell className="max-w-xs p-2">
                                                <p className="text-xs line-clamp-2">{s.description}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant="outline" 
                                                    className={`text-[9px] uppercase ${s.status === 'YES' ? 'text-green-600 bg-green-50' : ''}`}
                                                >
                                                    {s.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(s.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setConfirmId(s.id); setActionType("delete_sighting"); }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Pagination */}
                <DataTablePagination
                    currentPage={page + 1}
                    totalPages={totalPages}
                    totalItems={totalElements}
                    pageSize={pageSize}
                    onPageChange={(p) => setPage(p - 1)}
                    onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
                />
            </Tabs>

            {/* Action Dialog */}
            <Dialog open={!!confirmId} onOpenChange={(open) => !open && setConfirmId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === "resolve" ? "Force Resolve Case?" : "Permanent Deletion"}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === "resolve"
                                ? "This will mark the case as RESOLVED. This usually happens when the item is found or the user forgot to close it."
                                : "Are you sure you want to delete this record? This action cannot be undone."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            onClick={handleAction}
                            variant={actionType === "resolve" ? "default" : "destructive"}
                        >
                            {actionType === "resolve" ? "Resolve Case" : "Delete Permanently"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
