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
import { 
    Search, CheckCircle, Trash2, MapPin, Package, Eye, Phone, 
    Calendar, User, ExternalLink, Heart, MessageSquare, Image as ImageIcon, 
    Copy, Check
} from "lucide-react";
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
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [pageSize, setPageSize] = useState(20);
    const [totalElements, setTotalElements] = useState(0);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    // Details & Preview
    const [selectedCase, setSelectedCase] = useState<LostFoundPost | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [copiedPhone, setCopiedPhone] = useState(false);

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
                setSelectedCase(prev => prev && prev.id === confirmId ? { ...prev, status: "RESOLVED" } : prev);
                toast.success("Case resolved");
            } else if (actionType === "delete_case") {
                await lostFoundService.deleteCase(confirmId);
                setCases(prev => prev.filter(c => c.id !== confirmId));
                setSelectedCase(prev => prev && prev.id === confirmId ? null : prev);
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

    const handleCopyPhone = (phone: string) => {
        navigator.clipboard.writeText(phone);
        setCopiedPhone(true);
        toast.success("Phone number copied to clipboard");
        setTimeout(() => setCopiedPhone(false), 2000);
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
                        <Select 
                            value={typeFilter} 
                            onValueChange={(val) => {
                                setTypeFilter(val);
                                setPage(0);
                            }}
                        >
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="All Posts" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Posts</SelectItem>
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
                            <CardDescription>
                                Click any row or the eye icon to view complete details, photos, reporter information, and coordinates.
                            </CardDescription>
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
                                        <TableRow 
                                            key={c.id} 
                                            className="cursor-pointer hover:bg-muted/40 transition-colors"
                                            onClick={() => setSelectedCase(c)}
                                        >
                                            <TableCell>
                                                <Badge 
                                                    variant={c.postType === "LOST" ? "destructive" : "default"} 
                                                    className="text-[10px]"
                                                >
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
                                                <Badge 
                                                    variant="outline" 
                                                    className={c.status === "RESOLVED" ? "text-green-600 bg-green-50" : "text-yellow-600 bg-yellow-50"}
                                                >
                                                    {c.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-8 w-8 p-0" 
                                                        title="View Details"
                                                        onClick={() => setSelectedCase(c)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {c.status === "OPEN" && (
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="h-8 text-xs"
                                                            onClick={() => { setConfirmId(c.id); setActionType("resolve"); }}
                                                        >
                                                            <CheckCircle className="h-3 w-3 mr-1 text-green-600" /> Resolve
                                                        </Button>
                                                    )}
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive" 
                                                        title="Delete Case"
                                                        onClick={() => { setConfirmId(c.id); setActionType("delete_case"); }}
                                                    >
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
                                                    className={`text-[9px] uppercase ${s.status === "YES" ? "text-green-600 bg-green-50" : ""}`}
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

            {/* Case Details Dialog */}
            <Dialog open={!!selectedCase} onOpenChange={(open) => !open && setSelectedCase(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                    {selectedCase && (
                        <div className="flex flex-col">
                            {/* Header */}
                            <div className="p-6 border-b bg-muted/20">
                                <div className="flex items-center justify-between gap-4 mb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={selectedCase.postType === "LOST" ? "destructive" : "default"}
                                            className="text-xs font-semibold px-2.5 py-0.5"
                                        >
                                            {selectedCase.postType}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className={
                                                selectedCase.status === "RESOLVED"
                                                    ? "text-green-600 bg-green-50 border-green-200"
                                                    : "text-amber-600 bg-amber-50 border-amber-200"
                                            }
                                        >
                                            {selectedCase.status}
                                        </Badge>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-mono">
                                        Case #{selectedCase.id}
                                    </span>
                                </div>
                                <DialogTitle className="text-xl font-bold leading-tight">
                                    {selectedCase.title || (selectedCase.postType === "LOST" ? "Lost Item" : "Found Item")}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Reported on {new Date(selectedCase.createdAt).toLocaleString(undefined, {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })}
                                </DialogDescription>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Photos Gallery */}
                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                                        <ImageIcon className="h-3.5 w-3.5" /> Photos ({selectedCase.photos?.length || 0})
                                    </h4>
                                    {selectedCase.photos && selectedCase.photos.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {selectedCase.photos.map((url, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative group rounded-lg overflow-hidden border bg-muted/40 aspect-square cursor-pointer shadow-sm hover:shadow transition-shadow"
                                                    onClick={() => setPreviewImage(url)}
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`Photo ${idx + 1}`}
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                                                        Click to view
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/30 border border-dashed text-xs text-muted-foreground">
                                            <ImageIcon className="h-4 w-4 text-muted-foreground/60" />
                                            No photos attached to this report.
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                        Description
                                    </h4>
                                    <div className="p-4 rounded-lg bg-muted/20 border text-sm whitespace-pre-wrap leading-relaxed">
                                        {selectedCase.description || "No description provided."}
                                    </div>
                                </div>

                                {/* Information Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Reporter Box */}
                                    <div className="p-4 rounded-lg border bg-card space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            <User className="h-3.5 w-3.5" /> Reporter Details
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{selectedCase.postedBy}</p>
                                        </div>
                                        {selectedCase.phoneNumber ? (
                                            <div className="flex items-center gap-2 pt-1">
                                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                                <a
                                                    href={`tel:${selectedCase.phoneNumber}`}
                                                    className="text-xs text-primary hover:underline font-medium"
                                                >
                                                    {selectedCase.phoneNumber}
                                                </a>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 ml-auto"
                                                    title="Copy phone number"
                                                    onClick={() => handleCopyPhone(selectedCase.phoneNumber!)}
                                                >
                                                    {copiedPhone ? (
                                                        <Check className="h-3.5 w-3.5 text-green-600" />
                                                    ) : (
                                                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                                    )}
                                                </Button>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">No phone number provided</p>
                                        )}
                                    </div>

                                    {/* Location Box */}
                                    <div className="p-4 rounded-lg border bg-card space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            <MapPin className="h-3.5 w-3.5" /> Location
                                        </div>
                                        <p className="text-sm font-medium">{selectedCase.location}</p>
                                        {selectedCase.latitude != null && selectedCase.longitude != null ? (
                                            <div className="pt-1 flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    {selectedCase.latitude.toFixed(5)}, {selectedCase.longitude.toFixed(5)}
                                                </span>
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${selectedCase.latitude},${selectedCase.longitude}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                                                >
                                                    <ExternalLink className="h-3 w-3" /> Maps
                                                </a>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Engagement / Activity stats */}
                                <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground border-t">
                                    <div className="flex items-center gap-1.5">
                                        <Heart className="h-3.5 w-3.5 text-red-500" />
                                        <span>{selectedCase.likeCount ?? 0} Likes</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                                        <span>{selectedCase.commentCount ?? 0} Comments</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer with Actions */}
                            <div className="p-4 border-t bg-muted/10 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    {selectedCase.status === "OPEN" && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setConfirmId(selectedCase.id);
                                                setActionType("resolve");
                                            }}
                                        >
                                            <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                                            Resolve Case
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => {
                                            setConfirmId(selectedCase.id);
                                            setActionType("delete_case");
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                        Delete Case
                                    </Button>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setSelectedCase(null)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Full Image Preview Dialog */}
            <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-3xl p-2 bg-black/90 border-0 flex items-center justify-center">
                    {previewImage && (
                        <img
                            src={previewImage}
                            alt="Enlarged preview"
                            className="max-h-[80vh] w-auto max-w-full rounded-md object-contain"
                        />
                    )}
                </DialogContent>
            </Dialog>

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
