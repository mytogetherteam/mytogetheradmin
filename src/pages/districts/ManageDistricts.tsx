import { useState, useEffect, useRef } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Loader2, Plus, Search, FileSpreadsheet, Trash2, Edit,
} from "lucide-react";
import { DataTablePagination } from "@/components/DataTablePagination";
import { SortableTableHead } from "@/components/SortableTableHead";
import { SortConfig, toggleSort, sortData } from "@/lib/sort-utils";
import { useNavigate } from "react-router-dom";
import { useCities } from "@/hooks/city/useCity";
import { useDistricts, useDeleteDistrictMutation } from "@/hooks/district/useDistrict";
import * as XLSX from "xlsx";

export default function ManageDistricts() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCityId, setSelectedCityId] = useState<number | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: "" });

    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
    const isFirstSearchDebounce = useRef(true);

    useEffect(() => {
        const delayMs = isFirstSearchDebounce.current ? 0 : 500;
        isFirstSearchDebounce.current = false;
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), delayMs);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: citiesData } = useCities({ page: 1, size: 500 });
    const cities = citiesData?.content || [];

    const { data, isPending: loading } = useDistricts({
        page: currentPage,
        size: pageSize,
        search: debouncedSearch.trim() || undefined,
        cityId: selectedCityId,
    });

    const { mutateAsync: deleteDistrict, isPending: deleting } = useDeleteDistrictMutation();

    const districts = data?.content || [];
    const totalItems = data?.totalElements ?? 0;
    const totalPages = Math.max(1, data?.totalPages ?? 1);

    useEffect(() => {
        if (!loading && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [loading, currentPage, totalPages]);

    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key));

    const sortedDistricts = sortData(districts, sortConfig);
    const currentDistricts = sortedDistricts;

    const exportToExcel = () => {
        const data = sortedDistricts.map((d) => ({
            ID: d.id, "City": d.cityNameEn || d.cityId, "Name (EN)": d.nameEn,
            "Name (MM)": d.nameMm, "Name (TH)": d.nameTh || "",
            Latitude: d.latitude || "", Longitude: d.longitude || "",
            Active: d.active ? "Yes" : "No",
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Districts");
        XLSX.writeFile(wb, "Districts.xlsx");
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.id) return;
        await deleteDistrict(deleteDialog.id);
        setDeleteDialog({ open: false, id: 0, name: "" });
    };

    return (
        <div className="container mx-auto py-10 max-w-7xl">
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="leading-tight">Manage Districts</CardTitle>
                            <CardDescription className="line-clamp-2 md:line-clamp-none">
                                Manage districts and townships across all cities.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <Select value={selectedCityId !== undefined ? String(selectedCityId) : "all"} onValueChange={(v) => { setSelectedCityId(v === "all" ? undefined : Number(v)); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Cities" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Cities</SelectItem>
                                    {cities.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.nameEn}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search districts..." className="pl-8 w-full sm:w-[200px]" value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                            </div>
                            <Button variant="outline" className="gap-2 shrink-0" onClick={exportToExcel}>
                                <FileSpreadsheet className="h-4 w-4" /> Export
                            </Button>
                            <Button onClick={() => navigate("/districts/create")}>
                                <Plus className="mr-2 h-4 w-4" /> Create New
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <SortableTableHead label="ID" sortKey="id" sortConfig={sortConfig} onSort={handleSort} className="w-[70px]" />
                                            <SortableTableHead label="City" sortKey="cityNameEn" sortConfig={sortConfig} onSort={handleSort} />
                                            <SortableTableHead label="Name (EN)" sortKey="nameEn" sortConfig={sortConfig} onSort={handleSort} />
                                            <TableHead>Name (MM)</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentDistricts.length > 0 ? currentDistricts.map((d) => (
                                            <TableRow key={d.id} className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => navigate(`/districts/edit/${d.id}`)}>
                                                <TableCell className="font-mono text-xs">{d.id}</TableCell>
                                                <TableCell className="text-muted-foreground">{d.cityNameEn || d.cityId}</TableCell>
                                                <TableCell className="font-medium">{d.nameEn}</TableCell>
                                                <TableCell>{d.nameMm}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${d.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                        {d.active ? "Active" : "Inactive"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/districts/edit/${d.id}`); }}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, id: d.id, name: d.nameEn }); }}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No districts found.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <DataTablePagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                pageSize={pageSize}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                            />
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={deleteDialog.open} onOpenChange={(open) => !deleting && setDeleteDialog((d) => ({ ...d, open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete District?</DialogTitle>
                        <DialogDescription>This will permanently delete <strong>{deleteDialog.name}</strong>. This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, id: 0, name: "" })} disabled={deleting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
