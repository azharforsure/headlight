/**
 * ActionAssignment.ts
 *
 * Assigns technical and content actions to each page based on all available data.
 */

import {
  getExpectedCtr,
  estimateCtrImprovementClicks,
  estimatePositionImprovementClicks,
} from './ExpectedCtrCurve';
import type { DetectedIndustry } from './SiteTypeDetector';

export interface AssignedAction {
  action: string;
  reason: string;
  priority: number;
  estimatedImpact: number;
  effort: 'low' | 'medium' | 'high';
  category: 'technical' | 'content' | 'industry';
}

interface PageForAction {
  url: string;
  statusCode: number;
  indexable: boolean | null;
  inSitemap: boolean | null;
  redirectChainLength?: number;
  isRedirectLoop?: boolean;
  speedScore?: string;
  mixedContent?: boolean;
  sslValid?: boolean | null;
  inlinks: number;
  pageValueTier?: string;
  isDuplicate?: boolean;
  exactDuplicate?: boolean;
  isCannibalized?: boolean;
  hreflangNoReturn?: boolean;
  multipleCanonical?: boolean;
  canonicalChain?: boolean;
  gscImpressions: number | null;
  gscClicks: number | null;
  gscCtr: number | null;
  gscPosition: number | null;
  ctrGap?: number;
  ga4Sessions: number | null;
  isLosingTraffic: boolean | null;
  sessionsDeltaPct: number | null;
  ga4BounceRate: number | null;
  wordCount: number;
  eeatScore: number | null;
  readability?: string;
  visibleDate?: string;
  searchIntent: string | null;
  intentMatch?: string;
  schemaTypes: string[];
  backlinks: number | null;
  referringDomains: number | null;
  internalPageRank?: number;
  pageCategory?: string;
  isHtmlPage: boolean;
  industrySignals?: Record<string, any>;
  hasArticleSchema?: boolean;
  mainKeyword: string | null;
  hasFeaturedSnippetPatterns?: boolean;
}

interface SiteContextForAction {
  detectedIndustry: DetectedIndustry;
  detectedLanguage: string;
  totalPages: number;
  isMultiLanguage: boolean;
}

interface DecisionFactors {
  freshness: 'fresh' | 'aging' | 'stale' | 'ancient';
}

function computeDecisionFactors(page: PageForAction): DecisionFactors {
  return {
    freshness: !page.visibleDate
      ? 'fresh'
      : (() => {
          const date = new Date(page.visibleDate as string);
          if (Number.isNaN(date.getTime())) return 'fresh';
          const age = Date.now() - date.getTime();
          const months = age / (30 * 24 * 60 * 60 * 1000);
          if (months < 6) return 'fresh';
          if (months < 12) return 'aging';
          if (months < 24) return 'stale';
          return 'ancient';
        })(),
  };
}

function estimateActionImpact(page: PageForAction, actionType: string): number {
  const impressions = Number(page.gscImpressions || 0);
  const position = Number(page.gscPosition || 0);
  const sessions = Number(page.ga4Sessions || 0);
  const actualCtr = Number(page.gscCtr || 0);

  switch (actionType) {
    case 'Rewrite Title & Meta':
      return estimateCtrImprovementClicks(impressions, position, actualCtr);
    case 'Recover Declining Content': {
      const lost = Math.abs(Number(page.sessionsDeltaPct || 0)) * sessions;
      return Math.round(lost * 0.5);
    }
    case 'Restore Broken Page':
      return Math.round(impressions * 0.05);
    case 'Expand Thin Content':
      return estimatePositionImprovementClicks(impressions, position, 3);
    case 'Update Stale Content':
      return estimatePositionImprovementClicks(impressions, position, 2);
    case 'Unblock From Index':
      return Math.round(impressions * 0.02) || 10;
    case 'Add Schema':
      return Math.round(impressions * actualCtr * 0.3);
    case 'Fix Redirect Chain':
      return Math.round(impressions * 0.01);
    case 'Fix Canonical':
      return Math.round(impressions * 0.02);
    case 'Add to Sitemap':
      return Math.round(impressions * 0.01) || 5;
    default:
      return 0;
  }
}

