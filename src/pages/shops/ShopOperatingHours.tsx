import { useEffect, useState, useMemo } from "react"
import { ShopService, OperatingHour, Shop } from "@/services/shopService"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/ui/loader"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { MapPin, Clock, Store } from "lucide-react"
import { toast } from "sonner"

const daysOfWeekMap: Record<number, string> = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
    7: "Sunday",
    0: "Sunday",
}

export default function ShopOperatingHours() {

    const [shops, setShops] = useState<Shop[]>([])
    const [selectedShopId, setSelectedShopId] = useState<number | null>(null)
    const [operatingHours, setOperatingHours] = useState<OperatingHour[]>([])

    const [loadingShops, setLoadingShops] = useState(true)
    const [loadingHours, setLoadingHours] = useState(false)

    useEffect(() => {
        loadShops()
    }, [])

    useEffect(() => {
        if (selectedShopId) {
            loadOperatingHours(selectedShopId)
        } else {
            setOperatingHours([])
        }
    }, [selectedShopId])

    const loadShops = async () => {
        setLoadingShops(true)
        try {
            // Using lookup for lightweight dropdown if available, falling back to full list

            const response = await ShopService.getAllShops(0, 1000)
            const list = response?.content || []
            setShops(Array.isArray(list) ? list : [])
        } catch (error) {
            console.error("Failed to load shops:", error)
            toast.error("Failed to load shops")
        } finally {
            setLoadingShops(false)
        }
    }

    const loadOperatingHours = async (shopId: number) => {
        setLoadingHours(true)
        try {

            const data = await ShopService.getShopOperatingHours(shopId)
            setOperatingHours(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Failed to load operating hours:", error)
            toast.error("Failed to load operating hours for this shop")
            setOperatingHours([])
        } finally {
            setLoadingHours(false)
        }
    }


    const formatTimeObj = (timeVal: string | { hour: number; minute: number } | undefined) => {
        if (!timeVal) return ""
        if (typeof timeVal === 'string') return timeVal.slice(0, 5); // From "HH:mm:ss" to "HH:mm"
        
        const pad = (num: number) => String(num).padStart(2, '0')
        // Check if it has hour/minute structure
        if (typeof timeVal.hour === 'number' && typeof timeVal.minute === 'number') {
            return `${pad(timeVal.hour)}:${pad(timeVal.minute)}`
        }
        return String(timeVal)
    }

    const formatTime = (timeStr: string | undefined, timeValue: string | { hour: number; minute: number } | undefined) => {
        if (timeStr) return timeStr;
        if (timeValue) return formatTimeObj(timeValue);
        return "";
    }

    const selectedShop = shops.find(s => s.id === selectedShopId)

    // Sort operating hours by dayOfWeek (Monday(1) to Sunday(7 or 0 -> treat as 7))
    const sortedHours = useMemo(() => {
        if (!operatingHours.length) return [];
        return [...operatingHours].sort((a, b) => {
            const dayA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
            const dayB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
            return dayA - dayB;
        });
    }, [operatingHours]);

    return (
        <div className="container mx-auto py-10 max-w-5xl">
            <Card className="flex flex-col h-full shadow-sm">
                <CardHeader className="bg-muted/30 border-b pb-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="leading-tight text-2xl flex items-center gap-2">
                                <Clock className="h-6 w-6 text-primary" />
                                Shop Operating Hours
                            </CardTitle>
                            <CardDescription className="text-sm mt-1">
                                View operating hours for verified shops and restaurants.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="mb-8">
                        <label className="text-sm font-medium mb-2 block">Select a Shop/Restaurant</label>
                        {loadingShops ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader className="h-4 w-4" /> Loading shops...
                            </div>
                        ) : (
                            <Select
                                value={selectedShopId ? `${selectedShopId}` : ""}
                                onValueChange={(val) => setSelectedShopId(Number(val))}
                            >
                                <SelectTrigger className="w-full md:w-[400px]">
                                    <SelectValue placeholder="-- Select a Shop --" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {shops.map(shop => (
                                        <SelectItem key={shop.id} value={`${shop.id}`}>
                                            {shop.nameEn || shop.nameMm || shop.name} {shop.city || shop.cityMm ? `- ${shop.city || shop.cityMm}` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {selectedShop && (
                            <div className="mt-4 p-4 bg-muted/20 rounded-lg flex items-start gap-4 border">
                                <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0 border">
                                    {selectedShop.logoUrl ? (
                                        <img src={selectedShop.logoUrl} alt={selectedShop.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-medium bg-secondary/50">N/A</div>
                                    )}
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h3 className="font-semibold text-lg leading-none mb-1">{selectedShop.nameEn || selectedShop.nameMm || selectedShop.name}</h3>
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {[selectedShop.district || selectedShop.districtMm, selectedShop.city || selectedShop.cityMm].filter(Boolean).join(", ") || "No location provided"}
                                    </div>
                                    <div className="mt-2 flex gap-2">
                                        <Badge variant="outline" className="capitalize text-[10px] py-0">{selectedShop.category}</Badge>
                                        <Badge className={`text-[10px] py-0 ${selectedShop.isActive !== false ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"}`} variant="secondary">
                                            {selectedShop.isActive !== false ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedShopId ? (
                        loadingHours ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Loader size="lg" className="mb-4" />
                                <p>Loading business hours...</p>
                            </div>
                        ) : operatingHours.length > 0 ? (
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-[150px] font-semibold text-foreground">Day</TableHead>
                                            <TableHead className="font-semibold text-foreground">Status</TableHead>
                                            <TableHead className="font-semibold text-foreground">Opening Time</TableHead>
                                            <TableHead className="font-semibold text-foreground">Closing Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedHours.map((hour, index) => {
                                            const dayName = daysOfWeekMap[hour.dayOfWeek] || `Day ${hour.dayOfWeek}`
                                            const openTime = formatTime(hour.openTime, hour.openingTime)
                                            const closeTime = formatTime(hour.closeTime, hour.closingTime)

                                            return (
                                                <TableRow key={index} className="hover:bg-muted/30">
                                                    <TableCell className="font-medium">{dayName}</TableCell>
                                                    <TableCell>
                                                        {hour.isClosed ? (
                                                            <Badge variant="secondary" className="bg-red-50 text-red-600 hover:bg-red-50 font-medium border-red-100">Closed</Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="bg-green-50 text-green-600 hover:bg-green-50 font-medium border-green-100">Open</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm">
                                                        {hour.isClosed ? <span className="text-muted-foreground">—</span> : (openTime || "N/A")}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm">
                                                        {hour.isClosed ? <span className="text-muted-foreground">—</span> : (closeTime || "N/A")}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-12 border rounded-md bg-muted/10">
                                <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                                <h3 className="text-lg font-medium text-foreground">No Operating Hours Set</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    This shop hasn't configured its operating hours yet.
                                </p>
                            </div>
                        )
                    ) : (
                        <div className="text-center py-16 border rounded-md border-dashed">
                            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-10" />
                            <p className="text-muted-foreground">Please select a shop from the dropdown above to view its operating hours.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
