/** Shared status badge colors for the order pages. */
export const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    PAYMENT_SLIP_REQUESTED: "bg-pink-100 text-pink-800 border-pink-200",
    AWAITING_APPROVAL: "bg-amber-100 text-amber-800 border-amber-200",
    PAYMENT_VERIFIED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    COOKING: "bg-orange-100 text-orange-800 border-orange-200",
    READY_FOR_PICKUP: "bg-purple-100 text-purple-800 border-purple-200",
    ON_THE_WAY: "bg-indigo-100 text-indigo-800 border-indigo-200",
    REVISED: "bg-sky-100 text-sky-800 border-sky-200",
    DELIVERED: "bg-green-100 text-green-800 border-green-200",
    PICKED_UP: "bg-green-100 text-green-800 border-green-200",
    CANCELED: "bg-red-100 text-red-800 border-red-200",
};

export interface Address {
    buildingName?: string;
    floor?: string;
    address?: string;
    note?: string;
}

/** Render an address that may arrive as a string or a structured object. */
export function renderAddress(addr: string | Address | null | undefined): string {
    if (!addr) return "N/A";
    if (typeof addr === "string") return addr;
    if (typeof addr === "object") {
        const parts = [
            addr.buildingName,
            addr.floor ? `Floor ${addr.floor}` : null,
            addr.address,
            addr.note ? `(Note: ${addr.note})` : null,
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : "Address details provided but empty";
    }
    return "Invalid address format";
}

interface Price {
    displayValue?: string;
    amount?: number;
}

/** Safely render a currency/amount that may be a string, number, or object. */
export function renderCurrency(val: string | number | Price | null | undefined): string {
    if (val === null || val === undefined) return "0";
    if (typeof val === "string" || typeof val === "number") return val.toString();
    if (typeof val === "object") {
        return val.displayValue || (val.amount !== undefined ? val.amount.toString() : JSON.stringify(val));
    }
    return "N/A";
}
