export const fmtNum = (v: unknown, opts?: Intl.NumberFormatOptions) => {
    if (v === null || v === undefined || v === '' || Number.isNaN(Number(v))) return '—'
    return Number(v).toLocaleString(undefined, opts)
}

export const fmtPct = (v: unknown, scale = 1, digits = 1) => {
    if (v === null || v === undefined || v === '' || Number.isNaN(Number(v))) return '—'
    return `${(Number(v) * scale).toFixed(digits)}%`
}

export const fmtDelta = (v: number | null | undefined, suffix = '') => {
    if (v === null || v === undefined || Number.isNaN(v)) return { text: '—', tone: 'flat' as const }
    if (v === 0) return { text: `0${suffix}`, tone: 'flat' as const }
    const tone = v > 0 ? 'up' : 'down'
    const arrow = v > 0 ? '▲' : '▼'
    return { text: `${arrow} ${Math.abs(v).toLocaleString()}${suffix}`, tone }
}

export const compactNum = (v: unknown) => {
    const n = Number(v)
    if (!Number.isFinite(n)) return '—'
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`
    return String(Math.round(n))
}

export const safePathname = (url: string) => {
    try { return new URL(url).pathname || url } catch { return url }
}
