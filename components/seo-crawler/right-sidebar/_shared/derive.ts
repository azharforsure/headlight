export function templateOf(p: any): string {
  return String(p.template || p.pageTemplate || (p.url || '').split('/')[3] || 'unknown')
}
export function inlinkBucket(n: number): string {
  if (n === 0) return '0'
  if (n <= 2) return '1–2'
  if (n <= 10) return '3–10'
  if (n <= 50) return '11–50'
  return '50+'
}
export function depthBucket(d: number): string {
  if (d <= 1) return '0–1'
  if (d <= 3) return '2–3'
  if (d <= 5) return '4–5'
  return '6+'
}
export function ageBucket(days: number): string {
  if (days < 30) return '<30d'
  if (days < 90) return '30–90d'
  if (days < 180) return '90–180d'
  if (days < 365) return '180–365d'
  return '>1y'
}
