import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Languages, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  languagePolicyService,
  LanguagePolicy,
  LanguageTarget,
} from "@/services/languagePolicyService";

const emptyPolicy: LanguagePolicy = {
  customer: false,
  shop: false,
  website: false,
};

const targets: { key: LanguageTarget; title: string; detail: string }[] = [
  {
    key: "customer",
    title: "MyTogether app",
    detail: "Sets the customer app to Thai. People can change it again. Turning this off restores the language from before it was turned on.",
  },
  {
    key: "shop",
    title: "MyShop",
    detail: "Sets the shop app to Thai. People can change it again. Turning this off restores the language from before it was turned on.",
  },
  {
    key: "website",
    title: "Website",
    detail: "Sets mytogether.org to Thai. Pages without Thai text stay in English. Turning this off restores the language from before it was turned on.",
  },
];

export default function AppLanguageControl() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState<LanguagePolicy>(emptyPolicy);

  useEffect(() => {
    let cancelled = false;
    languagePolicyService
      .get()
      .then((next) => {
        if (!cancelled && next) setPolicy(next);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load the language switches");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const apply = async (
    payload: Partial<Record<LanguageTarget, boolean>>,
    success: string,
  ) => {
    setSaving(true);
    const previous = policy;
    setPolicy({ ...policy, ...payload });
    try {
      const next = await languagePolicyService.update(payload);
      setPolicy(next);
      toast.success(success);
    } catch (error) {
      console.error("Failed to update language policy:", error);
      setPolicy(previous);
      toast.error("Failed to update the language switch");
    } finally {
      setSaving(false);
    }
  };

  const allOn = policy.customer && policy.shop && policy.website;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Languages className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-semibold">App Language</h1>
          <p className="text-sm text-muted-foreground">
            Set each app to Thai, or all of them at once. People can change the language again afterward. Turning a switch off restores the language from before it was turned on.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All apps</CardTitle>
          <CardDescription>
            Open apps pick this up within a minute. A closed app picks it up the next time it opens.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">{allOn ? "On for all" : "Not on for all"}</div>
                <div className="text-sm text-muted-foreground">
                  Turns MyTogether, MyShop, and the website together.
                </div>
              </div>
              <Switch
                checked={allOn}
                disabled={saving}
                onCheckedChange={(next) =>
                  apply(
                    { customer: next, shop: next, website: next },
                    next ? "All three are set to Thai" : "All three are back to the language from before the switch",
                  )
                }
                aria-label="Force Thai on all apps"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {!loading &&
        targets.map((target) => (
          <Card key={target.key}>
            <CardHeader>
              <CardTitle className="text-lg">{target.title}</CardTitle>
              <CardDescription>{target.detail}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div className="font-medium">{policy[target.key] ? "On" : "Off"}</div>
                <Switch
                  checked={policy[target.key]}
                  disabled={saving}
                  onCheckedChange={(next) =>
                    apply(
                      { [target.key]: next } as Partial<Record<LanguageTarget, boolean>>,
                      next
                        ? `${target.title} is set to Thai`
                        : `${target.title} is back to the language from before the switch`,
                    )
                  }
                  aria-label={`Force Thai on ${target.title}`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
