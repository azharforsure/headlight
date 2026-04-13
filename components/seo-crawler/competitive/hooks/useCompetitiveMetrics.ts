import { useMemo } from 'react';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import type { CompetitorProfile } from '../../../../services/CompetitorMatrixConfig';

type MetricDelta = { label: string; yours: string; delta: string };

export function useCompetitiveMetrics() {
  const { competitiveState } = useSeoCrawler();
  const { ownProfile, competitorProfiles, activeCompetitorDomains } = competitiveState;

  const activeComps = useMemo(
    () => activeCompetitorDomains.map((d) => competitorProfiles.get(d)).filter(Boolean) as CompetitorProfile[],
    [activeCompetitorDomains, competitorProfiles]
  );

  const { advantages, vulnerabilities } = useMemo(() => {
    if (!ownProfile || activeComps.length === 0) {
      return { advantages: [] as MetricDelta[], vulnerabilities: [] as MetricDelta[] };
    }

    const avgOf = (key: keyof CompetitorProfile) => {
      const vals = activeComps.map((c) => Number(c[key] || 0)).filter((v) => v > 0);
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    const adv: MetricDelta[] = [];
    const vul: MetricDelta[] = [];

    const check = (label: string, ownVal: number, avg: number, unit = '') => {
      const diff = ownVal - avg;
      const entry = {
        label,
        yours: `${Math.round(ownVal).toLocaleString()}${unit}`,
        delta: `${diff > 0 ? '+' : ''}${Math.round(diff).toLocaleString()}${unit}`,
      };
      if (diff > 0) adv.push(entry);
      else if (diff < 0) vul.push(entry);
    };

    check('Referring Domains', Number(ownProfile.referringDomains || 0), avgOf('referringDomains'));
    check('Indexable Pages', Number(ownProfile.totalIndexablePages || 0), avgOf('totalIndexablePages'));
    check('Tech Health', Number(ownProfile.techHealthScore || 0), avgOf('techHealthScore'), '%');
    check('CWV Pass Rate', Number(ownProfile.cwvPassRate || 0), avgOf('cwvPassRate'), '%');
    check('GEO Score', Number(ownProfile.avgGeoScore || 0), avgOf('avgGeoScore'));
    check('Blog Posts/Mo', Number(ownProfile.blogPostsPerMonth || 0), avgOf('blogPostsPerMonth'));
    check('Schema Coverage', Number(ownProfile.schemaCoveragePct || 0), avgOf('schemaCoveragePct'), '%');
    check('Social Followers', Number(ownProfile.socialTotalFollowers || 0), avgOf('socialTotalFollowers'));
    check('Content Freshness', Number(ownProfile.contentFreshnessScore || 0), avgOf('contentFreshnessScore'), '%');
    check('Trust Signals', Number(ownProfile.trustSignalScore || 0), avgOf('trustSignalScore'));
    check('Site Speed', Number(ownProfile.siteSpeedScore || 0), avgOf('siteSpeedScore'));
    check('Crawlability', Number(ownProfile.crawlabilityScore || 0), avgOf('crawlabilityScore'));

    const parseAbsDelta = (value: string) => Math.abs(Number(value.replace(/[^0-9.-]/g, '')));

    return {
      advantages: adv.sort((a, b) => parseAbsDelta(b.delta) - parseAbsDelta(a.delta)).slice(0, 4),
      vulnerabilities: vul.sort((a, b) => parseAbsDelta(b.delta) - parseAbsDelta(a.delta)).slice(0, 4),
    };
  }, [ownProfile, activeComps]);

  return { ownProfile, activeComps, advantages, vulnerabilities };
}
