import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminImportService } from "@/services/adminImportService";
import { Download, FileUp, Trash2 } from "lucide-react";

type SheetKey = "Activities";

const SHEET_CONFIG: Record<SheetKey, { title: string; headers: string[] }> = {
  Activities: {
    title: "Activities",
    headers: [
      "Name",
      "Name (MM)",
      "Description",
      "Description (MM)",
      "Category",
      "Location",
      "Latitude",
      "Longitude",
      "Address",
      "Address (MM)",
      "Price",
      "Currency",
      "Start Date",
      "End Date",
      "Cover Photo",
      "Gallery Photos",
      "Active",
    ],
  },
};

type ParsedRow = { __excelRow: number } & Record<string, unknown>;

function isBlank(v: unknown) {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

function normalizeHeader(h: unknown) {
  return String(h ?? "").trim();
}

function parseSheetToRows(ws: XLSX.WorkSheet): { headers: string[]; rows: ParsedRow[] } {
  const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false }) as unknown[][];
  if (!matrix.length) return { headers: [], rows: [] };

  const headers = (matrix[0] || []).map(normalizeHeader).filter(Boolean);
  const rows: ParsedRow[] = [];

  for (let i = 1; i < matrix.length; i++) {
    const rowArr = matrix[i] || [];
    const rowObj: ParsedRow = { __excelRow: i + 1 };
    for (let c = 0; c < headers.length; c++) {
      rowObj[headers[c]] = rowArr[c] ?? null;
    }
    rows.push(rowObj);
  }

  return { headers, rows };
}

function buildTemplateWorkbook() {
  const wb = XLSX.utils.book_new();

  Object.entries(SHEET_CONFIG).forEach(([, config]) => {
    const ws = XLSX.utils.aoa_to_sheet([config.headers]);
    XLSX.utils.book_append_sheet(wb, ws, config.title);
  });

  return wb;
}

export default function ActivityExcelImport() {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<{ headers: string[]; rows: ParsedRow[] } | null>(null);
  const [validating, setValidating] = useState(false);
  const [backendResult, setBackendResult] = useState<unknown>(null);

  const onPickFile = async (f: File | null) => {
    if (!f) return;
    setFile(f);
    setBackendResult(null);
    setParsed(null);

    try {
      const blob = f.slice(0, 1 << 20);
      const arrayBuffer = await blob.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const { headers, rows } = parseSheetToRows(firstSheet);
      setParsed({ headers, rows });
      toast.success("Excel loaded", { description: "Preview updated from your file." });
    } catch (e) {
      console.error(e);
      toast.error("Failed to read Excel file", { description: "Invalid file" });
    }
  };

  const clearData = () => {
    setFile(null);
    setParsed(null);
    setBackendResult(null);
  };

  const downloadTemplate = () => {
    const wb = buildTemplateWorkbook();
    XLSX.writeFile(wb, "activity-import-template.xlsx");
  };

  const validateWithBackend = async () => {
    if (!file) {
      toast.error("Please select an Excel file first");
      return;
    }

    setValidating(true);
    try {
      const result = await adminImportService.importActivityExcel(file);
      setBackendResult(result);
      toast.success("Import completed");
    } catch (e) {
      console.error(e);
      toast.error("Import failed", { description: "Backend error" });
    } finally {
      setValidating(false);
    }
  };

  const handleClear = () => {
    clearData();
    toast.info("Data cleared");
  };

  const hasErrors = useMemo(() => {
    if (!parsed?.rows.length) return false;
    return parsed.rows.some((row) => Object.values(row).some((v) => isBlank(v)));
  }, [parsed]);

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="leading-tight">Import Activities (Excel)</CardTitle>
              <CardDescription className="line-clamp-2 md:line-clamp-none">
                Upload an Excel file, preview exact sheet data, and import it via backend.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button variant="outline" onClick={downloadTemplate} className="gap-2 shrink-0">
                <Download className="h-4 w-4" />
                Download Template
              </Button>
              <Button onClick={validateWithBackend} className="gap-2 shrink-0" disabled={!file || validating}>
                <FileUp className="h-4 w-4" />
                {validating ? "Importing..." : "Upload"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasErrors && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md border border-destructive/20 text-sm font-medium">
              Data contains NULL values. Please correct the highlighted cells before importing.
            </div>
          )}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Excel file</div>
              {!file ? (
                <>
                  <Input type="file" accept=".xlsx,.xls" onChange={(e) => onPickFile(e.target.files?.[0] ?? null)} />
                  <div className="text-xs text-muted-foreground">Sheets supported: {Object.keys(SHEET_CONFIG).join(", ")}.</div>
                </>
              ) : (
                <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/20">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleClear}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {parsed && parsed.rows.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      {parsed.headers.map((h) => (
                        <TableHead key={h} className="min-w-[120px]">
                          <div className="flex items-center gap-1">
                            {h}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsed.rows.slice(0, 50).map((row) => (
                      <TableRow key={row.__excelRow} className={Object.values(row).some((v) => isBlank(v) && typeof v !== "number") ? "bg-destructive/10" : ""}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{row.__excelRow}</TableCell>
                        {parsed.headers.map((h) => (
                          <TableCell key={h} className="max-w-[200px] truncate">
                            {row[h] === null || row[h] === undefined ? (
                              <span className="text-destructive italic">null</span>
                            ) : (
                              String(row[h])
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {parsed.rows.length > 50 && (
                <div className="p-3 text-center text-sm text-muted-foreground border-t">
                  Showing first 50 of {parsed.rows.length} rows
                </div>
              )}
            </div>
          )}

          {parsed && parsed.rows.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No data found in the Excel file</div>
          )}

          {backendResult !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Backend response</CardTitle>
                <CardDescription>Raw response from the import endpoint.</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs whitespace-pre-wrap break-words bg-muted p-3 rounded-md overflow-auto max-h-[320px]">
                  {typeof backendResult === "string" ? backendResult : JSON.stringify(backendResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
