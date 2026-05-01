import type { ReactNode } from 'react'

export type Tone = 'good' | 'warn' | 'bad' | 'info' | 'neutral'

export type SourceTier = 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'T8'
export type Freshness   = 'live' | 'recent' | 'fresh' | 'ok' | 'stale' | 'unknown'

export type SourceStamp = {
  tier: SourceTier
  provider?: string
  observedAt?: string
  sampleSize?: number
}

export type RsAction = {
  id: string
  title: string
  reason?: string
  forecast?: string         // e.g. '+180 sessions / mo'
  confidence?: number       // 0..1
  effort?: 'S' | 'M' | 'L'
  affected?: number         // page count
  primary?: boolean
  cta?: { label: string; onClick?: () => void }
}

export type RsAlert = {
  id: string
  tone: Tone
  title: string
  count?: number
  drillTo?: { tab?: string; filter?: Record<string, unknown> }
}

export type RsListItem = {
  id: string
  primary: ReactNode
  secondary?: ReactNode
  tail?: ReactNode
  tone?: Tone
  href?: string
  onClick?: () => void
}
