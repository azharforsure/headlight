// components/seo-crawler/right-sidebar/_shared/format.ts
export const fmtNum = (v: unknown, opts: Intl.NumberFormatOptions = {}) => {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString(undefined, opts)
}

export const compactNum = (v: unknown) => {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return '—'
  return Intl.NumberFormat('en', { notation: 'compact' }).format(n)
}

export const fmtPct = (v: unknown, mul = 1, digits = 1) => {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return '—'
  return `${(n * mul).toFixed(digits)}%`
}

export const fmtMs = (v: unknown) => {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return '—'
  if (n < 1000) return `${Math.round(n)}ms`
  return `${(n / 1000).toFixed(2)}s`
}

export const fmtBytes = (v: unknown) => {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return '—'
  const k = 1024
  if (n < k) return `${n} B`
  if (n < k * k) return `${(n / k).toFixed(1)} KB`
  if (n < k * k * k) return `${(n / k / k).toFixed(1)} MB`
  return `${(n / k / k / k).toFixed(2)} GB`
}

export const safePct = (count: number, total: number) =>
  total > 0 ? (count / total) * 100 : 0

export const safePathname = (url: string) => {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

export const cls = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ')
