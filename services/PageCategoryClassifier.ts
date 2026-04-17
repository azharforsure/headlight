/**
 * PageCategoryClassifier.ts
 *
 * Language-agnostic page category classification.
 * Returns category + confidence + signal trail.
 */
import {
  RX_CONTACT, RX_ABOUT, RX_LEGAL, RX_LOGIN, RX_PAGINATION, RX_SEARCH,
  hasBlogSlug, hasCategorySlug, hasProductSlug, hasLocationSlug,
} from './SlugDictionaries';

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 80,   // "Certain" — used for core technical assignments
  MEDIUM: 50, // "Probable" — used for content recommendations
  LOW: 30     // "Heuristic" — used for rollups only
};

export type PageCategory =
  | 'homepage'
  | 'product'
  | 'category'
  | 'blog_post'
  | 'blog_index'
  | 'landing_page'
  | 'service_page'
  | 'about'
  | 'contact'
  | 'legal'
  | 'faq'
  | 'resource'
  | 'login'
  | 'media'
  | 'pagination'
  | 'search_results'
  | 'location_page'
  | 'other';

export interface PageCategoryResult {
  category: PageCategory;
  confidence: number;   // 0–100
  signals: string[];    // ordered: strongest first
}

interface PageForClassification {
  url: string;
  crawlDepth: number;
  statusCode: number;
  isHtmlPage: boolean;
  contentType: string;
  wordCount: number;
  schemaTypes: string[];
  inlinks: number;
  industrySignals?: Record<string, any>;
  hasEmbeddedMap?: boolean;
  hasPostalAddress?: boolean;
  phoneNumbers?: string[];
  hasFormsWithAutocomplete?: boolean;
  relNextTag?: string;
  relPrevTag?: string;
  httpRelNext?: string;
  httpRelPrev?: string;
  hasFaqSchema?: boolean;
  ctaTexts?: string[];
  visibleDate?: string;
  // NEW
  firstPathSegment?: string;
}

export interface SiteContextForClassification {
  totalPages: number;
  detectedIndustry: string;
  rootHostname: string;
  /** first-path-segment → count, computed after ~50 pages crawled */
  segmentFrequency?: Record<string, number>;
  /** segments deemed implicit blog/news indexes ({"vijesti", "politika", ...}) */
  learnedBlogSegments?: Set<string>;
  /** segments deemed implicit category/section indexes */
  learnedCategorySegments?: Set<string>;
}

// ─── Public entrypoints ──────────────────────────────────────────────────────

/**
 * Backward-compatible entrypoint for category classification.
 */
export function classifyPageCategory(
  page: PageForClassification,
  siteCtx: SiteContextForClassification
): PageCategory {
  return classifyPageCategoryRich(page, siteCtx).category;
}

/**
 * Extended category classification returning confidence and signal trail.
 */
