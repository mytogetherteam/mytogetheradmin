import { useState, useEffect } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Loader2, Plus, Search, FileSpreadsheet, Trash2, Edit,
} from "lucide-react";
import { DataTablePagination } from "@/components/DataTablePagination";
import { SortableTableHead, SortConfig, toggleSort, sortData } from "@/components/SortableTableHead";
import { useNavigate } from "react-router-dom";
import { cityService, CityDTO } from "@/services/cityService";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function ManageCities() {
    const navigate = useNavigate();
    const [cities, setCities] = useState<CityDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: "" });
    const [deleting, setDeleting] = useState(false);

    const loadCities = async () => {
        setLoading(true);
        try {
            const res = await cityService.getCities(0, 500, searchTerm);
            setCities(res.content || []);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load cities");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => loadCities(), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key));

    const sortedCities = sortData(cities, sortConfig);

    const totalItems = sortedCities.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const currentCities = sortedCities.slice(startIndex, endIndex);

    const exportToExcel = () => {
        const data = sortedCities.map((c) => ({
            ID: c.id, "Name (EN)": c.nameEn, "Name (MM)": c.nameMm,
            "Name (TH)": c.nameTh || "", Slug: c.slug, Active: c.active ? "Yes" : "No",
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Cities");
        XLSX.writeFile(wb, "Cities.xlsx");
    };

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            await cityService.deleteCity(deleteDialog.id);
            toast.success("City deleted successfully");
            setDeleteDialog({ open: false, id: 0, name: "" });
            loadCities();
        } catch (e) {
            console.error(e);
            toast.error("Failed to delete city");
        } finally { setDeleting(false); }
    };

    return (
        <div className="container mx-auto py-10 max-w-7xl">
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="leading-tight">Manage Cities</CardTitle>
                            <CardDescription className="line-clamp-2 md:line-clamp-none">
                                Manage all cities for the platform's location system.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search cities..."
                                    className="pl-8 w-full sm:w-[200px] lg:w-[300px]"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                            <Button variant="outline" className="gap-2 shrink-0" onClick={exportToExcel}>
                                <FileSpreadsheet className="h-4 w-4" /> Export
                            </Button>
                            <Button onClick={() => navigate("/cities/create")}>
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
                                            <SortableTableHead label="ID" sortKey="id" sortConfig={sortConfig} onSort={handleSort} className="w-[80px]" />
                                            <SortableTableHead label="Name (EN)" sortKey="nameEn" sortConfig={sortConfig} onSort={handleSort} />
                                            <TableHead>Name (MM)</TableHead>
                                            <TableHead>Name (TH)</TableHead>
                                            <TableHead>Slug</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentCities.length > 0 ? currentCities.map((city) => (
                                            <TableRow key={city.id} className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => navigate(`/cities/edit/${city.id}`)}>
                                                <TableCell className="font-mono text-xs">{city.id}</TableCell>
                                                <TableCell className="font-medium">{city.nameEn}</TableCell>
                                                <TableCell>{city.nameMm}</TableCell>
                                                <TableCell className="text-muted-foreground">{city.nameTh || "—"}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs font-mono">{city.slug}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${city.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                        {city.active ? "Active" : "Inactive"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/cities/edit/${city.id}`); }}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, id: city.id, name: city.nameEn }); }}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No cities found.</TableCell>
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
                        <DialogTitle>Delete City?</DialogTitle>
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
