/**
 * SiteTypeDetector.ts
 *
 * Multi-signal website type detection. Language-agnostic.
 * 5 signal layers: CMS, Schema, Content Patterns, URL Structure, GSC Queries.
 */

export type DetectedIndustry =
  | 'ecommerce'
  | 'news'
  | 'blog'
  | 'local'
  | 'saas'
  | 'healthcare'
  | 'finance'
  | 'education'
  | 'real_estate'
  | 'restaurant'
  | 'portfolio'
  | 'job_board'
  | 'general';

export interface SiteTypeResult {
  industry: DetectedIndustry;
  confidence: number;
  allScores: Record<DetectedIndustry, number>;
  detectedLanguage: string;
  detectedLanguages: Array<{ code: string; percentage: number }>;
  detectedCms: string | null;
  isMultiLanguage: boolean;
}

interface PageSignals {
  url: string;
  schemaTypes: string[];
  cmsType: string | null;
  language: string;
  industrySignals: Record<string, any>;
  wordCount: number;
  crawlDepth: number;
  statusCode: number;
  isHtmlPage: boolean;
  hasPricingPage?: boolean;
  hasEmbeddedMap?: boolean;
  hasPostalAddress?: boolean;
  phoneNumbers?: string[];
  gscImpressions?: number;
  mainKeyword?: string;
}

function scoreByCms(pages: PageSignals[]): Partial<Record<DetectedIndustry, number>> {
  const scores: Partial<Record<DetectedIndustry, number>> = {};
  const cmsCounts: Record<string, number> = {};

  for (const p of pages) {
    if (p.cmsType) cmsCounts[p.cmsType] = (cmsCounts[p.cmsType] || 0) + 1;
  }

  const dominant = Object.entries(cmsCounts).sort((a, b) => b[1] - a[1])[0];
  if (!dominant) return scores;

  const cms = dominant[0].toLowerCase();

  if (['shopify', 'woocommerce', 'magento', 'bigcommerce', 'prestashop', 'opencart'].includes(cms)) {
    scores.ecommerce = 95;
  } else if (['ghost', 'substack'].includes(cms)) {
    scores.blog = 95;
  } else if (cms === 'wordpress') {
    const hasWoo = pages.some((p) => p.industrySignals?.hasProductSchema || p.industrySignals?.priceVisible);
    scores.blog = hasWoo ? 0 : 60;
    if (hasWoo) scores.ecommerce = 85;
  } else if (cms === 'drupal') {
    scores.general = 40;
  }

  return scores;
}

function scoreBySchema(pages: PageSignals[]): Partial<Record<DetectedIndustry, number>> {
  const scores: Partial<Record<DetectedIndustry, number>> = {};
  const typeCounts: Record<string, number> = {};

  for (const p of pages) {
    if (!Array.isArray(p.schemaTypes)) continue;
    for (const t of p.schemaTypes) typeCounts[t] = (typeCounts[t] || 0) + 1;
  }

  const has = (types: string[]) => types.some((t) => (typeCounts[t] || 0) > 0);
  const count = (types: string[]) => types.reduce((sum, t) => sum + (typeCounts[t] || 0), 0);

  if (has(['Product', 'Offer', 'AggregateOffer'])) {
    scores.ecommerce = Math.min(95, 50 + count(['Product', 'Offer']) * 2);
  }
  if (has(['NewsArticle', 'ReportageNewsArticle'])) {
    scores.news = Math.min(95, 60 + count(['NewsArticle']) * 3);
  }
  if (has(['Article', 'BlogPosting', 'TechArticle'])) {
    const articleCount = count(['Article', 'BlogPosting', 'TechArticle']);
    scores.blog = Math.min(90, 40 + articleCount * 2);
    scores.news = Math.max(scores.news || 0, Math.min(70, 30 + articleCount));
  }
  if (has(['LocalBusiness', 'Restaurant', 'MedicalBusiness', 'LegalService', 'Store', 'AutoRepair', 'BarOrPub', 'BeautySalon', 'DayCare', 'Dentist', 'Electrician', 'Plumber', 'RealEstateAgent'])) {
    scores.local = Math.min(95, 70 + count(['LocalBusiness', 'Restaurant', 'Store']) * 5);
  }
  if (has(['Course', 'EducationalOrganization'])) {
    scores.education = Math.min(90, 60 + count(['Course']) * 5);
  }
  if (has(['MedicalWebPage', 'MedicalCondition', 'Drug', 'MedicalClinic'])) {
    scores.healthcare = Math.min(90, 60 + count(['MedicalWebPage', 'MedicalCondition']) * 5);
  }
  if (has(['FinancialProduct', 'BankAccount', 'InvestmentFund'])) {
    scores.finance = 60;
  }
  if (has(['RealEstateListing', 'Residence', 'Apartment'])) {
    scores.real_estate = 60;
  }
  if (has(['Recipe', 'Menu', 'MenuItem'])) {
    scores.restaurant = Math.min(90, 60 + count(['Recipe', 'Menu']) * 5);
  }
  if (has(['SoftwareApplication', 'WebApplication', 'MobileApplication'])) {
    scores.saas = 55;
  }
  if (has(['JobPosting'])) {
    scores.job_board = Math.min(85, 50 + count(['JobPosting']) * 2);
  }

  return scores;
}

