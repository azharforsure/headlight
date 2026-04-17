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
import { DataAvailability } from './DataAvailability';


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
  hasFaqSchema?: boolean;             // NEW: FAQPage schema present
  mainKeyword: string | null;
  hasFeaturedSnippetPatterns?: boolean;
  selfContainedAnswers?: number;      // NEW: count of Q&A answer units on page
  contentDecayRisk?: number;          // NEW
  // NEW: Sprint B
  napSnapshot?: { phones: string[]; address: string; hasMap: boolean };
  napMatchWithHomepage?: boolean;
  napHasDistinctAddress?: boolean;
  inNewsSitemap?: boolean;
}

interface SiteContextForAction {
  detectedIndustry: DetectedIndustry;
  detectedLanguage: string;
  totalPages: number;
  isMultiLanguage: boolean;
  availability: DataAvailability;
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
    case 'Add FAQ Schema':                                                    // NEW
      return Math.round(impressions * actualCtr * 0.4);
    case 'Fix Redirect Chain':
      return Math.round(impressions * 0.01);
    case 'Fix Canonical':
      return Math.round(impressions * 0.02);
    case 'Add to Sitemap':
      return Math.round(impressions * 0.01) || 5;
    case 'Fix Navigation Structure':                                          // NEW
      return Math.round(impressions * 0.03) || 5;
    case 'Acquire Backlinks':                                                 // NEW
      return estimatePositionImprovementClicks(impressions, position, 4);
    case 'Fix NAP Consistency':                                               // NEW
      return estimatePositionImprovementClicks(impressions, position, 1);
    case 'Add Listing Schema':                                                // NEW
      return Math.round(impressions * actualCtr * 0.25);
    case 'Add Menu Schema':                                                   // NEW
      return Math.round(impressions * actualCtr * 0.5);
    default:
      return 0;
  }
}