export function assignTechnicalAction(page: PageForAction, ctx: SiteContextForAction): AssignedAction {
  const impressions = Number(page.gscImpressions || 0);
  const backlinks = Number(page.backlinks || 0);
  const sessions = Number(page.ga4Sessions || 0);

  if (!page.isHtmlPage) {
    return { action: 'Monitor', reason: 'Non-HTML resource.', priority: 99, estimatedImpact: 0, effort: 'low', category: 'technical' };
  }

  if (page.statusCode >= 500) {
    return {
      action: 'Fix Server Errors',
      reason: `Page returns ${page.statusCode}. Nothing else matters until this is fixed.`,
      priority: 1,
      estimatedImpact: estimateActionImpact(page, 'Restore Broken Page'),
      effort: 'medium',
      category: 'technical',
    };
  }

  if (page.statusCode >= 400 && (impressions > 50 || backlinks > 0 || sessions > 10)) {
    return {
      action: 'Restore Broken Page',
      reason: `${page.statusCode} page with measurable value. Redirect to the closest equivalent page to recover value.`,
      priority: 2,
      estimatedImpact: estimateActionImpact(page, 'Restore Broken Page'),
      effort: 'low',
      category: 'technical',
    };
  }

  if (page.statusCode >= 400) {
    return {
      action: 'Remove Dead Page',
      reason: `${page.statusCode} page with no traffic, impressions, or backlinks. Remove or redirect.`,
      priority: 3,
      estimatedImpact: 0,
      effort: 'low',
      category: 'technical',
    };
  }

  if (page.indexable === false && (impressions > 50 || sessions > 10 || Number(page.internalPageRank || 0) > 30)) {
    return {
      action: 'Unblock From Index',
      reason: 'Page has value but is not indexable. Check noindex, canonical, and robots.',
      priority: 4,
      estimatedImpact: estimateActionImpact(page, 'Unblock From Index'),
      effort: 'low',
      category: 'technical',
    };
  }

  if (page.isRedirectLoop || Number(page.redirectChainLength || 0) >= 3) {
    return {
      action: 'Fix Redirect Chain',
      reason: page.isRedirectLoop ? 'Redirect loop detected.' : `${page.redirectChainLength}-hop redirect chain detected.`,
      priority: 5,
      estimatedImpact: estimateActionImpact(page, 'Fix Redirect Chain'),
      effort: 'low',
      category: 'technical',
    };
  }

  if (page.multipleCanonical || page.canonicalChain) {
    return {
      action: 'Fix Canonical',
      reason: page.multipleCanonical ? 'Multiple canonical tags found.' : 'Canonical chain detected.',
      priority: 6,
      estimatedImpact: estimateActionImpact(page, 'Fix Canonical'),
      effort: 'low',
      category: 'technical',
    };
  }

  if (!page.inSitemap && page.indexable && page.statusCode === 200 && (impressions > 0 || page.inlinks > 3)) {
    return {
      action: 'Add to Sitemap',
      reason: 'Indexable page is not in sitemap.xml.',
      priority: 7,
      estimatedImpact: estimateActionImpact(page, 'Add to Sitemap'),
      effort: 'low',
      category: 'technical',
    };
  }

  if (page.speedScore === 'Poor' && (sessions > 50 || impressions > 500)) {
    return {
      action: 'Improve Speed',
      reason: `Page has meaningful traffic but poor speed (${page.speedScore}).`,
      priority: 8,
      estimatedImpact: Math.round(sessions * 0.05),
      effort: 'medium',
      category: 'technical',
    };
  }

  if (page.mixedContent || page.sslValid === false) {
    return {
      action: 'Fix Security',
      reason: page.mixedContent ? 'Mixed content detected.' : 'Invalid SSL certificate.',
      priority: 9,
      estimatedImpact: 0,
      effort: 'low',
      category: 'technical',
    };
  }

  if (page.inlinks <= 1 && (page.pageValueTier === '★★★' || page.pageValueTier === '★★')) {
    return {
      action: 'Add Internal Links',
      reason: `Valuable page (${page.pageValueTier}) has only ${page.inlinks} inlink(s).`,
      priority: 10,
      estimatedImpact: Math.round((impressions * 0.01) || 5),
      effort: 'low',
      category: 'technical',
    };
  }

  if ((page.isDuplicate || page.exactDuplicate) && impressions > 0) {
    return {
      action: 'Consolidate Duplicates',
      reason: 'Page appears duplicate and already earns impressions.',
      priority: 11,
      estimatedImpact: Math.round(impressions * 0.02),
      effort: 'medium',
      category: 'technical',
    };
  }

  if (page.hreflangNoReturn && ctx.isMultiLanguage) {
    return {
      action: 'Fix Hreflang',
      reason: 'Hreflang tags are not reciprocal.',
      priority: 12,
      estimatedImpact: 0,
      effort: 'low',
      category: 'technical',
    };
  }

  return {
    action: 'Monitor',
    reason: 'No technical issues found.',
    priority: 99,
    estimatedImpact: 0,
    effort: 'low',
    category: 'technical',
  };
}

