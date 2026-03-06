import { useState, useEffect } from "react";
import { shopRiderService, ShopRider } from "@/services/shopRiderService";
import { ShopService } from "@/services/shopService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function CreateRider() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const isEditMode = !!id;

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [vehicleType, setVehicleType] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [shopId, setShopId] = useState("");

    const [shops, setShops] = useState<any[]>([]);
    const [loadingShops, setLoadingShops] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadShops();
        if (isEditMode && id) {
            loadRider(parseInt(id));
        }
    }, [id, isEditMode]);

    const loadShops = async () => {
        setLoadingShops(true);
        try {
            const res = await ShopService.getAllShops(0, 100);
            setShops(res?.content || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingShops(false);
        }
    };

    const loadRider = async (riderId: number) => {
        setLoading(true);
        try {
            const rider = await shopRiderService.getRiderById(riderId);
            setName(rider.name);
            setPhone(rider.phone);
            setVehicleNumber(rider.vehicleNumber || "");
            setVehicleType(rider.vehicleType || "");
            setIsActive(rider.isActive);
            setShopId(rider.shopId.toString());
        } catch (error) {
            console.error(error);
            toast.error("Failed to load rider details");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shopId) {
            toast.error("Please select a shop");
            return;
        }

        setSubmitting(true);
        try {
            const riderData: Partial<ShopRider> = {
                name,
                phone,
                vehicleNumber,
                vehicleType,
                isActive,
                shopId: parseInt(shopId),
            };

            if (isEditMode && id) {
                await shopRiderService.updateRider(parseInt(id), riderData);
                toast.success("Rider updated successfully");
            } else {
                await shopRiderService.createRider(riderData);
                toast.success("Rider created successfully");
            }
            navigate("/shops/riders/manage");
        } catch (error) {
            console.error(error);
            toast.error(isEditMode ? "Failed to update rider" : "Failed to create rider");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <Button
                variant="ghost"
                className="mb-4 gap-2"
                onClick={() => navigate("/shops/riders/manage")}
            >
                <ArrowLeft className="h-4 w-4" /> Back to List
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>{isEditMode ? "Edit Rider" : "Add New Rider"}</CardTitle>
                    <CardDescription>
                        Enter the details for the delivery personnel.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="shop">Shop <span className="text-red-500">*</span></Label>
                            <Select value={shopId} onValueChange={setShopId} disabled={loadingShops}>
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingShops ? "Loading shops..." : "Select a shop"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {shops.map((shop) => (
                                        <SelectItem key={shop.id} value={shop.id.toString()}>
                                            {shop.nameEn || shop.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    placeholder="e.g. 0912345678"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                                <Input
                                    id="vehicleNumber"
                                    value={vehicleNumber}
                                    onChange={(e) => setVehicleNumber(e.target.value)}
                                    placeholder="e.g. 1A-1234"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vehicleType">Vehicle Type</Label>
                                <Select value={vehicleType} onValueChange={setVehicleType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BICYCLE">Bicycle</SelectItem>
                                        <SelectItem value="MOTORCYCLE">Motorcycle</SelectItem>
                                        <SelectItem value="CAR">Car</SelectItem>
                                        <SelectItem value="VAN">Van</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                            <Label htmlFor="active">Active & Available</Label>
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/shops/riders/manage")}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting || !name || !phone || !shopId}>
                                {submitting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                ) : isEditMode ? "Update Rider" : "Create Rider"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
