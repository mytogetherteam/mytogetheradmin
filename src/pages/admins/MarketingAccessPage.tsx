import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { handleApiError } from "@/lib/error-utils";
import { marketingPermissionsService } from "@/services/marketingPermissionsService";
import type { MarketingSectionPermission } from "@/utils/marketingAccess";

export default function MarketingAccessPage() {
  const [rows, setRows] = useState<MarketingSectionPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    marketingPermissionsService
      .list()
      .then(setRows)
      .catch((error) => handleApiError(error, "Failed to load marketing access"))
      .finally(() => setLoading(false));
  }, []);

  const setFlag = (
    key: string,
    flag: "canView" | "canCreate" | "canEdit" | "canDelete",
    value: boolean,
  ) => {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, [flag]: value } : row)),
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const saved = await marketingPermissionsService.save(rows);
      setRows(saved);
      toast.success("Marketing Admin access updated");
    } catch (error) {
      handleApiError(error, "Failed to save marketing access");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-semibold md:text-2xl">Marketing Admin access</h1>
            <p className="text-sm text-muted-foreground">
              These switches apply to the Marketing Admin role only. Super Admin keeps full access.
            </p>
          </div>
        </div>
        <Button onClick={save} disabled={loading || saving || rows.length === 0}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sections</CardTitle>
          <CardDescription>
            View controls the menu and the page. Create, edit, and delete control what that role can change.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section</TableHead>
                <TableHead>View</TableHead>
                <TableHead>Create</TableHead>
                <TableHead>Edit</TableHead>
                <TableHead>Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  {(["canView", "canCreate", "canEdit", "canDelete"] as const).map((flag) => (
                    <TableCell key={flag}>
                      <Checkbox
                        checked={row[flag]}
                        onCheckedChange={(checked) => setFlag(row.key, flag, checked === true)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
