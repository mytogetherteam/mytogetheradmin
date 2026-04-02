import { useState, useEffect, useRef } from "react";
import { appManagementService, OnboardingScreen } from "@/services/appManagementService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Presentation, Edit, Trash2, Loader2 } from "lucide-react";
import { handleApiError } from "@/lib/error-utils";

export default function OnboardingManagement() {
    const [screens, setScreens] = useState<OnboardingScreen[]>([]);
    const [loading, setLoading] = useState(true);

    const isFired = useRef(false);
    useEffect(() => {
        if (!isFired.current) {
            isFired.current = true;
            loadScreens();
        }
    }, []);

    const loadScreens = async () => {
        setLoading(true);
        try {
            const data = await appManagementService.getOnboardingScreens();
            setScreens(data);
        } catch (error) {
            handleApiError(error, "Failed to load onboarding screens");
        } finally {
            setLoading(false);
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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Onboarding Screens</h1>
                    <p className="text-muted-foreground text-lg">Manage mobile app onboarding screens.</p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Screen
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Presentation className="h-5 w-5" />
                        Screens List
                    </CardTitle>
                    <CardDescription>All onboarding screens currently configured for the mobile apps.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order</TableHead>
                                <TableHead>Image</TableHead>
                                <TableHead>Title (EN)</TableHead>
                                <TableHead>Platform</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {screens.length > 0 ? (
                                screens.map((screen) => (
                                    <TableRow key={screen.id}>
                                        <TableCell>{screen.displayOrder}</TableCell>
                                        <TableCell>
                                            <div className="w-16 h-10 rounded border bg-muted overflow-hidden">
                                                {screen.imageUrl && <img src={screen.imageUrl} alt={screen.titleEn} className="w-full h-full object-cover" />}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{screen.titleEn}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{screen.platform}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={screen.isActive ? "default" : "secondary"}>
                                                {screen.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No onboarding screens found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
