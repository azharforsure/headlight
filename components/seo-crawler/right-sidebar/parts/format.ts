export function fmtNum(n: number | null | undefined, opts: Intl.NumberFormatOptions = {}): string {
    if (n === null || n === undefined || Number.isNaN(n)) return '—'
    return Number(n).toLocaleString(undefined, { maximumFractionDigits: 1, ...opts })
}

export function fmtPct(n: number | null | undefined, total = 1, digits = 0): string {
    if (n === null || n === undefined || Number.isNaN(n) || !total) return '—'
    return `${(Number(n) / total * 100).toFixed(digits)}%`
}

export function fmtMs(n: number | null | undefined): string {
    if (n === null || n === undefined || Number.isNaN(n)) return '—'
    if (n >= 1000) return `${(n / 1000).toFixed(1)}s`
    return `${Math.round(n)}ms`
}

export function fmtDelta(curr: number | null, prev: number | null, digits = 0): { text: string; tone: 'good' | 'bad' | 'neutral' } {
    if (curr === null || prev === null || prev === 0) return { text: '—', tone: 'neutral' }
    const d = ((curr - prev) / Math.abs(prev)) * 100
    if (Math.abs(d) < 0.5) return { text: 'flat', tone: 'neutral' }
    return {
        text: `${d > 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(digits)}%`,
        tone: d > 0 ? 'good' : 'bad',
    }
}

export function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n))
}

export type Tone = 'good' | 'warn' | 'bad' | 'info' | 'neutral'

export function toneToColor(tone: Tone | undefined): string {
    switch (tone) {
        case 'good': return '#10b981'
        case 'warn': return '#f59e0b'
        case 'bad': return '#ef4444'
        case 'info': return '#3b82f6'
        default: return '#888'
    }
}
