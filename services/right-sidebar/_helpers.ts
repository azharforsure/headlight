// services/right-sidebar/_helpers.ts
import type { CrawledPage } from '../CrawlDatabase'

export const countWhere = <T,>(arr: ReadonlyArray<T>, fn: (x: T) => unknown) =>
  arr.reduce((n, x) => (fn(x) ? n + 1 : n), 0)

export const isIndexable           = (p: CrawledPage) => p.isIndexed !== false && (p.status ?? 200) < 400
export const hasTitle              = (p: CrawledPage) => !!(p.title && p.title.trim())
export const hasMetaDescription    = (p: CrawledPage) => !!(p.metaDesc && p.metaDesc.trim())
export const hasH1                 = (p: CrawledPage) => !!(p.h1 && p.h1.trim())
export const isThin                = (p: CrawledPage) => (p.wordCount ?? 0) < 300

export const pct  = (n: number, d: number) => (d <= 0 ? 0 : Math.round((n / d) * 100))
export const safeDiv = (n: number, d: number) => (d <= 0 ? 0 : n / d)

export function score100(parts: { weight: number; value: number }[]): number {
  const w = parts.reduce((s, p) => s + p.weight, 0)
  if (w === 0) return 0
  return Math.round(parts.reduce((s, p) => s + p.weight * p.value, 0) / w)
}

export const topN = <T,>(arr: ReadonlyArray<T>, n: number, key: (x: T) => number) =>
  [...arr].sort((a, b) => key(b) - key(a)).slice(0, n)

export function dedupCount<T>(arr: ReadonlyArray<T>, key: (x: T) => string | undefined | null): number {
  const m = new Map<string, number>()
  for (const x of arr) {
    const k = key(x); if (!k) continue
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  let dupes = 0
  for (const v of m.values()) if (v > 1) dupes += v
  return dupes
}

export const avg = (xs: number[]) => (xs.length === 0 ? 0 : xs.reduce((s, x) => s + x, 0) / xs.length)

export function percentile(xs: number[], p: number): number {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  const idx = Math.min(s.length - 1, Math.max(0, Math.floor((p / 100) * (s.length - 1))))
  return s[idx]
}

export const fmtInt = (n: number) => Number.isFinite(n) ? Math.round(n).toLocaleString() : '—'
export const fmtPct = (n: number, digits = 0) => `${(n).toFixed(digits)}%`

export function histogram(values: number[], thresholds: number[]): number[] {
  // returns counts per bucket. thresholds = [t0, t1, ..., tN] → buckets [t0,t1), [t1,t2), ... [tN-1, tN]
  const buckets = new Array(Math.max(0, thresholds.length - 1)).fill(0)
  for (const v of values) {
    for (let i = 0; i < buckets.length; i++) {
      const lo = thresholds[i]
      const hi = thresholds[i + 1]
      const inRange = i === buckets.length - 1 ? v >= lo && v <= hi : v >= lo && v < hi
      if (inRange) { buckets[i] += 1; break }
    }
  }
  return buckets
}
