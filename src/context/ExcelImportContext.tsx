import { useState, ReactNode, useMemo, useCallback } from "react";

import {
    ExcelImportContext,
    WorkbookData,
    SheetKey
} from "./use-excel-import";

export function ExcelImportProvider({ children }: { children: ReactNode }) {
    const [file, setFile] = useState<File | null>(null);
    const [workbookData, setWorkbookData] = useState<WorkbookData>({});
    const [selectedSheet, setSelectedSheet] = useState<SheetKey>("Shops");

    const clearData = useCallback(() => {
        setFile(null);
        setWorkbookData({});
        setSelectedSheet("Shops");
    }, []);

    const value = useMemo(() => ({
        file,
        setFile,
        workbookData,
        setWorkbookData,
        selectedSheet,
        setSelectedSheet,
        clearData,
    }), [file, workbookData, selectedSheet, clearData]);

    return (
        <ExcelImportContext.Provider value={value}>
            {children}
        </ExcelImportContext.Provider>
    );
}

