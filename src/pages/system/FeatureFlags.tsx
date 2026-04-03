import { useState, useEffect, useRef } from "react";
import { appManagementService, FeatureFlag } from "@/services/appManagementService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flag, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
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

export default function FeatureFlags() {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingFlag, setDeletingFlag] = useState<number | null>(null);
    const [confirmFlag, setConfirmFlag] = useState<FeatureFlag | null>(null);

    const isFired = useRef(false);
    useEffect(() => {
        if (!isFired.current) {
            isFired.current = true;
            loadFlags();
        }
    }, []);

    const loadFlags = async () => {
        setLoading(true);
        try {
            const data = await appManagementService.getFeatureFlags();
            setFlags(data);
        } catch (error) {
            handleApiError(error, "Failed to load feature flags");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFlag = async () => {
        if (!confirmFlag) return;
        setDeletingFlag(confirmFlag.id);
        setConfirmFlag(null);
        try {
            await appManagementService.deleteFeatureFlag(confirmFlag.id);
            setFlags(prev => prev.filter(f => f.id !== confirmFlag.id));
            toast.success(`Feature flag "${confirmFlag.flagKey}" deleted`);
        } catch (error) {
            handleApiError(error, "Failed to delete feature flag");
        } finally {
            setDeletingFlag(null);
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
        <div className="container mx-auto py-10 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
                <p className="text-muted-foreground text-lg">Control application features in real-time.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {flags.length > 0 ? (
                    flags.map((flag) => (
                        <Card key={flag.id}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg flex items-center gap-2 mb-1 break-all">
                                            <Flag className="h-4 w-4 shrink-0" />
                                            <span className="truncate" title={flag.flagKey}>{flag.flagKey}</span>
                                        </CardTitle>
                                        <CardDescription className="font-mono text-xs mt-1">{flag.targetApp}</CardDescription>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                                        onClick={() => setConfirmFlag(flag)}
                                        disabled={deletingFlag === flag.id}
                                    >
                                        {deletingFlag === flag.id
                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                            : <Trash2 className="h-4 w-4" />
                                        }
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground min-h-[40px]">
                                    {flag.description || "No description provided."}
                                </p>
                                <div className="flex flex-wrap gap-2 pt-2 border-t">
                                    <Badge variant="outline" className="text-[10px]">{flag.targetApp}</Badge>
                                    <Badge variant="outline" className="text-[10px]">{flag.targetPlatform}</Badge>
                                    {flag.minVersion && <Badge variant="outline" className="text-[10px]">Min: {flag.minVersion}</Badge>}
                                    {flag.maxVersion && <Badge variant="outline" className="text-[10px]">Max: {flag.maxVersion}</Badge>}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-muted-foreground border rounded-lg bg-muted/20">
                        No feature flags configured.
                    </div>
                )}
            </div>

            {/* Delete confirmation dialog */}
            <AlertDialog open={!!confirmFlag} onOpenChange={(open) => { if (!open) setConfirmFlag(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Feature Flag</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{confirmFlag?.flagKey}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDeleteFlag}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

