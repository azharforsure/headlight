export const fmtInt = (n: number | null | undefined): string => {
	if (n == null || Number.isNaN(Number(n))) return '—'
	return Number(n).toLocaleString()
}
export const fmtPct = (n: number | null | undefined, digits = 1): string => {
	if (n == null || Number.isNaN(Number(n))) return '—'
	const v = Number(n)
	const pct = v > 1 ? v : v * 100
	return `${pct.toFixed(digits)}%`
}
export const fmtMs = (ms: number | null | undefined): string => {
	if (ms == null || Number.isNaN(Number(ms))) return '—'
	return `${Math.round(Number(ms))}ms`
}
export const fmtBytes = (b: number | null | undefined): string => {
	if (b == null || Number.isNaN(Number(b))) return '—'
	const v = Number(b)
	if (v < 1024) return `${v} B`
	if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
	if (v < 1024 * 1024 * 1024) return `${(v / 1024 / 1024).toFixed(2)} MB`
	return `${(v / 1024 / 1024 / 1024).toFixed(2)} GB`
}
export const fmtMoney = (n: number | null | undefined, currency = 'USD'): string => {
	if (n == null || Number.isNaN(Number(n))) return '—'
	return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(n))
}
export const ago = (ts: number | string | Date): string => {
	const t = typeof ts === 'number' ? ts : new Date(ts).getTime()
	if (!t) return '—'
	const s = Math.floor((Date.now() - t) / 1000)
	if (s < 60) return `${s}s ago`
	if (s < 3600) return `${Math.floor(s / 60)}m ago`
	if (s < 86400) return `${Math.floor(s / 3600)}h ago`
	return `${Math.floor(s / 86400)}d ago`
}
