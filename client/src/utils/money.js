// Shekels for the page, whole, in the page's language; a dash when unknown.
export function formatMoney(value, language) {
    if (value === null || value === undefined) return "—"
    return new Intl.NumberFormat(language, { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(value)
}
