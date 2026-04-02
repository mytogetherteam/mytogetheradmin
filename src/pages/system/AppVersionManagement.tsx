import { useEffect, useState, useCallback, useRef } from "react";
import { appVersionService, AppVersion } from "@/services/appVersionService";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Smartphone, Edit2, Search, Info } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AppVersionManagement() {
    const [versions, setVersions] = useState<AppVersion[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<AppVersion | null>(null);
    const [editingData, setEditingData] = useState<Partial<AppVersion>>({});
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");

    const fetchVersions = useCallback(async () => {
        setLoading(true);
        try {
            const data = await appVersionService.getAppVersions();
            setVersions(data);
        } catch (error) {
            handleApiError(error, "Failed to load app versions");
        } finally {
            setLoading(false);
        }
    }, []);

    const isFired = useRef(false);
    useEffect(() => { 
        if (!isFired.current) {
            isFired.current = true;
            fetchVersions(); 
        }
    }, [fetchVersions]);

    const handleEdit = (version: AppVersion) => {
        setSelectedVersion(version);
        setEditingData(version);
    };

    const handleSave = async () => {
        if (!selectedVersion || !editingData.platform) return;
        setSaving(true);
        try {
            await appVersionService.updateAppVersionByPlatform(editingData.platform, editingData);
            toast.success("Version updated successfully");
            setSelectedVersion(null);
            fetchVersions();
        } catch (error) {
            handleApiError(error, "Failed to update version");
        } finally {
            setSaving(false);
        }
    };

    const filteredVersions = versions.filter(v => 
        v.platform.toLowerCase().includes(search.toLowerCase()) || 
        v.appType.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Smartphone className="h-6 w-6 text-primary" />
                    <h1 className="text-lg font-semibold md:text-2xl">App Version Management</h1>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>App Versions & Force Updates</CardTitle>
                    <CardDescription>Manage minimum and latest versions for mobile applications and configure update messages.</CardDescription>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter by platform or app type..."
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
                                <TableHead>Platform</TableHead>
                                <TableHead>App Type</TableHead>
                                <TableHead>Min Version</TableHead>
                                <TableHead>Latest Version</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <TableRow key={i}>
                                        {[...Array(6)].map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filteredVersions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        No versions found.
                                    </TableCell>
                                </TableRow>
                            ) : filteredVersions.map((version) => (
                                <TableRow key={version.id}>
                                    <TableCell className="font-semibold">
                                        {version.platform}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{version.appType}</Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {version.minimumVersion}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {version.latestVersion}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={version.isActive ? "default" : "secondary"}>
                                            {version.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(version)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selectedVersion} onOpenChange={(open) => !open && setSelectedVersion(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit App Version: {selectedVersion?.platform}</DialogTitle>
                        <DialogDescription>
                            Configure version requirements and update messages.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedVersion && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="platform">Platform</Label>
                                    <Input id="platform" value={editingData.platform} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="appType">App Type</Label>
                                    <Input id="appType" value={editingData.appType} disabled />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="minVersion">Minimum Version (Force Update)</Label>
                                    <Input
                                        id="minVersion"
                                        placeholder="e.g. 1.0.0"
                                        value={editingData.minimumVersion}
                                        onChange={(e) => setEditingData({ ...editingData, minimumVersion: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="latestVersion">Latest Version</Label>
                                    <Input
                                        id="latestVersion"
                                        placeholder="e.g. 1.2.0"
                                        value={editingData.latestVersion}
                                        onChange={(e) => setEditingData({ ...editingData, latestVersion: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="updateUrl">Update URL (Store Link)</Label>
                                <Input
                                    id="updateUrl"
                                    placeholder="https://..."
                                    value={editingData.updateUrl}
                                    onChange={(e) => setEditingData({ ...editingData, updateUrl: e.target.value })}
                                />
                            </div>

                            <Tabs defaultValue="en" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="en">English</TabsTrigger>
                                    <TabsTrigger value="mm">Myanmar</TabsTrigger>
                                    <TabsTrigger value="th">Thai</TabsTrigger>
                                </TabsList>
                                <TabsContent value="en" className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="msgEn">Update Message (EN)</Label>
                                        <Textarea
                                            id="msgEn"
                                            value={editingData.updateMessageEn}
                                            onChange={(e) => setEditingData({ ...editingData, updateMessageEn: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                </TabsContent>
                                <TabsContent value="mm" className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="msgMm">Update Message (MM)</Label>
                                        <Textarea
                                            id="msgMm"
                                            value={editingData.updateMessageMm}
                                            onChange={(e) => setEditingData({ ...editingData, updateMessageMm: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                </TabsContent>
                                <TabsContent value="th" className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="msgTh">Update Message (TH)</Label>
                                        <Textarea
                                            id="msgTh"
                                            value={editingData.updateMessageTh}
                                            onChange={(e) => setEditingData({ ...editingData, updateMessageTh: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <div className="flex items-start gap-2 text-blue-600 text-xs bg-blue-50 p-3 rounded border border-blue-100">
                                <Info className="h-4 w-4 mt-0.5" />
                                <span>Minimum version updates will trigger a force update prompt in the mobile app. Users below this version will not be able to continue using the app.</span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedVersion(null)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
