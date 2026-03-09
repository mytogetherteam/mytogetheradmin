import { createContext, useContext } from "react";

export type ParsedRow = { __excelRow: number } & Record<string, unknown>;
export type SheetKey = "Shops" | "MenuItems" | "OperatingHours";

export interface WorkbookData {
    [key: string]: {
        headers: string[];
        rows: ParsedRow[];
    };
}

export interface ExcelImportContextType {
    file: File | null;
    setFile: (file: File | null) => void;
    workbookData: WorkbookData;
    setWorkbookData: (data: WorkbookData) => void;
    selectedSheet: SheetKey;
    setSelectedSheet: (sheet: SheetKey) => void;
    clearData: () => void;
}

export const ExcelImportContext = createContext<ExcelImportContextType | undefined>(undefined);

export function useExcelImport() {
    const context = useContext(ExcelImportContext);
    if (context === undefined) {
        throw new Error("useExcelImport must be used within an ExcelImportProvider");
    }
    return context;
}
