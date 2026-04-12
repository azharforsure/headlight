import { CheckEvaluator } from '../types';

const rootOnly = (page: any) => Number(page?.crawlDepth || 0) === 0;

const safeParseJson = (raw: string | null) => {
  try {
    return JSON.parse(String(raw || '[]'));
  } catch {
    return [];
  }
};

const readProjectMentions = (projectId?: string) => {
  if (!projectId || typeof window === 'undefined') return [];
  return safeParseJson(window.localStorage.getItem(`headlight:data:brand_mentions:${projectId}`));
};

const getProjectId = (page: any, ctx?: any) =>
  String(ctx?.projectId || page?.projectId || '').trim() || undefined;

const extractAggregateRating = (page: any) => {
  const schemaBlocks = Array.isArray(page?.schema) ? page.schema : [];
  for (const block of schemaBlocks) {
    const aggregate = block?.aggregateRating || (block?.['@type'] === 'AggregateRating' ? block : null);
    if (!aggregate) continue;
    const ratingValue = Number(aggregate.ratingValue || aggregate.rating || 0);
    const reviewCount = Number(aggregate.reviewCount || aggregate.ratingCount || 0);
    return {
      ratingValue: Number.isFinite(ratingValue) && ratingValue > 0 ? ratingValue : null,
      reviewCount: Number.isFinite(reviewCount) && reviewCount > 0 ? reviewCount : null
    };
  }
  return { ratingValue: null, reviewCount: null };
};

const getCitationDirectoryCount = (page: any, ctx?: any) =>
  (ctx?.allPages || []).reduce((max: number, current: any) => {
    const count = Number(current?.industrySignals?.directoryLinks || 0);
    return Math.max(max, count);
  }, Number(page?.industrySignals?.directoryLinks || 0));

const normalizePhone = (value: string) => String(value || '').replace(/[^\d+]/g, '');

export const checkCitationNAP: CheckEvaluator = (page, ctx) => {
  if (!rootOnly(page)) return null;

  const phones = Array.isArray(page?.phoneNumbers) ? page.phoneNumbers.map(normalizePhone).filter(Boolean) : [];
  const gbpPhone = page?.gbpPhone ? normalizePhone(page.gbpPhone) : '';
  const hasAddress = Boolean(page?.hasPostalAddress || page?.gbpAddress);
  const hasName = Boolean(page?.gbpName || page?.title);
  const napSignals = [hasName, hasAddress, Boolean(phones.length || gbpPhone)].filter(Boolean).length;
  const phoneConsistent = gbpPhone ? phones.includes(gbpPhone) || phones.length === 0 : null;
  const napConsistent = gbpPhone ? Boolean(phoneConsistent && hasAddress) : napSignals >= 2;
  const severity = napConsistent ? 'pass' : napSignals >= 1 ? 'info' : 'warning';

  return {
    checkId: 't4-citation-nap',
    tier: 4, category: 'citations', name: 'Citation NAP Consistency',
    severity,
    value: { napSignals, phoneConsistent, hasAddress, hasName },
    expected: 'Name, address, and phone should be present and consistent with business listings',
    message: napConsistent
      ? 'NAP signals look consistent across on-page and business-profile data.'
      : napSignals >= 1
        ? 'Partial NAP signals found, but consistency is incomplete.'
        : 'No reliable NAP consistency signal found.',
    auditModes: ['full', 'local_seo'], industries: ['all']
  };
};

export const checkCitationCount: CheckEvaluator = (page, ctx) => {
  if (!rootOnly(page)) return null;
  const count = getCitationDirectoryCount(page, ctx) + (page?.gbpName ? 1 : 0);
  const severity = count >= 4 ? 'pass' : count >= 1 ? 'info' : 'warning';

  return {
    checkId: 't4-citation-count',
    tier: 4, category: 'citations', name: 'Citation Coverage',
    severity,
    value: { citationCount: count },
    expected: 'Core directory/listing coverage should exist for the business',
    message: count > 0
      ? `${count} citation or listing signals detected across GBP and directory links.`
      : 'No clear citation coverage signals detected.',
    auditModes: ['full', 'local_seo'], industries: ['all']
  };
};

