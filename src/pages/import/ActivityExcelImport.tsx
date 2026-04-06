import { useMemo, useState } from "react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminImportService } from "@/services/adminImportService";
import { ArrowUpDown, Download, FileUp, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Loader } from "@/components/ui/loader";

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


export default function ActivityExcelImport() {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<{ headers: string[]; rows: ParsedRow[] } | null>(null);
  const [validating, setValidating] = useState(false);
  const [backendResult, setBackendResult] = useState<unknown>(null);
  const [showOnlyNullRows, setShowOnlyNullRows] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseSheetToRows = (xlsxLib: any, ws: any): { headers: string[]; rows: ParsedRow[] } => {
    const matrix = xlsxLib.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false }) as unknown[][];
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
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildTemplateWorkbook = (xlsxLib: any): any => {
    const wb = xlsxLib.utils.book_new();

    Object.entries(SHEET_CONFIG).forEach(([, config]) => {
      const ws = xlsxLib.utils.aoa_to_sheet([config.headers]);
      xlsxLib.utils.book_append_sheet(wb, ws, config.title);
    });

    return wb;
  };


  const headers = useMemo(() => parsed?.headers ?? [], [parsed]);
  const rows = useMemo(() => parsed?.rows ?? [], [parsed]);

  const visibleRows = useMemo(() => {
    if (!parsed) return [];
    const filtered = showOnlyNullRows ? rows.filter((r) => headers.some((h) => isBlank(r[h]))) : rows;

    const sorted = [...filtered].sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;

      const aVal = key === "__excelRow" ? a.__excelRow : a[key];
      const bVal = key === "__excelRow" ? b.__excelRow : b[key];

      const aComp = typeof aVal === "string" ? aVal.toLowerCase() : (aVal as number | boolean | null);
      const bComp = typeof bVal === "string" ? bVal.toLowerCase() : (bVal as number | boolean | null);

      if (aComp === null || aComp === undefined) return 1;
      if (bComp === null || bComp === undefined) return -1;
      if (aComp === bComp) return 0;
      if (aComp! < bComp!) return direction === "asc" ? -1 : 1;
      return direction === "asc" ? 1 : -1;
    });

    return sorted;
  }, [parsed, rows, headers, showOnlyNullRows, sortConfig]);

  const totalItems = visibleRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const pagedRows = visibleRows.slice(startIndex, endIndex);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };


  const onPickFile = async (f: File | null) => {
    if (!f) return;
    setFile(f);
    setBackendResult(null);
    setParsed(null);

    try {
      const XLSX = await import("xlsx");
      const blob = f.slice(0, 1 << 20);
      const arrayBuffer = await blob.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const { headers, rows } = parseSheetToRows(XLSX, firstSheet);
      setParsed({ headers, rows });
      toast.success("Excel loaded", { description: "Preview updated from your file." });
    } catch (e) {
      handleApiError(e, "Failed to read Excel file");
    }
  };

  const clearData = () => {
    setFile(null);
    setParsed(null);
    setBackendResult(null);
  };

  const downloadTemplate = async () => {
    try {
      const XLSX = await import("xlsx");
      const wb = buildTemplateWorkbook(XLSX);
      XLSX.writeFile(wb, "activity-import-template.xlsx");
    } catch (e) {
      handleApiError(e, "Failed to download template");
    }
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
      handleApiError(e, "Import failed");
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
    return parsed.rows.some((row) => headers.some((h) => isBlank(row[h])));
  }, [parsed, headers]);

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

            <div className="flex flex-col gap-3 md:items-end">
              <div className="flex items-center gap-3">
                <div className="text-sm">Show only rows with NULL</div>
                <Switch
                  checked={showOnlyNullRows}
                  onCheckedChange={(v) => {
                    setShowOnlyNullRows(v);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">Rows per page</div>
                <Input
                  className="w-20"
                  type="number"
                  min={5}
                  max={200}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Math.max(5, Number(e.target.value || 20)));
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto relative">
            {validating && (
              <div className="absolute inset-0 z-20 bg-background/70 backdrop-blur-sm flex items-center justify-center">
                <div className="flex items-center gap-3">
                  <Loader />
                  <div className="text-sm font-medium">Importing to backend…</div>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[90px] cursor-pointer" onClick={() => handleSort("__excelRow")}>
                    <div className="flex items-center gap-2">
                      No. <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  {headers.map((h) => (
                    <TableHead key={h} className="cursor-pointer whitespace-nowrap" onClick={() => handleSort(h)}>
                      <div className="flex items-center gap-2">
                        {h} <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedRows.length ? (
                  pagedRows.map((r, idx) => (
                    <TableRow key={`${r.__excelRow}-${idx}`}>
                      <TableCell className="font-mono text-xs">{r.__excelRow}</TableCell>
                      {headers.map((h) => {
                        const v = r[h];
                        const blank = isBlank(v);
                        return (
                          <TableCell key={h} className={blank ? "bg-red-50 text-red-700 font-semibold" : ""}>
                            {blank ? "NULL" : String(v)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={headers.length + 1} className="h-24 text-center text-muted-foreground">
                      {file ? "No rows to display (try turning off “Show only rows with NULL”)." : "Upload an Excel file to preview."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing {totalItems ? startIndex + 1 : 0} to {endIndex} of {totalItems} entries
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </Button>
              <div className="text-sm">
                Page {currentPage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                Last
              </Button>
            </div>
          </div>

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
