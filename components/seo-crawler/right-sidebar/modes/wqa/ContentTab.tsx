import {
  Card, SectionTitle, Row, MiniBar, SourceChip, fmtNum, fmtPct,
} from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { WqaStats } from '../../../../../services/right-sidebar/wqa'

const WORD_BUCKETS = ['<300', '300–800', '800–1.5k', '1.5–3k', '3k+']
const READ_BUCKETS = ['hard <40', '40–60', '60–80', 'easy 80+']
const FRESH_BUCKETS = ['<7d', '<30d', '<90d', '<1y', '>1y']

const tonePct = (n: number, good = 60, warn = 30) =>
  n >= good ? 'good' : n >= warn ? 'warn' : 'bad'

export function WqaContentTab({ stats }: RsTabProps<WqaStats>) {
  const c = stats.content

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <SectionTitle>Words distribution</SectionTitle>
        <MiniBar
          data={c.wordsHistogram.map((v, i) => ({ label: WORD_BUCKETS[i], value: v }))}
          height={56}
        />
        <Row label="Thin pages" value={fmtNum(c.thin)} tone={c.thin ? 'warn' : 'good'} />
        <Row label="Avg words"  value={fmtNum(c.avgWords)} />
        <SourceChip sources={['Crawler']} />
      </Card>

      <Card>
        <SectionTitle>Readability</SectionTitle>
        <Row label="Average (Flesch)" value={c.readabilityAvg ?? '—'} />
        <MiniBar
          data={c.readabilityHistogram.map((v, i) => ({ label: READ_BUCKETS[i], value: v }))}
          height={48}
        />
        <SourceChip sources={['Crawler']} />
      </Card>

      <Card>
        <SectionTitle>Freshness</SectionTitle>
        <MiniBar
          data={c.freshnessHistogram.map((v, i) => ({ label: FRESH_BUCKETS[i], value: v }))}
          height={56}
        />
        <SourceChip sources={['Crawler']} />
      </Card>

      <Card>
        <SectionTitle>Duplication</SectionTitle>
        <Row label="Near-dupe groups" value={fmtNum(c.duplication.nearDupeGroups)}
             tone={c.duplication.nearDupeGroups ? 'warn' : 'good'} />
        <Row label="Cannibalization pairs" value={fmtNum(c.duplication.cannibalPairs)}
             tone={c.duplication.cannibalPairs ? 'warn' : 'good'} />
        <Row label="Exact dupes" value={fmtNum(c.duplication.exactDupes)}
             tone={c.duplication.exactDupes ? 'bad' : 'good'} />
        <Row label="Dup titles" value={fmtNum(c.dupTitles)}
             tone={c.dupTitles ? 'warn' : 'good'} />
        <Row label="Dup descriptions" value={fmtNum(c.dupDescriptions)}
             tone={c.dupDescriptions ? 'warn' : 'good'} />
        <SourceChip sources={['Crawler']} />
      </Card>

      <Card>
        <SectionTitle>E-E-A-T coverage</SectionTitle>
        <Row label="Author bylines" bar={c.eeat.byline}      value={`${c.eeat.byline}%`}      tone={tonePct(c.eeat.byline)} />
        <Row label="Updated dates"  bar={c.eeat.updatedDate} value={`${c.eeat.updatedDate}%`} tone={tonePct(c.eeat.updatedDate)} />
        <Row label="Citations"      bar={c.eeat.citations}   value={`${c.eeat.citations}%`}   tone={tonePct(c.eeat.citations, 50, 20)} />
        <Row label="Author bios"    bar={c.eeat.authorBio}   value={`${c.eeat.authorBio}%`}   tone={tonePct(c.eeat.authorBio, 50, 20)} />
        <SourceChip sources={['Crawler']} />
      </Card>

      <Card>
        <SectionTitle>Schema coverage</SectionTitle>
        <Row label="Article" bar={c.schemaCoverage.article} value={`${c.schemaCoverage.article}%`} />
        <Row label="Product" bar={c.schemaCoverage.product} value={`${c.schemaCoverage.product}%`} />
        <Row label="FAQ"     bar={c.schemaCoverage.faq}     value={`${c.schemaCoverage.faq}%`} />
        <Row label="HowTo"   bar={c.schemaCoverage.howto}   value={`${c.schemaCoverage.howto}%`} />
        <SourceChip sources={['Crawler']} />
      </Card>

      <Card>
        <SectionTitle>Content health</SectionTitle>
        <Row label="With title"       bar={fmtPctRaw(c.withTitle, c.eeat.total)} value={`${pctOf(c.withTitle, c.eeat.total)}%`} />
        <Row label="With meta desc"   bar={fmtPctRaw(c.withDesc,  c.eeat.total)} value={`${pctOf(c.withDesc,  c.eeat.total)}%`} />
        <Row label="With H1"          bar={fmtPctRaw(c.withH1,    c.eeat.total)} value={`${pctOf(c.withH1,    c.eeat.total)}%`} />
        <SourceChip sources={['Crawler']} />
      </Card>
    </div>
  )
}

const pctOf = (n: number, t: number) => (t ? Math.round((n / t) * 100) : 0)
const fmtPctRaw = pctOf
