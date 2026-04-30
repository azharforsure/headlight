import {
  Card, SectionTitle, Row, Sparkline, SourceChip, fmtNum, fmtPct, fmtDelta,
} from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { WqaStats } from '../../../../../services/right-sidebar/wqa'

export function WqaSearchTab({ deps, stats }: RsTabProps<WqaStats>) {
  const s = stats.search
  const gscOn  = !!deps.integrationConnections?.googleSearchConsole
  const bingOn = !!deps.integrationConnections?.bingWebmaster
  const sources = [
    gscOn  && 'Google Search Console',
    bingOn && 'Bing Webmaster',
  ].filter(Boolean) as string[]

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <SectionTitle>Source · Range</SectionTitle>
        <div className="flex flex-wrap gap-1">
          {sources.length === 0
            ? <span className="text-xs text-muted">No search source connected</span>
            : sources.map(src => (
                <span key={src} className="text-[11px] px-1.5 py-0.5 rounded chip-info">{src}</span>
              ))}
          <span className="text-[11px] px-1.5 py-0.5 rounded chip-neutral">28d</span>
        </div>
      </Card>

      <Card>
        <SectionTitle>Clicks</SectionTitle>
        <div className="flex items-center justify-between gap-2">
          <span className="tabular-nums text-lg">{fmtNum(s.clicks28d)}</span>
          <span className="text-xs">{fmtDelta(s.clicks28dDelta, 'pct')}</span>
        </div>
        <Sparkline data={s.clicksSeries} height={28} />
        <SourceChip sources={sources} />
      </Card>

      <Card>
        <SectionTitle>Impressions</SectionTitle>
        <div className="flex items-center justify-between gap-2">
          <span className="tabular-nums text-lg">{fmtNum(s.impr28d)}</span>
          <span className="text-xs">{fmtDelta(s.impr28dDelta, 'pct')}</span>
        </div>
        <Sparkline data={s.imprSeries} height={28} />
        <SourceChip sources={sources} />
      </Card>

      <Card>
        <SectionTitle>CTR</SectionTitle>
        <div className="flex items-center justify-between gap-2">
          <span className="tabular-nums text-lg">{fmtPct(s.ctr28d)}</span>
          <span className="text-xs">{fmtDelta(s.ctr28dDelta, 'pp')}</span>
        </div>
        <Sparkline data={s.ctrSeries} height={28} />
        <SourceChip sources={sources} />
      </Card>

      <Card>
        <SectionTitle>Avg position</SectionTitle>
        <div className="flex items-center justify-between gap-2">
          <span className="tabular-nums text-lg">{s.pos28d.toFixed(1)}</span>
          <span className="text-xs">{fmtDelta(-s.pos28dDelta, 'abs')}</span>
        </div>
        <Sparkline data={s.posSeries} height={28} invert />
        <SourceChip sources={sources} />
      </Card>

      <Card>
        <SectionTitle>Keyword buckets</SectionTitle>
        <Row label="Ranking"          value={fmtNum(s.keywordBuckets.ranking)} />
        <Row label="Top 3"            value={fmtNum(s.keywordBuckets.top3)}  tone="good" />
        <Row label="Top 10"           value={fmtNum(s.keywordBuckets.top10)} />
        <Row label="Striking (11–20)" value={fmtNum(s.keywordBuckets.striking)} tone="warn" />
        <Row label="Tail (21–50)"     value={fmtNum(s.keywordBuckets.tail)} />
        <Row label="Not ranking"      value={fmtNum(s.keywordBuckets.notRanking)} tone="muted" />
        <SourceChip sources={sources} />
      </Card>

      <Card>
        <SectionTitle>CTR vs benchmark</SectionTitle>
        {s.ctrVsBenchmark.map(r => {
          const tone = r.us < r.benchmark * 0.6 ? 'bad'
                     : r.us < r.benchmark        ? 'warn'
                     : 'good'
          return (
            <Row
              key={r.pos}
              label={`Pos ${r.pos}`}
              value={`${fmtPct(r.us)} vs ${fmtPct(r.benchmark)}`}
              tone={tone}
            />
          )
        })}
        <SourceChip sources={sources} />
      </Card>

      <Card>
        <SectionTitle>Movers (28d)</SectionTitle>
        {s.movers.length === 0
          ? <Row label="No movement detected" value="—" tone="muted" />
          : s.movers.map(m => (
              <Row
                key={m.url}
                label={m.url}
                value={`${m.direction === 'up' ? '▲' : '▼'} ${fmtNum(Math.abs(m.delta))}`}
                tone={m.direction === 'up' ? 'good' : 'bad'}
                truncate
              />
            ))}
        <SourceChip sources={sources} />
      </Card>

      <Card>
        <SectionTitle>Lost pages</SectionTitle>
        {s.lostPages.length === 0
          ? <Row label="None dropped from top 50" value="—" tone="muted" />
          : s.lostPages.map(p => (
              <Row key={p.url} label={p.url} value="—" tone="bad" truncate />
            ))}
        <SourceChip sources={sources} />
      </Card>
    </div>
  )
}