function scoreByContentPatterns(pages: PageSignals[]): Partial<Record<DetectedIndustry, number>> {
  const scores: Partial<Record<DetectedIndustry, number>> = {};
  const htmlPages = pages.filter((p) => p.isHtmlPage && p.statusCode === 200);
  const total = htmlPages.length || 1;

  const pricePages = htmlPages.filter((p) => p.industrySignals?.priceVisible).length;
  if (pricePages / total > 0.15) {
    scores.ecommerce = Math.min(85, 30 + Math.round((pricePages / total) * 100));
  }

  const longContentPages = htmlPages.filter((p) => Number(p.wordCount || 0) > 500).length;
  const articleLikeRatio = longContentPages / total;
  if (articleLikeRatio > 0.3) {
    scores.blog = Math.min(75, 20 + Math.round(articleLikeRatio * 80));
    scores.news = Math.min(60, 15 + Math.round(articleLikeRatio * 60));
  }

  const localSignalPages = htmlPages.filter((p) =>
    p.hasPostalAddress || p.hasEmbeddedMap || ((p.phoneNumbers || []).length > 0)
  ).length;
  if (localSignalPages / total > 0.1) {
    scores.local = Math.min(75, 25 + Math.round((localSignalPages / total) * 100));
  }

  const hasPricing = htmlPages.some((p) => p.hasPricingPage);
  const hasDocsLike = htmlPages.filter((p) => {
    try {
      return new URL(p.url).pathname.toLowerCase().includes('/doc');
    } catch {
      return false;
    }
  }).length > 5;

  if (hasPricing && hasDocsLike && pricePages / total < 0.1) {
    scores.saas = Math.min(75, 65);
  }

  const medicalPages = htmlPages.filter((p) => p.industrySignals?.hasMedicalAuthor).length;
  if (medicalPages > 3) {
    scores.healthcare = Math.min(70, 30 + medicalPages * 5);
  }

  return scores;
}

function scoreByUrlStructure(pages: PageSignals[]): Partial<Record<DetectedIndustry, number>> {
  const scores: Partial<Record<DetectedIndustry, number>> = {};
  const htmlPages = pages.filter((p) => p.isHtmlPage && p.statusCode === 200);
  const total = htmlPages.length || 1;

  const dateUrlPages = htmlPages.filter((p) => {
    try {
      const path = new URL(p.url).pathname;
      return /\/\d{4}\/\d{2}\//.test(path) || /\d{4}-\d{2}-\d{2}/.test(path);
    } catch {
      return false;
    }
  }).length;

  if (dateUrlPages / total > 0.15) {
    scores.blog = Math.min(70, 25 + Math.round((dateUrlPages / total) * 80));
    scores.news = Math.min(65, 20 + Math.round((dateUrlPages / total) * 80));
  }

  const deepPages = htmlPages.filter((p) => Number(p.crawlDepth || 0) >= 3).length;
  if (deepPages / total > 0.4) {
    scores.ecommerce = Math.max(scores.ecommerce || 0, Math.min(50, 15 + Math.round((deepPages / total) * 50)));
  }

  const shallowPages = htmlPages.filter((p) => Number(p.crawlDepth || 0) <= 1).length;
  if (shallowPages / total > 0.6 && total < 30) {
    scores.local = Math.max(scores.local || 0, 30);
    scores.portfolio = Math.max(scores.portfolio || 0, 25);
  }

  return scores;
}

