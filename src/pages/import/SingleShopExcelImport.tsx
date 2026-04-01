import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader } from "@/components/ui/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminImportService } from "@/services/adminImportService";
import { ArrowUpDown, Download, FileUp, Trash2, Store, CheckCircle, AlertCircle } from "lucide-react";

// ─── Sheet definition ────────────────────────────────────────────────────────
// Mirrors the special single-shop Excel format expected by the backend.
// Adjust headers to match the backend's actual template if needed.
type SheetKey =
  | "ShopProfile"
  | "MenuFolders"
  | "MenuItems"
  | "Varient"
  | "Topping"
  | "Operation Hour"
  | "PaymentType";

const SHEET_CONFIG: Record<SheetKey, { title: string; headers: string[] }> = {
  ShopProfile: {
    title: "ShopProfile",
    headers: ["Key", "Value"],
  },
  MenuFolders: {
    title: "MenuFolders",
    headers: ["Folder Name", "Folder Name (MM)", "Sort Order"],
  },
  MenuItems: {
    title: "MenuItems",
    headers: [
      "Folder Name",
      "Item Name",
      "Item Name (MM)",
      "Price",
      "Currency",
      "Description",
      "Image URL",
      "Popular",
      "Vegetarian",
      "Spicy"
    ],
  },
  Varient: {
    title: "Varient",
    headers: ["Item Name", "Variant Group", "Variant Name", "Extra Price"],
  },
  Topping: {
    title: "Topping",
    headers: ["Item Name", "Topping Name", "Extra Price"],
  },
  "Operation Hour": {
    title: "Operation Hour",
    headers: ["Day of Week", "Open Time", "Close Time", "Is Closed"],
  },
  PaymentType: {
    title: "PaymentType",
    headers: ["Payment Method", "Account Name", "Account Number", "Type"],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
type ParsedRow = { __excelRow: number } & Record<string, unknown>;

function isBlank(v: unknown) {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

function normalizeHeader(h: unknown) {
  return String(h ?? "").trim();
}

function parseSheetToRows(ws: XLSX.WorkSheet): { headers: string[]; rows: ParsedRow[] } {
  const matrix = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
    blankrows: false,
  }) as unknown[][];
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
    const { headers, title } = SHEET_CONFIG[key];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    XLSX.utils.book_append_sheet(wb, ws, title);
  });
  return wb;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function SingleShopExcelImport() {
  const [file, setFile] = useState<File | null>(null);
  const [workbookData, setWorkbookData] = useState<
    Partial<Record<SheetKey, { headers: string[]; rows: ParsedRow[] }>>
  >({});
  const [selectedSheet, setSelectedSheet] = useState<SheetKey>("ShopProfile");

  const [showOnlyNullRows, setShowOnlyNullRows] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [uploading, setUploading] = useState(false);
  const [backendResult, setBackendResult] = useState<{
    success: boolean;
    message: string;
    data?: {
      successCount?: number;
      failureCount?: number;
      errors?: Array<{ row: number; message: string }>;
    };
  } | null>(null);

  const sheet = workbookData[selectedSheet];
  const headers = useMemo(() => sheet?.headers ?? [], [sheet]);
  const rows = useMemo(() => sheet?.rows ?? [], [sheet]);

  // const hasErrors = useMemo(() => {
  //   // Validation commented out
  //   return false; // rows.some((r) => headers.some((h) => isBlank(r[h])));
  // }, [rows, headers]);

  const availableSheets = useMemo(
    () =>
      (Object.keys(SHEET_CONFIG) as SheetKey[]).filter(
        (k) => (workbookData[k]?.rows.length ?? 0) > 0
      ),
    [workbookData]
  );

  const visibleRows = useMemo(() => {
    const filtered = showOnlyNullRows
      ? rows.filter((r) => headers.some((h) => isBlank(r[h])))
      : rows;

    return [...filtered].sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      const aVal = key === "__excelRow" ? a.__excelRow : a[key];
      const bVal = key === "__excelRow" ? b.__excelRow : b[key];
      const aComp =
        typeof aVal === "string"
          ? aVal.toLowerCase()
          : (aVal as number | boolean | null);
      const bComp =
        typeof bVal === "string"
          ? bVal.toLowerCase()
          : (bVal as number | boolean | null);
      if (aComp === null || aComp === undefined) return 1;
      if (bComp === null || bComp === undefined) return -1;
      if (aComp === bComp) return 0;
      if (aComp! < bComp!) return direction === "asc" ? -1 : 1;
      return direction === "asc" ? 1 : -1;
    });
  }, [rows, headers, showOnlyNullRows, sortConfig]);

  const totalItems = visibleRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const pagedRows = visibleRows.slice(startIndex, endIndex);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
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

      const next: Partial<Record<SheetKey, { headers: string[]; rows: ParsedRow[] }>> =
        {};
      (Object.keys(SHEET_CONFIG) as SheetKey[]).forEach((name) => {
        const ws = wb.Sheets[name];
        if (!ws) return;
        next[name] = parseSheetToRows(ws);
      });

      setWorkbookData(next);

      const firstAvailable = (Object.keys(SHEET_CONFIG) as SheetKey[]).find(
        (k) => next[k]?.rows.length
      );
      if (firstAvailable) setSelectedSheet(firstAvailable);

      toast.success("Excel loaded", { description: "Preview updated from your file." });
    } catch (e) {
      console.error(e);
      toast.error("Failed to read Excel file", { description: "Invalid file" });
    }
  };

  const downloadTemplate = () => {
    const wb = buildTemplateWorkbook();
    XLSX.writeFile(wb, "single-shop-import-template.xlsx");
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select an Excel file first");
      return;
    }

    setUploading(true);
    setBackendResult(null);
    try {
      const result = await adminImportService.importSingleShopExcel(file);
      setBackendResult({
        success: true,
        message: result?.message || "Import completed successfully.",
        data: result?.data,
      });
      toast.success("Import completed", {
        description: "Single shop imported successfully.",
      });
    } catch (e: unknown) {
      console.error(e);
      const error = e as { data?: { message?: string; successCount?: number; failureCount?: number } };
      setBackendResult({
        success: false,
        message: error?.data?.message || "Backend returned an error.",
        data: error?.data,
      });
      toast.error("Import failed", { description: "Backend returned an error." });
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setWorkbookData({});
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
              <div className="flex items-center gap-2 mb-1">
                <Store className="h-5 w-5 text-primary" />
                <CardTitle className="leading-tight">
                  Import Single Shop (Excel)
                </CardTitle>
              </div>
              <CardDescription className="line-clamp-2 md:line-clamp-none">
                Upload a special single-shop Excel file, preview each sheet, and import it.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="gap-2 shrink-0"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
              <Button
                onClick={handleUpload}
                className="gap-2 shrink-0"
                disabled={!file || uploading /* || hasErrors */}
              >
                <FileUp className="h-4 w-4" />
                {uploading ? "Importing…" : "Upload"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error banner 
          {hasErrors && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md border border-destructive/20 text-sm font-medium">
              Data contains NULL values. Please correct the highlighted cells before
              importing.
            </div>
          )} */}

          {/* File picker + controls */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Excel file</div>
              {!file ? (
                <>
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                  />
                  <div className="text-xs text-muted-foreground">
                    Sheets supported: {Object.keys(SHEET_CONFIG).join(", ")}.
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/20">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                  >
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

          {/* Sheet selector — only shown when the file is loaded */}
          {availableSheets.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Sheet:</span>
              <div className="flex gap-1 flex-wrap">
                {availableSheets.map((key) => (
                  <Button
                    key={key}
                    variant={selectedSheet === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedSheet(key);
                      setSortConfig(null);
                      setCurrentPage(1);
                    }}
                  >
                    {SHEET_CONFIG[key].title}
                    <span className="ml-1.5 text-xs opacity-70">
                      ({workbookData[key]?.rows.length ?? 0})
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Backend Result Banner */}
          {backendResult && (
            <div
              className={`px-4 py-3 rounded-md border text-sm font-medium ${
                backendResult.success
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-destructive/15 text-destructive border-destructive/20"
              }`}
            >
              <div className="flex items-start gap-2">
                {backendResult.success ? (
                  <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">{backendResult.success ? "Success" : "Error"}</div>
                  <div className="mt-1 font-normal opacity-90 break-words max-w-[80vw]">{backendResult.message}</div>
                </div>
              </div>
            </div>
          )}

          {/* Data table */}
          <div className="rounded-md border overflow-x-auto relative">
            {uploading && (
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
                  <TableHead
                    className="w-[90px] cursor-pointer"
                    onClick={() => handleSort("__excelRow")}
                  >
                    <div className="flex items-center gap-2">
                      No. <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  {headers.map((h) => (
                    <TableHead
                      key={h}
                      className="cursor-pointer whitespace-nowrap"
                      onClick={() => handleSort(h)}
                    >
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
                          <TableCell
                            key={h}
                            className={blank ? "bg-red-50 text-red-700 font-semibold" : ""}
                          >
                            {blank ? "NULL" : String(v)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={headers.length + 1}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {file
                        ? 'No rows to display (try turning off "Show only rows with NULL").'
                        : "Upload an Excel file to preview."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing {totalItems ? startIndex + 1 : 0} to {endIndex} of {totalItems}{" "}
              entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </Button>
            </div>
          </div>


        </CardContent>
      </Card>
    </div>
  );
}
