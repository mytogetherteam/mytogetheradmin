import { useState, useMemo } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    MapPin,
    Maximize2,
    Compass,
    Flame,
    Layers,
    Search,
    List,
    Map as MapIcon,
    TrendingUp,
    Navigation,
    Radio,
    Clock,
    X,
} from "lucide-react";

export interface DistrictDemandItem {
    district: string;
    users: number;
    sessions: number;
    avgSessionSeconds: number;
    percentOfMax: number;
    percentOfTotal: number;
}

interface Props {
    districtData: DistrictDemandItem[];
    timeframe: "today" | "7d" | "30d";
    totalVisitsCount?: number;
    highestDistrictName?: string;
}

// Known coordinates for platform districts (Bangkok metro & Yangon metro)
const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number; areaLabel: string }> = {
    // Bangkok Metropolitan Region
    "Khlong Tan": { lat: 13.7372, lng: 100.5980, areaLabel: "Watthana / Khlong Toei, Bangkok" },
    "Hua Mak": { lat: 13.7548, lng: 100.6453, areaLabel: "Bang Kapi, Bangkok" },
    "Udom Suk": { lat: 13.6791, lng: 100.6094, areaLabel: "Bang Na, Bangkok" },
    "Samrong": { lat: 13.6492, lng: 100.5985, areaLabel: "Samut Prakan, Bangkok Metro" },
    "On Nut": { lat: 13.7070, lng: 100.6012, areaLabel: "Suan Luang / Watthana, Bangkok" },
    "Phra Khanong": { lat: 13.7142, lng: 100.5937, areaLabel: "Phra Khanong, Bangkok" },
    "Bang Na": { lat: 13.6682, lng: 100.6045, areaLabel: "Bang Na, Bangkok" },
    "Asok": { lat: 13.7367, lng: 100.5604, areaLabel: "Sukhumvit 21, Bangkok" },
    "Thong Lo": { lat: 13.7329, lng: 100.5843, areaLabel: "Sukhumvit 55, Bangkok" },
    "Ekkamai": { lat: 13.7225, lng: 100.5855, areaLabel: "Sukhumvit 63, Bangkok" },
    "Ari": { lat: 13.7797, lng: 100.5447, areaLabel: "Phaya Thai, Bangkok" },
    "Sathorn": { lat: 13.7214, lng: 100.5303, areaLabel: "Sathorn, Bangkok" },
    "Silom": { lat: 13.7279, lng: 100.5283, areaLabel: "Bang Rak, Bangkok" },
    "Chatuchak": { lat: 13.8166, lng: 100.5567, areaLabel: "Chatuchak, Bangkok" },
    "Ladprao": { lat: 13.7933, lng: 100.6052, areaLabel: "Lat Phrao, Bangkok" },
    "Location not shared": { lat: 13.7280, lng: 100.5800, areaLabel: "Bangkok Metropolitan (Unshared)" },

    // Yangon Metropolitan Region
    "Bahan": { lat: 16.8124, lng: 96.1553, areaLabel: "Bahan, Yangon" },
    "Hlaing": { lat: 16.8520, lng: 96.1280, areaLabel: "Hlaing, Yangon" },
    "Sanchaung": { lat: 16.8050, lng: 96.1340, areaLabel: "Sanchaung, Yangon" },
    "Kamayut": { lat: 16.8280, lng: 96.1270, areaLabel: "Kamayut, Yangon" },
    "Dagon": { lat: 16.7970, lng: 96.1480, areaLabel: "Dagon, Yangon" },
    "Mayangone": { lat: 16.8720, lng: 96.1450, areaLabel: "Mayangone, Yangon" },
    "Yankin": { lat: 16.8370, lng: 96.1660, areaLabel: "Yankin, Yangon" },
    "Tamwe": { lat: 16.8130, lng: 96.1730, areaLabel: "Tamwe, Yangon" },
    "Kyauktada": { lat: 16.7760, lng: 96.1610, areaLabel: "Downtown, Yangon" },
};

