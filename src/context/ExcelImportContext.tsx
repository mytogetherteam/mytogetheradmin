import { createContext, useContext, useState, ReactNode } from "react";

type ParsedRow = { __excelRow: number } & Record<string, unknown>;
type SheetKey = "Shops" | "MenuItems" | "OperatingHours";

interface WorkbookData {
    [key: string]: {
        headers: string[];
        rows: ParsedRow[];
    };
}

interface ExcelImportContextType {
    file: File | null;
    setFile: (file: File | null) => void;
    workbookData: WorkbookData;
    setWorkbookData: (data: WorkbookData) => void;
    selectedSheet: SheetKey;
    setSelectedSheet: (sheet: SheetKey) => void;
    clearData: () => void;
}

const ExcelImportContext = createContext<ExcelImportContextType | undefined>(undefined);

export function ExcelImportProvider({ children }: { children: ReactNode }) {
    const [file, setFile] = useState<File | null>(null);
    const [workbookData, setWorkbookData] = useState<WorkbookData>({});
    const [selectedSheet, setSelectedSheet] = useState<SheetKey>("Shops");

    const clearData = () => {
        setFile(null);
        setWorkbookData({});
        setSelectedSheet("Shops");
    };

    return (
        <ExcelImportContext.Provider
            value={{
                file,
                setFile,
                workbookData,
                setWorkbookData,
                selectedSheet,
                setSelectedSheet,
                clearData,
            }}
        >
            {children}
        </ExcelImportContext.Provider>
    );
}

export function useExcelImport() {
    const context = useContext(ExcelImportContext);
    if (context === undefined) {
        throw new Error("useExcelImport must be used within an ExcelImportProvider");
    }
    return context;
}
