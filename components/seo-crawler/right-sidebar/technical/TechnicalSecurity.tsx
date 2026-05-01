// components/seo-crawler/right-sidebar/technical/TechnicalSecurity.tsx
import React, { useMemo } from 'react'
import { Shield } from 'lucide-react'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'
import { Card, Section } from '../primitives'
import { Bar as RsBar, MetricRow, EmptyState, fmtNum, safePct, scoreToTone } from '../_shared'
import { computeTechSummary } from './selectors'

export function TechnicalSecurity() {
  const { pages } = useSeoCrawler()
  const s = useMemo(() => computeTechSummary(pages || []), [pages])
  if (!pages?.length) return <EmptyState title="No crawl data yet" icon={<Shield size={20} />} />

  const httpsPct = safePct(s.security.httpsPages, s.total)

  return (
    <>
      <Card>
        <Section title="Transport security" dense>
          <RsBar tone={httpsPct >= 99 ? 'good' : httpsPct >= 90 ? 'warn' : 'bad'} value={s.security.httpsPages} max={s.total} label={`HTTPS coverage ${httpsPct.toFixed(1)}%`} />
          <MetricRow label="HTTP-only pages" value={fmtNum(s.security.httpPages)} tone={s.security.httpPages ? 'bad' : 'good'} />
          <MetricRow label="Mixed content" value={fmtNum(s.security.mixedContent)} tone={s.security.mixedContent ? 'bad' : 'good'} />
          <MetricRow label="Invalid SSL" value={fmtNum(s.security.sslInvalid)} tone={s.security.sslInvalid ? 'bad' : 'good'} />
          <MetricRow label="SSL expiring < 30d" value={fmtNum(s.security.sslExpiringSoon)} tone={s.security.sslExpiringSoon ? 'warn' : 'good'} />
          <MetricRow label="Weak TLS" value={fmtNum(s.security.weakTls)} tone={s.security.weakTls ? 'warn' : 'good'} />
        </Section>
      </Card>

      <Card>
        <Section title="HTTP headers" dense>
          <MetricRow label="HSTS missing (HTTPS pages)" value={fmtNum(s.security.hstsMissing)} tone={s.security.hstsMissing ? 'warn' : 'good'} />
          <MetricRow label="CSP missing" value={fmtNum(s.security.cspMissing)} tone={s.security.cspMissing ? 'warn' : 'good'} />
          <MetricRow label="CSP unsafe directives" value={fmtNum(s.security.cspUnsafe)} tone={s.security.cspUnsafe ? 'warn' : 'good'} />
          <MetricRow label="X-Frame-Options missing" value={fmtNum(s.security.xFrameMissing)} tone={s.security.xFrameMissing ? 'warn' : 'good'} />
          <MetricRow label="X-Content-Type-Options missing" value={fmtNum(s.security.xContentMissing)} tone={s.security.xContentMissing ? 'warn' : 'good'} />
          <MetricRow label="Referrer-Policy missing" value={fmtNum(s.security.referrerMissing)} tone={s.security.referrerMissing ? 'warn' : 'good'} />
          <MetricRow label="Permissions-Policy missing" value={fmtNum(s.security.permissionsMissing)} tone={s.security.permissionsMissing ? 'warn' : 'good'} />
          <MetricRow label="CORS wildcard" value={fmtNum(s.security.corsWildcard)} tone={s.security.corsWildcard ? 'warn' : 'good'} />
        </Section>
      </Card>

      <Card>
        <Section title="Cookies & integrity" dense>
          <MetricRow label="Insecure cookies" value={fmtNum(s.security.insecureCookies)} tone={s.security.insecureCookies ? 'warn' : 'good'} />
          <MetricRow label="Cookies missing SameSite" value={fmtNum(s.security.sameSiteMissing)} tone={s.security.sameSiteMissing ? 'warn' : 'good'} />
          <MetricRow label="Scripts without SRI" value={fmtNum(s.security.scriptsNoSri)} tone={s.security.scriptsNoSri ? 'warn' : 'good'} />
          <MetricRow label="Exposed API keys" value={fmtNum(s.security.exposedKeys)} tone={s.security.exposedKeys ? 'bad' : 'good'} />
        </Section>
      </Card>

      <Card>
        <Section title="Security score" dense>
          <MetricRow label="Score" value={Math.round(s.scores.security || 0)} tone={scoreToTone(s.scores.security)} />
          <div className="text-[10px] text-[#666] px-2">HTTPS, CSP, HSTS, SSL validity and exposed-key checks.</div>
        </Section>
      </Card>
    </>
  )
}
