import { useState, useEffect } from "react";
import { appManagementService, SystemLatency } from "@/services/appManagementService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Server, Globe, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SystemHealth() {
    const [stats, setStats] = useState<SystemLatency | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await appManagementService.getSystemLatency();
            setStats(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load system health stats");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (latency: number) => {
        if (latency < 100) return "text-green-500 bg-green-50";
        if (latency < 300) return "text-yellow-500 bg-yellow-50";
        return "text-red-500 bg-red-50";
    };

    const getStatusText = (latency: number) => {
        if (latency < 100) return "Healthy";
        if (latency < 300) return "Degraded";
        return "Critical";
    };

    if (loading && !stats) {
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
                    <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
                    <p className="text-muted-foreground text-lg">Real-time infrastructure latency and status monitoring.</p>
                </div>
                <Button onClick={loadStats} disabled={loading} variant="outline" className="gap-2">
                    <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Database (Postgres)</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.database || 0}ms</div>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge className={getStatusColor(stats?.database || 0)} variant="outline">
                                {getStatusText(stats?.database || 0)}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cache Layer (Redis)</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.redis || 0}ms</div>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge className={getStatusColor(stats?.redis || 0)} variant="outline">
                                {getStatusText(stats?.redis || 0)}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">External APIs</CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.externalApi || 0}ms</div>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge className={getStatusColor(stats?.externalApi || 0)} variant="outline">
                                {getStatusText(stats?.externalApi || 0)}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        System Logs Summary
                    </CardTitle>
                    <CardDescription>Recent high-level system events and errors.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/5 text-muted-foreground">
                        Detailed monitoring dashboard coming soon.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
