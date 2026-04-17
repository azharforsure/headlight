import React from 'react';
import {
  DataRow, MetricCard, SectionHeader, StatusBadge, TruncatedUrl,
  formatNumber, formatBytes, formatDuration,
} from '../../../inspector/shared';
import CollapseGroup from '../parts/CollapseGroup';

function Gauge({ label, value, unit, good, warn }: { label: string; value: number | null; unit: string; good: number; warn: number }) {
  if (value === null || !Number.isFinite(value)) {
    return (
      <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
        <div className="text-[10px] text-[#666] uppercase tracking-widest">{label}</div>
        <div className="text-[22px] font-black mt-1 text-[#666]">—</div>
      </div>
    );
  }
  const tone = value <= good ? 'pass' : value <= warn ? 'warn' : 'fail';
  const colorText = tone === 'pass' ? 'text-green-400' : tone === 'warn' ? 'text-orange-400' : 'text-red-400';
  const colorBar = tone === 'pass' ? 'bg-green-500' : tone === 'warn' ? 'bg-orange-500' : 'bg-red-500';
  const pct = Math.min(100, Math.round((value / warn) * 100));
  return (
    <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
      <div className="text-[10px] text-[#666] uppercase tracking-widest">{label}</div>
      <div className={`text-[22px] font-black mt-1 ${colorText}`}>{value}{unit}</div>
      <div className="mt-2 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div className={`h-full ${colorBar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function TechTab({ page }: { page: any }) {
  const headers: Array<[string, unknown]> =
    page?.responseHeaders && typeof page.responseHeaders === 'object'
      ? Object.entries(page.responseHeaders)
      : [];
  const redirects: string[] = Array.isArray(page?.redirectChain) ? page.redirectChain : [];
  const lcp = Number(page?.lcp || 0) || null;
  const cls = Number(page?.cls || 0) || null;
  const inp = Number(page?.inp || 0) || null;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MetricCard label="Health" value={formatNumber(page?.healthScore)} />
        <MetricCard label="Speed" value={page?.speedScore || '—'} />
        <MetricCard
          label="Status"
          value={page?.statusCode || '—'}
          sub={page?.status || ''}
          color={Number(page?.statusCode || 0) >= 400 ? 'text-red-400' : Number(page?.statusCode || 0) >= 300 ? 'text-orange-400' : 'text-green-400'}
        />
        <MetricCard label="Indexable" value={page?.indexable === false ? 'No' : 'Yes'} color={page?.indexable === false ? 'text-red-400' : 'text-green-400'} />
      </div>

      <CollapseGroup title="Crawl & index">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 min-w-0">
          <DataRow label="URL" value={<TruncatedUrl url={String(page?.url || '')} />} />
          <DataRow label="Final URL" value={<TruncatedUrl url={String(page?.finalUrl || '')} />} />
          <DataRow label="Canonical" value={<TruncatedUrl url={String(page?.canonical || '')} />} status={page?.canonical && page.canonical !== page.url ? 'info' : 'pass'} />
          <DataRow label="Meta robots" value={page?.metaRobots1} />
          <DataRow label="X-Robots" value={page?.xRobots || page?.xRobotsTag} />
          <DataRow label="In sitemap" value={page?.inSitemap ? 'Yes' : 'No'} status={page?.inSitemap ? 'pass' : 'warn'} />
          <DataRow label="Crawl depth" value={formatNumber(page?.crawlDepth)} mono />
          <DataRow label="Folder depth" value={formatNumber(page?.folderDepth)} mono />
        </div>
      </CollapseGroup>

      <CollapseGroup title="Speed">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <Gauge label="LCP" value={lcp} unit="ms" good={2500} warn={4000} />
          <Gauge label="CLS" value={cls} unit="" good={0.1} warn={0.25} />
          <Gauge label="INP" value={inp} unit="ms" good={200} warn={500} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <MetricCard label="TTFB" value={formatDuration(page?.loadTime)} />
          <MetricCard label="DOM nodes" value={formatNumber(page?.domNodeCount)} />
          <MetricCard
            label="Render blocking"
            value={formatNumber(Number(page?.renderBlockingCss || 0) + Number(page?.renderBlockingJs || 0))}
          />
          <MetricCard label="3P scripts" value={formatNumber(page?.thirdPartyScriptCount)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 min-w-0">
          <DataRow label="HTTP version" value={page?.httpVersion} />
          <DataRow label="Size" value={formatBytes(page?.sizeBytes)} />
          <DataRow label="Transferred" value={formatBytes(page?.transferredBytes)} />
          <DataRow label="DNS time" value={formatDuration(page?.dnsResolutionTime)} />
          <DataRow label="Cache-Control" value={page?.hasCacheControl ? 'Present' : 'Missing'} status={page?.hasCacheControl ? 'pass' : 'warn'} />
          <DataRow label="ETag" value={page?.hasEtag ? 'Present' : 'Missing'} status={page?.hasEtag ? 'pass' : 'warn'} />
        </div>
      </CollapseGroup>

      <CollapseGroup title="Security">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 min-w-0">
          <DataRow label="HTTPS" value={String(page?.url || '').startsWith('https://') ? 'Yes' : 'No'} status={String(page?.url || '').startsWith('https://') ? 'pass' : 'fail'} />
          <DataRow label="SSL valid" value={page?.sslValid === true ? 'Yes' : page?.sslValid === false ? 'No' : '—'} status={page?.sslValid === false ? 'fail' : 'pass'} />
          <DataRow label="TLS" value={page?.sslProtocol} />
          <DataRow label="SSL expires" value={page?.sslExpiryDate} status={page?.sslIsExpiringSoon ? 'warn' : 'pass'} />
          <DataRow label="HSTS" value={page?.hasHsts ? 'Present' : 'Missing'} status={page?.hasHsts ? 'pass' : 'warn'} />
          <DataRow label="CSP" value={page?.hasCsp ? 'Present' : 'Missing'} status={page?.hasCsp ? 'pass' : 'warn'} />
          <DataRow label="Mixed content" value={page?.mixedContent ? 'Yes' : 'No'} status={page?.mixedContent ? 'fail' : 'pass'} />
          <DataRow label="Exposed API keys" value={formatNumber(page?.exposedApiKeys)} status={Number(page?.exposedApiKeys || 0) > 0 ? 'fail' : 'pass'} />
        </div>
      </CollapseGroup>

      <CollapseGroup title="Mobile & accessibility" defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 min-w-0">
          <DataRow label="Viewport meta" value={page?.hasViewportMeta ? 'Yes' : 'No'} status={page?.hasViewportMeta ? 'pass' : 'fail'} />
          <DataRow label="Tap targets too small" value={formatNumber(page?.smallTapTargets)} status={Number(page?.smallTapTargets || 0) > 0 ? 'warn' : 'pass'} />
          <DataRow label="Small fonts" value={formatNumber(page?.smallFontCount)} />
          <DataRow label="Main landmark" value={page?.hasMainLandmark ? 'Yes' : 'No'} status={page?.hasMainLandmark ? 'pass' : 'warn'} />
          <DataRow label="Skip link" value={page?.hasSkipLink ? 'Yes' : 'No'} />
          <DataRow label="Forms without labels" value={formatNumber(page?.formsWithoutLabels)} />
        </div>
      </CollapseGroup>

      <CollapseGroup title="Render diff (JS vs HTML)" defaultOpen={false}>
        {page?.jsRenderDiff ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Text diff" value={`${page.jsRenderDiff.textDiffPercent ?? 0}%`} />
            <MetricCard label="JS-only links" value={formatNumber(page.jsRenderDiff.jsOnlyLinks)} />
            <MetricCard label="JS-only images" value={formatNumber(page.jsRenderDiff.jsOnlyImages)} />
            <MetricCard label="Critical content JS-only" value={page.jsRenderDiff.criticalContentJsOnly ? 'Yes' : 'No'} />
          </div>
        ) : (
          <div className="text-[12px] text-[#666]">JS rendering diff not enabled for this crawl.</div>
        )}
      </CollapseGroup>

      {redirects.length > 0 && (
        <CollapseGroup title={`Redirect chain (${redirects.length})`} defaultOpen={false}>
          <div className="space-y-2">
            {redirects.map((u, i) => (
              <div key={`${u}-${i}`} className="bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 text-[11px] font-mono text-[#ccc] break-all">
                <span className="text-[#666] mr-2">#{i + 1}</span>{u}
              </div>
            ))}
          </div>
        </CollapseGroup>
      )}

      {headers.length > 0 && (
        <CollapseGroup title={`Response headers (${headers.length})`} defaultOpen={false}>
          <div className="bg-[#0a0a0a] border border-[#222] rounded overflow-hidden max-h-[240px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-[11px] font-mono">
              <tbody>
                {headers.map(([k, v]) => (
                  <tr key={k} className="border-b border-[#1a1a1a] hover:bg-[#111]">
                    <td className="px-3 py-1 text-[#F5364E] w-[210px]">{k}</td>
                    <td className="px-3 py-1 text-[#ccc] break-all">{String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapseGroup>
      )}
    </div>
  );
}
