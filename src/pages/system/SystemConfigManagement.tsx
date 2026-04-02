import { useEffect, useState, useCallback } from "react";
import { systemConfigService, SystemConfig } from "@/services/systemConfigService";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Edit2, Play, Search, Info, Plus, User } from "lucide-react";
import { format } from "date-fns";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SystemConfigManagement() {
    const [configs, setConfigs] = useState<SystemConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState<SystemConfig | null>(null);
    const [editingData, setEditingData] = useState<{ configKey: string; configValue: string; description: string }>({ 
        configKey: "", 
        configValue: "", 
        description: "" 
    });
    const [saving, setSaving] = useState(false);
    const [isAddMode, setIsAddMode] = useState(false);
    const [search, setSearch] = useState("");

    const fetchConfigs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await systemConfigService.getConfigs();
            setConfigs(data);
        } catch (error) {
            handleApiError(error, "Failed to load system configurations");
        } finally {
            setLoading(false);
        }
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchConfigs(); }, []);

    const handleEdit = (config: SystemConfig) => {
        setIsAddMode(false);
        setSelectedConfig(config);
        setEditingData({
            configKey: config.configKey,
            configValue: config.configValue,
            description: config.description
        });
    };

    const handleAdd = () => {
        setIsAddMode(true);
        setSelectedConfig({ id: 0, configKey: "", configValue: "", description: "", deleted: false } as unknown as SystemConfig);
        setEditingData({
            configKey: "",
            configValue: "",
            description: ""
        });
    };

    const handleSave = async () => {
        if (!selectedConfig && !isAddMode) return;
        const key = isAddMode ? editingData.configKey : selectedConfig?.configKey;
        if (!key) {
            toast.error("Configuration key is required");
            return;
        }

        setSaving(true);
        try {
            await systemConfigService.updateConfig(key, editingData.configValue, editingData.description);
            toast.success(isAddMode ? "Configuration created successfully" : "Configuration updated successfully");
            setSelectedConfig(null);
            setIsAddMode(false);
            fetchConfigs();
        } catch (error) {
            handleApiError(error, isAddMode ? "Failed to create configuration" : "Failed to update configuration");
        } finally {
            setSaving(false);
        }
    };

    const handleInit = async () => {
        try {
            await systemConfigService.initConfigs();
            toast.success("System configurations initialized");
            fetchConfigs();
        } catch (error) {
            handleApiError(error, "Failed to initialize system configurations");
        }
    };

    const filteredConfigs = configs.filter(c => 
        c.configKey.toLowerCase().includes(search.toLowerCase()) || 
        c.description.toLowerCase().includes(search.toLowerCase()) ||
        c.configValue.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Settings className="h-6 w-6 text-primary" />
                    <h1 className="text-lg font-semibold md:text-2xl">System Configuration</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleInit}>
                        <Play className="mr-2 h-4 w-4" /> Initialize Defaults
                    </Button>
                    <Button size="sm" onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" /> Add Config
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Global Settings</CardTitle>
                    <CardDescription>Manage application-wide settings and parameters.</CardDescription>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter configurations..."
                            className="pl-9 max-w-md"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Config Key</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(10)].map((_, i) => (
                                    <TableRow key={i}>
                                        {[...Array(4)].map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filteredConfigs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                        No configurations found.
                                    </TableCell>
                                </TableRow>
                            ) : filteredConfigs.map((config) => (
                                <TableRow key={config.id}>
                                    <TableCell className="font-mono text-xs font-semibold">
                                        {config.configKey}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate font-mono text-xs">
                                        {config.configValue}
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                                        {config.description}
                                    </TableCell>
                                    <TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex flex-col text-xs cursor-default">
                                                        <span className="font-medium text-muted-foreground">
                                                            {config.updatedBy?.fullName || "System"}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground/70">
                                                            {format(new Date(config.updatedAt), "MMM d, yyyy HH:mm")}
                                                        </span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="p-3">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-3 w-3" />
                                                            <span className="text-xs font-semibold">Audit Information</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                                                            <span className="text-muted-foreground">Created By:</span>
                                                            <span>{config.createdBy?.fullName || "System"}</span>
                                                            <span className="text-muted-foreground">Created At:</span>
                                                            <span>{format(new Date(config.createdAt), "MMM d, HH:mm")}</span>
                                                            <span className="text-muted-foreground">Updated By:</span>
                                                            <span>{config.updatedBy?.fullName || "System"}</span>
                                                            <span className="text-muted-foreground">Updated At:</span>
                                                            <span>{format(new Date(config.updatedAt), "MMM d, HH:mm")}</span>
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(config)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selectedConfig} onOpenChange={(open) => {
                if (!open) {
                    setSelectedConfig(null);
                    setIsAddMode(false);
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isAddMode ? "Add Configuration" : "Edit Configuration"}</DialogTitle>
                        <DialogDescription>
                            {isAddMode 
                                ? "Create a new application-wide configuration parameter." 
                                : `Modify the value for ${selectedConfig?.configKey}`}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedConfig && (
                        <div className="grid gap-4 py-4">
                            {isAddMode && (
                                <div className="space-y-2">
                                    <Label htmlFor="key">Configuration Key</Label>
                                    <Input
                                        id="key"
                                        placeholder="e.g. MAXIMUM_LOGIN_ATTEMPTS"
                                        value={editingData.configKey}
                                        onChange={(e) => setEditingData({ ...editingData, configKey: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="value">Configuration Value</Label>
                                <Input
                                    id="value"
                                    value={editingData.configValue}
                                    onChange={(e) => setEditingData({ ...editingData, configValue: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Internal use)</Label>
                                <Textarea
                                    id="description"
                                    value={editingData.description}
                                    onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="flex items-start gap-2 text-blue-600 text-xs bg-blue-50 p-3 rounded border border-blue-100">
                                <Info className="h-4 w-4 mt-0.5" />
                                <span>Changes to system configurations may take a few minutes to propagate across all services or may require a service restart depending on how they are consumed.</span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedConfig(null)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
