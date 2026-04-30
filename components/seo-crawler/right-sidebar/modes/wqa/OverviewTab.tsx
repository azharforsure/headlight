import {
  Card, SectionTitle, Row, KpiTile, Gauge, MiniBar, StackedBar, SourceChip,
  fmtNum, fmtPct, fmtDelta,
} from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { WqaStats } from '../../../../../services/right-sidebar/wqa'

const QUALITY_BUCKET_LABELS = ['0–20', '20–40', '40–60', '60–80', '80–100']

export function WqaOverviewTab({ deps, stats }: RsTabProps<WqaStats>) {
  const { overallScore, scoreP50, scoreP90, qualityHistogram, categoryMix,
          search, needsDecision, heroChips } = stats
  const totalPages = deps.pages.length

  return (
    <div className="flex flex-col gap-3">
      <Card accent="violet">
        <SectionTitle>Quality</SectionTitle>
        <div className="flex items-center gap-3">
          <Gauge value={overallScore} max={100} size={84} accent="violet" />
          <div className="flex flex-col text-xs leading-tight">
            <span className="text-muted">p50 <b className="text-default tabular-nums">{scoreP50}</b></span>
            <span className="text-muted">p90 <b className="text-default tabular-nums">{scoreP90}</b></span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {heroChips.map(c => (
            <span key={c.label} className={`text-[11px] px-1.5 py-0.5 rounded chip-${c.tone}`}>
              {c.label} <b className="tabular-nums">{c.value}</b>
            </span>
          ))}
        </div>
        <SourceChip sources={['Crawler']} className="mt-2" />
      </Card>

      <Card>
        <SectionTitle>Category KPIs</SectionTitle>
        <Row label="Pages"      value={fmtNum(totalPages)} />
        <Row label="Indexable"  value={fmtPct(stats.search.indexable / Math.max(totalPages, 1))} />
        <Row label="Avg words"  value={fmtNum(stats.content.avgWords)} />
        <Row label="Byline cov" value={`${stats.content.eeat.byline}%`} />
        <SourceChip sources={['Crawler']} />
      </Card>

      <Card>
        <SectionTitle>Quality distribution</SectionTitle>
        <MiniBar
          data={qualityHistogram.map((count, i) => ({ label: QUALITY_BUCKET_LABELS[i], value: count }))}
          height={56}
        />
        <SourceChip sources={['Crawler']} />
      </Card>

      <Card>
        <SectionTitle>Page categories</SectionTitle>
        {categoryMix.map(c => (
          <Row
            key={c.name}
            label={c.name}
            bar={c.pct}
            value={`${c.pct}%`}
            sub={fmtNum(c.count)}
          />
        ))}
        <SourceChip sources={['Crawler']} />
      </Card>

      <Card>
        <SectionTitle>Search performance</SectionTitle>
        <Row label="Clicks"      value={fmtNum(search.clicks28d)} delta={fmtDelta(search.clicks28dDelta, 'pct')} />
        <Row label="Impressions" value={fmtNum(search.impr28d)}   delta={fmtDelta(search.impr28dDelta, 'pct')} />
        <Row label="CTR"         value={fmtPct(search.ctr28d)}    delta={fmtDelta(search.ctr28dDelta, 'pp')} />
        <Row label="Avg position" value={search.pos28d.toFixed(1)} delta={fmtDelta(-search.pos28dDelta, 'abs')} />
        <SourceChip sources={['Google Search Console', 'Bing Webmaster']} />
      </Card>

      <Card>
        <SectionTitle>Needs decision <span className="text-muted">{needsDecision.total}</span></SectionTitle>
        <Row label="Rewrite"   value={fmtNum(needsDecision.rewrite)} />
        <Row label="Merge"     value={fmtNum(needsDecision.merge)} />
        <Row label="Expand"    value={fmtNum(needsDecision.expand)} />
        <Row label="Deprecate" value={fmtNum(needsDecision.deprecate)} />
        <SourceChip sources={['Crawler', 'Rules']} />
      </Card>
    </div>
  )
}
