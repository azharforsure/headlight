import React from 'react'
import { DistBlock } from '..'

export function QueryIntentSplitBlock({ title = 'Query intent', split }: {
  title?: string
  split: { informational: number; transactional: number; navigational: number; commercial: number }
}) {
  return (
    <DistBlock title={title} segments={[
      { value: split.informational, tone: 'info' as const,    label: 'Info' },
      { value: split.commercial,    tone: 'warn' as const,    label: 'Commercial' },
      { value: split.transactional, tone: 'good' as const,    label: 'Transactional' },
      { value: split.navigational,  tone: 'neutral' as const, label: 'Nav' },
    ]} />
  )
}
