import { analyzeCompetitorOverlap } from '../../CompetitorDiscoveryService';
import { findKeywordGaps } from '../../KeywordDiscoveryService';
import { CheckEvaluator } from '../types';

const rootOnly = (page: any) => Number(page?.crawlDepth || 0) === 0;

export const normalizeHost = (url?: string) => {
  try {
    return new URL(String(url || '')).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
};

export const getRootPage = (pages: any[] = []) =>
  pages.find((page) => Number(page?.crawlDepth || 0) === 0) || pages[0] || null;

export const countSocialProfiles = (page: any) =>
  Object.values(page?.socialLinks || {}).filter(Boolean).length;

export const extractRecentContentCount = (pages: any[] = [], days = 90) => {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return pages.filter((page) => {
    const timestamp = Date.parse(String(page?.visibleDate || ''));
    if (!Number.isFinite(timestamp)) return false;
    const isContentLike = Number(page?.wordCount || 0) >= 300 ||
      /(blog|news|article|guide|resources|learn|insights)/i.test(String(page?.url || ''));
    return isContentLike && timestamp >= cutoff;
  }).length;
};

const collectTechStack = (pages: any[] = []) => {
  const stack = new Set<string>();
  for (const page of pages) {
    for (const lib of page?.detectedLibraries || []) {
      if (lib) stack.add(String(lib));
    }
    if (page?.cmsType) stack.add(String(page.cmsType));
  }
  return [...stack].sort();
};

const sumReferringDomains = (pages: any[] = []) =>
  pages.reduce((sum, page) => sum + Number(page?.referringDomains || 0), 0);

const getPricingSignal = (pages: any[] = []) =>
  pages.some((page) =>
    page?.hasPricingPage ||
    page?.industrySignals?.hasPricingTable ||
    /(pricing|plans|packages|subscription)/i.test(String(page?.url || ''))
  );

const getPrimaryCompetitorDomain = (pages: any[] = []) => normalizeHost(pages[0]?.url);

const summarizeKeywordGaps = (ownPages: any[], competitorPages: any[]) =>
  findKeywordGaps(ownPages, competitorPages).map((item) => item.keyword).slice(0, 15);

const summarizeContentGaps = (ownPages: any[], competitorPages: any[]) => {
  const overlap = analyzeCompetitorOverlap(ownPages, competitorPages);
  return overlap.uniqueKeywords.slice(0, 15);
};

const infoNoCompetitorData = (checkId: string, category: string, name: string, message: string) => ({
  checkId,
  tier: 4 as const,
  category,
  name,
  severity: 'info' as const,
  value: { hasCompetitorData: false },
  expected: 'Competitor crawl pages available for comparison',
  message,
  auditModes: ['full', 'competitor_gap'],
  industries: ['all']
});

export const checkCompKeywordGap: CheckEvaluator = (page, ctx) => {
  if (!rootOnly(page)) return null;
  const competitorPages = ctx?.competitorPages || [];
  if (competitorPages.length === 0) {
    return infoNoCompetitorData('t4-comp-keyword-gap', 'competitor', 'Competitor Keyword Gap', 'No competitor crawl data available for keyword-gap analysis.');
  }

  const gaps = summarizeKeywordGaps(ctx?.allPages || [], competitorPages);
  const severity = gaps.length > 0 ? 'warning' : 'pass';

  return {
    checkId: 't4-comp-keyword-gap',
    tier: 4, category: 'competitor', name: 'Competitor Keyword Gap',
    severity,
    value: { gapCount: gaps.length, keywords: gaps },
    expected: 'Own site covers the main keywords competitors target',
    message: gaps.length > 0
      ? `${gaps.length} competitor keywords appear uncovered by your site.`
      : 'No obvious keyword gaps found against the competitor sample.',
    auditModes: ['full', 'competitor_gap'], industries: ['all']
  };
};

export const checkCompContentGap: CheckEvaluator = (page, ctx) => {
  if (!rootOnly(page)) return null;
  const competitorPages = ctx?.competitorPages || [];
  if (competitorPages.length === 0) {
    return infoNoCompetitorData('t4-comp-content-gap', 'competitor', 'Competitor Content Gap', 'No competitor crawl data available for content-gap analysis.');
  }

  const gaps = summarizeContentGaps(ctx?.allPages || [], competitorPages);
  const severity = gaps.length > 0 ? 'warning' : 'pass';

  return {
    checkId: 't4-comp-content-gap',
    tier: 4, category: 'competitor', name: 'Competitor Content Gap',
    severity,
    value: { gapCount: gaps.length, topics: gaps },
    expected: 'Comparable topical coverage to competitor content sample',
    message: gaps.length > 0
      ? `${gaps.length} competitor content topics are not clearly represented on your site.`
      : 'No major topical gaps found in the competitor sample.',
    auditModes: ['full', 'competitor_gap'], industries: ['all']
  };
};

export const checkCompBacklinkGap: CheckEvaluator = (page, ctx) => {
  if (!rootOnly(page)) return null;
  const competitorPages = ctx?.competitorPages || [];
  if (competitorPages.length === 0) {
    return infoNoCompetitorData('t4-comp-backlink-gap', 'competitor', 'Competitor Backlink Gap', 'No competitor crawl data available for backlink-gap analysis.');
  }

  const yourRefDomains = sumReferringDomains(ctx?.allPages || []);
  const competitorRefDomains = sumReferringDomains(competitorPages);
  const gap = Math.max(0, competitorRefDomains - yourRefDomains);
  const severity = gap > 25 ? 'warning' : gap > 0 ? 'info' : 'pass';

  return {
    checkId: 't4-comp-backlink-gap',
    tier: 4, category: 'competitor', name: 'Competitor Backlink Gap',
    severity,
    value: { yourRefDomains, competitorRefDomains, gap },
    expected: 'Comparable referring-domain strength to primary competitor',
    message: gap > 0
      ? `Competitor sample shows ${gap} more referring domains than your sampled pages.`
      : 'No competitor backlink gap detected in the sampled crawl data.',
    auditModes: ['full', 'competitor_gap'], industries: ['all']
  };
};

export const checkCompTechStack: CheckEvaluator = (page, ctx) => {
  if (!rootOnly(page)) return null;
  const competitorPages = ctx?.competitorPages || [];
  if (competitorPages.length === 0) {
    return infoNoCompetitorData('t4-comp-tech-stack', 'competitor', 'Tech Stack Comparison', 'No competitor crawl data available for tech-stack comparison.');
  }

  const ownStack = collectTechStack(ctx?.allPages || []);
  const competitorStack = collectTechStack(competitorPages);
  const missing = competitorStack.filter((item) => !ownStack.includes(item));

  return {
    checkId: 't4-comp-tech-stack',
    tier: 4, category: 'competitor', name: 'Tech Stack Comparison',
    severity: missing.length > 0 ? 'info' : 'pass',
    value: { ownStack, competitorStack, competitorOnly: missing },
    expected: 'Understand meaningful stack differences versus competitors',
    message: missing.length > 0
      ? `Competitor sample uses ${missing.slice(0, 5).join(', ')} that your site does not expose.`
      : 'No meaningful tech-stack differences detected in the sampled competitor pages.',
    auditModes: ['full', 'competitor_gap'], industries: ['all']
  };
};

export const checkCompPricing: CheckEvaluator = (page, ctx) => {
  if (!rootOnly(page)) return null;
  const competitorPages = ctx?.competitorPages || [];
  if (competitorPages.length === 0) {
    return infoNoCompetitorData('t4-comp-pricing', 'competitor', 'Competitor Pricing Comparison', 'No competitor crawl data available for pricing comparison.');
  }

  const ownHasPricing = getPricingSignal(ctx?.allPages || []);
  const competitorHasPricing = getPricingSignal(competitorPages);
  const severity = competitorHasPricing && !ownHasPricing ? 'warning' : (ownHasPricing === competitorHasPricing ? 'pass' : 'info');

  return {
    checkId: 't4-comp-pricing',
    tier: 4, category: 'competitor', name: 'Competitor Pricing Comparison',
    severity,
    value: { ownHasPricing, competitorHasPricing, competitorDomain: getPrimaryCompetitorDomain(competitorPages) },
    expected: 'Pricing visibility should match or exceed the competitor sample',
    message: competitorHasPricing && !ownHasPricing
      ? 'Competitor sample exposes pricing while your site does not.'
      : ownHasPricing && competitorHasPricing
        ? 'Both your site and the competitor sample expose pricing pages.'
        : ownHasPricing
          ? 'Your site exposes pricing while the competitor sample does not.'
          : 'Neither site shows a clear pricing page in the sampled crawl.',
    auditModes: ['full', 'competitor_gap'], industries: ['all']
  };
};

export const checkCompSocial: CheckEvaluator = (page, ctx) => {
  if (!rootOnly(page)) return null;
  const competitorPages = ctx?.competitorPages || [];
  if (competitorPages.length === 0) {
    return infoNoCompetitorData('t4-comp-social', 'competitor', 'Competitor Social Footprint', 'No competitor crawl data available for social-footprint comparison.');
  }

  const ownRoot = getRootPage(ctx?.allPages || []);
  const competitorRoot = getRootPage(competitorPages);
  const ownCount = countSocialProfiles(ownRoot);
  const competitorCount = countSocialProfiles(competitorRoot);
  const severity = competitorCount > ownCount ? 'warning' : ownCount > 0 ? 'pass' : 'info';

  return {
    checkId: 't4-comp-social',
    tier: 4, category: 'competitor', name: 'Competitor Social Footprint',
    severity,
    value: { ownCount, competitorCount },
    expected: 'Own social footprint should match or exceed competitor visibility',
    message: competitorCount > ownCount
      ? `Competitor sample links ${competitorCount} social profiles versus ${ownCount} on your site.`
      : ownCount > 0
        ? `Your site links ${ownCount} social profiles, matching or exceeding the competitor sample.`
        : 'No social profiles detected on either site root.',
    auditModes: ['full', 'competitor_gap'], industries: ['all']
  };
};

export const checkCompContentFreq: CheckEvaluator = (page, ctx) => {
  if (!rootOnly(page)) return null;
  const competitorPages = ctx?.competitorPages || [];
  if (competitorPages.length === 0) {
    return infoNoCompetitorData('t4-comp-content-freq', 'competitor', 'Competitor Content Frequency', 'No competitor crawl data available for publishing-frequency comparison.');
  }

  const ownRecent = extractRecentContentCount(ctx?.allPages || [], 90);
  const competitorRecent = extractRecentContentCount(competitorPages, 90);
  const severity = competitorRecent > Math.max(ownRecent * 1.5, ownRecent + 2) ? 'warning' : competitorRecent > 0 || ownRecent > 0 ? 'info' : 'pass';

  return {
    checkId: 't4-comp-content-freq',
    tier: 4, category: 'competitor', name: 'Competitor Content Frequency',
    severity,
    value: { ownRecentPages90d: ownRecent, competitorRecentPages90d: competitorRecent },
    expected: 'Publishing frequency should be competitive over the last 90 days',
    message: competitorRecent > ownRecent
      ? `Competitor sample shows ${competitorRecent} recent content pages versus ${ownRecent} on your site.`
      : `Your site shows ${ownRecent} recent content pages versus ${competitorRecent} in the competitor sample.`,
    auditModes: ['full', 'competitor_gap'], industries: ['all']
  };
};

export const checkCompLinkVelocity: CheckEvaluator = (page, ctx) => {
  if (!rootOnly(page)) return null;
  const competitorPages = ctx?.competitorPages || [];
  if (competitorPages.length === 0) {
    return infoNoCompetitorData('t4-comp-link-velocity', 'competitor', 'Competitor Link Velocity Proxy', 'No competitor crawl data available for link-velocity comparison.');
  }

  const yourRefDomains = sumReferringDomains(ctx?.allPages || []);
  const competitorRefDomains = sumReferringDomains(competitorPages);
  const ownRecent = extractRecentContentCount(ctx?.allPages || [], 90);
  const competitorRecent = extractRecentContentCount(competitorPages, 90);
  const ownVelocityProxy = yourRefDomains + ownRecent * 5;
  const competitorVelocityProxy = competitorRefDomains + competitorRecent * 5;
  const severity = competitorVelocityProxy > ownVelocityProxy * 1.25 ? 'warning' : competitorVelocityProxy > ownVelocityProxy ? 'info' : 'pass';

  return {
    checkId: 't4-comp-link-velocity',
    tier: 4, category: 'competitor', name: 'Competitor Link Velocity Proxy',
    severity,
    value: { ownVelocityProxy, competitorVelocityProxy, yourRefDomains, competitorRefDomains, ownRecent, competitorRecent },
    expected: 'Own site should not trail badly on authority-growth proxies',
    message: competitorVelocityProxy > ownVelocityProxy
      ? 'Competitor sample shows stronger recent authority-growth proxy signals than your site.'
      : 'Your site matches or exceeds the competitor sample on the current link-velocity proxy.',
    fixSuggestion: 'Replace this proxy with true historical backlink snapshots when backlink history is available.',
    auditModes: ['full', 'competitor_gap'], industries: ['all']
  };
};

export const competitorChecks: Record<string, CheckEvaluator> = {
  't4-comp-keyword-gap': checkCompKeywordGap,
  't4-comp-content-gap': checkCompContentGap,
  't4-comp-backlink-gap': checkCompBacklinkGap,
  't4-comp-tech-stack': checkCompTechStack,
  't4-comp-pricing': checkCompPricing,
  't4-comp-social': checkCompSocial,
  't4-comp-content-freq': checkCompContentFreq,
  't4-comp-link-velocity': checkCompLinkVelocity,
};
