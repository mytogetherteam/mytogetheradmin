import { formatDistanceToNow } from "date-fns"

export function formatPrice(amount: number, currency: string = "$"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD", // You might want to map the currency symbol to code if needed, but simple for now
    minimumFractionDigits: 2,
  })
    .format(amount)
    .replace("USD", currency) // Quick hack to support custom symbols if Intl doesn't infer it from locale
    // Better approach:
    // return \`\${currency}\${amount.toFixed(2)}\`;
}

export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(d)
}

/** Human "time ago" (e.g. "5 minutes ago") via date-fns; "—" when missing/invalid. */
export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return "—"
  return formatDistanceToNow(d, { addSuffix: true })
}

/**
 * Display an amount: prefer a server-formatted `displayAmount`, else
 * locale-format the numeric value, else fall back to "—".
 */
export function formatAmount(
  amount?: number | string | null,
  displayAmount?: string | null,
): string {
  if (displayAmount) return displayAmount
  if (typeof amount === "number") return amount.toLocaleString()
  return amount ? String(amount) : "—"
}
