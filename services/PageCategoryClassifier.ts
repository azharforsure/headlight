/**
 * PageCategoryClassifier.ts
 *
 * Language-agnostic page category classification.
 * Uses content patterns, schema, and structural analysis.
 */

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
}

interface SiteContextForClassification {
  totalPages: number;
  detectedIndustry: string;
  rootHostname: string;
}

export function classifyPageCategory(
  page: PageForClassification,
  siteCtx: SiteContextForClassification
): PageCategory {
  if (!page.isHtmlPage) return 'media';
  if (page.statusCode >= 400) return 'other';

  const path = getPathname(page.url);
  const schemas = page.schemaTypes || [];

  if (page.crawlDepth === 0 || path === '/' || path === '') return 'homepage';
  if (hasPaginationSignals(page, path)) return 'pagination';
  if (isSearchResultsPage(page.url)) return 'search_results';
  if (isLoginPage(path)) return 'login';

  if (schemas.includes('Product') || schemas.includes('Offer')) return 'product';
  if (page.industrySignals?.priceVisible && page.industrySignals?.hasProductSchema) return 'product';

  if (page.hasFaqSchema || schemas.includes('FAQPage')) return 'faq';
  if (isLocationPage(page)) return 'location_page';
  if (isContactPage(page)) return 'contact';
  if (isLegalPage(path)) return 'legal';
  if (isAboutPage(path)) return 'about';

  if (schemas.some((s) => ['Article', 'BlogPosting', 'NewsArticle', 'TechArticle', 'ReportageNewsArticle'].includes(s))) {
    return 'blog_post';
  }
  if (isArticleLikePage(page)) return 'blog_post';
  if (isBlogIndexPage(page)) return 'blog_index';
  if (isCategoryPage(page, siteCtx)) return 'category';
  if (isLandingPage(page)) return 'landing_page';
  if (isServicePage(page)) return 'service_page';
  if (isResourcePage(path)) return 'resource';

  return 'other';
}

function getPathname(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return '';
  }
}

function hasPaginationSignals(page: PageForClassification, path: string): boolean {
  if (page.relNextTag || page.relPrevTag || page.httpRelNext || page.httpRelPrev) {
    if (/[?&]page=\d|\/page\/\d|\/p\/\d|\/pagina\/\d|\/seite\/\d|\/stranica\/\d/i.test(path)) {
      return true;
    }
  }
  return /[?&]page=\d+/i.test(path) || /\/page\/\d+\/?$/i.test(path);
}

function isSearchResultsPage(url: string): boolean {
  try {
    const parsed = new URL(url);
    if ([...parsed.searchParams.keys()].some((k) => /^(q|s|search|query)$/i.test(k))) return true;
    return /\/(search|suche|pretraga|buscar|recherche)\/?$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function isLoginPage(path: string): boolean {
  return /\/(login|signin|sign-in|account|dashboard|admin|register|signup|sign-up|auth|prijava|anmelden|connexion)\b/i.test(path);
}

function isLocationPage(page: PageForClassification): boolean {
  const signals = [
    page.hasEmbeddedMap,
    page.hasPostalAddress,
    (page.phoneNumbers || []).length > 0,
    page.industrySignals?.hasLocalBusinessSchema,
  ].filter(Boolean).length;

  return signals >= 2;
}

function isContactPage(page: PageForClassification): boolean {
  const hasForm = page.hasFormsWithAutocomplete || false;
  const hasPhone = (page.phoneNumbers || []).length > 0;
  const isShallow = page.crawlDepth <= 2;
  const isShort = Number(page.wordCount || 0) < 500;

  const path = getPathname(page.url);
  if (/\/(contact|kontakt|contato|contacto|contatto|iletisim|連絡|联系)\b/i.test(path)) return true;

  return hasForm && hasPhone && isShallow && isShort;
}

function isLegalPage(path: string): boolean {
  return /\/(privacy|terms|legal|disclaimer|cookie|gdpr|imprint|impressum|datenschutz|politica-de-privacidad|politique-de-confidentialite|privatnost)\b/i.test(path);
}

function isAboutPage(path: string): boolean {
  return /\/(about|team|our-team|company|mission|story|uber-uns|o-nama|a-propos|chi-siamo|acerca-de|hakkimizda)\b/i.test(path);
}

function isArticleLikePage(page: PageForClassification): boolean {
  const hasDate = Boolean(page.visibleDate);
  const isLong = Number(page.wordCount || 0) > 500;
  const isDeep = Number(page.crawlDepth || 0) > 0;
  return hasDate && isLong && isDeep;
}

function isBlogIndexPage(page: PageForClassification): boolean {
  const lowInlinks = Number(page.inlinks || 0) < 20;
  const isShort = Number(page.wordCount || 0) < 300;
  const isShallow = Number(page.crawlDepth || 0) <= 2;
  return isShort && isShallow && !page.visibleDate && lowInlinks;
}

function isCategoryPage(page: PageForClassification, ctx: SiteContextForClassification): boolean {
  if (ctx.detectedIndustry === 'ecommerce') {
    return Boolean(page.industrySignals?.hasBreadcrumbUI) &&
      !page.industrySignals?.priceVisible &&
      page.crawlDepth >= 1 &&
      page.crawlDepth <= 3;
  }
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
