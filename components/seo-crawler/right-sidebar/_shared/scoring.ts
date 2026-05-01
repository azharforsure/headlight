// components/seo-crawler/right-sidebar/_shared/scoring.ts
export type Tone = 'good' | 'warn' | 'bad' | 'info' | 'neutral'

export const TONE_BG: Record<Tone, string> = {
  good: 'bg-[#10b981]',
  warn: 'bg-[#f59e0b]',
  bad: 'bg-[#ef4444]',
  info: 'bg-[#3b82f6]',
  neutral: 'bg-[#444]',
}

export const TONE_TEXT: Record<Tone, string> = {
  good: 'text-[#10b981]',
  warn: 'text-[#f59e0b]',
  bad: 'text-[#ef4444]',
  info: 'text-[#3b82f6]',
  neutral: 'text-[#888]',
}

export const TONE_BORDER: Record<Tone, string> = {
  good: 'border-[#10b981]/30',
  warn: 'border-[#f59e0b]/30',
  bad: 'border-[#ef4444]/30',
  info: 'border-[#3b82f6]/30',
  neutral: 'border-[#222]',
}

// Map a 0..100 score to a tone bucket using fixed thresholds.
export const scoreToTone = (s: unknown): Tone => {
  const score = Number(s)
  if (!Number.isFinite(score)) return 'neutral'
  if (score >= 80) return 'good'
  if (score >= 50) return 'warn'
  return 'bad'
}

// CWV bucketing per Google guidance.
export const lcpTone = (ms?: number): Tone =>
  !Number.isFinite(ms as number) ? 'neutral' : (ms as number) <= 2500 ? 'good' : (ms as number) <= 4000 ? 'warn' : 'bad'

export const inpTone = (ms?: number): Tone =>
  !Number.isFinite(ms as number) ? 'neutral' : (ms as number) <= 200 ? 'good' : (ms as number) <= 500 ? 'warn' : 'bad'

export const clsTone = (v?: number): Tone =>
  !Number.isFinite(v as number) ? 'neutral' : (v as number) <= 0.1 ? 'good' : (v as number) <= 0.25 ? 'warn' : 'bad'

export const ttfbTone = (ms?: number): Tone =>
  !Number.isFinite(ms as number) ? 'neutral' : (ms as number) <= 800 ? 'good' : (ms as number) <= 1800 ? 'warn' : 'bad'