export function assignContentAction(page: PageForAction, ctx: SiteContextForAction): AssignedAction {
  const factors = computeDecisionFactors(page);
  const impressions = Number(page.gscImpressions || 0);
  const position = Number(page.gscPosition || 0);
  const ctr = Number(page.gscCtr || 0);
  const sessions = Number(page.ga4Sessions || 0);
  const backlinks = Number(page.backlinks || 0);

  if (!page.isHtmlPage || page.statusCode >= 400) {
    return { action: 'No Action', reason: 'Non-content page.', priority: 99, estimatedImpact: 0, effort: 'low', category: 'content' };
  }

  if (impressions > 200 && Number(page.ctrGap || 0) < -0.02) {
    const expected = getExpectedCtr(position);
    return {
      action: 'Rewrite Title & Meta',
      reason: `${impressions.toLocaleString()} impressions but CTR is ${(ctr * 100).toFixed(1)}% (expected ${(expected * 100).toFixed(1)}% at position ${Math.round(position)}).`,
      priority: 1,
      estimatedImpact: estimateActionImpact(page, 'Rewrite Title & Meta'),
      effort: 'low',
      category: 'content',
    };
  }

  if (page.isLosingTraffic && impressions > 100) {
    const drop = Math.abs(Number(page.sessionsDeltaPct || 0) * 100);
    return {
      action: 'Recover Declining Content',
      reason: `Traffic dropped ${drop.toFixed(0)}%.`,
      priority: 2,
      estimatedImpact: estimateActionImpact(page, 'Recover Declining Content'),
      effort: 'medium',
      category: 'content',
    };
  }

  if (page.intentMatch === 'misaligned' && impressions > 50) {
    return {
      action: 'Fix Keyword Mismatch',
      reason: 'Page intent does not match the primary query intent.',
      priority: 3,
      estimatedImpact: estimatePositionImprovementClicks(impressions, position, 5),
      effort: 'medium',
      category: 'content',
    };
  }

  const thinThreshold = page.pageCategory === 'blog_post' ? 300 : page.pageCategory === 'product' ? 150 : 100;
  if (page.wordCount < thinThreshold && page.wordCount > 0 && (impressions > 50 || backlinks > 0)) {
    return {
      action: 'Expand Thin Content',
      reason: `Only ${page.wordCount} words with existing value signals.`,
      priority: 4,
      estimatedImpact: estimateActionImpact(page, 'Expand Thin Content'),
      effort: 'medium',
      category: 'content',
    };
  }

  if ((factors.freshness === 'stale' || factors.freshness === 'ancient') && position > 5 && position <= 30) {
    return {
      action: 'Update Stale Content',
      reason: `Content is ${factors.freshness} and currently ranks around position ${Math.round(position)}.`,
      priority: 5,
      estimatedImpact: estimateActionImpact(page, 'Update Stale Content'),
      effort: 'medium',
      category: 'content',
    };
  }

  if ((page.schemaTypes || []).length === 0 && page.statusCode === 200) {
    const schemaNeeded = getExpectedSchema(page.pageCategory || 'other', ctx.detectedIndustry);
    if (schemaNeeded) {
      return {
        action: 'Add Schema',
        reason: `No schema markup detected. Add ${schemaNeeded}.`,
        priority: 6,
        estimatedImpact: estimateActionImpact(page, 'Add Schema'),
        effort: 'low',
        category: 'content',
      };
    }
  }

  const isYmyl = ['healthcare', 'finance'].includes(ctx.detectedIndustry);
  if (Number(page.eeatScore ?? 100) < 40 && isYmyl) {
    return {
      action: 'Improve E-E-A-T',
      reason: `Low E-E-A-T score (${page.eeatScore || 0}) for a YMYL industry.`,
      priority: 3,
      estimatedImpact: estimatePositionImprovementClicks(impressions, position, 3),
      effort: 'medium',
      category: 'content',
    };
  }

  if (page.isCannibalized && position > 10) {
    return {
      action: 'Resolve Cannibalization',
      reason: `Multiple pages appear to target "${page.mainKeyword || 'same keyword'}".`,
      priority: 8,
      estimatedImpact: estimatePositionImprovementClicks(impressions, position, 4),
      effort: 'medium',
      category: 'content',
    };
  }

  if (position >= 2 && position <= 8 && !page.hasFeaturedSnippetPatterns) {
    return {
      action: 'Optimize for SERP Features',
      reason: `Ranking at position ${Math.round(position)} and close to snippet territory.`,
      priority: 9,
      estimatedImpact: estimatePositionImprovementClicks(impressions, position, 2),
      effort: 'low',
      category: 'content',
    };
  }

  if (page.readability === 'Difficult' && Number(page.ga4BounceRate || 0) > 0.7 && sessions > 20) {
    return {
      action: 'Improve Readability',
      reason: `Difficult readability with high bounce rate (${Math.round(Number(page.ga4BounceRate || 0) * 100)}%).`,
      priority: 10,
      estimatedImpact: Math.round(sessions * 0.1),
      effort: 'medium',
      category: 'content',
    };
  }

  if (page.wordCount < 50 && impressions === 0 && sessions === 0 && backlinks === 0 && page.inlinks <= 1) {
    return {
      action: 'Remove or Merge',
      reason: 'Minimal content and no value signals.',
      priority: 11,
      estimatedImpact: 0,
      effort: 'low',
      category: 'content',
    };
  }

  return {
    action: 'No Action',
    reason: 'Content metrics are healthy.',
    priority: 99,
    estimatedImpact: 0,
    effort: 'low',
    category: 'content',
  };
}

