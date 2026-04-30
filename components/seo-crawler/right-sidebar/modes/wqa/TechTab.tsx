import {
  Card, SectionTitle, Row, StackedBar, SourceChip, fmtNum, fmtMs,
} from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { WqaStats } from '../../../../../services/right-sidebar/wqa'

const cwvTone = (kind: 'lcp' | 'inp' | 'cls', v: number | null): 'good' | 'warn' | 'bad' | 'muted' => {
  if (v == null) return 'muted'
  if (kind === 'lcp') return v <= 2500 ? 'good' : v <= 4000 ? 'warn' : 'bad'
  if (kind === 'inp') return v <= 200  ? 'good' : v <= 500  ? 'warn' : 'bad'
  return v <= 0.1 ? 'good' : v <= 0.25 ? 'warn' : 'bad'
}

export function WqaTechTab({ deps, stats }: RsTabProps<WqaStats>) {
  const t = stats.tech
  const total = deps.pages.length || 1
  const indexablePct      = Math.round((t.indexableCount        / total) * 100)
  const noindexPct        = Math.round((t.noindexCount          / total) * 100)
  const blockedPct        = Math.round((t.blockedCount          / total) * 100)
  const canonMismatchPct  = Math.round((t.canonMismatchCount    / total) * 100)
  const renderTotal = t.renderMix.static + t.renderMix.ssr + t.renderMix.csr || 1
  const renderPct = (n: number) => Math.round((n / renderTotal) * 100)

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <SectionTitle>Indexability</SectionTitle>
        <Row label="Indexable"       bar={indexablePct}     value={`${indexablePct}%`} tone="good" />
        <Row label="Noindex"         bar={noindexPct}       value={`${noindexPct}%`}    tone="warn" />
        <Row label="Blocked"         bar={blockedPct}       value={`${blockedPct}%`}    tone="bad" />
        <Row label="Canonical ≠ self" bar={canonMismatchPct} value={`${canonMismatchPct}%`} tone="warn" />
        <SourceChip sources={['Crawler']} />
      </Card>

      <Card>
        <SectionTitle>Status codes</SectionTitle>
        <StackedBar
          data={t.statusMix.map(s => ({
            label: s.code,
            value: s.count,
            color: s.code === '2xx' ? 'good' : s.code === '3xx' ? 'info'
                  : s.code === '4xx' ? 'warn' : 'bad',
          }))}
        />
        {t.statusMix.map(s => (
          <Row key={s.code} label={s.code} value={fmtNum(s.count)} />
        ))}
        <SourceChip sources={['Crawler']} />
      </Card>

      <Card>
        <SectionTitle>Render</SectionTitle>
        <Row label="Static" bar={renderPct(t.renderMix.static)} value={`${renderPct(t.renderMix.static)}%`} />
        <Row label="SSR"    bar={renderPct(t.renderMix.ssr)}    value={`${renderPct(t.renderMix.ssr)}%`} />
        <Row label="CSR"    bar={renderPct(t.renderMix.csr)}    value={`${renderPct(t.renderMix.csr)}%`}
             tone={renderPct(t.renderMix.csr) > 20 ? 'warn' : 'muted'} />
        <SourceChip sources={['Crawler']} />
      </Card>

      <Card>
        <SectionTitle>Response time</SectionTitle>
        <Row label="p50" value={t.responseP50 != null ? fmtMs(t.responseP50) : '—'} />
        <Row label="p90" value={t.responseP90 != null ? fmtMs(t.responseP90) : '—'} />
        <Row label="p99" value={t.responseP99 != null ? fmtMs(t.responseP99) : '—'}
             tone={t.responseP99 && t.responseP99 > 3000 ? 'warn' : 'muted'} />
        <SourceChip sources={['Crawler']} />
      </Card>

      <Card>
        <SectionTitle>Core signals (sample)</SectionTitle>
        <Row label="LCP p50" value={t.cwv.lcpP50 != null ? fmtMs(t.cwv.lcpP50) : '—'} tone={cwvTone('lcp', t.cwv.lcpP50)} />
        <Row label="LCP p75" value={t.cwv.lcpP75 != null ? fmtMs(t.cwv.lcpP75) : '—'} tone={cwvTone('lcp', t.cwv.lcpP75)} />
        <Row label="INP p50" value={t.cwv.inpP50 != null ? fmtMs(t.cwv.inpP50) : '—'} tone={cwvTone('inp', t.cwv.inpP50)} />
        <Row label="CLS p50" value={t.cwv.clsP50 != null ? t.cwv.clsP50.toFixed(2) : '—'} tone={cwvTone('cls', t.cwv.clsP50)} />
        <span className="text-[11px] text-muted">Templatized sample · less per-page noise</span>
        <SourceChip sources={['Crawler', 'CrUX']} />
      </Card>

      <Card>
        <SectionTitle>Structural</SectionTitle>
        <Row label="Orphans"          value={fmtNum(t.structural.orphans)}        tone={t.structural.orphans ? 'warn' : 'good'} />
        <Row label="Deep (&gt; 5)"    value={fmtNum(t.structural.deep)}           tone={t.structural.deep    ? 'warn' : 'good'} />
        <Row label="Redirect chains"  value={fmtNum(t.structural.redirectChains)} tone={t.structural.redirectChains ? 'warn' : 'good'} />
        <Row label="Mixed content"    value={fmtNum(t.structural.mixedContent)}   tone={t.structural.mixedContent ? 'bad'  : 'good'} />
        <SourceChip sources={['Crawler']} />
      </Card>

      <Card>
        <SectionTitle>HTTPS</SectionTitle>
        <Row label="Pages over HTTPS" bar={t.httpsPct} value={`${t.httpsPct}%`} tone={t.httpsPct >= 95 ? 'good' : 'bad'} />
        <Row label="Heavy pages (&gt; 2MB)" value={fmtNum(t.heavyPages)} tone={t.heavyPages ? 'warn' : 'muted'} />
        <Row label="Slow pages (&gt; 2.5s)" value={fmtNum(t.slowPages)} tone={t.slowPages ? 'warn' : 'muted'} />
        <SourceChip sources={['Crawler']} />
      </Card>
    </div>
  )
}