function formatStay(seconds: number) {
    const total = Math.max(0, Math.round(seconds));
    const minutes = Math.round(total / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remain = minutes % 60;
    return remain ? `${hours}h ${remain}m` : `${hours}h`;
}

export function TodayActiveUserLocationMap({
    districtData,
    timeframe,
    totalVisitsCount,
    highestDistrictName,
}: Props) {
    const [viewMode, setViewMode] = useState<"map" | "list">("map");
    const [mapProvider, setMapProvider] = useState<"google" | "osm">("google");
    const [isExpanded, setIsExpanded] = useState(false);
    const [modalSearch, setModalSearch] = useState("");

    // Active selected hotspot index
    const [selectedDistrictName, setSelectedDistrictName] = useState<string | null>(null);

    // Calculate total active people
    const totalActivePeople = useMemo(
        () => totalVisitsCount || districtData.reduce((sum, d) => sum + d.users, 0),
        [totalVisitsCount, districtData]
    );

    // Current active district or highest
    const activeDistrict = useMemo(() => {
        if (selectedDistrictName) {
            const found = districtData.find((d) => d.district === selectedDistrictName);
            if (found) return found;
        }
        return districtData[0] || null;
    }, [districtData, selectedDistrictName]);

    // Resolved Coordinates for current center
    const currentCoords = useMemo(() => {
        if (activeDistrict && DISTRICT_COORDINATES[activeDistrict.district]) {
            return DISTRICT_COORDINATES[activeDistrict.district];
        }
        // Fallback Bangkok center
        return { lat: 13.7372, lng: 100.5980, areaLabel: "Bangkok Metropolitan Area" };
    }, [activeDistrict]);

    // Build embed URLs
    const googleEmbedUrl = useMemo(() => {
        const zoom = 13;
        return `https://maps.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}&hl=en&z=${zoom}&output=embed`;
    }, [currentCoords]);

    const osmEmbedUrl = useMemo(() => {
        const delta = 0.04;
        const bbox = `${currentCoords.lng - delta}%2C${currentCoords.lat - delta}%2C${currentCoords.lng + delta}%2C${currentCoords.lat + delta}`;
        return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${currentCoords.lat}%2C${currentCoords.lng}`;
    }, [currentCoords]);

    const activeEmbedUrl = mapProvider === "osm" ? osmEmbedUrl : googleEmbedUrl;

    // Filtered list for the expand modal
    const modalFilteredDistricts = useMemo(() => {
        if (!modalSearch.trim()) return districtData;
        const q = modalSearch.trim().toLowerCase();
        return districtData.filter((d) => d.district.toLowerCase().includes(q));
    }, [districtData, modalSearch]);

    return (
        <>
            <Card className="border-border/70 shadow-sm overflow-hidden bg-card/90 flex flex-col">
                {/* Card Header */}
                <CardHeader className="pb-2.5 border-b border-border/40 bg-muted/15 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-emerald-500 animate-pulse" />
                            Today Active User Locations
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {timeframe === "today"
                                ? "Live spatial distribution & district demand today"
                                : timeframe === "7d"
                                ? "Weekly district hotspots & user clusters"
                                : "Monthly location trends & ordering density"}
                        </CardDescription>
                    </div>

                    {/* Header Controls: Mode Toggle & Expand Button */}
                    <div className="flex items-center gap-1.5">
                        {/* Map / List View Toggle */}
                        <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border border-border/60">
                            <button
                                type="button"
                                onClick={() => setViewMode("map")}
                                className={`px-2 py-1 text-xs rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                                    viewMode === "map"
                                        ? "bg-background text-foreground shadow-xs font-semibold"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                                title="Map View"
                            >
                                <MapIcon className="h-3 w-3 text-emerald-500" />
                                <span className="hidden sm:inline">Map</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("list")}
                                className={`px-2 py-1 text-xs rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                                    viewMode === "list"
                                        ? "bg-background text-foreground shadow-xs font-semibold"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                                title="Ranked List View"
                            >
                                <List className="h-3 w-3" />
                                <span className="hidden sm:inline">List</span>
                            </button>
                        </div>

                        {/* Expand Map Modal Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsExpanded(true)}
                            className="h-7 px-2 text-xs gap-1 border-border/70 hover:border-emerald-500/40 hover:bg-emerald-500/5 cursor-pointer"
                            title="Expand Interactive Map View"
                        >
                            <Maximize2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="hidden md:inline">Expand</span>
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-0 flex-1 flex flex-col">
                    {viewMode === "map" ? (
                        <div className="relative flex-1 flex flex-col min-h-[340px]">
                            {/* Interactive District Quick-Select Pills Bar */}
                            <div className="p-2.5 px-3 bg-muted/30 border-b border-border/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1">
                                    <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
                                    Hotspots:
                                </span>
                                {districtData.slice(0, 6).map((item) => {
                                    const isSelected = activeDistrict?.district === item.district;
                                    return (
                                        <button
                                            key={item.district}
                                            type="button"
                                            onClick={() => setSelectedDistrictName(item.district)}
                                            className={`shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs transition-all cursor-pointer ${
                                                isSelected
                                                    ? "bg-emerald-500 text-white font-semibold shadow-xs"
                                                    : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/60"
                                            }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-emerald-500"}`} />
                                            <span>{item.district}</span>
                                            <span className={`text-[10px] font-mono ${isSelected ? "text-emerald-100" : "text-muted-foreground"}`}>
                                                ({item.users.toLocaleString()})
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Embedded Map Container */}
                            <div className="relative flex-1 w-full min-h-[290px] bg-muted/20 overflow-hidden">
                                <iframe
                                    title="Active User Locations Map"
                                    src={activeEmbedUrl}
                                    className="w-full h-full min-h-[290px] border-0"
                                    loading="lazy"
                                />

                                {/* Floating Glassmorphism Hotspot Summary Card */}
                                {activeDistrict && (
                                    <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs bg-background/90 backdrop-blur-md p-2.5 rounded-xl border border-border/80 shadow-lg text-xs space-y-1.5 pointer-events-auto">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                                    <Flame className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h5 className="font-bold text-foreground truncate text-xs">
                                                        {activeDistrict.district}
                                                    </h5>
                                                    <p className="text-[10px] text-muted-foreground truncate">
                                                        {currentCoords.areaLabel}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-1.5 py-0">
                                                {activeDistrict.users.toLocaleString()} users
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-border/40 text-[10px]">
                                            <div>
                                                <span className="text-muted-foreground block">Avg Session:</span>
                                                <strong className="text-foreground">{formatStay(activeDistrict.avgSessionSeconds)}</strong>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-muted-foreground block">Area Share:</span>
                                                <strong className="text-emerald-500">{activeDistrict.percentOfTotal}% of total</strong>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Floating Map Provider Pill */}
                                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-background/85 backdrop-blur-xs p-1 rounded-lg border border-border/70 shadow-xs">
                                    <button
                                        type="button"
                                        onClick={() => setMapProvider("google")}
                                        className={`px-1.5 py-0.5 text-[10px] rounded font-medium cursor-pointer ${
                                            mapProvider === "google"
                                                ? "bg-primary text-primary-foreground font-semibold"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        Google
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMapProvider("osm")}
                                        className={`px-1.5 py-0.5 text-[10px] rounded font-medium cursor-pointer ${
                                            mapProvider === "osm"
                                                ? "bg-primary text-primary-foreground font-semibold"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        OSM
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsExpanded(true)}
                                        className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded cursor-pointer"
                                        title="Expand Full Map"
                                    >
                                        <Maximize2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* List Mode: The Horizontal Distribution Meters */
                        <div className="p-4 sm:p-5 space-y-3.5 flex-1">
                            {districtData.length > 0 ? (
                                districtData.slice(0, 6).map((row, idx) => (
                                    <div
                                        key={row.district}
                                        onClick={() => {
                                            setSelectedDistrictName(row.district);
                                            setViewMode("map");
                                        }}
                                        className="space-y-1.5 group cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="h-5 w-5 rounded-md bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <span className="font-semibold text-foreground truncate group-hover:text-emerald-500 transition-colors">
                                                    {row.district}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-muted-foreground font-mono text-[11px]">
                                                    {row.users.toLocaleString()} people
                                                </span>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] font-medium px-1.5 py-0 h-4.5 bg-muted/70"
                                                >
                                                    {formatStay(row.avgSessionSeconds)} avg
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden relative">
                                            <div
                                                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500"
                                                style={{ width: `${Math.max(row.percentOfMax, 6)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-xs text-center p-4">
                                    <Compass className="h-8 w-8 mb-2 opacity-30" />
                                    <p>No district visits recorded yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Card Footer */}
                    <div className="p-2.5 px-4 border-t border-border/40 bg-muted/15 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                            Highest: {highestDistrictName || districtData[0]?.district || "Khlong Tan"}
                        </span>
                        <div className="flex items-center gap-2">
                            <span>
                                <strong>{totalActivePeople.toLocaleString()}</strong> people today
                            </span>
                            <span
                                onClick={() => setIsExpanded(true)}
                                className="text-emerald-500 font-semibold cursor-pointer hover:underline flex items-center gap-0.5"
                            >
                                Expand Map <Maximize2 className="h-2.5 w-2.5" />
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ─── Expanded Full Map Modal Dialog ───────────────────────────── */}
            <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
                <DialogContent className="max-w-5xl w-[96vw] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl">
                    <DialogHeader className="p-4 px-5 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                                <MapPin className="h-5 w-5 text-emerald-500" />
                                Today Active User Geospatial Map
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                Interactive high-resolution map of real-time customer locations, district demand, and session activity
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border/60">
                                <button
                                    type="button"
                                    onClick={() => setMapProvider("google")}
                                    className={`px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer ${
                                        mapProvider === "google"
                                            ? "bg-background text-foreground font-semibold shadow-xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    Google Maps
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMapProvider("osm")}
                                    className={`px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer ${
                                        mapProvider === "osm"
                                            ? "bg-background text-foreground font-semibold shadow-xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    OpenStreetMap
                                </button>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Modal Body: Split view of large map + district side panel */}
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[500px] max-h-[75vh]">
                        {/* Left / Center Map View (70% width on desktop) */}
                        <div className="relative flex-1 min-h-[350px] md:min-h-[500px] bg-muted/30">
                            <iframe
                                title="Expanded Active User Locations Map"
                                src={activeEmbedUrl}
                                className="w-full h-full min-h-[350px] md:min-h-[500px] border-0"
                                loading="lazy"
                            />

                            {/* Floating Active District Info Pill */}
                            {activeDistrict && (
                                <div className="absolute top-3 left-3 bg-background/95 backdrop-blur-md p-3 rounded-xl border border-border/80 shadow-lg text-xs space-y-1 z-10 max-w-xs">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <h4 className="font-bold text-foreground text-sm">
                                            {activeDistrict.district}
                                        </h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {currentCoords.areaLabel}
                                    </p>
                                    <div className="pt-2 border-t border-border/50 grid grid-cols-2 gap-2 text-[11px]">
                                        <div>
                                            <span className="text-muted-foreground block">Active Today:</span>
                                            <strong className="text-foreground text-sm font-bold">
                                                {activeDistrict.users.toLocaleString()}
                                            </strong>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block">Average Stay:</span>
                                            <strong className="text-emerald-500 text-sm font-bold">
                                                {formatStay(activeDistrict.avgSessionSeconds)}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Side: Searchable Districts Breakdown Panel (30% width on desktop) */}
                        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border/50 bg-card flex flex-col overflow-hidden">
                            {/* Panel Header & Search */}
                            <div className="p-3 border-b border-border/40 bg-muted/15 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <Layers className="h-3.5 w-3.5 text-emerald-500" />
                                        Districts ({modalFilteredDistricts.length})
                                    </span>
                                    <Badge variant="outline" className="text-[10px]">
                                        {totalActivePeople.toLocaleString()} users
                                    </Badge>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="Search district..."
                                        value={modalSearch}
                                        onChange={(e) => setModalSearch(e.target.value)}
                                        className="pl-8 h-8 text-xs bg-background/80"
                                    />
                                    {modalSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setModalSearch("")}
                                            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Scrollable District List */}
                            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 max-h-[380px] md:max-h-none">
                                {modalFilteredDistricts.map((item, idx) => {
                                    const isSelected = activeDistrict?.district === item.district;
                                    return (
                                        <div
                                            key={item.district}
                                            onClick={() => setSelectedDistrictName(item.district)}
                                            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                                                isSelected
                                                    ? "bg-emerald-500/10 border-emerald-500/40 shadow-xs"
                                                    : "bg-muted/20 border-border/60 hover:bg-muted/50 hover:border-border"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className={`h-5 w-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                                        isSelected ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                                                    }`}>
                                                        {idx + 1}
                                                    </span>
                                                    <span className="font-semibold text-xs text-foreground truncate">
                                                        {item.district}
                                                    </span>
                                                </div>
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-[10px] font-mono px-1.5 py-0 ${
                                                        isSelected ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold" : ""
                                                    }`}
                                                >
                                                    {item.users.toLocaleString()} users
                                                </Badge>
                                            </div>

                                            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatStay(item.avgSessionSeconds)} avg stay
                                                </span>
                                                <span className="font-semibold text-emerald-500">
                                                    {item.percentOfTotal}% share
                                                </span>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="w-full h-1.5 rounded-full bg-muted/60 overflow-hidden mt-1.5">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500"
                                                    style={{ width: `${Math.max(item.percentOfMax, 5)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-3 px-5 border-t border-border/50 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-medium">
                            <Navigation className="h-3.5 w-3.5 text-emerald-500" />
                            Live customer spatial telemetry updates with user app sessions
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsExpanded(false)}
                            className="h-7 text-xs"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