export function getIndustryActions(page: PageForAction, ctx: SiteContextForAction): AssignedAction[] {
  const actions: AssignedAction[] = [];
  const ind = ctx.detectedIndustry;

  if (ind === 'ecommerce') {
    if (page.pageCategory === 'product' && !(page.schemaTypes || []).includes('Product')) {
      actions.push({
        action: 'Add Product Schema',
        reason: 'Product page lacks Product/Offer schema.',
        priority: 6,
        estimatedImpact: Math.round(Number(page.gscImpressions || 0) * 0.03),
        effort: 'low',
        category: 'industry',
      });
    }
    if (page.industrySignals?.priceVisible === false && page.pageCategory === 'product') {
      actions.push({
        action: 'Add Visible Price',
        reason: 'Product page appears to hide price.',
        priority: 8,
        estimatedImpact: 0,
        effort: 'low',
        category: 'industry',
      });
    }
  }

  if (ind === 'news' || ind === 'blog') {
    if (page.pageCategory === 'blog_post' && !page.hasArticleSchema) {
      actions.push({
        action: 'Add Article Schema',
        reason: 'Article-like page without Article/NewsArticle schema.',
        priority: 6,
        estimatedImpact: Math.round(Number(page.gscImpressions || 0) * 0.02),
        effort: 'low',
        category: 'industry',
      });
    }
    if (page.pageCategory === 'blog_post' && !page.visibleDate) {
      actions.push({
        action: 'Add Publish Date',
        reason: 'Article-like page has no visible publish date.',
        priority: 7,
        estimatedImpact: 0,
        effort: 'low',
        category: 'industry',
      });
    }
  }

  if (ind === 'local') {
    if (page.pageCategory === 'homepage' && !page.industrySignals?.hasLocalBusinessSchema) {
      actions.push({
        action: 'Add Local Schema',
        reason: 'Homepage is missing LocalBusiness schema.',
        priority: 6,
        estimatedImpact: 0,
        effort: 'low',
        category: 'industry',
      });
    }
  }

  if (ind === 'healthcare') {
    if (page.pageCategory === 'blog_post' && !page.industrySignals?.hasMedicalAuthor) {
      actions.push({
        action: 'Add Medical Author',
        reason: 'Healthcare content lacks medical author credentials.',
        priority: 3,
        estimatedImpact: estimatePositionImprovementClicks(Number(page.gscImpressions || 0), Number(page.gscPosition || 0), 3),
        effort: 'medium',
        category: 'industry',
      });
    }
  }

  return actions;
}

function getExpectedSchema(pageCategory: string, industry: DetectedIndustry): string | null {
  const map: Record<string, string> = {
    product: 'Product',
    blog_post: industry === 'news' ? 'NewsArticle' : 'Article',
    faq: 'FAQPage',
    homepage: industry === 'local' ? 'LocalBusiness' : 'Organization',
    location_page: 'LocalBusiness',
    category: 'CollectionPage',
    service_page: 'Service',
  };

  return map[pageCategory] || null;
}