export const checkReviewScore: CheckEvaluator = (page) => {
  if (!rootOnly(page)) return null;
  const aggregate = extractAggregateRating(page);
  const rating = Number(page?.gbpAvgRating || aggregate.ratingValue || 0);
  const severity = rating >= 4.2 ? 'pass' : rating >= 3.5 ? 'info' : rating > 0 ? 'warning' : 'info';

  return {
    checkId: 't4-review-score',
    tier: 4, category: 'citations', name: 'Review Rating',
    severity,
    value: { rating: rating || null },
    expected: 'Average rating should be strong and clearly surfaced',
    message: rating > 0
      ? `Average review rating is ${rating.toFixed(1)}.`
      : 'No review rating data was found in GBP enrichment or schema.',
    auditModes: ['full', 'local_seo', 'website_quality'], industries: ['all']
  };
};

export const checkReviewVolume: CheckEvaluator = (page) => {
  if (!rootOnly(page)) return null;
  const aggregate = extractAggregateRating(page);
  const reviewCount = Number(page?.gbpReviewCount || aggregate.reviewCount || 0);
  const severity = reviewCount >= 25 ? 'pass' : reviewCount >= 5 ? 'info' : reviewCount > 0 ? 'warning' : 'info';

  return {
    checkId: 't4-review-volume',
    tier: 4, category: 'citations', name: 'Review Volume',
    severity,
    value: { reviewCount: reviewCount || null },
    expected: 'Review count should be meaningful enough to build trust',
    message: reviewCount > 0
      ? `${reviewCount} reviews detected from GBP enrichment or schema.`
      : 'No review-count data was found.',
    auditModes: ['full', 'local_seo', 'website_quality'], industries: ['all']
  };
};

export const checkReviewRecency: CheckEvaluator = (page) => {
  if (!rootOnly(page)) return null;
  const reviewCount = Number(page?.gbpReviewCount || extractAggregateRating(page).reviewCount || 0);
  const freshestSignal = Number(page?.gbpEnrichedAt || 0);
  const ageDays = freshestSignal > 0 ? Math.floor((Date.now() - freshestSignal) / (24 * 60 * 60 * 1000)) : null;
  const severity = reviewCount === 0
    ? 'info'
    : ageDays === null
      ? 'info'
      : ageDays <= 30
        ? 'pass'
        : ageDays <= 90
          ? 'info'
          : 'warning';

  return {
    checkId: 't4-review-recency',
    tier: 4, category: 'citations', name: 'Review Recency',
    severity,
    value: { ageDays, proxy: 'gbpEnrichedAt' },
    expected: 'Recent review data should be available and refreshed regularly',
    message: reviewCount === 0
      ? 'No review dataset available to assess recency.'
      : ageDays === null
        ? 'Review data exists, but no timestamp proxy is available for recency.'
        : `Review freshness proxy is ${ageDays} days old based on the latest GBP enrichment sync.`,
    fixSuggestion: 'Store actual review timestamps when GBP reviews are ingested to upgrade this from a proxy signal.',
    auditModes: ['full', 'local_seo'], industries: ['all']
  };
};

export const checkBrandMentions: CheckEvaluator = (page, ctx) => {
  if (!rootOnly(page)) return null;
  const projectId = getProjectId(page, ctx);
  const mentions = readProjectMentions(projectId);
  const linkable = mentions.filter((item: any) => item?.is_linkable);
  const severity = linkable.length > 0 ? 'pass' : mentions.length > 0 ? 'info' : 'info';

  return {
    checkId: 't4-brand-mentions',
    tier: 4, category: 'citations', name: 'Unlinked Brand Mentions',
    severity,
    value: {
      totalMentions: mentions.length,
      linkableMentions: linkable.length,
      sampleSources: mentions.slice(0, 5).map((item: any) => item?.source).filter(Boolean)
    },
    expected: 'Track and reclaim unlinked brand mentions where possible',
    message: projectId
      ? (mentions.length > 0
          ? `${mentions.length} tracked brand mentions found, ${linkable.length} marked linkable.`
          : 'No tracked brand mentions found for this project.')
      : 'Brand mention data is not available in the current check context.',
    auditModes: ['full', 'off_page'], industries: ['all']
  };
};

export const citationChecks: Record<string, CheckEvaluator> = {
  't4-citation-nap': checkCitationNAP,
  't4-citation-count': checkCitationCount,
  't4-review-score': checkReviewScore,
  't4-review-volume': checkReviewVolume,
  't4-review-recency': checkReviewRecency,
  't4-brand-mentions': checkBrandMentions,
};
