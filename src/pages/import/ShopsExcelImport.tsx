import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader } from "@/components/ui/loader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminImportService } from "@/services/adminImportService";
import { ArrowUpDown, Download, FileUp, Trash2 } from "lucide-react";

type SheetKey = "Shops" | "MenuItems" | "OperatingHours";

const SHEET_CONFIG: Record<SheetKey, { title: string; headers: string[] }> = {
  Shops: {
    title: "Shops",
    headers: [
      "Name",
      "Name (MM)",
      "Slug",
      "Category",
      "Latitude",
      "Longitude",
      "Address",
      "Name (EN)",
      "Sub Category",
      "Township",
      "City",
      "Phone",
      "Email",
      "Description",
      "Description (MM)",
      "Specialties",
      "Delivery",
      "Parking",
      "Wifi",
      "Verified",
      "Active",
      "Cover Photo",
      "Address (MM)",
      "Price Pref",
      "Halal",
      "Vegetarian",
      "Gallery Photos",
    ],
  },
  MenuItems: {
    title: "MenuItems",
    headers: [
      "Shop Slug",
      "Category",
      "Item Name",
      "Price",
      "Currency",
      "Vegetarian",
      "Spicy",
      "Popular",
      "Image URL",
      "Name (MM)",
      "Name (EN)",
    ],
  },
  OperatingHours: {
    title: "OperatingHours",
    headers: ["Shop Slug", "Day of Week", "Open Time", "Close Time", "Is Closed"],
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
  (Object.keys(SHEET_CONFIG) as SheetKey[]).forEach((key) => {
    const { headers } = SHEET_CONFIG[key];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    XLSX.utils.book_append_sheet(wb, ws, key);
  });
  return wb;
}

import { useExcelImport } from "@/context/use-excel-import";

export default function ShopsExcelImport() {
  const {
    file,
    setFile,
    workbookData,
    setWorkbookData,
    selectedSheet,
    setSelectedSheet,
    clearData,
  } = useExcelImport();

  // Remove local states that are now global
  // const [file, setFile] = useState<File | null>(null);
  // const [selectedSheet, setSelectedSheet] = useState<SheetKey>("Shops");
  // const [workbookData, setWorkbookData] = useState<...>(...);

  const [showOnlyNullRows, setShowOnlyNullRows] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [validating, setValidating] = useState(false);
  const [backendResult, setBackendResult] = useState<unknown>(null);

  const sheet = workbookData[selectedSheet];
  const headers = useMemo(() => sheet?.headers ?? [], [sheet]);
  const rows = useMemo(() => sheet?.rows ?? [], [sheet]);

  const hasErrors = useMemo(() => {
    return rows.some(r => headers.some(h => isBlank(r[h])));
  }, [rows, headers]);

  const visibleRows = useMemo(() => {
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
  }, [rows, headers, showOnlyNullRows, sortConfig]);

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

  const onPickFile = async (picked: File | null) => {
    setFile(picked);
    setBackendResult(null);
    setSortConfig(null);
    setCurrentPage(1);
    setWorkbookData({});
    if (!picked) return;

    try {
      const buffer = await picked.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });

      const next: Partial<Record<SheetKey, { headers: string[]; rows: ParsedRow[] }>> = {};
      (Object.keys(SHEET_CONFIG) as SheetKey[]).forEach((name) => {
        const ws = wb.Sheets[name];
        if (!ws) return;
        next[name] = parseSheetToRows(ws);
      });

      setWorkbookData(next as Record<SheetKey, { headers: string[]; rows: ParsedRow[] }>);
      const firstAvailable = (Object.keys(SHEET_CONFIG) as SheetKey[]).find((k) => next[k]?.rows.length);
      if (firstAvailable) setSelectedSheet(firstAvailable);

      toast.success("Excel loaded", { description: "Preview updated from your file." });
    } catch (e) {
      console.error(e);
      toast.error("Failed to read Excel file", { description: "Invalid file" });
    }
  };

  const downloadTemplate = () => {
    const wb = buildTemplateWorkbook();
    XLSX.writeFile(wb, "shops-import-template.xlsx");
  };

  const validateWithBackend = async () => {
    if (!file) {
      toast.error("Please select an Excel file first");
      return;
    }

    setValidating(true);
    try {
      const result = await adminImportService.importShopsExcel(file);
      setBackendResult(result);
      toast.success("Validation completed");
    } catch (e) {
      console.error(e);
      toast.error("Validation failed", { description: "Backend error" });
    } finally {
      setValidating(false);
    }
  };

  const handleClear = () => {
    clearData();
    setBackendResult(null);
    setSortConfig(null);
    setCurrentPage(1);
    toast.info("Data cleared");
  };

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="leading-tight">Import Shops (Excel)</CardTitle>
              <CardDescription className="line-clamp-2 md:line-clamp-none">
                Upload an Excel file, preview exact sheet data, and validate it via backend before importing.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button variant="outline" onClick={downloadTemplate} className="gap-2 shrink-0">
                <Download className="h-4 w-4" />
                Download Template
              </Button>
              <Button onClick={validateWithBackend} className="gap-2 shrink-0" disabled={!file || validating || hasErrors}>
                <FileUp className="h-4 w-4" />
                Upload
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasErrors && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md border border-destructive/20 text-sm font-medium">
              Data contains NULL values. Please correct the highlighted cells before validating.
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
                    <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 w-8 p-0 text-destructive hover:text-destructive/90">
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

          {/* removed sheet selector */}

          <div className="rounded-md border overflow-x-auto relative">
            {validating && (
              <div className="absolute inset-0 z-20 bg-background/70 backdrop-blur-sm flex items-center justify-center">
                <div className="flex items-center gap-3">
                  <Loader />
                  <div className="text-sm font-medium">Validating with backend…</div>
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
                <CardDescription>Raw response from the validation endpoint.</CardDescription>
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






