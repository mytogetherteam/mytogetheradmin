import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function CheckboxField({
  label,
  checked,
  onCheckedChange,
  error,
}: {
  label: string;
  checked?: boolean;
  onCheckedChange: (v: boolean) => void;
  error?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(v: boolean) => onCheckedChange(v)}
          className={error && "border-red-500"}
        />
        <Label htmlFor={id} className={error && "text-red-500"}>
          {label}
        </Label>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
