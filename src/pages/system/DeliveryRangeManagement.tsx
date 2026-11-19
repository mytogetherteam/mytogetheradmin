import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  MapPin,
  Loader2,
  Save,
  RefreshCw,
  ShieldCheck,
  FlaskConical,
  Rocket,
  Clock,
  AlertTriangle,
  Gavel,
  CheckCircle2,
  Ban,
  Flame,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { handleApiError } from "@/lib/error-utils";
import {
  deliveryRangeService,
  DeliveryRangeDTO,
  DeliveryPolicyConfigDTO,
  ShopDeliveryPenaltyDTO,
  ShopPenaltyStatus,
} from "@/services/deliveryRangeService";

export default function DeliveryRangeManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  // Delivery Range & Surge Buffer state
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [maxDeliveryKm, setMaxDeliveryKm] = useState("30");
  const [farWarningKm, setFarWarningKm] = useState("6");
  const [feeBufferThb, setFeeBufferThb] = useState("10");
  const [lalamoveEnv, setLalamoveEnv] = useState<"SANDBOX" | "PRODUCTION">("PRODUCTION");
  const [effectiveBufferThb, setEffectiveBufferThb] = useState<number>(10);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // Rider Waiting Time, Fine & Shop Policy state
  const [riderWaitWarnMinutes, setRiderWaitWarnMinutes] = useState("7");
  const [riderWaitFineMinutes, setRiderWaitFineMinutes] = useState("10");
  const [riderWaitFineThb, setRiderWaitFineThb] = useState("40");
  const [maxUnpaidPenaltyStrikes, setMaxUnpaidPenaltyStrikes] = useState("3");
  const [autoRedispatchOnEnRouteCancel, setAutoRedispatchOnEnRouteCancel] = useState(true);
  const [requireHandoverChecklist, setRequireHandoverChecklist] = useState(true);
  const [defaultPrepTimeMinutes, setDefaultPrepTimeMinutes] = useState("15");
  const [busyModeExtraMinutes, setBusyModeExtraMinutes] = useState("15");
  const [policyTitleMm, setPolicyTitleMm] = useState(
    "Lalamove ပို့ဆောင်ရေး စည်းကမ်းချက်များ နှင့် ဒဏ်ကြေးမူဝါဒ",
  );
  const [policyTitleEn, setPolicyTitleEn] = useState(
    "Lalamove Delivery Rules & Penalty Policy",
  );
  const [policyNotesMm, setPolicyNotesMm] = useState(
    "အစားအသောက် ချက်ပြုတ်ပြီးစီး (သို့မဟုတ် ၃ မိနစ်အတွင်း ထုပ်ပိုးပြီးစီး) မှသာ Lalamove Rider ခေါ်ယူပါ။ Rider ဆိုင်ရှေ့ရောက်ရှိပြီး သတ်မှတ်စောင့်ဆိုင်းချိန်ထက် ကျော်လွန်၍ အော်ဒါပယ်ဖျက်သွားပါက စောင့်ဆိုင်းချိန်ကျော်လွန်မှု ဒဏ်ကြေး သတ်မှတ်ခံရမည် ဖြစ်ပါသည်။",
  );
  const [policyNotesEn, setPolicyNotesEn] = useState(
    "Please dispatch Lalamove only when food is cooked and ready for packaging within 3 minutes. If a rider arrives at your store, waits beyond the maximum free waiting time, and cancels the delivery, a late-waiting penalty fine will be issued.",
  );
  const [penalties, setPenalties] = useState<ShopDeliveryPenaltyDTO[]>([]);

  const applyConfig = (range: DeliveryRangeDTO) => {
    const savedBuffer = range.feeBufferThb ?? 10;
    const env = range.lalamoveEnv ?? "PRODUCTION";
    setLimitEnabled(range.enabled === true);
    setMaxDeliveryKm(String(range.maxDeliveryKm));
    setFarWarningKm(String(range.farWarningKm));
    setFeeBufferThb(String(savedBuffer));
    setLalamoveEnv(env);
    setEffectiveBufferThb(
      range.effectiveFeeBufferThb !== undefined
        ? range.effectiveFeeBufferThb
        : env === "SANDBOX"
          ? 0
          : savedBuffer,
    );
    setUpdatedAt(range.updatedAt ?? null);
  };

  const applyPolicy = (p: DeliveryPolicyConfigDTO) => {
    setRiderWaitWarnMinutes(String(p.riderWaitWarnMinutes ?? 7));
    setRiderWaitFineMinutes(String(p.riderWaitFineMinutes ?? 10));
    setRiderWaitFineThb(String(p.riderWaitFineThb ?? 40));
    setMaxUnpaidPenaltyStrikes(String(p.maxUnpaidPenaltyStrikes ?? 3));
    setAutoRedispatchOnEnRouteCancel(p.autoRedispatchOnEnRouteCancel !== false);
    setRequireHandoverChecklist(p.requireHandoverChecklist !== false);
    setDefaultPrepTimeMinutes(String(p.defaultPrepTimeMinutes ?? 15));
    setBusyModeExtraMinutes(String(p.busyModeExtraMinutes ?? 15));
    if (p.policyTitleMm) setPolicyTitleMm(p.policyTitleMm);
    if (p.policyTitleEn) setPolicyTitleEn(p.policyTitleEn);
    if (p.policyNotesMm) setPolicyNotesMm(p.policyNotesMm);
    if (p.policyNotesEn) setPolicyNotesEn(p.policyNotesEn);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rangeData, policyBundle] = await Promise.all([
        deliveryRangeService.get(),
        deliveryRangeService.getPolicy().catch(() => null),
      ]);
      applyConfig(rangeData);
      if (policyBundle?.policy) {
        applyPolicy(policyBundle.policy);
      }
      if (Array.isArray(policyBundle?.penalties)) {
        setPenalties(policyBundle.penalties);
      }
    } catch (error) {
      handleApiError(error, "Failed to load delivery settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const handleSave = async () => {
    const maxKm = Number(maxDeliveryKm);
    const warningKm = Number(farWarningKm);
    const buffer = Number(feeBufferThb);
    if (!Number.isFinite(maxKm) || !Number.isFinite(warningKm)) {
      toast.error("Enter both distances in kilometers");
      return;
    }
    if (
      feeBufferThb.trim() === "" ||
      !Number.isInteger(buffer) ||
      buffer < 0 ||
      buffer > 500
    ) {
      toast.error("The fee buffer must be a whole number of baht from 0 to 500");
      return;
    }
    if (warningKm >= maxKm) {
      toast.error("The warning distance must be lower than the maximum");
      return;
    }
    setSaving(true);
    try {
      applyConfig(
        await deliveryRangeService.update({
          enabled: limitEnabled,
          maxDeliveryKm: maxKm,
          farWarningKm: warningKm,
          feeBufferThb: buffer,
        }),
      );
      toast.success("Delivery range & surge buffer updated");
    } catch (error) {
      handleApiError(error, "Failed to save delivery range");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePolicy = async () => {
    const warnMins = Number(riderWaitWarnMinutes);
    const fineMins = Number(riderWaitFineMinutes);
    const fineThb = Number(riderWaitFineThb);
    const strikes = Number(maxUnpaidPenaltyStrikes);
    const prepMins = Number(defaultPrepTimeMinutes);
    const busyExtra = Number(busyModeExtraMinutes);

    if (!Number.isInteger(warnMins) || warnMins < 1 || warnMins > 60) {
      toast.error("Warning alert time must be between 1 and 60 minutes");
      return;
    }
    if (!Number.isInteger(fineMins) || fineMins <= warnMins || fineMins > 120) {
      toast.error("Max free waiting time must be greater than warning time");
      return;
    }
    if (!Number.isInteger(fineThb) || fineThb < 0 || fineThb > 2000) {
      toast.error("Fine amount must be between 0 and 2000 THB");
      return;
    }
    if (!Number.isInteger(strikes) || strikes < 1 || strikes > 50) {
      toast.error("Max unpaid strikes must be between 1 and 50");
      return;
    }

    setSavingPolicy(true);
    try {
      const updated = await deliveryRangeService.updatePolicy({
        riderWaitWarnMinutes: warnMins,
        riderWaitFineMinutes: fineMins,
        riderWaitFineThb: fineThb,
        maxUnpaidPenaltyStrikes: strikes,
        autoRedispatchOnEnRouteCancel,
        requireHandoverChecklist,
        defaultPrepTimeMinutes: prepMins,
        busyModeExtraMinutes: busyExtra,
        policyTitleMm,
        policyTitleEn,
        policyNotesMm,
        policyNotesEn,
      });
      applyPolicy(updated);
      toast.success("Lalamove waiting-time rules & penalty policy updated");
    } catch (error) {
      handleApiError(error, "Failed to save delivery policy");
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleResolvePenalty = async (penaltyId: number, status: ShopPenaltyStatus) => {
    setResolvingId(penaltyId);
    try {
      const updated = await deliveryRangeService.resolvePenalty(penaltyId, { status });
      setPenalties((prev) =>
        prev.map((item) => (item.id === penaltyId ? updated : item)),
      );
      toast.success(`Penalty #${penaltyId} marked as ${status}`);
    } catch (error) {
      handleApiError(error, "Failed to update penalty status");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Delivery Range, Lalamove Waiting Policy & Shop Penalties
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Manage delivery distance limits, the +฿10 cooking-time surge buffer,
            Lalamove rider waiting-time warnings (7m), late-cancellation shop fines (10m / ฿40),
            3-strike Lalamove lock rules, and dynamic policy rules displayed in the Shop App Profile menu.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetchAll()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* CARD 1: Customer App Distance Limits & Surge Buffer */}
      <Card>
        <CardHeader>
          <CardTitle>1. Customer App Distance Limits & 5-Min Cooking Surge Buffer</CardTitle>
          <CardDescription>
            Turn blocking on to stop a delivery at the maximum distance or
            farther. A paid delivery in Production adds the fee buffer (+฿10 default)
            to cover Lalamove 5-minute quotation renewals while the shop cooks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="delivery-limit-enabled" className="text-base">
                    Block deliveries at or beyond the maximum distance
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When off, far orders are still allowed after the customer
                    confirms the warning.
                  </p>
                </div>
                <Switch
                  id="delivery-limit-enabled"
                  checked={limitEnabled}
                  onCheckedChange={setLimitEnabled}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="far-warning-km">
                    Far delivery warning starts after (km)
                  </Label>
                  <Input
                    id="far-warning-km"
                    type="number"
                    min={1}
                    max={200}
                    step="0.5"
                    value={farWarningKm}
                    onChange={(e) => setFarWarningKm(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Default: 6 km. At 6 km there is no warning; above 6 km the
                    customer is asked to confirm.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-delivery-km">
                    Maximum delivery distance (km)
                  </Label>
                  <Input
                    id="max-delivery-km"
                    type="number"
                    min={1}
                    max={200}
                    step="0.5"
                    value={maxDeliveryKm}
                    onChange={(e) => setMaxDeliveryKm(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Default: 30 km. At 30 km or farther the order cannot be
                    placed when blocking is on.
                  </p>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="fee-buffer-thb" className="text-base font-medium flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Lalamove 5-Minute Quote Expiry & Cooking Surge Buffer (฿)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Lalamove quotations expire after 5 minutes while restaurants take 15–25 minutes to cook.
                      This extra buffer covers rate fluctuations at dispatch time.
                    </p>
                  </div>
                  {lalamoveEnv === "SANDBOX" ? (
                    <Badge variant="secondary" className="flex items-center gap-1.5 bg-amber-500/15 text-amber-700 border-amber-500/30">
                      <FlaskConical className="h-3.5 w-3.5" />
                      SANDBOX MODE (Buffer Auto-Bypassed: ฿0)
                    </Badge>
                  ) : (
                    <Badge variant="default" className="flex items-center gap-1.5 bg-emerald-600 text-white">
                      <Rocket className="h-3.5 w-3.5" />
                      PRODUCTION MODE (Buffer Active: +฿{Number.isFinite(Number(feeBufferThb)) ? Number(feeBufferThb) : effectiveBufferThb})
                    </Badge>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        id="fee-buffer-thb"
                        type="number"
                        min={0}
                        max={500}
                        step={1}
                        className="max-w-40"
                        value={feeBufferThb}
                        onChange={(e) => setFeeBufferThb(e.target.value)}
                      />
                      <div className="flex items-center gap-1">
                        {[0, 10, 15, 20].map((preset) => (
                          <Button
                            key={preset}
                            type="button"
                            variant={Number(feeBufferThb) === preset ? "default" : "outline"}
                            size="sm"
                            className="h-8 px-2.5 text-xs"
                            onClick={() => setFeeBufferThb(String(preset))}
                          >
                            {preset === 0 ? "฿0" : `+฿${preset}`}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-background p-3 space-y-1.5 text-xs">
                    <div className="font-medium text-foreground">
                      Live Pricing & Surge Coverage Preview (Example Lalamove Quote: ฿45)
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Sandbox Checkout Fee (1:1 UAT Match):</span>
                      <span className="font-mono font-medium text-foreground">฿45 + ฿0 = ฿45</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Production Checkout Fee (Verified Shop):</span>
                      <span className="font-mono font-semibold text-emerald-600">
                        ฿45 + ฿{Number.isFinite(Number(feeBufferThb)) ? Number(feeBufferThb) : 10} = ฿{45 + (Number.isFinite(Number(feeBufferThb)) ? Number(feeBufferThb) : 10)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-xs text-muted-foreground">
                  {updatedAt
                    ? `Last saved ${new Date(updatedAt).toLocaleString()}`
                    : "Using default settings"}
                </p>
                <Button onClick={() => void handleSave()} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Distance & Surge Buffer
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* CARD 2: Lalamove Rider Waiting Time, Fine & Dynamic Shop App Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-rose-600" />
            2. Rider Waiting Time Warning, Late-Wait Fine (฿40) & Shop App Rules Policy
          </CardTitle>
          <CardDescription>
            Controls when the Shop App alerts the restaurant owner that a Lalamove rider is waiting outside,
            how much fine is charged if the rider cancels after waiting too long, when Lalamove dispatch is locked (3 strikes),
            and the rules displayed on the Shop App Profile &ldquo;Delivery Rules &amp; Penalty Policy&rdquo; page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 rounded-lg border p-3.5">
              <Label htmlFor="wait-warn-mins" className="flex items-center gap-1.5 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                1. Warning Alert Time (mins)
              </Label>
              <Input
                id="wait-warn-mins"
                type="number"
                min={1}
                max={60}
                value={riderWaitWarnMinutes}
                onChange={(e) => setRiderWaitWarnMinutes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Default: <strong>7 mins</strong>. Sends urgent notification &amp; pops up countdown warning modal in Shop App.
              </p>
            </div>

            <div className="space-y-2 rounded-lg border p-3.5">
              <Label htmlFor="wait-fine-mins" className="flex items-center gap-1.5 text-rose-700">
                <Clock className="h-4 w-4" />
                2. Max Free Waiting Time (mins)
              </Label>
              <Input
                id="wait-fine-mins"
                type="number"
                min={2}
                max={120}
                value={riderWaitFineMinutes}
                onChange={(e) => setRiderWaitFineMinutes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Default: <strong>10 mins</strong>. If rider cancels after waiting ≥ {riderWaitFineMinutes} mins at store, fine applies.
              </p>
            </div>

            <div className="space-y-2 rounded-lg border p-3.5">
              <Label htmlFor="wait-fine-thb" className="flex items-center gap-1.5 text-rose-700">
                <Gavel className="h-4 w-4" />
                3. Late Waiting Fine Amount (฿)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="wait-fine-thb"
                  type="number"
                  min={0}
                  max={2000}
                  value={riderWaitFineThb}
                  onChange={(e) => setRiderWaitFineThb(e.target.value)}
                />
              </div>
              <div className="flex gap-1 pt-1">
                {[30, 40, 50, 80].map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    size="sm"
                    variant={Number(riderWaitFineThb) === amt ? "default" : "outline"}
                    className="h-7 px-2 text-xs"
                    onClick={() => setRiderWaitFineThb(String(amt))}
                  >
                    ฿{amt}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-lg border p-3.5">
              <Label htmlFor="max-strikes" className="flex items-center gap-1.5 text-slate-800">
                <Ban className="h-4 w-4 text-rose-600" />
                4. Max Unpaid Strikes (Auto-Lock)
              </Label>
              <Input
                id="max-strikes"
                type="number"
                min={1}
                max={50}
                value={maxUnpaidPenaltyStrikes}
                onChange={(e) => setMaxUnpaidPenaltyStrikes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Default: <strong>3 strikes</strong> (฿{Number(riderWaitFineThb || 40) * Number(maxUnpaidPenaltyStrikes || 3)}). Locks Lalamove dispatch until settled/waived.
              </p>
            </div>
          </div>

          {/* Standard Delivery App Features (Grab / LINEMAN / Foodpanda Standards) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">
                  Auto Re-Dispatch on En-Route Rider Cancellation (฿0 Fine)
                </Label>
                <p className="text-xs text-muted-foreground">
                  If a Lalamove rider cancels before arriving at the shop (or under {riderWaitFineMinutes} mins),
                  do not fine the shop and automatically search for a replacement rider.
                </p>
              </div>
              <Switch
                checked={autoRedispatchOnEnRouteCancel}
                onCheckedChange={setAutoRedispatchOnEnRouteCancel}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">
                  Require Food Handover Verification Checklist
                </Label>
                <p className="text-xs text-muted-foreground">
                  Shows package seal &amp; order number verification checklist in Shop App when rider arrives at the store.
                </p>
              </div>
              <Switch
                checked={requireHandoverChecklist}
                onCheckedChange={setRequireHandoverChecklist}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default-prep-mins" className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-orange-500" />
                Standard Kitchen Prep Time (mins)
              </Label>
              <Input
                id="default-prep-mins"
                type="number"
                min={5}
                max={120}
                value={defaultPrepTimeMinutes}
                onChange={(e) => setDefaultPrepTimeMinutes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="busy-extra-mins" className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-rose-600" />
                Shop &ldquo;Busy Mode&rdquo; Extra Prep Time (+mins)
              </Label>
              <Input
                id="busy-extra-mins"
                type="number"
                min={5}
                max={120}
                value={busyModeExtraMinutes}
                onChange={(e) => setBusyModeExtraMinutes(e.target.value)}
              />
            </div>
          </div>

          {/* Dynamic Rules Text shown in Shop App Profile Menu */}
          <div className="grid gap-4 sm:grid-cols-2 rounded-xl border bg-muted/15 p-4">
            <div className="space-y-2">
              <Label htmlFor="policy-title-mm">Shop App Rules Page Title (Myanmar)</Label>
              <Input
                id="policy-title-mm"
                value={policyTitleMm}
                onChange={(e) => setPolicyTitleMm(e.target.value)}
              />
              <Label htmlFor="policy-notes-mm" className="pt-2 block">
                Shop App Policy Notice (Myanmar)
              </Label>
              <Input
                id="policy-notes-mm"
                value={policyNotesMm}
                onChange={(e) => setPolicyNotesMm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="policy-title-en">Shop App Rules Page Title (English)</Label>
              <Input
                id="policy-title-en"
                value={policyTitleEn}
                onChange={(e) => setPolicyTitleEn(e.target.value)}
              />
              <Label htmlFor="policy-notes-en" className="pt-2 block">
                Shop App Policy Notice (English)
              </Label>
              <Input
                id="policy-notes-en"
                value={policyNotesEn}
                onChange={(e) => setPolicyNotesEn(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => void handleSavePolicy()} disabled={savingPolicy}>
              {savingPolicy ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Waiting Policy &amp; Shop App Rules
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CARD 3: Shop Waiting-Time Penalty Ledger */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-rose-600" />
            3. Shop Waiting-Time Penalty Ledger ({penalties.length})
          </CardTitle>
          <CardDescription>
            Automatically recorded when a Lalamove rider waits ≥ {riderWaitFineMinutes} minutes at a restaurant
            and cancels the delivery. Mark penalties as PAID or WAIVED to unlock shops that hit the {maxUnpaidPenaltyStrikes}-strike limit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {penalties.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No shop waiting-time penalties recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2.5 pr-3">ID</th>
                    <th className="py-2.5 px-3">Shop</th>
                    <th className="py-2.5 px-3">Order</th>
                    <th className="py-2.5 px-3">Rider Waited</th>
                    <th className="py-2.5 px-3">Fine</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {penalties.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 pr-3 font-mono text-xs">#{p.id}</td>
                      <td className="py-3 px-3 font-medium">
                        {p.shopName} <span className="text-xs text-muted-foreground">(ID: {p.shopId})</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs">{p.orderRef}</td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-rose-700 border-rose-300 bg-rose-50">
                          {p.waitingMinutes} mins
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-semibold text-rose-600">฿{p.fineAmountThb}</td>
                      <td className="py-3 px-3">
                        {p.status === "UNPAID" ? (
                          <Badge variant="destructive">UNPAID</Badge>
                        ) : p.status === "PAID" ? (
                          <Badge className="bg-emerald-600 text-white">PAID</Badge>
                        ) : (
                          <Badge variant="secondary">WAIVED</Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status !== "PAID" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-emerald-700 border-emerald-300"
                              disabled={resolvingId === p.id}
                              onClick={() => void handleResolvePenalty(p.id, "PAID")}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                          {p.status !== "WAIVED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={resolvingId === p.id}
                              onClick={() => void handleResolvePenalty(p.id, "WAIVED")}
                            >
                              Waive
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
