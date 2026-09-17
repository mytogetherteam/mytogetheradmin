import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BroadcastAudience } from "@/services/broadcastService";
import { AlertTriangle } from "lucide-react";

const MASS_CONFIRM: Partial<Record<BroadcastAudience, string>> = {
  ALL: "EVERYONE",
  USERS: "ALL USERS",
  SHOP_ADMINS: "SHOP ADMINS",
  OPERATION_ADMINS: "OPERATION ADMINS",
};

const MASS_WARNING: Partial<Record<BroadcastAudience, string>> = {
  ALL: "This will notify every user, every shop admin, and every operation admin. This cannot be undone.",
  USERS: "This will notify every customer (all users). This cannot be undone.",
  SHOP_ADMINS:
    "This will notify every shop admin (all shops). This cannot be undone.",
  OPERATION_ADMINS:
    "This will notify every operation admin. This cannot be undone.",
};

export function massConfirmPhrase(
  audience: BroadcastAudience,
): string | undefined {
  return MASS_CONFIRM[audience];
}

interface BroadcastConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audienceLabel: string;
  audience: BroadcastAudience;
  audienceDetail?: string;
  title: string;
  message: string;
  whenLabel: string;
  confirmText: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function BroadcastConfirmDialog({
  open,
  onOpenChange,
  audienceLabel,
  audience,
  audienceDetail,
  title,
  message,
  whenLabel,
  confirmText,
  loading = false,
  onConfirm,
}: BroadcastConfirmDialogProps) {
  const phrase = MASS_CONFIRM[audience];
  const warning = MASS_WARNING[audience];
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  const canConfirm = !phrase || typed.trim().toUpperCase() === phrase;
  const busy = loading;

  const handleConfirm = async () => {
    if (!canConfirm || busy) return;
    try {
      await onConfirm();
    } catch {
      // Mutation already toasts the API error; keep the dialog open.
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm broadcast</DialogTitle>
          <DialogDescription>
            Check the audience and send time before this goes out. Mass sends
            cannot be recalled.
          </DialogDescription>
        </DialogHeader>

        {warning ? (
          <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{warning}</p>
          </div>
        ) : null}

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Audience
            </dt>
            <dd className="mt-1 font-semibold">
              {audienceLabel}
              {audienceDetail ? (
                <span className="ml-1 font-normal text-muted-foreground">
                  {audienceDetail}
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              When
            </dt>
            <dd className="mt-1 font-semibold">{whenLabel}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Title
            </dt>
            <dd className="mt-1 break-words">{title}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Message
            </dt>
            <dd className="mt-1 max-h-28 overflow-y-auto whitespace-pre-wrap break-words text-muted-foreground">
              {message}
            </dd>
          </div>
        </dl>

        {phrase ? (
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Type <span className="text-foreground">{phrase}</span> to confirm
            </label>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={phrase}
              autoComplete="off"
              disabled={busy}
            />
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!canConfirm || busy}
          >
            {busy ? "Sending..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
