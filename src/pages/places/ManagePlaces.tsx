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
import { Loader2, Plus, Search, Trash2, Pencil } from "lucide-react";
import { TableImage } from "@/components/TableImage";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import { useDeletePlaceMutation, usePlaces } from "@/hooks/places/usePlaces";

export default function ManagePlaces() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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

  const { data, isPending: loading } = usePlaces({
    page: 1,
    size: 500,
    search: debouncedSearch.trim() || undefined,
  });

  const { mutate: deletePlace, isPending: deleting } = useDeletePlaceMutation();

  const places = useMemo(() => {
    const list = data?.content ?? [];
    return [...list].sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.id - b.id,
    );
  }, [data?.content]);

  const handleDeleteConfirm = () => {
    deletePlace(deleteDialog.id, {
      onSuccess: () => setDeleteDialog({ open: false, id: 0, name: "" }),
    });
  };

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Manage Places</CardTitle>
              <CardDescription>
                Points of interest shown in the mobile app with location and opening hours.
              </CardDescription>
            </div>
            <Button onClick={() => navigate("/places/create")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Place
            </Button>
          </div>
          <div className="pt-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : places.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No places found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Cover</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Coords</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {places.map((place) => (
                  <TableRow
                    key={place.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/places/create?id=${place.id}`)}
                  >
                    <TableCell>
                      <TableImage src={place.coverUrl} alt={place.titleEn} size="sm" />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{place.titleEn}</div>
                      {place.titleTh && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {place.titleTh}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {place.locationName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm whitespace-nowrap">
                        {place.openingTime} – {place.closingTime}
                      </span>
                    </TableCell>
                    <TableCell>
                      {place.latitude != null && place.longitude != null ? (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{place.displayOrder ?? "—"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          place.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {place.isActive ? "Active" : "Inactive"}
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
                            navigate(`/places/create?id=${place.id}`);
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
                              id: place.id,
                              name: place.titleEn,
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
        title="Delete Place"
        description={`Are you sure you want to delete "${deleteDialog.name}"? This cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  );
}