export function assignTechnicalAction(page: PageForAction, ctx: SiteContextForAction): AssignedAction {
  if (!page.isHtmlPage) {
    return {
      action: 'Monitor',
      reason: 'Non-HTML resource.',
      priority: 99,
      estimatedImpact: 0,
      effort: 'low',
      category: 'technical',
    };
  }

  const candidates: AssignedAction[] = [];
  const impressions = Number(page.gscImpressions || 0);
  const backlinks = Number(page.backlinks || 0);
  const sessions = Number(page.ga4Sessions || 0);

  if (page.statusCode >= 500) {
    candidates.push({
      action: 'Fix Server Errors',
      reason: `Page returns ${page.statusCode}. Nothing else matters until this is fixed.`,
      priority: 1,
      estimatedImpact: estimateActionImpact(page, 'Restore Broken Page'),
      effort: 'medium',
      category: 'technical',
    });
  }

  if (page.statusCode >= 400 && (impressions > 50 || backlinks > 0 || sessions > 10)) {
    candidates.push({
      action: 'Restore Broken Page',
      reason: `${page.statusCode} page with measurable value. Redirect to the closest equivalent page to recover value.`,
      priority: 2,
      estimatedImpact: estimateActionImpact(page, 'Restore Broken Page'),
      effort: 'low',
      category: 'technical',
    });
  }

  if (page.statusCode >= 400) {
    candidates.push({
      action: 'Remove Dead Page',
      reason: `${page.statusCode} page with no traffic, impressions, or backlinks. Remove or redirect.`,
      priority: 3,
      estimatedImpact: 0,
      effort: 'low',
      category: 'technical',
    });
  }

  if (page.indexable === false && (impressions > 50 || sessions > 10 || Number(page.internalPageRank || 0) > 30)) {
    candidates.push({
      action: 'Unblock From Index',
      reason: 'Page has value but is not indexable. Check noindex, canonical, and robots.',
      priority: 4,
      estimatedImpact: estimateActionImpact(page, 'Unblock From Index'),
      effort: 'low',
      category: 'technical',
    });
  }

  if (page.isRedirectLoop || Number(page.redirectChainLength || 0) >= 3) {
    candidates.push({
      action: 'Fix Redirect Chain',
      reason: page.isRedirectLoop
        ? 'Redirect loop detected.'
        : `${page.redirectChainLength}-hop redirect chain detected.`,
      priority: 5,
      estimatedImpact: estimateActionImpact(page, 'Fix Redirect Chain'),
      effort: 'low',
      category: 'technical',
    });
  }

  if (page.multipleCanonical || page.canonicalChain) {
    candidates.push({
      action: 'Fix Canonical',
      reason: page.multipleCanonical
        ? 'Multiple canonical tags found.'
        : 'Canonical chain detected.',
      priority: 6,
      estimatedImpact: estimateActionImpact(page, 'Fix Canonical'),
      effort: 'low',
      category: 'technical',
    });
  }

  if (!page.inSitemap && page.indexable && page.statusCode === 200 && (impressions > 0 || page.inlinks > 3)) {
    candidates.push({
      action: 'Add to Sitemap',
      reason: 'Indexable page is not in sitemap.xml.',
      priority: 7,
      estimatedImpact: estimateActionImpact(page, 'Add to Sitemap'),
      effort: 'low',
      category: 'technical',
    });
  }

  if (page.speedScore === 'Poor' && (sessions > 50 || impressions > 500)) {
    candidates.push({
      action: 'Improve Speed',
      reason: `Page has meaningful traffic but poor speed.`,
      priority: 8,
      estimatedImpact: Math.round(sessions * 0.05),
      effort: 'medium',
      category: 'technical',
    });
  }

  if (page.mixedContent || page.sslValid === false) {
    candidates.push({
      action: 'Fix Security',
      reason: page.mixedContent ? 'Mixed content detected.' : 'Invalid SSL certificate.',
      priority: 9,
      estimatedImpact: 0,
      effort: 'low',
      category: 'technical',
    });
  }

  if (page.inlinks <= 1 && (page.pageValueTier === '★★★' || page.pageValueTier === '★★')) {
    candidates.push({
      action: 'Add Internal Links',
      reason: `Valuable page (${page.pageValueTier}) has only ${page.inlinks} inlink(s). Increase internal link support.`,
      priority: 10,
      estimatedImpact: Math.round((impressions * 0.01) || 5),
      effort: 'low',
      category: 'technical',
    });
  }

  if (page.inlinks === 0 && Number(page.crawlDepth || 0) > 0 && (impressions > 50 || sessions > 20)) {
    candidates.push({
      action: 'Fix Navigation Structure',
      reason: `Page earns ${impressions > 0 ? `${impressions} impressions` : `${sessions} sessions`} but has zero internal links pointing to it. It's invisible to crawlers navigating the site.`,
      priority: 11,
      estimatedImpact: estimateActionImpact(page, 'Fix Navigation Structure'),
      effort: 'low',
      category: 'technical',
    });
  }

  if ((page.isDuplicate || page.exactDuplicate) && impressions > 0) {
    candidates.push({
      action: 'Consolidate Duplicates',
      reason: 'Page appears duplicate and already earns impressions.',
      priority: 12,
      estimatedImpact: Math.round(impressions * 0.02),
      effort: 'medium',
      category: 'technical',
    });
  }

  if (page.hreflangNoReturn && ctx.isMultiLanguage) {
    candidates.push({
      action: 'Fix Hreflang',
      reason: 'Hreflang tags are not reciprocal.',
      priority: 13,
      estimatedImpact: 0,
      effort: 'low',
      category: 'technical',
    });
  }

  return candidates.sort((a, b) => a.priority - b.priority)[0] ?? {
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
  const referringDomains = Number(page.referringDomains || 0);
  const ipr = Number(page.internalPageRank || 0);

  if (!page.isHtmlPage || page.statusCode >= 400) {
    return {
      action: 'No Action',
      reason: 'Non-content page.',
      priority: 99,
      estimatedImpact: 0,
      effort: 'low',
      category: 'content',
    };
  }

  const candidates: AssignedAction[] = [];

  if (ctx.availability.gsc && impressions > 200 && Number(page.ctrGap || 0) < -0.02) {
    const expected = getExpectedCtr(position);
    candidates.push({
      action: 'Rewrite Title & Meta',
      reason: `${impressions.toLocaleString()} impressions but CTR is ${(ctr * 100).toFixed(1)}% (expected ${(expected * 100).toFixed(1)}% at position ${Math.round(position)}).`,
      priority: 1,
      estimatedImpact: estimateActionImpact(page, 'Rewrite Title & Meta'),
      effort: 'low',
      category: 'content',
    });
  }

  if (!ctx.availability.gsc && page.wordCount > 300 && (!page.title || page.title.length < 30)) {
    candidates.push({
      action: 'Rewrite Title & Meta',
      reason: 'Title is missing or unusually short. Without GSC data, this is the strongest available signal for CTR improvement.',
      priority: 1,
      estimatedImpact: 0,
      effort: 'low',
      category: 'content',
    });
  }

  if ((page.isLosingTraffic || (page.contentDecayRisk || 0) > 40) && impressions > 100) {
    const reason = page.isLosingTraffic 
      ? `Traffic dropped ${Math.abs(Number(page.sessionsDeltaPct || 0) * 100).toFixed(0)}%.` 
      : `Content decay risk is high (${Math.round(page.contentDecayRisk || 0)}%).`;
    candidates.push({
      action: 'Recover Declining Content',
      reason: `${reason} Review for keyword shifts or content decay.`,
      priority: 2,
      estimatedImpact: estimateActionImpact(page, 'Recover Declining Content'),
      effort: 'medium',
      category: 'content',
    });
  }

  if (page.intentMatch === 'misaligned' && impressions > 50) {
    candidates.push({
      action: 'Fix Keyword Mismatch',
      reason: 'Page intent does not match the primary query intent. Restructure the content to align with what searchers expect.',
      priority: 3,
      estimatedImpact: estimatePositionImprovementClicks(impressions, position, 5),
      effort: 'medium',
      category: 'content',
    });
  }

  const thinThreshold = page.pageCategory === 'blog_post' ? 300 : page.pageCategory === 'product' ? 150 : 100;
  if (page.wordCount < thinThreshold && page.wordCount > 0 && (impressions > 50 || backlinks > 0)) {
    candidates.push({
      action: 'Expand Thin Content',
      reason: `Only ${page.wordCount} words with existing value signals.`,
      priority: 4,
      estimatedImpact: estimateActionImpact(page, 'Expand Thin Content'),
      effort: 'medium',
      category: 'content',
    });
  }

  if ((factors.freshness === 'stale' || factors.freshness === 'ancient') && position > 5 && position <= 30) {
    candidates.push({
      action: 'Update Stale Content',
      reason: `Content is ${factors.freshness} and currently ranks around position ${Math.round(position)}. A freshness update could recover rankings.`,
      priority: 5,
      estimatedImpact: estimateActionImpact(page, 'Update Stale Content'),
      effort: 'medium',
      category: 'content',
    });
  }

  if ((page.schemaTypes || []).length === 0 && page.statusCode === 200) {
    const schemaNeeded = getExpectedSchema(page.pageCategory || 'other', ctx.detectedIndustry);
    if (schemaNeeded) {
      candidates.push({
        action: 'Add Schema',
        reason: `No schema markup detected. Add ${schemaNeeded} to improve rich result eligibility.`,
        priority: 6,
        estimatedImpact: estimateActionImpact(page, 'Add Schema'),
        effort: 'low',
        category: 'content',
      });
    }
  }

  if (Number(page.selfContainedAnswers || 0) >= 2 && !page.hasFaqSchema && impressions > 50) {
    candidates.push({
      action: 'Add FAQ Schema',
      reason: `Page has ${page.selfContainedAnswers} Q&A-style answers but no FAQPage schema. Adding it could earn a FAQ rich result in SERPs.`,
      priority: 7,
      estimatedImpact: estimateActionImpact(page, 'Add FAQ Schema'),
      effort: 'low',
      category: 'content',
    });
  }

  const isYmyl = ['healthcare', 'finance'].includes(ctx.detectedIndustry);
  if (Number(page.eeatScore ?? 100) < 40 && isYmyl) {
    candidates.push({
      action: 'Improve E-E-A-T',
      reason: `Low E-E-A-T score (${page.eeatScore || 0}) for a ${ctx.detectedIndustry} industry. Add author credentials, review dates, and trust signals.`,
      priority: 8,
      estimatedImpact: estimatePositionImprovementClicks(impressions, position, 3),
      effort: 'medium',
      category: 'content',
    });
  }

  if (page.isCannibalized && position > 10) {
    candidates.push({
      action: 'Resolve Cannibalization',
      reason: `Multiple pages appear to target "${page.mainKeyword || 'same keyword'}". Consolidate or differentiate them.`,
      priority: 9,
      estimatedImpact: estimatePositionImprovementClicks(impressions, position, 4),
      effort: 'medium',
      category: 'content',
    });
  }

  if (position >= 2 && position <= 8 && !page.hasFeaturedSnippetPatterns) {
    candidates.push({
      action: 'Optimize for SERP Features',
      reason: `Ranking at position ${Math.round(position)}. Structured formatting (tables, definitions, numbered lists) could earn a featured snippet.`,
      priority: 10,
      estimatedImpact: estimatePositionImprovementClicks(impressions, position, 2),
      effort: 'low',
      category: 'content',
    });
  }

  if (ctx.availability.backlinks && (page.pageValueTier === '★★★' || page.pageValueTier === '★★') && referringDomains === 0 && impressions > 100 && position >= 4 && position <= 20) {
    candidates.push({
      action: 'Acquire Backlinks',
      reason: `Page ranks at position ${Math.round(position)} with ${impressions.toLocaleString()} impressions but zero referring domains. External links could push it into top results.`,
      priority: 11,
      estimatedImpact: estimateActionImpact(page, 'Acquire Backlinks'),
      effort: 'high',
      category: 'content',
    });
  }

  if (page.readability === 'Difficult' && Number(page.ga4BounceRate || 0) > 0.7 && sessions > 20) {
    candidates.push({
      action: 'Improve Readability',
      reason: `Difficult readability with high bounce rate (${Math.round(Number(page.ga4BounceRate || 0) * 100)}%). Simplify the writing to reduce drop-off.`,
      priority: 12,
      estimatedImpact: Math.round(sessions * 0.1),
      effort: 'medium',
      category: 'content',
    });
  }

  if (ipr > 40 && impressions === 0 && sessions === 0 && page.wordCount < 200) {
    candidates.push({
      action: 'Repurpose Page',
      reason: `Page has strong internal link equity (IPR ${Math.round(ipr)}) but no search traffic and thin content. Rewriting it around a real keyword could turn that link equity into rankings.`,
      priority: 13,
      estimatedImpact: 0,
      effort: 'medium',
      category: 'content',
    });
  }

  if (page.wordCount < 50 && impressions === 0 && sessions === 0 && backlinks === 0 && page.inlinks <= 1) {
    candidates.push({
      action: 'Remove or Merge',
      reason: 'Minimal content and no value signals. Merge into a stronger page or remove.',
      priority: 14,
      estimatedImpact: 0,
      effort: 'low',
      category: 'content',
    });
  }

  return candidates.sort((a, b) => a.priority - b.priority)[0] ?? {
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
  const impressions = Number(page.gscImpressions || 0);
  const position = Number(page.gscPosition || 0);

  // ─── E-commerce ──────────────────────────────────────────────────────────
  if (ind === 'ecommerce') {
    if (page.pageCategory === 'product' && !(page.schemaTypes || []).includes('Product')) {
      actions.push({
        action: 'Add Product Schema',
        reason: 'Product page lacks Product/Offer schema. Required for price and availability rich results.',
        priority: 6,
        estimatedImpact: Math.round(impressions * 0.03),
        effort: 'low',
        category: 'industry',
      });
    }
    if (page.industrySignals?.priceVisible === false && page.pageCategory === 'product') {
      actions.push({
        action: 'Add Visible Price',
        reason: 'Product page appears to hide or omit pricing. Visible prices improve conversion and schema eligibility.',
        priority: 8,
        estimatedImpact: 0,
        effort: 'low',
        category: 'industry',
      });
    }
    if (page.industrySignals?.hasStockStatus === false && page.pageCategory === 'product') {
      actions.push({
        action: 'Add Stock Status',
        reason: 'Product page lacks availability signals. Users and search engines prefer knowing stock status.',
        priority: 8,
        estimatedImpact: 0,
        effort: 'low',
        category: 'industry',
      });
    }
    if (page.pageCategory === 'category' && !(page.schemaTypes || []).includes('ItemList')) {
      actions.push({
        action: 'Add Listing Schema',
        reason: 'Category/Listing page lacks ItemList schema for improved product grouping in search results.',
        priority: 7,
        estimatedImpact: estimateActionImpact(page, 'Add Listing Schema'),
        effort: 'medium',
        category: 'industry',
      });
    }
  }

  // ─── News / Blog ─────────────────────────────────────────────────────────
  if (ind === 'news' || ind === 'blog') {
    if (page.pageCategory === 'blog_post' && !page.hasArticleSchema) {
      actions.push({
        action: 'Add Article Schema',
        reason: 'Article-like page without Article/NewsArticle schema. Required for Top Stories and article rich results.',
        priority: 6,
        estimatedImpact: Math.round(impressions * 0.02),
        effort: 'low',
        category: 'industry',
      });
    }
    if (page.pageCategory === 'blog_post' && !page.visibleDate) {
      actions.push({
        action: 'Add Publish Date',
        reason: 'Article-like page has no visible publish date. Dates improve E-E-A-T and freshness signals.',
        priority: 7,
        estimatedImpact: 0,
        effort: 'low',
        category: 'industry',
      });
    }
    if (page.inNewsSitemap === false && page.pageCategory === 'blog_post') {
      actions.push({
        action: 'Add to News Sitemap',
        reason: 'Recent post is not included in the news-sitemap.xml. Required for Google News indexing.',
        priority: 4,
        estimatedImpact: 0,
        effort: 'medium',
        category: 'industry',
      });
    }
  }

  // ─── Local ───────────────────────────────────────────────────────────────
  if (ind === 'local') {
    if (page.pageCategory === 'homepage' && !page.industrySignals?.hasLocalBusinessSchema) {
      actions.push({
        action: 'Add Local Schema',
        reason: 'Homepage is missing LocalBusiness schema. Required for local knowledge panel and map pack eligibility.',
        priority: 6,
        estimatedImpact: 0,
        effort: 'low',
        category: 'industry',
      });
    }

    if (page.pageCategory === 'location_page' || page.pageCategory === 'homepage') {
      if (page.napMatchWithHomepage === false && page.napSnapshot?.address) {
        actions.push({
          action: 'Fix NAP Consistency',
          reason: 'Phone or address differs significantly from the homepage. Inconsistent NAP (Name, Address, Phone) hurts local rankings.',
          priority: 4,
          estimatedImpact: estimateActionImpact(page, 'Fix NAP Consistency'),
          effort: 'low',
          category: 'industry',
        });
      }
      if (!page.industrySignals?.hasServiceAreaPages && !page.industrySignals?.hasServiceAreaText) {
        actions.push({
          action: 'Add Service Area',
          reason: 'Local business page lacks defined service area mentions or linked location pages.',
          priority: 8,
          estimatedImpact: 0,
          effort: 'medium',
          category: 'industry',
        });
      }
      if (!page.industrySignals?.hasPriceRange) {
        actions.push({
          action: 'Add Price Range',
          reason: 'Restaurant or local service lacks priceRange in schema or price mentions. Helps users and local signals.',
          priority: 9,
          estimatedImpact: 0,
          effort: 'low',
          category: 'industry',
        });
      }
    }

    if (page.industrySignals?.hasMenuLink && !(page.schemaTypes || []).includes('Menu')) {
      actions.push({
        action: 'Add Menu Schema',
        reason: 'Menu link found but no Menu schema detected. Required for menu rich results in local search.',
        priority: 6,
        estimatedImpact: estimateActionImpact(page, 'Add Menu Schema'),
        effort: 'medium',
        category: 'industry',
      });
    }

    if (
      (page.searchIntent === 'transactional' || page.industrySignals?.hasReservationIntent) &&
      !page.industrySignals?.hasReservationLink
    ) {
      actions.push({
        action: 'Add Reservation Link',
        reason: 'Transactional local intent detected but no reservation/booking link found.',
        priority: 5,
        estimatedImpact: 0,
        effort: 'medium',
        category: 'industry',
      });
    }
  }

  // ─── Healthcare ──────────────────────────────────────────────────────────
  if (ind === 'healthcare') {
    if (page.pageCategory === 'blog_post' && !page.industrySignals?.hasMedicalAuthor) {
      actions.push({
        action: 'Add Medical Author',
        reason: 'Healthcare content lacks medical author credentials. Critical for YMYL E-E-A-T.',
        priority: 3,
        estimatedImpact: estimatePositionImprovementClicks(impressions, position, 3),
        effort: 'medium',
        category: 'industry',
      });
    }
    // NEW: content has author but no reviewer
    if (
      page.pageCategory === 'blog_post' &&
      page.industrySignals?.hasMedicalAuthor &&
      !page.industrySignals?.hasMedicalReviewer
    ) {
      actions.push({
        action: 'Add Medical Reviewer',
        reason: 'Medical content has an author but no medical reviewer. Adding a reviewer strengthens E-E-A-T.',
        priority: 5,
        estimatedImpact: estimatePositionImprovementClicks(impressions, position, 2),
        effort: 'medium',
        category: 'industry',
      });
    }
  }

  // ─── Finance (NEW) ───────────────────────────────────────────────────────
  if (ind === 'finance') {
    if (
      page.pageCategory === 'blog_post' &&
      !page.industrySignals?.hasFinancialDisclaimer
    ) {
      actions.push({
        action: 'Add Financial Disclaimer',
        reason: 'Financial content page lacks a "not financial advice" disclaimer. Required for YMYL compliance and trust.',
        priority: 4,
        estimatedImpact: 0,
        effort: 'low',
        category: 'industry',
      });
    }
  }

  // ─── SaaS (NEW) ──────────────────────────────────────────────────────────
  if (ind === 'saas') {
    if (
      (page.pageCategory === 'landing_page' || page.pageCategory === 'service_page') &&
      (!page.industrySignals?.hasTrialCta && !page.industrySignals?.hasPricingLink)
    ) {
      actions.push({
        action: 'Add Trial CTA',
        reason: 'Landing or service page has no trial or pricing call-to-action. SaaS visitors expect a low-friction next step.',
        priority: 7,
        estimatedImpact: 0,
        effort: 'low',
        category: 'industry',
      });
    }
  }

  // ─── Education (NEW) ─────────────────────────────────────────────────────
  if (ind === 'education') {
    if (
      page.pageCategory === 'service_page' &&
      !(page.schemaTypes || []).some((t: string) => ['Course', 'EducationalOrganization'].includes(t))
    ) {
      actions.push({
        action: 'Add Course Schema',
        reason: 'Course-like page is missing Course or EducationalOrganization schema. Required for course rich results.',
        priority: 6,
        estimatedImpact: Math.round(impressions * 0.02),
        effort: 'low',
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
    service_page: industry === 'education' ? 'Course' : 'Service',
    resource: 'HowTo',
    blog_index: 'Blog',
  };

  return map[pageCategory] || null;
}