function scoreByGscQueries(pages: PageSignals[]): Partial<Record<DetectedIndustry, number>> {
  const scores: Partial<Record<DetectedIndustry, number>> = {};

  const keywords = pages
    .filter((p) => p.mainKeyword && Number(p.gscImpressions || 0) > 10)
    .map((p) => String(p.mainKeyword).toLowerCase());

  if (keywords.length === 0) return scores;

  const totalKw = keywords.length;

  const ecomKw = keywords.filter((k) => /\b(buy|price|shop|cheap|order|deliver|sale|discount|coupon|free shipping)\b/i.test(k)).length;
  if (ecomKw / totalKw > 0.1) {
    scores.ecommerce = Math.min(60, 20 + Math.round((ecomKw / totalKw) * 100));
  }

  const localKw = keywords.filter((k) => /\b(near me|near|in \w+|city|town|location|hours|directions|open now)\b/i.test(k)).length;
  if (localKw / totalKw > 0.1) {
    scores.local = Math.min(60, 20 + Math.round((localKw / totalKw) * 100));
  }

  const saasKw = keywords.filter((k) => /\b(software|tool|app|platform|alternative|vs\b|comparison|pricing|free trial)\b/i.test(k)).length;
  if (saasKw / totalKw > 0.1) {
    scores.saas = Math.min(60, 20 + Math.round((saasKw / totalKw) * 100));
  }

  const healthKw = keywords.filter((k) => /\b(symptom|treatment|doctor|medical|health|diagnosis|medicine|therapy|clinic)\b/i.test(k)).length;
  if (healthKw / totalKw > 0.1) {
    scores.healthcare = Math.min(60, 20 + Math.round((healthKw / totalKw) * 100));
  }

  return scores;
}

function detectLanguages(pages: PageSignals[]): { primary: string; all: Array<{ code: string; percentage: number }>; isMulti: boolean } {
  const langCounts: Record<string, number> = {};
  let total = 0;

  for (const p of pages) {
    if (!p.isHtmlPage || p.statusCode !== 200) continue;
    const lang = String(p.language || '').split('-')[0].toLowerCase().trim();
    if (lang && lang.length >= 2 && lang.length <= 3) {
      langCounts[lang] = (langCounts[lang] || 0) + 1;
      total += 1;
    }
  }

  if (total === 0) {
    return { primary: 'unknown', all: [], isMulti: false };
  }

  const sorted = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => ({ code, percentage: Math.round((count / total) * 100) }));

  const primary = sorted[0]?.code || 'unknown';
  const isMulti = sorted.length > 1 && Number(sorted[1]?.percentage || 0) > 5;

  return { primary, all: sorted, isMulti };
}

function detectCms(pages: PageSignals[]): string | null {
  const cmsCounts: Record<string, number> = {};
  for (const p of pages) {
    if (p.cmsType) cmsCounts[p.cmsType] = (cmsCounts[p.cmsType] || 0) + 1;
  }
  const dominant = Object.entries(cmsCounts).sort((a, b) => b[1] - a[1])[0];
  return dominant ? dominant[0] : null;
}

const SIGNAL_WEIGHTS = {
  cms: 0.3,
  schema: 0.25,
  content: 0.25,
  url: 0.1,
  gsc: 0.1,
};

const ALL_INDUSTRIES: DetectedIndustry[] = [
  'ecommerce',
  'news',
  'blog',
  'local',
  'saas',
  'healthcare',
  'finance',
  'education',
  'real_estate',
  'restaurant',
  'portfolio',
  'job_board',
  'general',
];

export function detectSiteType(rawPages: PageSignals[]): SiteTypeResult {
  const pages = Array.isArray(rawPages) ? rawPages : [];
  const cmsScores = scoreByCms(pages);
  const schemaScores = scoreBySchema(pages);
  const contentScores = scoreByContentPatterns(pages);
  const urlScores = scoreByUrlStructure(pages);
  const gscScores = scoreByGscQueries(pages);

  const finalScores = {} as Record<DetectedIndustry, number>;
  for (const ind of ALL_INDUSTRIES) {
    finalScores[ind] = Math.round(
      (cmsScores[ind] || 0) * SIGNAL_WEIGHTS.cms +
      (schemaScores[ind] || 0) * SIGNAL_WEIGHTS.schema +
      (contentScores[ind] || 0) * SIGNAL_WEIGHTS.content +
      (urlScores[ind] || 0) * SIGNAL_WEIGHTS.url +
      (gscScores[ind] || 0) * SIGNAL_WEIGHTS.gsc
    );
  }

  const sorted = Object.entries(finalScores).sort((a, b) => b[1] - a[1]) as Array<[DetectedIndustry, number]>;
  const winner = sorted[0] || ['general', 0];

  const industry: DetectedIndustry = winner[1] >= 30 ? winner[0] : 'general';
  const confidence = winner[1] >= 30 ? Math.min(100, winner[1]) : 0;

  const lang = detectLanguages(pages);
  const cms = detectCms(pages);

  return {
    industry,
    confidence,
    allScores: finalScores,
    detectedLanguage: lang.primary,
    detectedLanguages: lang.all,
    detectedCms: cms,
    isMultiLanguage: lang.isMulti,
  };
}
