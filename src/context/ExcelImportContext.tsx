import { useState, ReactNode } from "react";

import {
    ExcelImportContext,
    WorkbookData,
    SheetKey
} from "./use-excel-import";

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

