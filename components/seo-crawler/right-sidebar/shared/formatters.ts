export function fmtNum(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  if (n >= 10000) return (n / 1000).toFixed(1) + 'k'
  return new Intl.NumberFormat().format(n)
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  const v = n * 100
  if (v === 0) return '0%'
  if (v < 10) return v.toFixed(1) + '%'
  return Math.round(v) + '%'
}

export function fmtMs(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return '—'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function fmtDelta(n: number | null | undefined, mode: 'pct' | 'pp' | 'abs'): string {
  if (n == null || !Number.isFinite(n)) return '—'
  const prefix = n > 0 ? '▲' : n < 0 ? '▼' : ''
  const abs = Math.abs(n)
  
  if (mode === 'pct') return `${prefix} ${fmtPct(abs / 100)}`
  if (mode === 'pp')  return `${prefix} ${abs.toFixed(1)}pt`
  return `${prefix} ${fmtNum(abs)}`
}

export function ago(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (s < 60)         return `${s}s ago`
  if (s < 3600)       return `${Math.floor(s / 60)}m ago`
  if (s < 86400)      return `${Math.floor(s / 3600)}h ago`
  if (s < 7 * 86400)  return `${Math.floor(s / 86400)}d ago`
  return new Date(ts).toLocaleDateString()
}

export function fmtBytes(b: number): string {
  if (!Number.isFinite(b) || b <= 0) return '—'
  const u = ['B', 'KB', 'MB', 'GB']
  let i = 0; let v = b
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${u[i]}`
}

export function fmtTime(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return '—'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function fmtCurrency(n: number, currency = 'USD'): string {
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}
