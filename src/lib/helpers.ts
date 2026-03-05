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
