/**
 * CSV Export Utility
 * Generates and downloads a CSV file from an array of objects.
 */

/**
 * Convert an array of objects into a CSV string.
 */
export function objectsToCsv<T extends Record<string, unknown>>(
    data: T[],
    columns?: { key: keyof T; label: string }[]
): string {
    if (data.length === 0) return "";

    const headers = columns
        ? columns.map((c) => c.label)
        : Object.keys(data[0]);

    const keys = columns
        ? columns.map((c) => c.key)
        : (Object.keys(data[0]) as (keyof T)[]);

    const csvRows: string[] = [headers.join(",")];

    for (const row of data) {
        const values = keys.map((key) => {
            const val = row[key];
            if (val === null || val === undefined) return "";
            const str = String(val);
            // Escape commas and quotes
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        });
        csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
}

/**
 * Trigger a file download in the browser.
 */
export function downloadCsv(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Full export helper — convert data to CSV and download.
 */
export function exportToCsv<T extends Record<string, unknown>>(
    data: T[],
    filename: string,
    columns?: { key: keyof T; label: string }[]
): void {
    const csv = objectsToCsv(data, columns);
    downloadCsv(csv, filename);
}
