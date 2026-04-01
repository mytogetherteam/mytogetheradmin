import { useEffect, useState, useCallback } from "react";
import { appContentService, AppContent } from "@/services/appContentService";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Edit2, Send, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

export default function AppContentManagement() {
    const [contents, setContents] = useState<AppContent[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedContent, setSelectedContent] = useState<AppContent | null>(null);
    const [editingData, setEditingData] = useState<Partial<AppContent>>({});
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");

    const fetchContents = useCallback(async () => {
        setLoading(true);
        try {
            const data = await appContentService.getAppContents();
            setContents(data);
        } catch {
            toast.error("Failed to load app contents");
        } finally {
            setLoading(false);
        }
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchContents(); }, []);

    const handleEdit = (content: AppContent) => {
        setSelectedContent(content);
        setEditingData(content);
    };

    const handleSave = async () => {
        if (!selectedContent || !editingData.pageKey) return;
        setSaving(true);
        try {
            await appContentService.updateAppContent(editingData.pageKey, editingData);
            toast.success("Content updated successfully");
            setSelectedContent(null);
            fetchContents();
        } catch {
            toast.error("Failed to update content");
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async (key: string) => {
        const content = contents.find(c => c.pageKey === key);
        if (!content) return;
        try {
            await appContentService.publishAppContent(key, content.targetApp);
            toast.success("Content published successfully");
            fetchContents();
        } catch {
            toast.error("Failed to publish content");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this content?")) return;
        try {
            await appContentService.deleteAppContent(id);
            toast.success("Content deleted successfully");
            fetchContents();
        } catch {
            toast.error("Failed to delete content");
        }
    };

    const filteredContents = contents.filter(c => 
        c.pageKey.toLowerCase().includes(search.toLowerCase()) || 
        c.titleEn.toLowerCase().includes(search.toLowerCase()) ||
        c.targetApp.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    <h1 className="text-lg font-semibold md:text-2xl">App Content Management</h1>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Page Content</CardTitle>
                    <CardDescription>Manage static page content for mobile and web apps (Privacy Policy, Terms, etc.).</CardDescription>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter by key or title..."
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
                                <TableHead>Page Key</TableHead>
                                <TableHead>Target App</TableHead>
                                <TableHead>Title (EN)</TableHead>
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
                            ) : filteredContents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                        No content found.
                                    </TableCell>
                                </TableRow>
                            ) : filteredContents.map((content) => (
                                <TableRow key={content.id}>
                                    <TableCell className="font-mono text-xs font-semibold">
                                        {content.pageKey}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{content.targetApp}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {content.titleEn}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={content.isActive ? "default" : "secondary"}>
                                            {content.isActive ? "Active" : "Draft"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(content)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handlePublish(content.pageKey)} title="Publish">
                                                <Send className="h-4 w-4 text-green-600" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(content.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selectedContent} onOpenChange={(open) => !open && setSelectedContent(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit App Content</DialogTitle>
                        <DialogDescription>
                            Modify content for {selectedContent?.pageKey} ({selectedContent?.targetApp}).
                        </DialogDescription>
                    </DialogHeader>
                    {selectedContent && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pageKey">Page Key</Label>
                                    <Input id="pageKey" value={editingData.pageKey} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="targetApp">Target App</Label>
                                    <Input id="targetApp" value={editingData.targetApp} disabled />
                                </div>
                            </div>

                            <Tabs defaultValue="en" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="en">English</TabsTrigger>
                                    <TabsTrigger value="mm">Myanmar</TabsTrigger>
                                    <TabsTrigger value="th">Thai</TabsTrigger>
                                </TabsList>
                                <TabsContent value="en" className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="titleEn">Title (EN)</Label>
                                        <Input
                                            id="titleEn"
                                            value={editingData.titleEn}
                                            onChange={(e) => setEditingData({ ...editingData, titleEn: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contentEn">Content (EN)</Label>
                                        <Textarea
                                            id="contentEn"
                                            value={editingData.contentEn}
                                            onChange={(e) => setEditingData({ ...editingData, contentEn: e.target.value })}
                                            rows={10}
                                        />
                                    </div>
                                </TabsContent>
                                <TabsContent value="mm" className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="titleMm">Title (MM)</Label>
                                        <Input
                                            id="titleMm"
                                            value={editingData.titleMm}
                                            onChange={(e) => setEditingData({ ...editingData, titleMm: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contentMm">Content (MM)</Label>
                                        <Textarea
                                            id="contentMm"
                                            value={editingData.contentMm}
                                            onChange={(e) => setEditingData({ ...editingData, contentMm: e.target.value })}
                                            rows={10}
                                        />
                                    </div>
                                </TabsContent>
                                <TabsContent value="th" className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="titleTh">Title (TH)</Label>
                                        <Input
                                            id="titleTh"
                                            value={editingData.titleTh}
                                            onChange={(e) => setEditingData({ ...editingData, titleTh: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contentTh">Content (TH)</Label>
                                        <Textarea
                                            id="contentTh"
                                            value={editingData.contentTh}
                                            onChange={(e) => setEditingData({ ...editingData, contentTh: e.target.value })}
                                            rows={10}
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedContent(null)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
