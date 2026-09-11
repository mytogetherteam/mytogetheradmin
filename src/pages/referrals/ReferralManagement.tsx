import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Gift,
  Settings2,
  Users,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  referralService,
  ReferralCodeDTO,
  ReferralRedemptionDTO,
  ShopCouponSummary,
  ReferralRewardTarget,
} from "@/services/referralService";

export default function ReferralManagement() {
  const [activeTab, setActiveTab] = useState("config");

  // Config State
  const [configLoading, setConfigLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [rewardTarget, setRewardTarget] = useState<ReferralRewardTarget>("NONE");
  const [referrerCouponId, setReferrerCouponId] = useState<number | null>(null);
  const [referrerCustomText, setReferrerCustomText] = useState("");
  const [referredCouponId, setReferredCouponId] = useState<number | null>(null);
  const [referredCustomText, setReferredCustomText] = useState("");
  const [shopCoupons, setShopCoupons] = useState<ShopCouponSummary[]>([]);

  // Mass Distribution State
  const [massCouponId, setMassCouponId] = useState<number | null>(null);
  const [massDistributing, setMassDistributing] = useState(false);
  const [showMassConfirmDialog, setShowMassConfirmDialog] = useState(false);

  // Promote Codes State
  const [codes, setCodes] = useState<ReferralCodeDTO[]>([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [codesSearch, setCodesSearch] = useState("");

  // Redemptions State
  const [redemptions, setRedemptions] = useState<ReferralRedemptionDTO[]>([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);
  const [redemptionsSearch, setRedemptionsSearch] = useState("");

  const loadConfigAndCoupons = async () => {
    setConfigLoading(true);
    try {
      const [configData, couponsData] = await Promise.all([
        referralService.getConfig(),
        referralService.getShopCoupons({ isActive: true }),
      ]);

      if (configData) {
        setIsActive(Boolean(configData.isActive));
        setRewardTarget(configData.rewardTarget || "NONE");
        setReferrerCouponId(configData.referrerCouponId || null);
        setReferrerCustomText(configData.referrerCustomText || "");
        setReferredCouponId(configData.referredCouponId || null);
        setReferredCustomText(configData.referredCustomText || "");
      }
      setShopCoupons(couponsData || []);
    } catch (error) {
      console.error("Failed to load referral configuration:", error);
      toast.error("Failed to load referral configuration");
    } finally {
      setConfigLoading(false);
    }
  };

  const loadCodes = async () => {
    setCodesLoading(true);
    try {
      const data = await referralService.getCodes({
        page: 1,
        size: 50,
        search: codesSearch,
      });
      setCodes(data || []);
    } catch (error) {
      console.error("Failed to load promote codes:", error);
      toast.error("Failed to load promote codes");
    } finally {
      setCodesLoading(false);
    }
  };

  const loadRedemptions = async () => {
    setRedemptionsLoading(true);
    try {
      const data = await referralService.getRedemptions({
        page: 1,
        size: 50,
        search: redemptionsSearch,
      });
      setRedemptions(data || []);
    } catch (error) {
      console.error("Failed to load redemptions:", error);
      toast.error("Failed to load redemptions log");
    } finally {
      setRedemptionsLoading(false);
    }
  };

  useEffect(() => {
    loadConfigAndCoupons();
  }, []);

  useEffect(() => {
    if (activeTab === "codes") loadCodes();
    if (activeTab === "redemptions") loadRedemptions();
  }, [activeTab]);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await referralService.updateConfig({
        isActive,
        rewardTarget,
        referrerCouponId,
        referrerCustomText: referrerCustomText || null,
        referredCouponId,
        referredCustomText: referredCustomText || null,
      });
      toast.success("Referral program settings updated successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleApplyToBoth = (couponId: number) => {
    setReferrerCouponId(couponId);
    setReferredCouponId(couponId);
    setRewardTarget("BOTH");
    toast.info("Selected coupon applied to both Referrer & New User!");
  };

  const handleConfirmMassDistribution = async () => {
    if (!massCouponId) {
      toast.error("Please select a coupon first");
      return;
    }

    setMassDistributing(true);
    try {
      const result = await referralService.applyCouponToAllUsers(massCouponId);
      toast.success(
        `Holiday distribution complete! Granted to ${result.distributedCount || "all"} active users.`
      );
      setShowMassConfirmDialog(false);
      setMassCouponId(null);
    } catch (error: any) {
      toast.error(error?.message || "Mass distribution failed");
    } finally {
      setMassDistributing(false);
    }
  };

  const selectedMassCoupon = shopCoupons.find((c) => c.id === massCouponId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Gift className="h-8 w-8 text-primary" />
            Referral & Promote Codes
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user custom promote codes, reward linkages with Shop Coupons, and holiday mass distribution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={isActive ? "default" : "secondary"}
            className="px-3 py-1 text-sm font-medium"
          >
            {isActive ? "Program Active" : "Program Paused"}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="codes" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Promote Codes
          </TabsTrigger>
          <TabsTrigger value="redemptions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Redemptions Log
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CONFIGURATION */}
        <TabsContent value="config" className="space-y-6">
          {configLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Master Referral Settings */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center justify-between">
                      <span>Referral Program Master Control</span>
                      <Switch
                        checked={isActive}
                        onCheckedChange={setIsActive}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </CardTitle>
                    <CardDescription>
                      Turn on rewards when users invite friends. When turned OFF, users can still share custom codes, but coupons are not awarded.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Reward Target */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Reward Target Rule</Label>
                      <Select
                        value={rewardTarget}
                        onValueChange={(val) => setRewardTarget(val as ReferralRewardTarget)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select who gets rewarded" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BOTH">🎁 Reward Both (Referrer & New User)</SelectItem>
                          <SelectItem value="REFERRED_ONLY">👤 New Registered User Only</SelectItem>
                          <SelectItem value="REFERRER_ONLY">📢 Referrer Only</SelectItem>
                          <SelectItem value="NONE">❌ No Coupon Reward (Logging Only)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Controls whether one party or both parties receive a saved coupon in their account.
                      </p>
                    </div>

                    <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Referrer Coupon */}
                      <div className="space-y-3 p-4 rounded-lg bg-gray-50 border">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-gray-800">
                            Referrer Coupon (Inviter)
                          </Label>
                          {referrerCouponId && (
                            <Badge variant="outline" className="text-xs bg-white">
                              ID: {referrerCouponId}
                            </Badge>
                          )}
                        </div>
                        <Select
                          value={referrerCouponId ? String(referrerCouponId) : "none"}
                          onValueChange={(val) =>
                            setReferrerCouponId(val === "none" ? null : Number(val))
                          }
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Choose Shop Coupon" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- No Coupon --</SelectItem>
                            {shopCoupons.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.name} ({c.code}) - {c.shop?.nameEn || "Shop"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div>
                          <Label className="text-xs text-gray-600">Custom Text / Note</Label>
                          <Input
                            placeholder="e.g. Thanks for sharing MyTogether!"
                            value={referrerCustomText}
                            onChange={(e) => setReferrerCustomText(e.target.value)}
                            className="bg-white mt-1 text-sm"
                          />
                        </div>
                      </div>

                      {/* Referred User Coupon */}
                      <div className="space-y-3 p-4 rounded-lg bg-gray-50 border">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-gray-800">
                            New User Coupon (Invitee)
                          </Label>
                          {referredCouponId && (
                            <Badge variant="outline" className="text-xs bg-white">
                              ID: {referredCouponId}
                            </Badge>
                          )}
                        </div>
                        <Select
                          value={referredCouponId ? String(referredCouponId) : "none"}
                          onValueChange={(val) =>
                            setReferredCouponId(val === "none" ? null : Number(val))
                          }
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Choose Shop Coupon" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- No Coupon --</SelectItem>
                            {shopCoupons.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.name} ({c.code}) - {c.shop?.nameEn || "Shop"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div>
                          <Label className="text-xs text-gray-600">Custom Text / Note</Label>
                          <Input
                            placeholder="e.g. Welcome gift from your friend!"
                            value={referredCustomText}
                            onChange={(e) => setReferredCustomText(e.target.value)}
                            className="bg-white mt-1 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Action: Apply single coupon to both */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-md bg-blue-50 border border-blue-200">
                      <div className="text-xs text-blue-800">
                        <strong>Tip:</strong> Want to award the same coupon to both referrer and new user?
                      </div>
                      <Select
                        onValueChange={(val) => handleApplyToBoth(Number(val))}
                      >
                        <SelectTrigger className="w-[240px] bg-white h-8 text-xs">
                          <SelectValue placeholder="⚡ Apply Single Coupon to Both" />
                        </SelectTrigger>
                        <SelectContent>
                          {shopCoupons.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name} ({c.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={handleSaveConfig}
                        disabled={savingConfig}
                        className="px-6"
                      >
                        {savingConfig ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Save Configuration
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right 1 Col: Holiday / Festival Mass Grant Card */}
              <div className="space-y-6">
                <Card className="border-red-200 bg-gradient-to-b from-red-50/50 to-orange-50/30">
                  <CardHeader>
                    <CardTitle className="text-lg text-red-900 flex items-center gap-2">
                      <span>🧧 Festival Mass Distribution</span>
                    </CardTitle>
                    <CardDescription className="text-red-700/80 text-xs">
                      Instantly grant a holiday coupon (e.g. Chinese New Year, Songkran) to <strong>every registered user's</strong> saved coupons list in one click.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-700">
                        Select Coupon to Distribute:
                      </Label>
                      <Select
                        value={massCouponId ? String(massCouponId) : ""}
                        onValueChange={(val) => setMassCouponId(Number(val))}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select Holiday Coupon" />
                        </SelectTrigger>
                        <SelectContent>
                          {shopCoupons.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name} ({c.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedMassCoupon && (
                      <div className="p-3 bg-white rounded-md border border-red-100 text-xs space-y-1">
                        <div className="font-semibold text-gray-900">
                          {selectedMassCoupon.name} ({selectedMassCoupon.code})
                        </div>
                        <div className="text-gray-600">
                          Shop: {selectedMassCoupon.shop?.nameEn || "Shop"}
                        </div>
                        <div className="text-gray-500">
                          Expires: {new Date(selectedMassCoupon.validUntil).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    <Button
                      variant="destructive"
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                      disabled={!massCouponId || massDistributing}
                      onClick={() => setShowMassConfirmDialog(true)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Apply to All Users
                    </Button>
                    <p className="text-[11px] text-gray-500 text-center">
                      Executes idempotently without duplicating coupons for users who already have it.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: PROMOTE CODES */}
        <TabsContent value="codes" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg">User Promote Codes</CardTitle>
                  <CardDescription>
                    Custom codes registered by app users to invite their friends.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search code or user..."
                      value={codesSearch}
                      onChange={(e) => setCodesSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loadCodes()}
                      className="pl-8 text-sm"
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={loadCodes}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {codesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : codes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No user promote codes found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Promote Code</TableHead>
                      <TableHead>User Name</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead className="text-center">Times Claimed</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codes.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono font-bold text-primary">
                          {c.code}
                        </TableCell>
                        <TableCell>
                          {c.user.name || c.user.username || "Anonymous User"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {c.user.phone}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {c.usedCount}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={c.isActive ? "outline" : "secondary"}>
                            {c.isActive ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: REDEMPTIONS AUDIT LOG */}
        <TabsContent value="redemptions" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg">Redemptions Audit Log</CardTitle>
                  <CardDescription>
                    Permanent record of referral code usages and rewarded coupons.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search redemption..."
                      value={redemptionsSearch}
                      onChange={(e) => setRedemptionsSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loadRedemptions()}
                      className="pl-8 text-sm"
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={loadRedemptions}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {redemptionsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : redemptions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No referral redemptions recorded yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Promote Code</TableHead>
                      <TableHead>Referrer (Inviter)</TableHead>
                      <TableHead>New User (Invitee)</TableHead>
                      <TableHead>Reward Target</TableHead>
                      <TableHead>Referrer Coupon</TableHead>
                      <TableHead>New User Coupon</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redemptions.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                          {new Date(r.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-primary">
                          {r.code}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">
                            {r.referrer.name || r.referrer.username || "Referrer"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.referrer.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">
                            {r.referredUser.name || r.referredUser.username || "New User"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.referredUser.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {r.rewardTarget}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.referrerCouponId ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Coupon #{r.referrerCouponId}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.referredCouponId ? (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              Coupon #{r.referredCouponId}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog for Mass Distribution */}
      <Dialog open={showMassConfirmDialog} onOpenChange={setShowMassConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Festival Mass Distribution
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-gray-700">
              Are you sure you want to distribute{" "}
              <strong>"{selectedMassCoupon?.name}"</strong> to{" "}
              <strong>ALL registered users</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-xs text-muted-foreground bg-gray-50 p-3 rounded-md">
            This will directly add the coupon into the Saved Coupons wishlist of every active user in the database.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowMassConfirmDialog(false)}
              disabled={massDistributing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmMassDistribution}
              disabled={massDistributing}
              className="bg-red-600 hover:bg-red-700"
            >
              {massDistributing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Confirm & Grant to All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
