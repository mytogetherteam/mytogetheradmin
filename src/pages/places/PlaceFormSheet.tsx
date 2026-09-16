import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Place,
  PlaceFormData,
  PricingPlanItem,
  placesService,
} from "@/services/placesService";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Upload,
  Sparkles,
  MapPin,
  Clock,
  Phone,
  Globe,
  DollarSign,
  Image as ImageIcon,
  Check,
} from "lucide-react";

interface PlaceFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  place?: Place | null;
  onSuccess: () => void;
}

const AVAILABLE_ACTIVITIES = [
  { id: "BADMINTON", label: "Badminton", icon: "🏸", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { id: "SWIMMING", label: "Swimming Pool", icon: "🏊", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { id: "FOOTBALL", label: "Football", icon: "⚽", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { id: "FUTSAL", label: "Futsal", icon: "🥅", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  { id: "GYM", label: "Gym & Fitness", icon: "🏋️", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { id: "MUAY_THAI", label: "Muay Thai / Boxing", icon: "🥊", color: "bg-red-500/10 text-red-600 border-red-500/20" },
  { id: "TENNIS", label: "Tennis", icon: "🎾", color: "bg-lime-500/10 text-lime-600 border-lime-500/20" },
  { id: "ICE_SKATING", label: "Ice Skating", icon: "🧊", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
  { id: "GAMES", label: "Games & Arcade", icon: "🎳", color: "bg-pink-500/10 text-pink-600 border-pink-500/20" },
  { id: "ROOFTOP_VIEW", label: "Rooftop View", icon: "🏙️", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  { id: "SHOPPING", label: "Shopping Mall", icon: "🛍️", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  { id: "NIGHT_MARKET", label: "Night Market", icon: "🌃", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  { id: "SIGHTSEEING", label: "Sightseeing", icon: "🗺️", color: "bg-teal-500/10 text-teal-600 border-teal-500/20" },
];

const AVAILABLE_AMENITIES = [
  { id: "PARKING", label: "Parking Space", icon: "🚗" },
  { id: "SHOWER", label: "Shower Rooms", icon: "🚿" },
  { id: "LOCKERS", label: "Lockers", icon: "🔒" },
  { id: "AIRCON", label: "Air Conditioned", icon: "❄️" },
  { id: "WIFI", label: "Free Wi-Fi", icon: "📶" },
  { id: "CAFE", label: "Cafe / Food Stall", icon: "☕" },
  { id: "NIGHT_LIGHTS", label: "Night Lighting", icon: "💡" },
  { id: "PRO_SHOP", label: "Equipment / Pro Shop", icon: "🏸" },
  { id: "FERRY_SHUTTLE", label: "Shuttle / Ferry Boat", icon: "🚢" },
];

export function PlaceFormSheet({ open, onOpenChange, place, onSuccess }: PlaceFormSheetProps) {
  const isEdit = !!place;

  const [titleEn, setTitleEn] = useState("");
  const [titleMm, setTitleMm] = useState("");
  const [titleTh, setTitleTh] = useState("");
  const [locationName, setLocationName] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionMm, setDescriptionMm] = useState("");
  const [descriptionTh, setDescriptionTh] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [openTimeHour, setOpenTimeHour] = useState(9);
  const [openTimeMin, setOpenTimeMin] = useState(0);
  const [closeTimeHour, setCloseTimeHour] = useState(21);
  const [closeTimeMin, setCloseTimeMin] = useState(0);
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");

  const [activities, setActivities] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlanItem[]>([]);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);
  const [removeGalleryIds, setRemoveGalleryIds] = useState<number[]>([]);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (place) {
      setTitleEn(place.titleEn || "");
      setTitleMm(place.titleMm || "");
      setTitleTh(place.titleTh || "");
      setLocationName(place.locationName || "");
      setDescriptionEn(place.descriptionEn || "");
      setDescriptionMm(place.descriptionMm || "");
      setDescriptionTh(place.descriptionTh || "");
      setLatitude(place.latitude != null ? String(place.latitude) : "");
      setLongitude(place.longitude != null ? String(place.longitude) : "");

      const [openH, openM] = (place.openingTime || "09:00").split(":").map(Number);
      const [closeH, closeM] = (place.closingTime || "21:00").split(":").map(Number);
      setOpenTimeHour(isNaN(openH) ? 9 : openH);
      setOpenTimeMin(isNaN(openM) ? 0 : openM);
      setCloseTimeHour(isNaN(closeH) ? 21 : closeH);
      setCloseTimeMin(isNaN(closeM) ? 0 : closeM);

      setDisplayOrder(place.displayOrder ?? 1);
      setIsActive(place.isActive ?? true);
      setPhoneNumber(place.phoneNumber || "");
      setWebsiteUrl(place.websiteUrl || "");
      setGoogleMapsUrl(place.googleMapsUrl || "");

      setActivities(place.activities || []);
      setAmenities(place.amenities || []);
      setPricingPlans(Array.isArray(place.pricingPlans) ? place.pricingPlans : []);

      setCoverPreview(place.coverUrl || null);
      setCoverFile(null);
      setGalleryFiles([]);
      setNewGalleryPreviews([]);
      setRemoveGalleryIds([]);
    } else {
      setTitleEn("");
      setTitleMm("");
      setTitleTh("");
      setLocationName("");
      setDescriptionEn("");
      setDescriptionMm("");
      setDescriptionTh("");
      setLatitude("13.7563");
      setLongitude("100.5018");
      setOpenTimeHour(9);
      setOpenTimeMin(0);
      setCloseTimeHour(21);
      setCloseTimeMin(0);
      setDisplayOrder(1);
      setIsActive(true);
      setPhoneNumber("");
      setWebsiteUrl("");
      setGoogleMapsUrl("");
      setActivities([]);
      setAmenities([]);
      setPricingPlans([
        { title: "Standard Hourly", price: "฿200", unit: "/ hour", timeSlot: "09:00 - 21:00", note: "", isPopular: true },
      ]);
      setCoverFile(null);
      setCoverPreview(null);
      setGalleryFiles([]);
      setNewGalleryPreviews([]);
      setRemoveGalleryIds([]);
    }
  }, [place, open]);

  const toggleActivity = (id: string) => {
    setActivities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleAmenity = (id: string) => {
    setAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleAddPricingPlan = () => {
    setPricingPlans((prev) => [
      ...prev,
      { title: "", price: "", unit: "/ hour", timeSlot: "", note: "", isPopular: false },
    ]);
  };

  const handleRemovePricingPlan = (index: number) => {
    setPricingPlans((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePricingPlanChange = (index: number, field: keyof PricingPlanItem, val: any) => {
    setPricingPlans((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setGalleryFiles((prev) => [...prev, ...newFiles]);
      const newUrls = newFiles.map((f) => URL.createObjectURL(f));
      setNewGalleryPreviews((prev) => [...prev, ...newUrls]);
    }
  };

  const removeNewGalleryPhoto = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setNewGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleRemoveExistingGallery = (galleryId: number) => {
    setRemoveGalleryIds((prev) =>
      prev.includes(galleryId) ? prev.filter((id) => id !== galleryId) : [...prev, galleryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim()) {
      toast.error("English Title is required");
      return;
    }
    if (!locationName.trim()) {
      toast.error("Location Name is required");
      return;
    }

    try {
      setIsSaving(true);
      const parsedLat = latitude.trim() ? parseFloat(latitude) : undefined;
      const parsedLng = longitude.trim() ? parseFloat(longitude) : undefined;

      const payload: PlaceFormData = {
        titleEn: titleEn.trim(),
        titleMm: titleMm.trim() || undefined,
        titleTh: titleTh.trim() || undefined,
        locationName: locationName.trim(),
        descriptionEn: descriptionEn.trim() || undefined,
        descriptionMm: descriptionMm.trim() || undefined,
        descriptionTh: descriptionTh.trim() || undefined,
        latitude: parsedLat,
        longitude: parsedLng,
        openTimeHour: Number(openTimeHour),
        openTimeMin: Number(openTimeMin),
        closeTimeHour: Number(closeTimeHour),
        closeTimeMin: Number(closeTimeMin),
        displayOrder: Number(displayOrder) || 1,
        isActive,
        phoneNumber: phoneNumber.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        googleMapsUrl: googleMapsUrl.trim() || undefined,
        activities,
        amenities,
        pricingPlans: pricingPlans.filter((p) => p.title.trim()),
        ...(isEdit && removeGalleryIds.length > 0 ? { removeGalleryIds } : {}),
      };

      if (isEdit && place) {
        await placesService.updatePlace(place.id, payload, coverFile || undefined, galleryFiles);
        toast.success("Place updated successfully");
      } else {
        await placesService.createPlace(payload, coverFile || undefined, galleryFiles);
        toast.success("Place created successfully");
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error("Save place error:", err);
      toast.error(err?.message || "Failed to save place");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto p-0 flex flex-col">
        <div className="p-6 border-b bg-background sticky top-0 z-10 flex items-center justify-between">
          <div>
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {isEdit ? "Edit Place & Activities" : "Create New Place"}
            </SheetTitle>
            <SheetDescription>
              Configure venue information, activities, pricing tiers, and photos.
            </SheetDescription>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
              {isSaving ? "Saving..." : isEdit ? "Update Place" : "Create Place"}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex-1">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid grid-cols-5 mb-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="pricing">Pricing Plans</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
            </TabsList>

            {/* TAB 1: BASIC INFO */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titleEn">Title (English) *</Label>
                  <Input
                    id="titleEn"
                    placeholder="e.g. Badminton Park Ladprao"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="titleMm">Title (Myanmar)</Label>
                  <Input
                    id="titleMm"
                    placeholder="လတ်ဖရောက် ကြက်တောင်ကွင်း"
                    value={titleMm}
                    onChange={(e) => setTitleMm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="titleTh">Title (Thai)</Label>
                  <Input
                    id="titleTh"
                    placeholder="แบดมินตัน พาร์ค ลาดพร้าว"
                    value={titleTh}
                    onChange={(e) => setTitleTh(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationName">Location Name / Address *</Label>
                <Input
                  id="locationName"
                  placeholder="e.g. Soi Ladprao 87, Bangkok"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Opening Time
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={openTimeHour}
                      onChange={(e) => setOpenTimeHour(parseInt(e.target.value) || 0)}
                      className="w-20 text-center"
                      placeholder="HH"
                    />
                    <span>:</span>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={openTimeMin}
                      onChange={(e) => setOpenTimeMin(parseInt(e.target.value) || 0)}
                      className="w-20 text-center"
                      placeholder="MM"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Closing Time
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={closeTimeHour}
                      onChange={(e) => setCloseTimeHour(parseInt(e.target.value) || 0)}
                      className="w-20 text-center"
                      placeholder="HH"
                    />
                    <span>:</span>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={closeTimeMin}
                      onChange={(e) => setCloseTimeMin(parseInt(e.target.value) || 0)}
                      className="w-20 text-center"
                      placeholder="MM"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    placeholder="+66 2 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl" className="flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    Website / Facebook URL
                  </Label>
                  <Input
                    id="websiteUrl"
                    placeholder="https://www.venue.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionEn">Description (English)</Label>
                <Textarea
                  id="descriptionEn"
                  rows={3}
                  placeholder="Overview of this venue and services..."
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="descriptionMm">Description (Myanmar)</Label>
                  <Textarea
                    id="descriptionMm"
                    rows={2}
                    placeholder="မြန်မာဘာသာ ဖော်ပြချက်..."
                    value={descriptionMm}
                    onChange={(e) => setDescriptionMm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionTh">Description (Thai)</Label>
                  <Textarea
                    id="descriptionTh"
                    rows={2}
                    placeholder="รายละเอียดภาษาไทย..."
                    value={descriptionTh}
                    onChange={(e) => setDescriptionTh(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Active Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Inactive places are hidden from the mobile user app.
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Sort Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  min={1}
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                  className="w-32"
                />
              </div>
            </TabsContent>

            {/* TAB 2: LOCATION */}
            <TabsContent value="location" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude (GPS)</Label>
                  <Input
                    id="latitude"
                    placeholder="13.7563"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude (GPS)</Label>
                  <Input
                    id="longitude"
                    placeholder="100.5018"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleMapsUrl">Google Maps Link Override (Optional)</Label>
                <Input
                  id="googleMapsUrl"
                  placeholder="https://maps.google.com/?q=..."
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  If left empty, mobile will open maps using the Latitude & Longitude coordinates.
                </p>
              </div>

              {latitude && longitude && !isNaN(Number(latitude)) && !isNaN(Number(longitude)) && (
                <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Google Maps Coordinates</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Test on Google Maps ↗
                    </a>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    Lat: {latitude}, Lng: {longitude}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 3: ACTIVITIES & AMENITIES */}
            <TabsContent value="activities" className="space-y-6">
              <div className="space-y-3">
                <div>
                  <Label className="text-base font-semibold">Activities & Sports Offered</Label>
                  <p className="text-xs text-muted-foreground">
                    Select all sports and chill activities available at this venue.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {AVAILABLE_ACTIVITIES.map((act) => {
                    const selected = activities.includes(act.id);
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => toggleActivity(act.id)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                          selected
                            ? "border-primary bg-primary/10 shadow-xs text-foreground font-semibold"
                            : "border-border hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <span className="text-xl">{act.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate">{act.label}</p>
                        </div>
                        {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div>
                  <Label className="text-base font-semibold">Facilities & Amenities</Label>
                  <p className="text-xs text-muted-foreground">
                    Select conveniences available to visitors.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {AVAILABLE_AMENITIES.map((am) => {
                    const selected = amenities.includes(am.id);
                    return (
                      <button
                        key={am.id}
                        type="button"
                        onClick={() => toggleAmenity(am.id)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                          selected
                            ? "border-primary bg-primary/10 text-foreground font-semibold"
                            : "border-border hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <span className="text-lg">{am.icon}</span>
                        <p className="text-xs truncate flex-1">{am.label}</p>
                        {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: PRICING PLANS */}
            <TabsContent value="pricing" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Pricing Rates & Tiers</Label>
                  <p className="text-xs text-muted-foreground">
                    Display entrance fees, court rental rates, or memberships on the app.
                  </p>
                </div>
                <Button type="button" size="sm" onClick={handleAddPricingPlan} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Add Pricing Plan
                </Button>
              </div>

              {pricingPlans.length === 0 ? (
                <div className="p-8 border-2 border-dashed rounded-xl text-center space-y-2">
                  <DollarSign className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-sm font-medium">No pricing plans added yet</p>
                  <p className="text-xs text-muted-foreground">
                    Add rates so users can see pricing before visiting.
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddPricingPlan}>
                    Add First Plan
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pricingPlans.map((plan, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border bg-card/60 shadow-2xs space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted">
                            Plan #{idx + 1}
                          </span>
                          {plan.isPopular && (
                            <Badge variant="default" className="gap-1 text-[10px]">
                              <Sparkles className="h-3 w-3" /> Popular Choice
                            </Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemovePricingPlan(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-xs">Plan Title *</Label>
                          <Input
                            placeholder="e.g. Peak Court Rental"
                            value={plan.title}
                            onChange={(e) => handlePricingPlanChange(idx, "title", e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Price & Unit</Label>
                          <div className="flex items-center gap-1.5">
                            <Input
                              placeholder="฿200"
                              value={plan.price || ""}
                              onChange={(e) => handlePricingPlanChange(idx, "price", e.target.value)}
                              className="w-24"
                            />
                            <Input
                              placeholder="/ hour"
                              value={plan.unit || ""}
                              onChange={(e) => handlePricingPlanChange(idx, "unit", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Time Slot / Hours</Label>
                          <Input
                            placeholder="e.g. 17:00 - 23:00 / Weekends"
                            value={plan.timeSlot || ""}
                            onChange={(e) => handlePricingPlanChange(idx, "timeSlot", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Special Note</Label>
                          <Input
                            placeholder="e.g. Shuttlecocks available"
                            value={plan.note || ""}
                            onChange={(e) => handlePricingPlanChange(idx, "note", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Switch
                          id={`popular-${idx}`}
                          checked={plan.isPopular || false}
                          onCheckedChange={(checked) =>
                            handlePricingPlanChange(idx, "isPopular", checked)
                          }
                        />
                        <Label htmlFor={`popular-${idx}`} className="text-xs cursor-pointer">
                          Highlight as Popular / Best Value
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 5: PHOTOS */}
            <TabsContent value="photos" className="space-y-6">
              {/* Cover Photo */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Cover Photo</Label>
                <div className="flex items-start gap-4">
                  {coverPreview ? (
                    <div className="relative w-40 h-28 rounded-xl overflow-hidden border bg-muted shrink-0 shadow-xs">
                      <img
                        src={coverPreview}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-40 h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground shrink-0">
                      <ImageIcon className="h-8 w-8 mb-1 opacity-40" />
                      <span className="text-[11px]">No Cover</span>
                    </div>
                  )}
                  <div className="space-y-2 flex-1">
                    <p className="text-xs text-muted-foreground">
                      Upload a high-resolution banner image for the venue. Recommended aspect ratio: 16:9 or 4:3.
                    </p>
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-card hover:bg-muted cursor-pointer text-xs font-medium transition-colors">
                      <Upload className="h-4 w-4" />
                      Choose Cover Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Gallery Photos */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Gallery Photos</Label>
                    <p className="text-xs text-muted-foreground">
                      Photos shown in the slideshow and gallery viewer on the place details page.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-card hover:bg-muted cursor-pointer text-xs font-medium transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    Upload Photos
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Existing Gallery Photos */}
                {isEdit && place && place.photoGallery && place.photoGallery.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Existing Photos</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {place.photoGallery.map((g) => {
                        const isMarked = removeGalleryIds.includes(g.id);
                        return (
                          <div
                            key={g.id}
                            className={`relative rounded-xl overflow-hidden border aspect-video group ${
                              isMarked ? "opacity-40 grayscale" : ""
                            }`}
                          >
                            <img
                              src={g.imageUrl}
                              alt="Gallery item"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => toggleRemoveExistingGallery(g.id)}
                              className={`absolute top-1.5 right-1.5 p-1 rounded-full text-xs font-semibold transition-all ${
                                isMarked
                                  ? "bg-primary text-white"
                                  : "bg-black/60 text-white hover:bg-destructive"
                              }`}
                              title={isMarked ? "Undo Delete" : "Mark for deletion"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            {isMarked && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-[11px] font-semibold">
                                Will be removed
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* New Gallery Previews */}
                {newGalleryPreviews.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-primary">New Photos to Upload</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {newGalleryPreviews.map((url, idx) => (
                        <div key={idx} className="relative rounded-xl overflow-hidden border aspect-video">
                          <img src={url} alt="New upload" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeNewGalleryPhoto(idx)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </SheetContent>
    </Sheet>
  );
}
