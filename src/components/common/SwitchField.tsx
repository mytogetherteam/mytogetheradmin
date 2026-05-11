"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function SwitchField({
  label,
  checked,
  onCheckedChange,
  error,
  disabled,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="">
      <div className="flex items-center gap-3">
        <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} className={error && "border-red-500"} />
        <Label className={error && "text-red-500"}>{label}</Label>
      </div>
      <div className="">
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
