import { useState, useEffect, useCallback } from "react";
import {
  Place,
  placesService,
} from "@/services/placesService";
import { PlaceFormSheet } from "./PlaceFormSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTablePagination } from "@/components/DataTablePagination";
import { toast } from "sonner";
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  Sparkles,
  ExternalLink,
  Image as ImageIcon,
  Clock,
  DollarSign,
  Filter,
} from "lucide-react";

const ACTIVITY_MAP: Record<string, { label: string; icon: string }> = {
  BADMINTON: { label: "Badminton", icon: "🏸" },
  SWIMMING: { label: "Swimming", icon: "🏊" },
  FOOTBALL: { label: "Football", icon: "⚽" },
  FUTSAL: { label: "Futsal", icon: "🥅" },
  GYM: { label: "Gym", icon: "🏋️" },
  MUAY_THAI: { label: "Muay Thai", icon: "🥊" },
  TENNIS: { label: "Tennis", icon: "🎾" },
  ICE_SKATING: { label: "Ice Skating", icon: "🧊" },
  GAMES: { label: "Games", icon: "🎳" },
  ROOFTOP_VIEW: { label: "Rooftop", icon: "🏙️" },
  SHOPPING: { label: "Shopping", icon: "🛍️" },
  NIGHT_MARKET: { label: "Night Market", icon: "🌃" },
  SIGHTSEEING: { label: "Sightseeing", icon: "🗺️" },
};

export default function ManagePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(false);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPlaces = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await placesService.getPlaces({
        page: currentPage,
        size: pageSize,
        search: search.trim() || undefined,
        activity: activityFilter !== "ALL" ? activityFilter : undefined,
      });

      setPlaces(res.items || []);
      setTotalItems(res.total || 0);
      setTotalPages(res.lastPage || 1);
    } catch (err: any) {
      console.error("Fetch places error:", err);
      toast.error(err?.message || "Failed to load places");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, search, activityFilter]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const handleOpenCreate = () => {
    setSelectedPlace(null);
    setSheetOpen(true);
  };

  const handleOpenEdit = (place: Place) => {
    setSelectedPlace(place);
    setSheetOpen(true);
  };

  const handleConfirmDelete = (place: Place) => {
    setPlaceToDelete(place);
    setDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!placeToDelete) return;
    try {
      setIsDeleting(true);
      await placesService.deletePlace(placeToDelete.id);
      toast.success(`"${placeToDelete.titleEn}" deleted successfully`);
      setDeleteDialogOpen(false);
      setPlaceToDelete(null);
      fetchPlaces();
    } catch (err: any) {
      console.error("Delete place error:", err);
      toast.error(err?.message || "Failed to delete place");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (place: Place, newStatus: boolean) => {
    try {
      await placesService.updatePlace(place.id, {
        titleEn: place.titleEn,
        locationName: place.locationName,
        isActive: newStatus,
      });
      setPlaces((prev) =>
        prev.map((p) => (p.id === place.id ? { ...p, isActive: newStatus } : p))
      );
      toast.success(`Place ${newStatus ? "activated" : "deactivated"}`);
    } catch (err: any) {
      console.error("Toggle active error:", err);
      toast.error(err?.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Places & Activities
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage sports arenas, hangouts, activities, and pricing rates for the &quot;Where to Chill?&quot; section.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add Place
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 rounded-xl border shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search places by title or location..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select
            value={activityFilter}
            onValueChange={(val) => {
              setActivityFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="All Activities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Activities</SelectItem>
              {Object.entries(ACTIVITY_MAP).map(([code, meta]) => (
                <SelectItem key={code} value={code}>
                  <span className="mr-2">{meta.icon}</span>
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-14">#</TableHead>
              <TableHead className="w-20">Photo</TableHead>
              <TableHead>Venue & Location</TableHead>
              <TableHead>Activities</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Pricing Rates</TableHead>
              <TableHead className="w-24 text-center">Status</TableHead>
              <TableHead className="w-20 text-center">Order</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                  Loading places...
                </TableCell>
              </TableRow>
            ) : places.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                  No places found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              places.map((place, index) => {
                const popularPlan = Array.isArray(place.pricingPlans)
                  ? place.pricingPlans.find((p) => p.isPopular) || place.pricingPlans[0]
                  : null;

                return (
                  <TableRow key={place.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>

                    <TableCell>
                      {place.coverUrl ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden border bg-muted shadow-2xs">
                          <img
                            src={place.coverUrl}
                            alt={place.titleEn}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-5 w-5 opacity-40" />
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          {place.titleEn}
                          {place.googleMapsUrl && (
                            <a
                              href={place.googleMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-muted-foreground hover:text-primary"
                              title="Open on Google Maps"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        {place.titleMm && (
                          <div className="text-xs text-muted-foreground">{place.titleMm}</div>
                        )}
                        <div className="text-xs flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[240px]">{place.locationName}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {place.activities && place.activities.length > 0 ? (
                          place.activities.map((act) => {
                            const meta = ACTIVITY_MAP[act];
                            return (
                              <Badge
                                key={act}
                                variant="secondary"
                                className="text-[11px] px-1.5 py-0.5 gap-1 font-normal"
                              >
                                <span>{meta?.icon || "🎯"}</span>
                                {meta?.label || act}
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-xs text-muted-foreground italic">None</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        {place.openingTime} - {place.closingTime}
                      </div>
                    </TableCell>

                    <TableCell>
                      {popularPlan ? (
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-primary flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {popularPlan.price} {popularPlan.unit}
                            {popularPlan.isPopular && (
                              <Sparkles className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                            {popularPlan.title}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No plans</span>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <Switch
                        checked={place.isActive}
                        onCheckedChange={(checked) => handleToggleActive(place, checked)}
                      />
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs">
                      {place.displayOrder}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenEdit(place)}
                          title="Edit Place"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleConfirmDelete(place)}
                          title="Delete Place"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 0 && (
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Form Drawer Sheet */}
      <PlaceFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        place={selectedPlace}
        onSuccess={fetchPlaces}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Place</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{placeToDelete?.titleEn}&quot;? This will remove the
              venue, its photos, activities, and pricing plans. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
