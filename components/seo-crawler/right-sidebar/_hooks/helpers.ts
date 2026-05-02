// @source computed — no external dependency
export const num = (v: any): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export const compactNum = (v: any): string => {
  const n = num(v)
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k'
  return n.toLocaleString()
}

export const fmtPct = (v: any): string => `${num(v).toFixed(1)}%`

export const fmtMs = (v: any): string => {
  const n = num(v)
  if (n < 1000) return `${Math.round(n)}ms`
  return `${(n / 1000).toFixed(2)}s`
}

export const fmtBytes = (v: any): string => {
  const n = num(v)
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v))

export const sortBy = <T>(arr: T[], key: (t: T) => number, dir: 'asc' | 'desc' = 'desc') =>
  [...arr].sort((a, b) => (dir === 'asc' ? key(a) - key(b) : key(b) - key(a)))
