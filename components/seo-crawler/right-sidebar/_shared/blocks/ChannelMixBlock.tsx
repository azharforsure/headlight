import React from 'react'
import { DistRowsBlock } from '..'

export function ChannelMixBlock({ title = 'Channel mix', channels, onChannelClick }: {
  title?: string
  channels?: { organic: number; direct: number; referral: number; social: number; paid: number; email: number; other: number }
  onChannelClick?: (id: string) => void
}) {
  const rows = [
    { id: 'organic',  label: 'Organic',  value: channels?.organic || 0,  tone: 'good' as const },
    { id: 'direct',   label: 'Direct',   value: channels?.direct || 0,   tone: 'info' as const },
    { id: 'referral', label: 'Referral', value: channels?.referral || 0, tone: 'info' as const },
    { id: 'social',   label: 'Social',   value: channels?.social || 0,   tone: 'info' as const },
    { id: 'paid',     label: 'Paid',     value: channels?.paid || 0,     tone: 'warn' as const },
    { id: 'email',    label: 'Email',    value: channels?.email || 0,    tone: 'info' as const },
    { id: 'other',    label: 'Other',    value: channels?.other || 0,    tone: 'neutral' as const },
  ]
  return (
    <DistRowsBlock
      title={title}
      rows={rows.map(r => ({
        label: r.label,
        value: r.value,
        tone: r.tone,
        onClick: () => onChannelClick?.(r.id),
      }) as any)}
    />
  )
}
