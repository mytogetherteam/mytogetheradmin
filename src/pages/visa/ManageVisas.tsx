import { useState, useEffect, useRef, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Search, Trash2, Pencil } from "lucide-react";
import { TableImage } from "@/components/TableImage";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import { useDeleteVisaMutation, useVisas } from "@/hooks/visa/useVisa";
import { SECTION_LABELS, type VisaSection } from "@/schemas/visa.schema";

export default function ManageVisas() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState<VisaSection | "ALL">("ALL");
  const isFirstSearchDebounce = useRef(true);

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({
    open: false,
    id: 0,
    name: "",
  });

  useEffect(() => {
    const delayMs = isFirstSearchDebounce.current ? 0 : 400;
    isFirstSearchDebounce.current = false;
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), delayMs);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isPending: loading } = useVisas({
    page: 1,
    size: 500,
    search: debouncedSearch.trim() || undefined,
    section: sectionFilter === "ALL" ? undefined : sectionFilter,
  });

  const { mutate: deleteVisa, isPending: deleting } = useDeleteVisaMutation();

  const visas = useMemo(() => {
    const list = data?.content ?? [];
    return [...list].sort((a, b) => {
      const sectionA = a.visaCategory?.section ?? "";
      const sectionB = b.visaCategory?.section ?? "";
      if (sectionA !== sectionB) return sectionA.localeCompare(sectionB);
      const catA = a.visaCategory?.title ?? "";
      const catB = b.visaCategory?.title ?? "";
      if (catA !== catB) return catA.localeCompare(catB);
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    });
  }, [data?.content]);

  const handleDeleteConfirm = () => {
    deleteVisa(deleteDialog.id, {
      onSuccess: () => setDeleteDialog({ open: false, id: 0, name: "" }),
    });
  };

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Manage Visas</CardTitle>
              <CardDescription>
                Thailand visa types and immigration services shown in the mobile app.
              </CardDescription>
            </div>
            <Button onClick={() => navigate("/visa/create")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Visa
            </Button>
          </div>
          <div className="flex flex-col gap-3 pt-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={sectionFilter}
              onValueChange={(v) => setSectionFilter(v as VisaSection | "ALL")}
            >
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="All sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All sections</SelectItem>
                <SelectItem value="VISA_TYPES">Visa Types</SelectItem>
                <SelectItem value="IMMIGRATION_SERVICES">Immigration Services</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : visas.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No visas found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Icon</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visas.map((visa) => (
                  <TableRow
                    key={visa.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/visa/create?id=${visa.id}`)}
                  >
                    <TableCell>
                      <TableImage src={visa.iconUrl} alt={visa.titleEn} size="sm" />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{visa.titleEn}</div>
                      {visa.subtitleEn && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {visa.subtitleEn}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {visa.visaCategory
                          ? SECTION_LABELS[visa.visaCategory.section]
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {visa.visaCategory?.title || "—"}
                      </span>
                    </TableCell>
                    <TableCell>{visa.displayOrder ?? "—"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          visa.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {visa.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/visa/create?id=${visa.id}`);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog({
                              open: true,
                              id: visa.id,
                              name: visa.titleEn,
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        title="Delete Visa"
        description={`Are you sure you want to delete "${deleteDialog.name}"? This cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  );
}
