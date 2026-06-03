import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { adminImportService, type OnboardingReferenceTemplateLists } from "@/services/adminImportService";
import { ApiError } from "@/services/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import { adminShopProfilesQueryRoot } from "@/hooks/shops/shared/adminShopProfilesQueryKeys";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  formatExcelPriceForPreview,
  isExcelPriceHeader,
  normalizeExcelPriceValue,
} from "@/lib/excel-price";
import {
  ArrowUpDown,
  Download,
  FileUp,
  Trash2,
  Store,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  ShieldCheck,
  PlusCircle,
  User,
  Loader2,
  ClipboardList,
} from "lucide-react";

// ─── Sheet definition ────────────────────────────────────────────────────────
// Mirrors the onboarding workbook consumed by Nest `POST /admin/shop-profile/import/excel`.
// Analyst sample: sheets named ShopProfile, MenuCategories, MenuItems, Varient, …
type SheetKey =
  | "ShopProfile"
  | "MenuCategories"
  | "MenuItems"
  | "Varient"
  | "Topping"
  | "Operation Hour"
  | "PaymentType"
  | "ReferenceData";

const SHEET_CONFIG: Record<
  SheetKey,
  {
    title: string;
    headers: string[];
    /** Header keys where an empty Excel cell should not show as highlighted NULL in preview (matches workbook semantics). */
    previewNullableHeaders?: string[];
    /** Extra rows after the header row in "Download template" `.xlsx` exports. */
    templateBodyRows?: (string | number | null)[][];
  }
> = {
  ShopProfile: {
    title: "ShopProfile",
    headers: ["field_key", "display_name", "value"],
  },
  MenuCategories: {
    title: "MenuCategories",
    headers: [
      "menu_name_en",
      "menu_name_mm",
      "menu_name_th",
      "master_category_key",
    ],
  },
  MenuItems: {
    title: "MenuItems",
    headers: [
      "menu_name_en",
      "item_name_en",
      "item_name_mm",
      "item_name_th",
      "price",
      "is_available",
      "is_popular",
      "is_vegetarian",
      "is_spicy",
      "is_hot_deal",
      "is_recommended",
      "meal_type",
      "item_image",
    ],
  },
  Varient: {
    title: "Varient",
    headers: [
      "item_name_en",
      "varient_name_en",
      "varient_name_mm",
      "varient_name_th",
      "varient_price",
    ],
  },
  Topping: {
    title: "Topping",
    headers: [
      "item_name_en",
      "topping_name_en",
      "topping_name_mm",
      "topping_name_th",
      "topping_price",
    ],
  },
  "Operation Hour": {
    title: "Operation Hour",
    headers: ["day_of_week", "open_time", "close_time", "is_closed"],
    /** Blank means "open that day"; only explicit Yes/true marks closed — same as Excel. */
    previewNullableHeaders: ["is_closed"],
  },
  PaymentType: {
    title: "PaymentType",
    headers: ["payment_type", "acc_name", "acc_number", "qr_image"],
  },
  /**
   * Column order matches Nest `referenceHeaderToField`; sample rows are generated from GET onboarding-reference-lists.
   */
  ReferenceData: {
    title: "ReferenceData",
    headers: [
      "ShopCategory",
      "CuisineType",
      "MasterMenuCategory",
      "YesNo",
      "DayOfWeek",
      "MealType",
      "PaymentType",
      "District",
    ],
    previewNullableHeaders: [
      "ShopCategory",
      "CuisineType",
      "MasterMenuCategory",
      "YesNo",
      "DayOfWeek",
      "MealType",
      "PaymentType",
      "District",
    ],
  },
};

const REFERENCE_TEMPLATE_MAX_ROWS = 50;

