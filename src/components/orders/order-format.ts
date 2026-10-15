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

/**
 * FAST/FLEXIBLE labels. Only set once the shop requests a payment slip, and
 * never for pick-up orders — so expect null on most orders.
 */
export const ORDER_DELIVERY_TYPE_LABELS: Record<string, string> = {
    FAST: "Fast",
    FLEXIBLE: "Flexible",
};

function usableCoord(lat?: number | null, lon?: number | null): boolean {
    if (lat == null || lon == null) return false;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
    if (lat === 0 || lon === 0) return false;
    return Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const earthKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Whole kilometers from the shop to the address the customer entered. */
export function shopToCustomerKmLabel(order: {
    orderType?: string | null;
    lat?: number | null;
    lon?: number | null;
    shopLatitude?: number | null;
    shopLongitude?: number | null;
}): string | null {
    const type = (order.orderType ?? "").toUpperCase();
    if (type === "PICK_UP" || type === "PICKUP") return null;
    if (!usableCoord(order.shopLatitude, order.shopLongitude)) return null;
    if (!usableCoord(order.lat, order.lon)) return null;
    const km = haversineKm(order.shopLatitude!, order.shopLongitude!, order.lat!, order.lon!);
    if (!(km > 0)) return null;
    if (km < 0.5) return "< 1 Km";
    return `${Math.round(km)} Km`;
}

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

/**
 * Compose the customer's delivery address from the flat order fields the admin
 * API returns (address / buildingName / floor / note). Falls back to a
 * structured `deliveryAddress` payload if one is ever present. Returns null when
 * no address details exist (e.g. pick-up orders), so callers can hide the block.
 */
export function orderAddressText(order: {
    address?: string | null;
    addressMm?: string | null;
    buildingName?: string | null;
    floor?: string | null;
    note?: string | null;
    deliveryAddress?: string | Address | null;
}): string | null {
    if (order.deliveryAddress) {
        const rendered = renderAddress(order.deliveryAddress);
        return rendered === "N/A" ? null : rendered;
    }
    const addr: Address = {
        buildingName: order.buildingName ?? undefined,
        floor: order.floor ?? undefined,
        address: order.address ?? order.addressMm ?? undefined,
        note: order.note ?? undefined,
    };
    const hasAny = [addr.buildingName, addr.floor, addr.address, addr.note].some(Boolean);
    return hasAny ? renderAddress(addr) : null;
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