export function classifyPageCategoryRich(
  page: PageForClassification,
  siteCtx: SiteContextForClassification
): PageCategoryResult {
  if (!page.isHtmlPage) return done('media', 100, ['non-html']);
  if (page.statusCode >= 400) return done('other', 100, [`status ${page.statusCode}`]);

  const path = getPathname(page.url);
  const schemas = page.schemaTypes || [];

  if (page.crawlDepth === 0 || path === '/' || path === '') {
    return done('homepage', 100, ['depth=0']);
  }

  if (hasPaginationSignals(page, path)) return done('pagination', 95, ['rel=next/prev or ?page=N']);
  if (isSearchResultsPage(page.url)) return done('search_results', 95, ['search query param or slug']);
  if (isLoginPage(path)) return done('login', 90, ['login-slug']);

  // Schema-strong signals (highest confidence)
  if (schemas.includes('Product') || schemas.includes('Offer')) {
    return done('product', 95, ['Product/Offer schema']);
  }
  if (page.industrySignals?.priceVisible && page.industrySignals?.hasProductSchema) {
    return done('product', 90, ['priceVisible + Product schema']);
  }
  if (page.hasFaqSchema || schemas.includes('FAQPage')) {
    return done('faq', 95, ['FAQPage schema']);
  }

  // Local: location page (now slug-aware)
  const loc = locationSignals(page, path);
  if (loc.score >= 2) {
    const confidence = 40 + Math.min(50, loc.score * 15);
    return done('location_page', confidence, loc.signals);
  }

  if (isContactPage(page, path)) return done('contact', 85, ['contact slug or form+phone']);
  if (isLegalPage(path)) return done('legal', 90, ['legal slug']);
  if (isAboutPage(path)) return done('about', 85, ['about slug']);

  // Article signals
  const articleSchema = schemas.find((s) =>
    ['Article', 'BlogPosting', 'NewsArticle', 'TechArticle', 'ReportageNewsArticle'].includes(s)
  );
  if (articleSchema) return done('blog_post', 95, [`${articleSchema} schema`]);

  const article = articleLikeSignals(page, siteCtx, path);
  if (article.isArticle) {
    return done('blog_post', article.confidence, article.signals);
  }

  if (isBlogIndexPage(page, siteCtx, path)) {
    return done('blog_index', 70, ['blog-index heuristics']);
  }

  if (isCategoryPage(page, siteCtx, path)) {
    return done('category', 70, ['category heuristics or site-learned prefix']);
  }

  if (isLandingPage(page)) {
    return done('landing_page', 60, ['CTA/form + moderate length + shallow']);
  }

  if (isServicePage(page)) {
    return done('service_page', 55, ['moderate length + no date + no price']);
  }

  if (isResourcePage(path)) return done('resource', 80, ['resource slug']);

  if (hasProductSlug(path) && page.crawlDepth >= 2) {
    return done('product', 55, ['product-slug fallback']);
  }
  if (hasCategorySlug(path)) return done('category', 60, ['category-slug fallback']);
  if (hasBlogSlug(path) && !page.visibleDate) return done('blog_index', 55, ['blog-slug, no date']);

  return done('other', 30, ['no strong signals']);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function done(category: PageCategory, confidence: number, signals: string[]): PageCategoryResult {
  return { category, confidence: Math.min(100, Math.max(0, confidence)), signals };
}

function getPathname(url: string): string {
  try { return new URL(url).pathname.toLowerCase(); } catch { return ''; }
}

function hasPaginationSignals(page: PageForClassification, path: string): boolean {
  if (page.relNextTag || page.relPrevTag || page.httpRelNext || page.httpRelPrev) return true;
  if (/[?&]page=\d+/i.test(path)) return true;
  return RX_PAGINATION.test(path) && /\d+/.test(path);
}

function isSearchResultsPage(url: string): boolean {
  try {
    const parsed = new URL(url);
    if ([...parsed.searchParams.keys()].some((k) => /^(q|s|search|query|suche|pretraga|busqueda|recherche)$/i.test(k))) return true;
    return RX_SEARCH.test(parsed.pathname);
  } catch { return false; }
}

function isLoginPage(path: string): boolean {
  return RX_LOGIN.test(path);
}

function locationSignals(page: PageForClassification, path: string): { score: number; signals: string[] } {
  const signals: string[] = [];
  let score = 0;
  if (page.hasEmbeddedMap) { score++; signals.push('embedded map'); }
  if (page.hasPostalAddress) { score++; signals.push('postal address'); }
  if ((page.phoneNumbers || []).length > 0) { score++; signals.push('phone'); }
  if (page.industrySignals?.hasLocalBusinessSchema) { score += 2; signals.push('LocalBusiness schema'); }
  if (hasLocationSlug(path)) { score++; signals.push('location slug'); }
  return { score, signals };
}

function isContactPage(page: PageForClassification, path: string): boolean {
  if (RX_CONTACT.test(path)) return true;
  const hasForm = page.hasFormsWithAutocomplete || false;
  const hasPhone = (page.phoneNumbers || []).length > 0;
  const isShallow = page.crawlDepth <= 2;
  const isShort = Number(page.wordCount || 0) < 500;
  return hasForm && hasPhone && isShallow && isShort;
}

function isLegalPage(path: string): boolean { return RX_LEGAL.test(path); }
function isAboutPage(path: string): boolean { return RX_ABOUT.test(path); }

function articleLikeSignals(
  page: PageForClassification,
  siteCtx: SiteContextForClassification,
  path: string
): { isArticle: boolean; confidence: number; signals: string[] } {
  const signals: string[] = [];
  const hasDate = Boolean(page.visibleDate);
  const isLong = Number(page.wordCount || 0) > 500;
  const isMedium = Number(page.wordCount || 0) > 400;
  const isDeep = Number(page.crawlDepth || 0) > 0;

  if (hasDate) signals.push('visible date');
  if (isLong) signals.push('>500 words');

  // Classic fallback
  if (hasDate && isLong && isDeep) return { isArticle: true, confidence: 80, signals };

  // Site-learned blog segment: e.g. /vijesti/naslov — no date found but site pattern says it's news
  const firstSeg = (page.firstPathSegment || getFirstSegment(path)).toLowerCase();
  if (
    firstSeg &&
    siteCtx.learnedBlogSegments?.has(firstSeg) &&
    isDeep &&
    isMedium
  ) {
    signals.push(`site-learned blog prefix: /${firstSeg}/`);
    // Higher confidence if the blog/news slug ALSO matches the dictionary
    const dictMatch = hasBlogSlug(`/${firstSeg}/`);
    return { isArticle: true, confidence: dictMatch ? 75 : 62, signals };
  }

  // Blog-slug parent + sufficient length, no date — still likely article
  if (hasBlogSlug(path) && isMedium && isDeep) {
    signals.push('blog slug + medium length');
    return { isArticle: true, confidence: 55, signals };
  }

  return { isArticle: false, confidence: 0, signals };
}

function isBlogIndexPage(
  page: PageForClassification,
  siteCtx: SiteContextForClassification,
  path: string
): boolean {
  const lowInlinks = Number(page.inlinks || 0) < 20;
  const isShort = Number(page.wordCount || 0) < 300;
  const isShallow = Number(page.crawlDepth || 0) <= 2;
  const generic = isShort && isShallow && !page.visibleDate && lowInlinks;

  if (generic && hasBlogSlug(path)) return true;

  // Site-learned segment applied to /<seg>/ (top level, no deeper)
  const seg = getFirstSegment(path);
  if (generic && seg && siteCtx.learnedBlogSegments?.has(seg.toLowerCase())) return true;

  return generic;
}

function isCategoryPage(
  page: PageForClassification,
  ctx: SiteContextForClassification,
  path: string
): boolean {
  if (ctx.detectedIndustry === 'ecommerce') {
    if (
      Boolean(page.industrySignals?.hasBreadcrumbUI) &&
      !page.industrySignals?.priceVisible &&
      page.crawlDepth >= 1 && page.crawlDepth <= 3
    ) return true;
  }
  const seg = getFirstSegment(path);
  if (seg && ctx.learnedCategorySegments?.has(seg.toLowerCase())) return true;
  return false;
}

function isLandingPage(page: PageForClassification): boolean {
  const hasCta = (page.ctaTexts || []).length > 0;
  const hasForm = page.hasFormsWithAutocomplete || false;
  const wc = Number(page.wordCount || 0);
  const isModerate = wc > 200 && wc < 2000;
  const isShallow = Number(page.crawlDepth || 0) <= 2;
  return (hasCta || hasForm) && isModerate && isShallow && !page.visibleDate;
}

function isServicePage(page: PageForClassification): boolean {
  const isModerate = Number(page.wordCount || 0) > 300;
  const noDate = !page.visibleDate;
  const noProduct = !page.industrySignals?.priceVisible;
  const isShallow = Number(page.crawlDepth || 0) <= 3;
  return isModerate && noDate && noProduct && isShallow;
}

function isResourcePage(path: string): boolean {
  return /\/(resource|download|whitepaper|ebook|guide|webinar|template|tool)\b/i.test(path);
}

function getFirstSegment(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[0] || '';
}

// ─── Site-learning helpers ───────────────────────────────────────────────────

/**
 * Learns site segments from a set of pages.
 * Called once per crawl from CrawlerDataUtils after pages are processed.
 */
export function learnSiteSegments(
  pages: Array<{ url: string; visibleDate?: string; wordCount?: number; crawlDepth?: number; pageCategory?: PageCategory | undefined }>
): { segmentFrequency: Record<string, number>; learnedBlogSegments: Set<string>; learnedCategorySegments: Set<string> } {
  const freq: Record<string, number> = {};
  const datedCountBySeg: Record<string, number> = {};
  const longCountBySeg: Record<string, number> = {};

  for (const p of pages) {
    const seg = (() => {
      try { return new URL(p.url).pathname.split('/').filter(Boolean)[0] || ''; } catch { return ''; }
    })().toLowerCase();
    if (!seg) continue;
    freq[seg] = (freq[seg] || 0) + 1;
    if (p.visibleDate) datedCountBySeg[seg] = (datedCountBySeg[seg] || 0) + 1;
    if (Number(p.wordCount || 0) > 400) longCountBySeg[seg] = (longCountBySeg[seg] || 0) + 1;
  }

  const learnedBlog = new Set<string>();
  const learnedCat = new Set<string>();

  for (const [seg, count] of Object.entries(freq)) {
    if (count < 10) continue; // need a real cluster
    const datedPct = (datedCountBySeg[seg] || 0) / count;
    const longPct = (longCountBySeg[seg] || 0) / count;
    if (datedPct >= 0.4 || (longPct >= 0.5 && count >= 15)) {
      learnedBlog.add(seg);
    } else if (longPct < 0.2 && count >= 15) {
      learnedCat.add(seg);
    }
  }

  return { segmentFrequency: freq, learnedBlogSegments: learnedBlog, learnedCategorySegments: learnedCat };
}