/** Zip API lists into sample rows (one row per index up to longest taxonomy column, capped). YesNo / DayOfWeek are not repeated—they fill row i only while i is within those short lists (then blank). Meal types still cycle when shorter than row count (many distinct meal tags). */
function buildReferenceDataTemplateRows(
  lists: OnboardingReferenceTemplateLists | null,
): (string | number | null)[][] {
  if (!lists) return [];
  const ys = lists.yesNo.length ? lists.yesNo : ["Yes", "No"];
  const days = lists.dayOfWeek.length ? lists.dayOfWeek : ["Sunday", "Monday"];
  const meals =
    lists.mealTypes.length > 0 ?
      lists.mealTypes
      : ["Breakfast", "Lunch", "Dinner", "Snacks", "Beverages"];

  /** Row count follows “wide” taxonomy only—YesNo/DayOfWeek are small fixed lists and must not duplicate down the sheet. */
  const lengths = [
    lists.shopCategories.length,
    lists.cuisineTypes.length,
    lists.masterMenuCategories.length,
    meals.length,
    lists.paymentTypes.length,
    lists.districts.length,
  ];
  const n = Math.min(REFERENCE_TEMPLATE_MAX_ROWS, Math.max(1, ...lengths));

  const rows: (string | number | null)[][] = [];
  for (let i = 0; i < n; i++) {
    rows.push([
      lists.shopCategories[i] ?? "",
      lists.cuisineTypes[i] ?? "",
      lists.masterMenuCategories[i] ?? "",
      i < ys.length ? (ys[i] ?? "") : "",
      i < days.length ? (days[i] ?? "") : "",
      meals[i % meals.length] ?? "",
      lists.paymentTypes[i] ?? "",
      lists.districts[i] ?? "",
    ]);
  }
  return rows;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
type ParsedRow = { __excelRow: number } & Record<string, unknown>;

function isBlank(v: unknown) {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

/** SheetJS yields Excel clock times as 0–1 day fractions (or datetime serials ≥1); format like Excel default AM/PM. */
function formatExcelTimePreview(v: unknown): string | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  let frac = v;
  /** Datetime serial: use time-of-day fraction */
  if (frac >= 1 || frac <= -1) {
    frac = ((frac % 1) + 1) % 1;
  } else if (frac < 0) {
    return null;
  }
  if (frac < 0 || frac > 1) return null;
  const secs = Math.round(frac * 86400);
  let h24 = Math.floor(secs / 3600) % 24;
  let m = Math.floor((secs % 3600) / 60);
  if (m === 60) {
    m = 0;
    h24 = (h24 + 1) % 24;
  }
  const ap = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  const mm = String(m).padStart(2, "0");
  return `${h12}:${mm} ${ap}`;
}

/** Format a single workbook cell for the preview grid (localized display, not raw JSON). */
function formatPreviewCell(
  sheet: SheetKey | undefined,
  header: string,
  v: unknown,
): string {
  const isHourCol =
    sheet === "Operation Hour" &&
    (header === "open_time" || header === "close_time");

  /** `raw:false` on this sheet yields the same formatted text Excel shows (timezone-neutral). */
  if (isHourCol && typeof v === "string") {
    const t = v.trim();
    if (t && t !== "—") return String(v);
  }

  if (isHourCol && typeof v === "number" && Number.isFinite(v)) {
    const clock = formatExcelTimePreview(v);
    if (clock != null) return clock;
  }

  if (isHourCol && v instanceof Date && !Number.isNaN(v.getTime())) {
    /** Serial-backed Dates: try UTC getters first (xlsx parsers often map workbook time onto UTC). */
    const utcFrac =
      ((((v.getUTCHours() * 3600 + v.getUTCMinutes() * 60 + v.getUTCSeconds()) %
        86400) +
        86400) %
        86400) /
      86400;
    const locFrac =
      ((((v.getHours() * 3600 + v.getMinutes() * 60 + v.getSeconds()) % 86400) +
        86400) %
        86400) /
      86400;
    const out =
      formatExcelTimePreview(utcFrac) ??
      formatExcelTimePreview(locFrac) ??
      null;
    if (out != null) return out;
  }

  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";

  if (isExcelPriceHeader(header)) {
    return formatExcelPriceForPreview(v);
  }

  return String(v ?? "");
}

function previewHeaderIsNullable(sheetKey: SheetKey | undefined, header: string): boolean {
  return Boolean(sheetKey && SHEET_CONFIG[sheetKey]?.previewNullableHeaders?.includes(header));
}

function normalizeHeader(h: unknown) {
  return String(h ?? "").trim();
}

function summarizeOnboardingResult(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Completed.";
  const o = payload as Record<string, unknown>;

  if (o.dryRun === true) {
    const cnt = (o.counts ?? {}) as Record<string, unknown>;
    const cntBits = [`fields ${cnt.shopProfileFields ?? "—"}`, `categories ${cnt.menuCategoriesDeclared ?? "—"}`, `items ${cnt.menuItems ?? "—"}`].join(" · ");
    return `Dry run succeeded (${cntBits}). Toggle off Dry run and submit with a ShopAdmin password to persist.`;
  }

  const id = typeof o.shopId === "number" ? o.shopId : "—";
  const name =
    typeof o.shopNameEn === "string"
      ? o.shopNameEn
      : "";

  let msg = name
    ? `Created shop "${name}" (id ${id}).`
    : `Shop created (id ${id}).`;
  msg += ` ${formatWarningCount(o)}`;
  return msg;
}

function formatWarningCount(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const w = (payload as { warnings?: unknown }).warnings;
  if (!Array.isArray(w)) return "";
  const n = w.length;
  if (!n) return "";
  return `API returned ${n} warning${n === 1 ? "" : "s"} (expand response below).`;
}

function onboardingWarnings(payload: unknown): Array<{ code?: string; detail?: string }> {
  if (!payload || typeof payload !== "object") return [];
  const w = (payload as { warnings?: unknown }).warnings;
  if (!Array.isArray(w)) return [];
  return w.filter(
    (x): x is { code?: string; detail?: string } =>
      !!x && typeof x === "object",
  );
}

type ImportCounts = {
  shopProfileFields?: number;
  menuCategoriesDeclared?: number;
  inferredMenuGroupingKeys?: number;
  menuItems?: number;
  variants?: number;
  toppings?: number;
  operatingHourRows?: number;
  paymentRows?: number;
  referenceDataRowsParsed?: number;
};

function extractCounts(payload: unknown): ImportCounts | null {
  if (!payload || typeof payload !== "object") return null;
  const c = (payload as { counts?: unknown }).counts;
  if (!c || typeof c !== "object") return null;
  return c as ImportCounts;
}

type ResolvedSummary = {
  shopCategoryId?: number;
  shopSubCategoryId?: number | null;
  districtId?: number | null;
  cityId?: number | null;
  cuisineIds?: number[];
  profileHints?: { nameEn?: string | null; districtEnLabel?: string | null };
};

function extractResolvedSummary(payload: unknown): ResolvedSummary | null {
  if (!payload || typeof payload !== "object") return null;
  const r = (payload as { resolvedSummary?: unknown }).resolvedSummary;
  if (!r || typeof r !== "object") return null;
  return r as ResolvedSummary;
}

type ImportMessage = {
  severity?: string;
  code?: string;
  detail?: string;
  sheet?: string;
  row?: number;
};

function onboardingImportErrors(payload: unknown): ImportMessage[] {
  if (!payload || typeof payload !== "object") return [];
  const e = (payload as { errors?: unknown }).errors;
  if (!Array.isArray(e)) return [];
  return e.filter((x): x is ImportMessage => !!x && typeof x === "object");
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function SingleShopExcelImport() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [workbookData, setWorkbookData] = useState<
    Partial<Record<SheetKey, { headers: string[]; rows: ParsedRow[] }>>
  >({});
  const [selectedSheet, setSelectedSheet] = useState<SheetKey>("ShopProfile");

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  /** Start in dry-run: validates workbook + FKs without provisioning ShopAdmin/menu rows. */
  const [dryRun, setDryRun] = useState(true);
  const [nestPayload, setNestPayload] = useState<unknown>(null);

  const [activeMainTab, setActiveMainTab] = useState<"preview" | "results">("preview");
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const [showOnlyNullRows, setShowOnlyNullRows] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseSheetToRows = (
    xlsxLib: any,
    ws: any,
    sheetKey: SheetKey,
  ): { headers: string[]; rows: ParsedRow[] } => {
    /**
     * Operation Hour clock cells are workbook wall times. `raw:false` asks SheetJS for the
     * formatted display string (matches Excel UI) instead of numeric serial / JS Date, which avoids
     * timezone shifts from the importer / browser TZ.
     */
    const useFormattedCells = sheetKey === "Operation Hour";
    const matrix = xlsxLib.utils.sheet_to_json(ws, {
      header: 1,
      defval: null,
      blankrows: false,
      raw: !useFormattedCells,
    }) as unknown[][];
    if (!matrix.length) return { headers: [], rows: [] };

    const headers = (matrix[0] || []).map(normalizeHeader).filter(Boolean);
    const rows: ParsedRow[] = [];

    for (let i = 1; i < matrix.length; i++) {
      const rowArr = matrix[i] || [];
      const rowObj: ParsedRow = { __excelRow: i + 1 };
      for (let c = 0; c < headers.length; c++) {
        const header = headers[c];
        const raw: unknown = rowArr[c] ?? null;
        rowObj[header] = isExcelPriceHeader(header)
          ? normalizeExcelPriceValue(raw)
          : raw;
      }
      rows.push(rowObj);
    }

    return { headers, rows };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildTemplateWorkbook = (
    xlsxLib: any,
    refLists: OnboardingReferenceTemplateLists | null,
  ): any => {
    const wb = xlsxLib.utils.book_new();
    (Object.keys(SHEET_CONFIG) as SheetKey[]).forEach((key) => {
      const { headers, title, templateBodyRows } = SHEET_CONFIG[key];
      const body =
        key === "ReferenceData" ?
          buildReferenceDataTemplateRows(refLists)
          : (templateBodyRows ?? []);
      const aoa = [headers, ...body];
      const ws = xlsxLib.utils.aoa_to_sheet(aoa);
      xlsxLib.utils.book_append_sheet(wb, ws, title);
    });
    return wb;
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [uploading, setUploading] = useState(false);
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const [backendResult, setBackendResult] = useState<{
    success: boolean;
    message: string;
    data?: {
      successCount?: number;
      failureCount?: number;
      errors?: Array<
        | { row: number; message: string }
        | ImportMessage
        | Record<string, unknown>
      >;
    };
  } | null>(null);

  interface BackendError {
    message?: string | string[];
    details?: string;
    successCount?: number;
    failureCount?: number;
    errors?: ImportMessage[] | Array<{ row?: number; message?: string }>;
    warnings?: ImportMessage[];
  }

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
      ? rows.filter((r) =>
        headers.some((h) => isBlank(r[h]) && !previewHeaderIsNullable(selectedSheet, h)),
      )
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
  }, [rows, headers, showOnlyNullRows, sortConfig, selectedSheet]);

  const totalItems = visibleRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const pagedRows = visibleRows.slice(startIndex, endIndex);

  const canSubmitImport = useMemo(() => {
    if (!file || uploading) return false;
    if (!adminEmail.trim().includes("@")) return false;
    if (!dryRun && adminPassword.trim().length < 6) return false;
    return true;
  }, [file, uploading, adminEmail, adminPassword, dryRun]);

  const onboardingSuccessWarnings = useMemo(() => {
    if (nestPayload == null || typeof nestPayload !== "object") return [];
    return onboardingWarnings(nestPayload);
  }, [nestPayload]);

  const reportErrors = useMemo(() => {
    if (nestPayload == null) return [];
    return onboardingImportErrors(nestPayload);
  }, [nestPayload]);

  const reportCounts = useMemo(() => extractCounts(nestPayload), [nestPayload]);
  const reportResolved = useMemo(() => extractResolvedSummary(nestPayload), [nestPayload]);

  const resultsTabBadgeCount = useMemo(() => {
    let n = 0;
    if (backendResult) n += 1;
    n += reportErrors.length;
    n += onboardingSuccessWarnings.length;
    return n;
  }, [backendResult, reportErrors.length, onboardingSuccessWarnings.length]);

  const nestPayloadJsonText = useMemo(() => {
    if (nestPayload == null) return null;
    try {
      return JSON.stringify(nestPayload, null, 2);
    } catch {
      return String(nestPayload);
    }
  }, [nestPayload]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };


  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    const name = dropped.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      toast.error("Invalid file", { description: "Please drop an Excel file (.xlsx or .xls)." });
      return;
    }
    void onPickFile(dropped);
  };

  const onPickFile = async (picked: File | null) => {
    setFile(picked);
    setBackendResult(null);
    setNestPayload(null);
    setSortConfig(null);
    setCurrentPage(1);
    setWorkbookData({});
    setActiveMainTab("preview");
    if (!picked) return;

    try {
      const XLSX = await import("xlsx");
      const buffer = await picked.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });

      const next: Partial<Record<SheetKey, { headers: string[]; rows: ParsedRow[] }>> =
        {};
      (Object.keys(SHEET_CONFIG) as SheetKey[]).forEach((name) => {
        const ws = wb.Sheets[name];
        if (!ws) return;
        next[name] = parseSheetToRows(XLSX, ws, name);
      });

      setWorkbookData(next);

      const firstAvailable = (Object.keys(SHEET_CONFIG) as SheetKey[]).find(
        (k) => next[k]?.rows.length
      );
      if (firstAvailable) setSelectedSheet(firstAvailable);

      toast.success("Excel loaded", { description: "Preview updated from your file." });
    } catch (e) {
      handleApiError(e, "Failed to read Excel file");
    }
  };

  const downloadTemplate = async () => {
    setTemplateDownloading(true);
    try {
      const XLSX = await import("xlsx");
      let refLists: OnboardingReferenceTemplateLists | null = null;
      try {
        refLists = await adminImportService.fetchOnboardingReferenceTemplateLists();
      } catch (e) {
        handleApiError(
          e,
          "Could not load reference lists from the API. The template includes ReferenceData headers only.",
        );
      }
      const wb = buildTemplateWorkbook(XLSX, refLists);
      XLSX.writeFile(wb, "shop-onboarding-template.xlsx");
      if (refLists) {
        toast.success("Template downloaded with live taxonomy from the database.");
      }
    } catch (e) {
      handleApiError(e, "Failed to download template");
    } finally {
      setTemplateDownloading(false);
    }
  };


  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select an Excel file first");
      return;
    }

    const emailTrim = adminEmail.trim();
    if (!emailTrim.includes("@")) {
      toast.error("Enter the new ShopAdmin email that will manage this shop.");
      return;
    }
    if (!dryRun && adminPassword.trim().length < 6) {
      toast.error("Password must be at least 6 characters to create the ShopAdmin.");
      return;
    }

    setUploading(true);
    setActiveMainTab("results");
    setBackendResult(null);
    setNestPayload(null);
    try {
      const result = await adminImportService.importShopProfileOnboardingExcel(
        file,
        {
          adminEmail: emailTrim,
          adminPassword: dryRun ? "" : adminPassword.trim(),
          adminUsername: adminUsername.trim() || undefined,
          dryRun,
        },
      );

      setNestPayload(result);

      const payload = result as Record<string, unknown>;
      const dry = payload.dryRun === true;
      const persisted = typeof payload.shopId === "number";

      if (!dry && !persisted) {
        setBackendResult({
          success: false,
          message: "Unexpected API response shape.",
        });
        return;
      }

      setBackendResult({
        success: true,
        message: summarizeOnboardingResult(result),
      });

      toast.success(dry ? "Dry run completed" : "Shop imported", {
        description: dry ? "Open the Validation report tab for counts and warnings." : "Shop list will refresh.",
      });

      if (persisted) {
        void queryClient.invalidateQueries({ queryKey: [...adminShopProfilesQueryRoot] });
      }
    } catch (e: unknown) {
      const api = e instanceof ApiError ? e : null;
      const data = api?.data;

      let message =
        api?.message ??
        (e &&
          typeof e === "object" &&
          "message" in e &&
          typeof (e as { message?: unknown }).message === "string"
          ? String((e as { message: string }).message)
          : "Import failed.");

      if (data && typeof data === "object") {
        const w = onboardingWarnings(data);
        if (w.length > 0) {
          message += `\n\nWarnings (${w.length}):\n`;
          message += w
            .map((x) => `• ${String(x.code ?? "?")} — ${String(x.detail ?? "")}`)
            .join("\n");
        }
      }

      setBackendResult({
        success: false,
        message,
        data: typeof data === "object" && data !== null ? (data as BackendError) : undefined,
      });
      if (data !== undefined && data !== null) setNestPayload(data);

      handleApiError(e, "Import rejected");
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setWorkbookData({});
    setBackendResult(null);
    setNestPayload(null);
    setSortConfig(null);
    setCurrentPage(1);
    setActiveMainTab("preview");
    dragCounterRef.current = 0;
    setIsDragging(false);
    if (excelInputRef.current) excelInputRef.current.value = "";
    toast.info("Data cleared");
  };

  const metricItems: { label: string; value: string | number }[] = [];
  if (reportCounts) {
    const c = reportCounts;
    if (c.shopProfileFields != null)
      metricItems.push({ label: "Profile fields", value: c.shopProfileFields });
    if (c.menuCategoriesDeclared != null)
      metricItems.push({ label: "Menu categories", value: c.menuCategoriesDeclared });
    if (c.inferredMenuGroupingKeys != null)
      metricItems.push({ label: "Inferred groups", value: c.inferredMenuGroupingKeys });
    if (c.menuItems != null) metricItems.push({ label: "Menu items", value: c.menuItems });
    if (c.variants != null) metricItems.push({ label: "Variants", value: c.variants });
    if (c.toppings != null) metricItems.push({ label: "Toppings", value: c.toppings });
    if (c.operatingHourRows != null)
      metricItems.push({ label: "Op. hour rows", value: c.operatingHourRows });
    if (c.paymentRows != null) metricItems.push({ label: "Payments", value: c.paymentRows });
    if (c.referenceDataRowsParsed != null)
      metricItems.push({ label: "Reference rows", value: c.referenceDataRowsParsed });
  }

  const persistPayload =
    nestPayload &&
      typeof nestPayload === "object" &&
      (nestPayload as { dryRun?: unknown }).dryRun === false ?
      (nestPayload as Record<string, unknown>)
      : null;
  const persistedShopId =
    typeof persistPayload?.shopId === "number" ? persistPayload.shopId : null;
  const persistedShopName =
    typeof persistPayload?.shopNameEn === "string" ? persistPayload.shopNameEn : null;

  const previewToolbar = (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between pb-4 border-b">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase text-muted-foreground">Sheets</span>
        {!file ? (
          <span className="text-sm text-muted-foreground">Load a workbook to preview</span>
        ) : availableSheets.length === 0 ? (
          <span className="text-sm text-amber-700">No recognised template sheets — check tab names.</span>
        ) : (
          availableSheets.map((key) => (
            <Button
              key={key}
              variant={selectedSheet === key ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1"
              onClick={() => {
                setSelectedSheet(key);
                setSortConfig(null);
                setCurrentPage(1);
              }}
            >
              {SHEET_CONFIG[key].title}
              <Badge variant="secondary" className="ml-1 font-normal px-1.5 py-0">
                {workbookData[key]?.rows.length ?? 0}
              </Badge>
            </Button>
          ))
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="null-only" className="text-xs text-muted-foreground whitespace-nowrap">
            Null cells only
          </Label>
          <Switch
            id="null-only"
            checked={showOnlyNullRows}
            onCheckedChange={(v) => {
              setShowOnlyNullRows(v);
              setCurrentPage(1);
            }}
            disabled={!file}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="page-size" className="text-xs text-muted-foreground">
            Rows / page
          </Label>
          <Input
            id="page-size"
            className="w-16 h-8"
            type="number"
            min={5}
            max={200}
            value={pageSize}
            disabled={!file}
            onChange={(e) => {
              setPageSize(Math.max(5, Number(e.target.value || 20)));
              setCurrentPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );

  const previewTable = (
    <div className="rounded-md border overflow-x-auto relative min-h-[200px]">
      {uploading && activeMainTab === "preview" ? (
        <div className="absolute inset-0 z-20 bg-background/70 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader />
            <div className="text-sm font-medium">Working…</div>
          </div>
        </div>
      ) : null}

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
                  const nullable = previewHeaderIsNullable(selectedSheet, h);
                  const showNullHighlight = blank && !nullable;
                  let displayText: string;
                  if (blank && nullable) {
                    displayText = "";
                  } else if (blank) {
                    displayText = "NULL";
                  } else {
                    displayText = formatPreviewCell(selectedSheet, h, v);
                  }

                  return (
                    <TableCell
                      key={h}
                      className={showNullHighlight ? "bg-red-50 text-red-700 font-semibold" : ""}
                    >
                      {displayText || "\u00a0"}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={Math.max(headers.length, 1) + 1}
                className="h-36 text-center text-muted-foreground"
              >
                {!file
                  ? "Drag and drop your workbook into Step 1, or click Browse."
                  : showOnlyNullRows
                    ? "No rows with empty cells on this sheet."
                    : "No rows to display."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-3 py-2 border-t text-sm text-muted-foreground bg-muted/20">
        <div>
          Showing {totalItems ? startIndex + 1 : 0} to {endIndex} of {totalItems} entries
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
            First
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
            Prev
          </Button>
          <span className="text-sm px-1">
            Page {currentPage} / {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Next
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
            Last
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full min-w-0 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Store className="h-8 w-8 shrink-0 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Onboarding shop import</h1>
          </div>
          <p className="mt-2 w-full text-sm text-muted-foreground">
            Preview your workbook locally, validate against the API (dry run), then create the shop + menu +
            ShopAdmin account. The optional <strong className="text-foreground font-medium">ReferenceData</strong> sheet
            lists taxonomy your shop expects: on import (when not dry-run), the API inserts <strong className="text-foreground font-medium">missing</strong> rows into shop category, cuisine, master menu category, payment method,
            and district tables before creating the shop. Dry run only previews those inserts via warning{" "}
            <span className="font-mono text-xs">REFERENCE_DATA_PREVIEW</span>.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={downloadTemplate}
          disabled={templateDownloading}
          className="gap-2 shrink-0"
        >
          {templateDownloading ?
            <Loader2 className="h-4 w-4 animate-spin" />
            : <Download className="h-4 w-4" />}
          {templateDownloading ? "Preparing template…" : "Download template (.xlsx)"}
        </Button>
      </div>

      <div className="flex w-full min-w-0 flex-col gap-6">
        <Card className="shadow-sm w-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Step 1 — Workbook
            </CardTitle>
            <CardDescription>
              Drop an .xlsx that matches the template. Optional ReferenceData rows add missing taxonomy in the database
              on real import (not during dry-run).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!file ? (
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") excelInputRef.current?.click();
                }}
                onClick={() => excelInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDropFile}
                className={cn(
                  "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/40 hover:bg-muted/30",
                )}
              >
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                />
                <FileUp className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-70" />
                <p className="text-sm font-medium">Drag & drop your Excel file</p>
                <p className="mt-1 text-xs text-muted-foreground">or click to browse</p>
                <p className="mt-3 font-mono text-[10px] text-muted-foreground/80">
                  {Object.keys(SHEET_CONFIG).join(" · ")}
                </p>
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB · {availableSheets.length} sheet
                      {availableSheets.length === 1 ? "" : "s"} detected
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-8 w-8 shrink-0 p-0 text-destructive hover:text-destructive/90"
                    aria-label="Remove file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm w-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />
              Step 2 — ShopAdmin & mode
            </CardTitle>
            <CardDescription>Email always required for the API payload. Password is required only when saving.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="onboard-email" className="text-xs font-semibold">
                  Admin email
                </Label>
                <Input
                  id="onboard-email"
                  type="email"
                  autoComplete="email"
                  placeholder="vendor@example.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  disabled={!file}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="onboard-password" className="text-xs font-semibold">
                  Admin password {!dryRun && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="onboard-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={dryRun ? "Not required while validating" : "Min 6 characters"}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  disabled={!file || dryRun}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="onboard-username" className="text-xs font-semibold">
                  Admin username (optional)
                </Label>
                <Input
                  id="onboard-username"
                  placeholder="Display name"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  disabled={!file}
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4 rounded-lg border bg-background px-3 py-2">
              <div className="min-w-0">
                <Label htmlFor="dry-run" className="cursor-pointer text-sm font-semibold">
                  Dry run
                </Label>
                <p className="text-[11px] text-muted-foreground">Validate workbook only — nothing written to DB</p>
              </div>
              <Switch id="dry-run" checked={dryRun} onCheckedChange={setDryRun} disabled={!file} />
            </div>

            {file ? (
              <div
                className={cn(
                  "flex gap-2 rounded-lg border px-3 py-2.5 text-xs",
                  dryRun ?
                    "border-sky-200 bg-sky-50/70 text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100"
                    : "border-amber-200 bg-amber-50/70 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
                )}
              >
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">{dryRun ? "Validation mode" : "Persist mode"}</p>
                  <p className="mt-0.5 opacity-90">
                    {dryRun
                      ? "Checks lookups and sheet shape. ReferenceData insert is previewed when applicable — no shop or admin is created."
                      : "Creates the shop, menu, and ShopAdmin in the database. Taxonomy from ReferenceData is inserted first if missing."}
                  </p>
                </div>
              </div>
            ) : null}

            <Button
              type="button"
              onClick={handleUpload}
              disabled={!canSubmitImport}
              className={cn(
                "w-full gap-2 py-6 text-sm font-semibold shadow-sm",
                dryRun && "bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500 dark:text-white",
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {dryRun ? "Validating…" : "Creating shop…"}
                </>
              ) : dryRun ? (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Validate workbook
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Create &amp; persist shop
                </>
              )}
            </Button>

            {!canSubmitImport && file && !uploading ? (
              <p className="text-center text-[11px] text-muted-foreground">
                {!adminEmail.trim().includes("@")
                  ? "Enter a valid admin email."
                  : !dryRun && adminPassword.trim().length < 6
                    ? "Password must be at least 6 characters to persist."
                    : null}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="w-full min-w-0">
        <Tabs
          className="w-full"
          value={activeMainTab}
          onValueChange={(v) => setActiveMainTab(v as "preview" | "results")}
        >
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-lg border bg-muted/40 p-1">
            <TabsTrigger value="preview" className="gap-2 py-2.5 text-sm">
              <FileSpreadsheet className="h-4 w-4 shrink-0" />
              Workbook preview
              {availableSheets.length > 0 && (
                <Badge variant="secondary" className="ml-1 font-normal">
                  {availableSheets.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2 py-2.5 text-sm">
              <ClipboardList className="h-4 w-4 shrink-0" />
              Validation report
              {resultsTabBadgeCount > 0 ? (
                <Badge variant={backendResult?.success === false ? "destructive" : "default"} className="ml-1 font-normal tabular-nums">
                  {resultsTabBadgeCount}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4 w-full min-w-0 space-y-0 rounded-lg border bg-card p-4 shadow-sm focus-visible:ring-0">
            {previewToolbar}
            {previewTable}
          </TabsContent>

          <TabsContent value="results" className="mt-4 w-full min-w-0 space-y-4 focus-visible:ring-0">
            {uploading ? (
              <Card className="border-dashed">
                <CardContent className="flex items-center gap-3 py-8">
                  <Loader />
                  <p className="text-sm font-medium text-muted-foreground">Waiting for API response…</p>
                </CardContent>
              </Card>
            ) : null}

            {!backendResult && !nestPayload && !uploading ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Run <strong>Validate workbook</strong> or <strong>Create &amp; persist shop</strong> to see
                  counts, resolved lookups, blocking errors, and warnings here.
                </CardContent>
              </Card>
            ) : null}

            {backendResult ? (
              <div
                className={cn(
                  "rounded-lg border px-4 py-3 text-sm",
                  backendResult.success ?
                    "border-green-200 bg-green-50/80 text-green-900 dark:border-green-900 dark:bg-green-950/30 dark:text-green-100"
                    : "border-destructive/40 bg-destructive/10 text-destructive",
                )}
              >
                <div className="flex items-start gap-2">
                  {backendResult.success ? (
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold">{backendResult.success ? "OK" : "Request failed"}</div>
                    <div className="mt-1 whitespace-pre-wrap break-words font-normal opacity-95">
                      {backendResult.message}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {!uploading &&
              backendResult?.success &&
              persistedShopId != null &&
              nestPayload &&
              typeof nestPayload === "object" &&
              (nestPayload as { dryRun?: unknown }).dryRun === false ?
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Shop created</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary">ID {persistedShopId}</Badge>
                  {persistedShopName ? <Badge variant="outline">{persistedShopName}</Badge> : null}
                </CardContent>
              </Card>
              : null}

            {metricItems.length > 0 ? (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Detected counts</h3>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {metricItems.map((m) => (
                    <Card key={m.label} className="shadow-none">
                      <CardContent className="p-3">
                        <p className="text-[11px] font-medium uppercase text-muted-foreground">{m.label}</p>
                        <p className="text-2xl font-semibold tabular-nums">{m.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null}

            {reportResolved ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Resolved lookups</CardTitle>
                  <CardDescription>How the workbook mapped to taxonomy before persisting.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Shop name (hint)</span>
                    <p className="font-medium">{reportResolved.profileHints?.nameEn ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">District label</span>
                    <p className="font-medium">{reportResolved.profileHints?.districtEnLabel ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Shop category ID</span>
                    <p className="font-mono text-sm">{reportResolved.shopCategoryId ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Shop subcategory ID</span>
                    <p className="font-mono text-sm">{reportResolved.shopSubCategoryId ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">District / city IDs</span>
                    <p className="font-mono text-sm">
                      {reportResolved.districtId ?? "—"} / {reportResolved.cityId ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cuisine IDs</span>
                    <p className="font-mono text-sm">
                      {(reportResolved.cuisineIds ?? []).join(", ") || "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {(reportErrors.length > 0 || onboardingSuccessWarnings.length > 0) ? (
              <Accordion
                type="multiple"
                defaultValue={[
                  ...(reportErrors.length > 0 ? (["errors"] as const) : []),
                  ...(onboardingSuccessWarnings.length > 0 ? (["warnings"] as const) : []),
                ]}
                className="rounded-lg border"
              >
                {reportErrors.length > 0 ?
                  <AccordionItem value="errors" className="border-b-0 px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="flex items-center gap-2">
                        Blocking errors
                        <Badge variant="destructive">{reportErrors.length}</Badge>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-3 pb-2">
                        {reportErrors.map((err, i) => (
                          <li
                            key={i}
                            className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm"
                          >
                            <div className="flex flex-wrap gap-2 font-mono text-xs">
                              {err.code ? <Badge variant="outline">{err.code}</Badge> : null}
                              {err.sheet ? (
                                <Badge variant="secondary" className="font-normal">
                                  sheet: {err.sheet}
                                </Badge>
                              ) : null}
                              {err.row != null ? (
                                <Badge variant="secondary" className="font-normal">
                                  row: {String(err.row)}
                                </Badge>
                              ) : null}
                            </div>
                            <p className="mt-1 whitespace-pre-wrap break-words">{err.detail ?? JSON.stringify(err)}</p>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  : null}

                {onboardingSuccessWarnings.length > 0 ?
                  <AccordionItem value="warnings" className="border-t px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="flex items-center gap-2">
                        Warnings
                        <Badge variant="secondary">{onboardingSuccessWarnings.length}</Badge>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 pb-2">
                        {onboardingSuccessWarnings.map((w, i) => (
                          <li
                            key={i}
                            className="rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 text-sm dark:border-amber-900 dark:bg-amber-950/30"
                          >
                            <span className="font-mono text-xs text-amber-900 dark:text-amber-100">
                              {String(w.code ?? "?")}
                            </span>
                            <span className="text-amber-900 dark:text-amber-100"> — {String(w.detail ?? "")}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  : null}
              </Accordion>
            ) : null}

            {nestPayloadJsonText !== null ?
              <Accordion type="single" collapsible className="rounded-lg border">
                <AccordionItem value="json" className="border-0 px-4">
                  <AccordionTrigger className="hover:no-underline">Raw API JSON</AccordionTrigger>
                  <AccordionContent>
                    <pre className="max-h-[360px] overflow-auto rounded-md bg-muted/50 p-3 text-xs whitespace-pre-wrap break-words">
                      {nestPayloadJsonText}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
