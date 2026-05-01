export const fmtNum = (n: unknown, opts?: Intl.NumberFormatOptions) => {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return new Intl.NumberFormat(undefined, opts).format(v)
}

export const fmtPct = (n: unknown, digits = 0) => {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return `${v.toFixed(digits)}%`
}

export const fmtMs = (n: unknown) => {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  if (v < 1000) return `${Math.round(v)}ms`
  return `${(v / 1000).toFixed(2)}s`
}

export const fmtBytes = (n: unknown) => {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} kB`
  return `${(v / (1024 * 1024)).toFixed(2)} MB`
}

export const fmtDelta = (n: unknown, suffix = '%') => {
  const v = Number(n)
  if (!Number.isFinite(v) || v === 0) return '—'
  const sign = v > 0 ? '▲' : '▼'
  return `${sign} ${Math.abs(v).toFixed(1)}${suffix}`
}

export const safePct = (num: number, den: number) =>
  den > 0 ? Math.round((num / den) * 1000) / 10 : 0

export const compactNum = (n: unknown) => {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}k`
  return `${v}`
}
