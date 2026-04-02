import { useEffect, useState, useCallback } from "react";
import { orderTimeoutService, OrderTimeoutRule } from "@/services/orderTimeoutService";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Timer, Edit2, Play, AlertTriangle, Plus } from "lucide-react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function OrderTimeoutManagement() {
    const [timeouts, setTimeouts] = useState<OrderTimeoutRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTimeout, setSelectedTimeout] = useState<OrderTimeoutRule | null>(null);
    const [editingData, setEditingData] = useState<Partial<OrderTimeoutRule>>({});
    const [saving, setSaving] = useState(false);
    const [isAddMode, setIsAddMode] = useState(false);

    const ORDER_STATUSES = [
        "PENDING",
        "CONFIRMED",
        "AWAITING_APPROVAL",
        "PAYMENT_SLIP_REQUESTED",
        "PAYMENT_UPLOADED",
        "PAYMENT_VERIFIED",
        "PREPARING",
        "ON_THE_WAY",
        "DELIVERED",
        "CANCELLED",
        "INTERNAL_TRACKING"
    ];

    const fetchTimeouts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await orderTimeoutService.getOrderTimeouts();
            setTimeouts(data);
        } catch (e) {
            handleApiError(e, "Failed to load order timeouts");
        } finally {
            setLoading(false);
        }
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchTimeouts(); }, []);

    const handleEdit = (timeout: OrderTimeoutRule) => {
        setIsAddMode(false);
        setSelectedTimeout(timeout);
        setEditingData({
            status: timeout.status,
            timeoutMinutes: timeout.timeoutMinutes,
            alertTarget: timeout.alertTarget,
            enabled: timeout.enabled
        });
    };

    const handleAdd = () => {
        setIsAddMode(true);
        setSelectedTimeout({ id: 0, status: "", timeoutMinutes: 30, alertTarget: "SHOP", enabled: true, deleted: false } as unknown as OrderTimeoutRule);
        setEditingData({
            status: "PENDING",
            timeoutMinutes: 30,
            alertTarget: "SHOP",
            enabled: true
        });
    };

    const handleSave = async () => {
        if (!selectedTimeout && !isAddMode) return;
        const status = isAddMode ? editingData.status : selectedTimeout?.status;
        if (!status) return;

        setSaving(true);
        try {
            const requestData: Record<string, unknown> = {};
            if (editingData.timeoutMinutes !== undefined) {
                requestData.timeoutMinutes = editingData.timeoutMinutes;
            }
            if (editingData.alertTarget) {
                requestData.alertTarget = editingData.alertTarget;
            }
            if (editingData.enabled !== undefined) {
                requestData.enabled = editingData.enabled;
            }
            if (isAddMode && editingData.status) {
                requestData.status = editingData.status;
            }

            const formData = new FormData();
            formData.append("data", new Blob([JSON.stringify(requestData)], { type: "application/json" }));

            await orderTimeoutService.updateOrderTimeout(status, formData);
            toast.success(isAddMode ? "Order timeout created successfully" : "Order timeout updated successfully");
            setSelectedTimeout(null);
            setIsAddMode(false);
            fetchTimeouts();
        } catch (e) {
            handleApiError(e, "Failed to update order timeout");
        } finally {
            setSaving(false);
        }
    };

    const handleInit = async () => {
        try {
            await orderTimeoutService.initOrderTimeouts();
            toast.success("Default order timeouts initialized");
            fetchTimeouts();
        } catch (e) {
            handleApiError(e, "Failed to initialize order timeouts");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Timer className="h-6 w-6 text-primary" />
                    <h1 className="text-lg font-semibold md:text-2xl">Order Timeout Management</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleInit}>
                        <Play className="mr-2 h-4 w-4" /> Initialize Defaults
                    </Button>
                    <Button size="sm" onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" /> Add Rule
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Timeout Rules</CardTitle>
                    <CardDescription>Configure how long an order can stay in a certain status before alerting.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order Status</TableHead>
                                <TableHead>Timeout (Minutes)</TableHead>
                                <TableHead>Alert Target</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        {[...Array(5)].map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : timeouts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                        No timeout rules found. Click "Initialize Defaults" to create them.
                                    </TableCell>
                                </TableRow>
                            ) : timeouts.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono">
                                            {rule.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{rule.timeoutMinutes}m</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {rule.alertTarget}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {rule.enabled ? (
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Enabled</Badge>
                                        ) : (
                                            <Badge variant="secondary">Disabled</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selectedTimeout} onOpenChange={(open) => {
                if (!open) {
                    setSelectedTimeout(null);
                    setIsAddMode(false);
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isAddMode ? "Add Timeout Rule" : "Edit Timeout Rule"}</DialogTitle>
                        <DialogDescription>
                            {isAddMode 
                                ? "Configure a new timeout rule for an order status." 
                                : `Adjust the timeout settings for status: ${selectedTimeout?.status}`}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedTimeout && (
                        <div className="grid gap-4 py-4">
                            {isAddMode && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="status" className="text-right">
                                        Status
                                    </Label>
                                    <Select
                                        value={editingData.status}
                                        onValueChange={(value) => setEditingData({ ...editingData, status: value })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ORDER_STATUSES.map(s => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="timeout" className="text-right">
                                    Minutes
                                </Label>
                                <Input
                                    id="timeout"
                                    type="number"
                                    value={editingData.timeoutMinutes}
                                    onChange={(e) => setEditingData({ ...editingData, timeoutMinutes: parseInt(e.target.value) })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="target" className="text-right">
                                    Alert Target
                                </Label>
                                <Select
                                    value={editingData.alertTarget}
                                    onValueChange={(value) => setEditingData({ ...editingData, alertTarget: value as "SHOP" | "USER" | "ADMIN" | "ALL" })}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select target" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SHOP">SHOP</SelectItem>
                                        <SelectItem value="USER">USER</SelectItem>
                                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                                        <SelectItem value="ALL">ALL</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="enabled" className="text-right">
                                    Enabled
                                </Label>
                                <div className="col-span-3 flex items-center space-x-2">
                                    <Switch
                                        id="enabled"
                                        checked={editingData.enabled}
                                        onCheckedChange={(checked) => setEditingData({ ...editingData, enabled: checked })}
                                    />
                                </div>
                            </div>
                            {editingData.timeoutMinutes === 0 && (
                                <div className="flex items-center gap-2 text-amber-600 text-xs bg-amber-50 p-2 rounded border border-amber-200">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>Setting timeout to 0 may disable automatic alerts for this status.</span>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedTimeout(null)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
