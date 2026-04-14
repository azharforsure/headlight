import type { DetectedIndustry } from './SiteTypeDetector';
import type { WqaActionGroup, WqaSiteStats } from './WebsiteQualityModeTypes';
import { scoreToGrade } from './WebsiteQualityModeTypes';

function asNum(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function clamp100(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function speedToScore(speed: any): number {
  const v = String(speed || '').toLowerCase();
  if (v === 'good') return 100;
  if (v === 'needs work') return 60;
  if (v === 'poor') return 25;
  return 80;
}

export function computeWqaSiteStats(pages: any[], industry: DetectedIndustry): WqaSiteStats {
  const totalPages = pages.length;
  const htmlPages = pages.filter((p) => p.isHtmlPage && asNum(p.statusCode) === 200);
  const htmlCount = htmlPages.length;

  const indexedPages = htmlPages.filter((p) => p.indexable !== false).length;
  const sitemapPages = pages.filter((p) => p.inSitemap).length;

  const totalImpressions = pages.reduce((s, p) => s + asNum(p.gscImpressions), 0);
  const totalClicks = pages.reduce((s, p) => s + asNum(p.gscClicks), 0);
  const totalSessions = pages.reduce((s, p) => s + asNum(p.ga4Sessions), 0);

  const posPages = pages.filter((p) => asNum(p.gscPosition) > 0);
  const avgPosition = avg(posPages.map((p) => asNum(p.gscPosition)));

  const totalRevenue = pages.reduce((s, p) => s + asNum(p.ga4Revenue || p.ga4EcommerceRevenue), 0);
  const totalTransactions = pages.reduce((s, p) => s + asNum(p.ga4Transactions), 0);
  const totalGoalCompletions = pages.reduce((s, p) => s + asNum(p.ga4GoalCompletions || p.ga4Conversions), 0);
  const totalPageviews = pages.reduce((s, p) => s + asNum(p.ga4Views), 0);
  const totalSubscribers = pages.reduce((s, p) => s + asNum(p.ga4Subscribers || p.ga4Conversions), 0);

  const dupCount = pages.filter((p) => p.exactDuplicate || p.isDuplicate || asNum(p.noNearDuplicates) > 0).length;
  const orphanCount = htmlPages.filter((p) => asNum(p.inlinks) === 0).length;
  const thinCount = htmlPages.filter((p) => asNum(p.wordCount) > 0 && asNum(p.wordCount) < 150).length;
  const brokenCount = pages.filter((p) => asNum(p.statusCode) >= 400).length;
  const schemaCount = htmlPages.filter((p) => Array.isArray(p.schemaTypes) && p.schemaTypes.length > 0).length;
  const indexedInSitemap = htmlPages.filter((p) => p.indexable !== false && p.inSitemap).length;

  const healthValues = htmlPages.map((p) => asNum(p.healthScore)).filter((v) => v > 0);
  const contentValues = htmlPages.map((p) => asNum(p.contentQualityScore)).filter((v) => v > 0);
  const eeatValues = htmlPages.map((p) => asNum(p.eeatScore)).filter((v) => v > 0);
  const speedValues = htmlPages.map((p) => speedToScore(p.speedScore));

  const avgHealthScore = avg(healthValues);
  const avgContentQuality = avg(contentValues);
  const avgSpeedScore = avg(speedValues);
  const avgEeat = avg(eeatValues);

  const duplicateRate = totalPages > 0 ? (dupCount / totalPages) * 100 : 0;
  const orphanRate = htmlCount > 0 ? (orphanCount / htmlCount) * 100 : 0;
  const thinContentRate = htmlCount > 0 ? (thinCount / htmlCount) * 100 : 0;
  const brokenRate = totalPages > 0 ? (brokenCount / totalPages) * 100 : 0;
  const schemaCoverage = htmlCount > 0 ? (schemaCount / htmlCount) * 100 : 0;
  const sitemapCoverage = indexedPages > 0 ? (indexedInSitemap / indexedPages) * 100 : 0;

  const authorityMean = avg(htmlPages.map((p) => clamp100(asNum(p.referringDomains) * 5 + asNum(p.backlinks) * 0.25)));
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const searchPerf = clamp100(ctr * 8 + (avgPosition > 0 ? Math.max(0, 100 - avgPosition * 2.5) : 0));
  const ux = clamp100(avgSpeedScore * 0.7 + clamp100(100 - avg(htmlPages.map((p) => asNum(p.ga4BounceRate) * 100))) * 0.3);
  const trust = clamp100((avgEeat || 50) * 0.65 + (100 - duplicateRate) * 0.35);

  const highValuePages = pages.filter((p) => p.pageValueTier === '★★★').length;
  const mediumValuePages = pages.filter((p) => p.pageValueTier === '★★').length;
  const lowValuePages = pages.filter((p) => p.pageValueTier === '★').length;
  const zeroValuePages = pages.filter((p) => p.pageValueTier === '☆' || p.pageValueTier == null).length;

  const pagesWithTechAction = pages.filter((p) => p.technicalAction && p.technicalAction !== 'Monitor').length;
  const pagesWithContentAction = pages.filter((p) => p.contentAction && p.contentAction !== 'No Action').length;
  const pagesNoAction = pages.filter((p) => (p.technicalAction === 'Monitor' || !p.technicalAction) && (p.contentAction === 'No Action' || !p.contentAction)).length;
  const totalEstimatedImpact = pages.reduce((s, p) => s + asNum(p.estimatedImpact), 0);

  let industryStats: WqaSiteStats['industryStats'] = null;
  if (htmlCount > 0) {
    if (industry === 'ecommerce') {
      const products = htmlPages.filter((p) => p.pageCategory === 'product');
      const productCount = products.length || 1;
      industryStats = {
        productSchemaCoverage: (products.filter((p) => (p.schemaTypes || []).includes('Product')).length / productCount) * 100,
        reviewSchemaCoverage: (products.filter((p) => (p.schemaTypes || []).includes('Review')).length / productCount) * 100,
        breadcrumbCoverage: (products.filter((p) => (p.schemaTypes || []).includes('BreadcrumbList')).length / productCount) * 100,
        outOfStockIndexed: products.filter((p) => p.industrySignals?.outOfStock && p.indexable !== false).length,
      };
    } else if (industry === 'news' || industry === 'blog') {
      const posts = htmlPages.filter((p) => p.pageCategory === 'blog_post');
      const postCount = posts.length || 1;
      industryStats = {
        articleSchemaCoverage: (posts.filter((p) => p.hasArticleSchema || (p.schemaTypes || []).includes('Article') || (p.schemaTypes || []).includes('NewsArticle')).length / postCount) * 100,
        authorAttributionRate: (posts.filter((p) => p.industrySignals?.hasAuthorAttribution).length / postCount) * 100,
        publishDateRate: (posts.filter((p) => !!p.visibleDate).length / postCount) * 100,
      };
    } else if (industry === 'local') {
      industryStats = {
        hasLocalSchema: htmlPages.some((p) => p.industrySignals?.hasLocalBusinessSchema),
        napConsistent: htmlPages.some((p) => p.industrySignals?.hasNapOnPage),
        hasGmbLink: htmlPages.some((p) => p.industrySignals?.hasGmbLink),
        serviceAreaPageCount: htmlPages.filter((p) => p.pageCategory === 'location_page').length,
        hasEmbeddedMap: htmlPages.some((p) => p.hasEmbeddedMap),
      };
    } else if (industry === 'saas') {
      industryStats = {
        hasPricingPage: htmlPages.some((p) => p.hasPricingPage || String(p.url || '').toLowerCase().includes('/pricing')),
        hasDocsSection: htmlPages.some((p) => String(p.url || '').toLowerCase().includes('/doc')),
        hasChangelog: htmlPages.some((p) => String(p.url || '').toLowerCase().includes('/changelog')),
        hasStatusPage: htmlPages.some((p) => String(p.url || '').toLowerCase().includes('/status')),
        hasComparisonPages: htmlPages.some((p) => /\/vs\b|\/alternative/i.test(String(p.url || '').toLowerCase())),
      };
    } else if (industry === 'healthcare') {
      const posts = htmlPages.filter((p) => p.pageCategory === 'blog_post');
      const postCount = posts.length || 1;
      industryStats = {
        medicalAuthorRate: (posts.filter((p) => p.industrySignals?.hasMedicalAuthor).length / postCount) * 100,
        medicalReviewRate: (posts.filter((p) => p.industrySignals?.hasMedicalReviewer).length / postCount) * 100,
        medicalDisclaimerRate: (posts.filter((p) => p.industrySignals?.hasMedicalDisclaimer).length / postCount) * 100,
      };
    } else if (industry === 'finance') {
      const posts = htmlPages.filter((p) => p.pageCategory === 'blog_post');
      const postCount = posts.length || 1;
      industryStats = {
        financialDisclaimerRate: (posts.filter((p) => p.industrySignals?.hasFinancialDisclaimer).length / postCount) * 100,
        authorCredentialsRate: (posts.filter((p) => p.industrySignals?.hasAuthorCredentials).length / postCount) * 100,
      };
    }
  }

  return {
    totalPages,
    indexedPages,
    sitemapPages,
    htmlPages: htmlCount,
    totalImpressions,
    totalClicks,
    totalSessions,
    avgPosition,
    totalRevenue,
    totalTransactions,
    totalGoalCompletions,
    totalPageviews,
    totalSubscribers,
    duplicateRate,
    orphanRate,
    thinContentRate,
    brokenRate,
    schemaCoverage,
    sitemapCoverage,
    avgHealthScore,
    avgContentQuality,
    avgSpeedScore,
    avgEeat,
    radarContent: Math.round(clamp100((avgContentQuality || 50) * 0.7 + (100 - thinContentRate) * 0.3)),
    radarSeo: Math.round(clamp100(schemaCoverage * 0.35 + sitemapCoverage * 0.35 + (100 - brokenRate) * 0.3)),
    radarAuthority: Math.round(clamp100(authorityMean)),
    radarUx: Math.round(clamp100(ux)),
    radarSearchPerf: Math.round(clamp100(searchPerf)),
    radarTrust: Math.round(clamp100(trust)),
    highValuePages,
    mediumValuePages,
    lowValuePages,
    zeroValuePages,
    pagesWithTechAction,
    pagesWithContentAction,
    pagesNoAction,
    totalEstimatedImpact,
    industryStats,
  };
}

const EFFORT_BY_ACTION: Record<string, 'low' | 'medium' | 'high'> = {
  'Fix Server Errors': 'medium',
  'Restore Broken Page': 'low',
  'Fix Redirect Chain': 'low',
  'Fix Canonical': 'low',
  'Consolidate Duplicates': 'medium',
  'Improve Speed': 'medium',
  'Recover Declining Content': 'medium',
  'Expand Thin Content': 'medium',
  'Update Stale Content': 'medium',
  'Improve E-E-A-T': 'medium',
};

export function computeWqaActionGroups(pages: any[]): WqaActionGroup[] {
  type Bucket = {
    action: string;
    category: 'technical' | 'content' | 'industry';
    count: number;
    impact: number;
    priorityTotal: number;
    reason?: string;
    pages: WqaActionGroup['pages'];
  };

  const buckets = new Map<string, Bucket>();

  const ingest = (page: any, action: string, category: 'technical' | 'content' | 'industry', reason?: string) => {
    if (!action) return;
    if ((category === 'technical' && action === 'Monitor') || (category === 'content' && action === 'No Action')) return;
    const key = `${category}:${action}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        action,
        category,
        count: 0,
        impact: 0,
        priorityTotal: 0,
        reason,
        pages: [],
      });
    }

    const bucket = buckets.get(key)!;
    bucket.count += 1;
    bucket.impact += asNum(page.estimatedImpact);
    bucket.priorityTotal += asNum(page.actionPriority) || 99;
    if (!bucket.reason && reason) bucket.reason = reason;
    bucket.pages.push({
      url: String(page.url || ''),
      pagePath: String(page.pagePath || page.url || ''),
      pageCategory: String(page.pageCategory || 'other'),
      impressions: asNum(page.gscImpressions),
      clicks: asNum(page.gscClicks),
      sessions: asNum(page.ga4Sessions),
      position: asNum(page.gscPosition),
      ctr: asNum(page.gscCtr),
      estimatedImpact: asNum(page.estimatedImpact),
      currentTitle: page.title || undefined,
      currentMeta: page.metaDesc || undefined,
      backlinks: asNum(page.backlinks) || undefined,
      lastModified: page.lastModified || page.visibleDate || undefined,
    });
  };

  for (const page of pages) {
    ingest(page, String(page.technicalAction || ''), 'technical', page.technicalActionReason || undefined);
    ingest(page, String(page.contentAction || ''), 'content', page.contentActionReason || undefined);
  }

  return Array.from(buckets.values())
    .map((bucket) => ({
      action: bucket.action,
      category: bucket.category,
      pageCount: bucket.count,
      totalEstimatedImpact: Math.round(bucket.impact),
      avgPriority: bucket.count > 0 ? Math.round(bucket.priorityTotal / bucket.count) : 99,
      reason: bucket.reason || 'Action recommended for this group of pages.',
      effort: EFFORT_BY_ACTION[bucket.action] || 'low',
      pages: bucket.pages
        .sort((a, b) => b.estimatedImpact - a.estimatedImpact)
        .slice(0, 200),
    }))
    .sort((a, b) => b.totalEstimatedImpact - a.totalEstimatedImpact);
}

export function deriveWqaScore(stats: WqaSiteStats): { score: number; grade: string } {
  const score = Math.round(
    clamp100(
      stats.radarContent * 0.2 +
      stats.radarSeo * 0.2 +
      stats.radarAuthority * 0.15 +
      stats.radarUx * 0.15 +
      stats.radarSearchPerf * 0.2 +
      stats.radarTrust * 0.1
    )
  );

  return { score, grade: scoreToGrade(score) };
}
