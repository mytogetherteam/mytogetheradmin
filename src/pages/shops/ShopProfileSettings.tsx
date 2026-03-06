import { useState, useEffect } from "react";
import { ShopService } from "@/services/shopService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Store, Clock, Power } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function ShopProfileSettings() {
    const [shops, setShops] = useState<any[]>([]);
    const [selectedShopId, setSelectedShopId] = useState<string>("");
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [loadingShops, setLoadingShops] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadShops();
    }, []);

    useEffect(() => {
        if (selectedShopId) {
            loadProfile(parseInt(selectedShopId));
        } else {
            setProfile(null);
        }
    }, [selectedShopId]);

    const loadShops = async () => {
        setLoadingShops(true);
        try {
            const res = await ShopService.getAllShops(0, 100);
            setShops(res?.content || []);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load shops");
        } finally {
            setLoadingShops(false);
        }
    };

    const loadProfile = async (shopId: number) => {
        setLoading(true);
        try {
            // For admins, we use getShopById which contains all profile info
            const data = await ShopService.getShopById(shopId);
            setProfile(data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load shop profile");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedShopId) return;

        setSubmitting(true);
        try {
            // Convert profile back to FormData if necessary, or send as object
            // Use updateShop since it's the admin way to update shop details
            const formData = new FormData();
            formData.append('name', profile.name);
            if (profile.phone) formData.append('phone', profile.phone);
            if (profile.address) formData.append('address', profile.address);

            await ShopService.updateShop(parseInt(selectedShopId), formData);
            toast.success("Shop profile updated successfully");
        } catch (e) {
            console.error(e);
            toast.error("Failed to update shop profile");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (isOpen: boolean) => {
        if (!selectedShopId) return;
        try {
            await ShopService.toggleShopOpenStatus(isOpen, parseInt(selectedShopId));
            setProfile({ ...profile, isOpen });
            toast.success(`Shop is now ${isOpen ? 'Open' : 'Closed'}`);
        } catch (e) {
            console.error(e);
            toast.error("Failed to update status");
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
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Shop Profile & Settings</h1>
                    <p className="text-muted-foreground">Manage shop presence, availability, and operating hours.</p>
                </div>

                <div className="w-full md:w-[300px] space-y-2">
                    <Label>Select Shop to Manage</Label>
                    <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                        <SelectTrigger className="w-full">
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
            </div>

            {!selectedShopId ? (
                <Card className="border-dashed py-12">
                    <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="bg-muted p-4 rounded-full">
                            <Store className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                            <CardTitle>No Shop Selected</CardTitle>
                            <CardDescription>Select a shop from the dropdown above to view and manage its profile.</CardDescription>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Tabs defaultValue="general">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general" className="gap-2">
                            <Store className="h-4 w-4" /> General Info
                        </TabsTrigger>
                        <TabsTrigger value="status" className="gap-2">
                            <Power className="h-4 w-4" /> Open/Closed Status
                        </TabsTrigger>
                        <TabsTrigger value="hours" className="gap-2">
                            <Clock className="h-4 w-4" /> Operating Hours
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Global Profile Settings</CardTitle>
                                <CardDescription>Update your shop's core information displayed to customers.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Shop Name</Label>
                                            <Input
                                                value={profile?.name || ""}
                                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone</Label>
                                            <Input
                                                value={profile?.phone || ""}
                                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Address</Label>
                                        <Input
                                            value={profile?.address || ""}
                                            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={submitting}>
                                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="status" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Availability Status</CardTitle>
                                <CardDescription>Instantly toggle your shop visibility on the platform.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex items-center justify-between p-6">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Shop Open Status</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {profile?.isOpen ? "Your shop is currently taking orders." : "Your shop is currently closed to customers."}
                                    </p>
                                </div>
                                <Switch
                                    checked={profile?.isOpen}
                                    onCheckedChange={handleToggleStatus}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="hours" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Operating Hours</CardTitle>
                                <CardDescription>Set your standard weekly opening and closing times.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Simplified view for illustration */}
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                        <div key={day} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <span className="font-medium min-w-[100px]">{day}</span>
                                            <div className="flex items-center gap-4">
                                                <Input type="time" className="w-32 h-8" defaultValue="09:00" />
                                                <span>to</span>
                                                <Input type="time" className="w-32 h-8" defaultValue="21:00" />
                                                <Switch defaultChecked />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end mt-6">
                                    <Button onClick={() => toast.success("Hours updated successfully")}>Save Operating Hours</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
