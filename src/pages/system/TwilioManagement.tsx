import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  PhoneCall,
  PhoneOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Radio,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { handleApiError } from "@/lib/error-utils";
import { twilioService, TwilioConfigData } from "@/services/twilioService";

export default function TwilioManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<TwilioConfigData | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await twilioService.getConfig();
      setConfig(data);
    } catch (error) {
      handleApiError(error, "Failed to load Twilio configuration");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const handleToggle = async (enabled: boolean) => {
    if (!config) return;
    setSaving(true);
    const previous = config;
    setConfig({ ...config, orderCallEnabled: enabled });

    try {
      const updated = await twilioService.updateConfig(enabled);
      setConfig(updated);
      toast.success(
        enabled
          ? "Twilio automated order phone calls enabled platform-wide"
          : "Twilio automated order phone calls disabled platform-wide"
      );
    } catch (error) {
      setConfig(previous);
      handleApiError(error, "Failed to update Twilio settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <PhoneCall className="h-6 w-6 text-primary" />
            Twilio Order Phone Calls
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Control automated phone call notifications when customers place an order.
            When enabled, the system automatically places an audio alert call to the
            restaurant's phone number.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchConfig()}
          disabled={loading || saving}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Main Switch Card */}
      <Card className="border-2 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <span>Master Automated Call Switch</span>
                {config && (
                  <Badge
                    variant={config.orderCallEnabled ? "default" : "secondary"}
                    className={
                      config.orderCallEnabled
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {config.orderCallEnabled ? "ACTIVE (ON)" : "DISABLED (OFF)"}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Turn off to instantly silence all automated phone calls across all restaurants on the platform.
              </CardDescription>
            </div>
            <Switch
              checked={Boolean(config?.orderCallEnabled)}
              onCheckedChange={handleToggle}
              disabled={loading || saving}
              className="scale-125 data-[state=checked]:bg-emerald-600"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div
            className={`p-4 rounded-lg border transition-colors ${
              config?.orderCallEnabled
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                : "bg-muted/50 border-border text-muted-foreground"
            }`}
          >
            <div className="flex items-start gap-3">
              {config?.orderCallEnabled ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              ) : (
                <PhoneOff className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              )}
              <div className="text-sm space-y-1">
                <div className="font-medium">
                  {config?.orderCallEnabled
                    ? "Automated voice calls are currently ACTIVE"
                    : "Automated voice calls are currently PAUSED"}
                </div>
                <p className="text-xs opacity-90">
                  {config?.orderCallEnabled
                    ? "Every new incoming order will trigger an automated phone call to the restaurant (unless the restaurant has disabled calls on their individual profile)."
                    : "No automated phone calls will be dispatched to restaurants for new orders. Push notifications and in-app alerts will still continue as normal."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            Twilio Integration Health & Status
          </CardTitle>
          <CardDescription>
            Environment credentials and gateway configuration details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-md bg-muted/30 border space-y-1">
              <span className="text-xs text-muted-foreground">Gateway Service</span>
              <div className="flex items-center gap-2">
                {config?.isConfigured ? (
                  <>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      Connected & Ready
                    </span>
                  </>
                ) : (
                  <>
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Missing Credentials in .env
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3 rounded-md bg-muted/30 border space-y-1">
              <span className="text-xs text-muted-foreground">From Phone Number</span>
              <div className="text-sm font-mono font-medium">
                {config?.fromNumber || "Not configured"}
              </div>
            </div>

            <div className="p-3 rounded-md bg-muted/30 border space-y-1">
              <span className="text-xs text-muted-foreground">Audio / Flow Strategy</span>
              <div className="text-sm flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-muted-foreground" />
                {config?.hasStudioFlow
                  ? "Twilio Studio Flow (Interactive)"
                  : config?.hasAlertAudio
                  ? "Custom Audio Clip URL"
                  : "Text-to-Speech (Fallback Say)"}
              </div>
            </div>

            <div className="p-3 rounded-md bg-muted/30 border space-y-1">
              <span className="text-xs text-muted-foreground">Individual Shop Control</span>
              <div className="text-sm text-foreground">
                Configurable per-shop in <span className="font-semibold">Manage Shop / Restaurant</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 rounded-lg text-xs mt-2 border border-blue-200 dark:border-blue-900/50">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong>How it works:</strong> When a customer places an order, the backend first verifies this master switch is ON, then checks that the target shop has phone calls enabled on its profile. If both are enabled, Twilio dials the restaurant's phone number within seconds.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
