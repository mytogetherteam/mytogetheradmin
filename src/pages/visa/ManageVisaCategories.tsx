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
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import { useDeleteVisaCategoryMutation, useVisaCategories } from "@/hooks/visa/useVisaCategory";
import { SECTION_LABELS, type VisaSection } from "@/schemas/visa.schema";

export default function ManageVisaCategories() {
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

  const { data, isPending: loading } = useVisaCategories({
    page: 1,
    size: 500,
    search: debouncedSearch.trim() || undefined,
    section: sectionFilter === "ALL" ? undefined : sectionFilter,
  });

  const { mutate: deleteCategory, isPending: deleting } = useDeleteVisaCategoryMutation();

  const categories = useMemo(() => {
    const list = data?.content ?? [];
    return [...list].sort((a, b) => {
      if (a.section !== b.section) return a.section.localeCompare(b.section);
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    });
  }, [data?.content]);

  const handleDeleteConfirm = () => {
    deleteCategory(deleteDialog.id, {
      onSuccess: () => setDeleteDialog({ open: false, id: 0, name: "" }),
    });
  };

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Manage Visa Categories</CardTitle>
              <CardDescription>
                Group visa items under categories like Short-Term & Tourist.
              </CardDescription>
            </div>
            <Button onClick={() => navigate("/visa/categories/create")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Category
            </Button>
          </div>
          <div className="flex flex-col gap-3 pt-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
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
          ) : categories.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No categories found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow
                    key={category.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/visa/categories/create?id=${category.id}`)}
                  >
                    <TableCell className="font-medium">{category.title}</TableCell>
                    <TableCell>{SECTION_LABELS[category.section]}</TableCell>
                    <TableCell>{category.displayOrder}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          category.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {category.isActive ? "Active" : "Inactive"}
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
                            navigate(`/visa/categories/create?id=${category.id}`);
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
                              id: category.id,
                              name: category.title,
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
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteDialog.name}"? Categories with linked visas cannot be deleted.`}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  );
}
