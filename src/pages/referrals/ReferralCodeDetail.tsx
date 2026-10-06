import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  referralService,
  ReferralCodeDetailDTO,
  ShopCouponSummary,
} from "@/services/referralService";

export default function ReferralCodeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const codeId = Number(id);

  const [detail, setDetail] = useState<ReferralCodeDetailDTO | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<ShopCouponSummary[]>([]);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [couponId, setCouponId] = useState<number | null>(null);
  const [granting, setGranting] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(codeId) || codeId < 1) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const [code, couponList] = await Promise.all([
        referralService.getCode(codeId),
        referralService.getShopCoupons({ isActive: true }),
      ]);
      setDetail(code);
      setCoupons(couponList || []);
    } catch (error) {
      console.error("Failed to load promote code:", error);
      setDetail(null);
      setLoadError("Failed to load this referral code");
      toast.error("Failed to load this referral code");
    } finally {
      setLoading(false);
    }
  }, [codeId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReward = async () => {
    if (!couponId || !detail) return;
    setGranting(true);
    try {
      const result = await referralService.rewardCodeOwner(detail.id, couponId);
      toast.success(`Granted ${result.couponName} (${result.couponCode})`);
      setRewardOpen(false);
      setCouponId(null);
    } catch (error) {
      console.error("Failed to grant reward:", error);
      const message = error instanceof Error ? error.message : "Failed to grant the reward";
      toast.error(message);
    } finally {
      setGranting(false);
    }
  };

  const ownerName = detail?.user.name || detail?.user.username || "This user";
  const selectedCoupon = coupons.find((coupon) => coupon.id === couponId);
  const selectedIsPublic = selectedCoupon?.requiresGrant === false;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/referrals/manage")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Referral code</h1>
            <p className="text-sm text-muted-foreground">
              People who joined with this code, and a reward for the owner.
            </p>
          </div>
        </div>
        <Button onClick={() => setRewardOpen(true)} disabled={!detail || loading}>
          <Gift className="h-4 w-4 mr-2" />
          Give reward
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !detail ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {loadError || "This referral code was not found."}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-xl text-primary">{detail.code}</CardTitle>
              <CardDescription>
                {ownerName}
                {detail.user.phone ? ` · ${detail.user.phone}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-6 text-sm">
              <div>
                <div className="text-muted-foreground">People referred</div>
                <div className="text-2xl font-semibold">{detail.peopleCount}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Status</div>
                <Badge variant={detail.isActive ? "outline" : "secondary"} className="mt-1">
                  {detail.isActive ? "Active" : "Disabled"}
                </Badge>
              </div>
              <div>
                <div className="text-muted-foreground">Created</div>
                <div className="mt-1">{new Date(detail.createdAt).toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">People who used this code</CardTitle>
              <CardDescription>
                {detail.people.length < detail.peopleCount
                  ? `Showing the latest ${detail.people.length} of ${detail.peopleCount}.`
                  : `${detail.peopleCount} ${detail.peopleCount === 1 ? "person" : "people"}.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detail.people.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Nobody has claimed this code yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Claimed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.people.map((person) => (
                      <TableRow key={person.id}>
                        <TableCell>
                          {person.user.name || person.user.username || "New user"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {person.user.phone || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(person.claimedAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={rewardOpen} onOpenChange={setRewardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Give {ownerName} a reward</DialogTitle>
            <DialogDescription>
              Grants an invite-only coupon. A public coupon is refused so other customers are not locked out. Referral reward coupons are invite-only.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Coupon</Label>
            <Select
              value={couponId ? String(couponId) : ""}
              onValueChange={(value) => setCouponId(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a coupon" />
              </SelectTrigger>
              <SelectContent>
                {coupons.map((coupon) => (
                  <SelectItem key={coupon.id} value={String(coupon.id)}>
                    {coupon.name} ({coupon.code})
                    {coupon.requiresGrant === false ? " · public" : coupon.requiresGrant ? " · invite-only" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedIsPublic ? (
              <p className="text-xs text-muted-foreground">
                Public coupons cannot be used as a personal reward.
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRewardOpen(false)} disabled={granting}>
              Cancel
            </Button>
            <Button onClick={handleReward} disabled={!couponId || granting || selectedIsPublic}>
              {granting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Gift className="h-4 w-4 mr-2" />}
              Grant reward
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
