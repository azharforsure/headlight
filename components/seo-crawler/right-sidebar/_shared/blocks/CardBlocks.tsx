import React from 'react'
import { Card, Section, Distribution, BarStack, Donut, TopList, ScoreBar, BenchmarkBar, Sparkline, Heatmap, Treemap, Funnel, ComparisonRow, SegmentTable, KeyValueGrid, TimelineList, AlertRow, ActionRow, DrillChip, EmptyState } from '..'
import type { TopListItem } from '../TopList'
import type { SourceTier } from '../SourceChip'
import type { Freshness } from '../FreshnessChip'

export function HealthBlock({ title = 'Health score', value, hint }: { title?: string; value: number; hint?: string }) {
  return <Card><Section title={title} dense><ScoreBar value={value} hint={hint} /></Section></Card>
}

export function DistBlock({ title, segments }: { title: string; segments: Parameters<typeof BarStack>[0]['segments'] }) {
  return <Card><Section title={title} dense><BarStack segments={segments} /></Section></Card>
}

export function DonutBlock({ title, segments }: { title: string; segments: Parameters<typeof Donut>[0]['segments'] }) {
  return <Card><Section title={title} dense><Donut segments={segments} /></Section></Card>
}

export function DistRowsBlock({ title, rows }: { title: string; rows: Parameters<typeof Distribution>[0]['rows'] }) {
  return <Card><Section title={title} dense><Distribution rows={rows} /></Section></Card>
}

export function TrendBlock({ title, values, tone, hint }: { title: string; values: ReadonlyArray<number>; tone?: 'good' | 'warn' | 'bad' | 'info' | 'neutral'; hint?: string }) {
  return (
    <Card><Section title={title} dense>
      <div className="flex items-center justify-between">
        <Sparkline values={values} tone={tone || 'info'} width={160} />
        {hint && <span className="text-[10px] text-[#666]">{hint}</span>}
      </div>
    </Section></Card>
  )
}

export function TopListBlock({ title, items, max, onSeeAll, emptyText = 'Nothing to show' }: {
  title: string; items: ReadonlyArray<TopListItem>; max?: number; onSeeAll?: () => void; emptyText?: string
}) {
  return (
    <Card><Section title={title} dense>
      {items.length
        ? <TopList items={items} max={max} onSeeAll={onSeeAll} />
        : <div className="text-[11px] text-[#666] italic">{emptyText}</div>}
    </Section></Card>
  )
}

export function SegmentBlock({ title, headers, rows, onRowClick }: {
  title: string; headers: ReadonlyArray<string>; rows: Parameters<typeof SegmentTable>[0]['rows']; onRowClick?: Parameters<typeof SegmentTable>[0]['onRowClick']
}) {
  return <Card><Section title={title} dense><SegmentTable headers={headers} rows={rows} onRowClick={onRowClick} /></Section></Card>
}

export function HeatmapBlock(p: { title: string } & Parameters<typeof Heatmap>[0]) {
  const { title, ...rest } = p
  return <Card><Section title={title} dense><Heatmap {...rest} /></Section></Card>
}

export function TreemapBlock(p: { title: string } & Parameters<typeof Treemap>[0]) {
  const { title, ...rest } = p
  return <Card><Section title={title} dense><Treemap {...rest} /></Section></Card>
}

export function FunnelBlock({ title, steps }: { title: string; steps: Parameters<typeof Funnel>[0]['steps'] }) {
  return <Card><Section title={title} dense><Funnel steps={steps} /></Section></Card>
}

export function BenchmarkBlock({ title, site, benchmark, unit, label, higherIsBetter }: {
  title: string; site: number; benchmark: number; unit?: string; label?: string; higherIsBetter?: boolean
}) {
  return <Card><Section title={title} dense><BenchmarkBar site={site} benchmark={benchmark} unit={unit} label={label} higherIsBetter={higherIsBetter} /></Section></Card>
}

export function CompareBlock({ title, rows, source, freshness }: {
  title: string
  rows: ReadonlyArray<{ label: string; a: { v: number; tag: string }; b: { v: number; tag: string }; c?: { v: number; tag: string }; format?: (v: number) => string }>
  source?: SourceTier
  freshness?: Freshness
}) {
  return (
    <Card><Section title={title} dense>
      {rows.map(r => <ComparisonRow key={r.label} {...r} source={source} freshness={freshness} />)}
    </Section></Card>
  )
}

export function KvBlock({ title, items, cols }: { title: string; items: Parameters<typeof KeyValueGrid>[0]['items']; cols?: 2 | 3 | 4 }) {
  return <Card><Section title={title} dense><KeyValueGrid items={items} cols={cols} /></Section></Card>
}

export function TimelineBlock({ title, entries, max }: { title: string; entries: Parameters<typeof TimelineList>[0]['entries']; max?: number }) {
  return <Card><Section title={title} dense><TimelineList entries={entries} max={max} /></Section></Card>
}

export function DrillFooter({ chips }: { chips: ReadonlyArray<{ label: string; count?: number | string; onClick?: () => void }> }) {
  if (!chips.length) return null
  return (
    <div className="flex flex-wrap gap-1">
      {chips.map(c => <DrillChip key={c.label} label={c.label} count={c.count} onClick={c.onClick} />)}
    </div>
  )
}
