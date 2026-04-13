/**
 * services/CompetitorProfileBuilder.ts
 *
 * Logic for building, enriching, and merging CompetitorProfile objects
 * from various data sources (crawls, AI, manual input).
 */

import { CompetitorProfile, createEmptyProfile } from './CompetitorMatrixConfig';
import type { CrawledPage } from './CrawlDatabase';
import {
  getRootPage,
  countSocialProfiles,
  extractRecentContentCount
} from './checks/tier4/competitor';

export class CompetitorProfileBuilder {
  /**
   * Build a profile from an array of CrawledPage objects.
   * Works for BOTH your own site and competitor micro-crawl results.
   * This is the primary extraction method.
   */
  static fromCrawlPages(domain: string, pages: CrawledPage[]): CompetitorProfile {
    const profile = createEmptyProfile(domain);
    if (!pages || pages.length === 0) return profile;

    const rootPage = getRootPage(pages) as CrawledPage;
    const blogPattern = /(blog|news|articles|insights|resources|learn)/i;
    const productPattern = /(product|shop|store|item|collection|category)/i;
    const landingPattern = /(landing|lp-|offer|promo|campaign)/i;
    const localPattern = /(locations?|service-area|near-me|city-name)/i;

    const blogPages = pages.filter(p => blogPattern.test(p.url));
    const productPages = pages.filter(p => productPattern.test(p.url) && p.crawlDepth > 0);
    const htmlPages = pages.filter(p => p.isHtmlPage);

    // 1. blogUrl
    const firstBlog = blogPages[0];
    profile.blogUrl = firstBlog ? firstBlog.url : null;

    // 2. isActivelyBlogging
    profile.isActivelyBlogging = extractRecentContentCount(pages, 90) > 0;

    // 3. blogPostsPerMonth
    const contentPages = blogPages.filter(p => p.wordCount >= 300);
    if (contentPages.length > 0) {
      // Very rough estimation: if we see 20 pages in a 20-page micro-crawl, we can't really tell frequency.
      // But if we have dates, we use them. extractRecentContentCount already filters by 90 days.
      const recentCount = extractRecentContentCount(contentPages, 365);
      profile.blogPostsPerMonth = Math.round((recentCount / 12) * 10) / 10 || (contentPages.length > 5 ? 2 : 0);
    }

    // 4. avgImagesPerArticle
    if (blogPages.length > 0) {
      const totalImages = blogPages.reduce((sum, p) => sum + (p.imageCount || 0), 0);
      profile.avgImagesPerArticle = Math.round(totalImages / blogPages.length);
    }

    // 5. embedsVideoInArticles
    profile.embedsVideoInArticles = blogPages.some(p => p.hasEmbeddedVideo || p.schemaTypes?.includes('VideoObject'));

    // 6. avgWordsPerArticle
    const wordyArticles = blogPages.filter(p => p.wordCount >= 100);
    if (wordyArticles.length > 0) {
      const totalWords = wordyArticles.reduce((sum, p) => sum + (p.wordCount || 0), 0);
      profile.avgWordsPerArticle = Math.round(totalWords / wordyArticles.length);
    }

    // 7. topBlogPages
    profile.topBlogPages = blogPages
      .sort((a, b) => (b.gscClicks || 0) - (a.gscClicks || 0) || (b.gscImpressions || 0) - (a.gscImpressions || 0) || (b.inlinks || 0) - (a.inlinks || 0))
      .slice(0, 3)
      .map(p => ({ url: p.url, title: p.title || '', traffic: p.gscClicks || undefined }));

    // 8. topEcomPages
    profile.topEcomPages = productPages
      .sort((a, b) => (b.gscClicks || 0) - (a.gscClicks || 0) || (b.gscImpressions || 0) - (a.gscImpressions || 0) || (b.inlinks || 0) - (a.inlinks || 0))
      .slice(0, 3)
      .map(p => ({ url: p.url, title: p.title || '', traffic: p.gscClicks || undefined }));

    // 9. topOrganicPages
    profile.topOrganicPages = htmlPages
      .sort((a, b) => (b.gscClicks || 0) - (a.gscClicks || 0))
      .slice(0, 3)
      .map(p => ({ url: p.url, title: p.title || '', traffic: p.gscClicks || undefined }));

    // 10. productPageAvgWordCount
    if (productPages.length > 0) {
      const totalWords = productPages.reduce((sum, p) => sum + (p.wordCount || 0), 0);
      profile.productPageAvgWordCount = Math.round(totalWords / productPages.length);
    }

    // 11. onPageSeoQuality
    if (rootPage) {
      let score = 0;
      if (rootPage.title) score++;
      if (rootPage.metaDesc) score++;
      if (rootPage.h1_1) score++;
      if (rootPage.hasOrgSchema || rootPage.hasBreadcrumbSchema) score++;
      if (rootPage.imageCount > 0 && rootPage.imagesWithoutAlt === 0) score++;
      if (rootPage.wordCount > 300) score++;

      if (score >= 5) profile.onPageSeoQuality = 'Good';
      else if (score >= 3) profile.onPageSeoQuality = 'Average';
      else profile.onPageSeoQuality = 'Poor';
    }

    // 12. hasSchemaOnProducts
    profile.hasSchemaOnProducts = pages.some(p => p.hasProductSchema || p.schemaTypes?.includes('Product'));

    // 13. hasTargetedLandingPages
    profile.hasTargetedLandingPages = pages.some(p => landingPattern.test(p.url));

    // 14. hasEmailOptIn
    profile.hasEmailOptIn = !!(rootPage?.hasEmailOptIn || rootPage?.industrySignals?.hasEmailOptIn);

    // 15. hasOptimizedLocalPages
    profile.hasOptimizedLocalPages = pages.some(p => localPattern.test(p.url));

    // 16. cmsType
    profile.cmsType = rootPage?.cmsType || null;

    // 17. techStackSignals
    const stack = new Set<string>();
    if (profile.cmsType) stack.add(profile.cmsType);
    pages.forEach(p => {
      if (p.industrySignals?.techStack) {
        Object.keys(p.industrySignals.techStack).forEach(t => stack.add(t));
      }
    });
    profile.techStackSignals = Array.from(stack);

    // 18. overallSeoScore
    const scores = htmlPages.map(p => p.techHealthScore).filter(s => s !== null) as number[];
    if (scores.length > 0) {
      profile.overallSeoScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    // 19. pagesIndexed
    profile.pagesIndexed = pages.filter(p => p.indexable !== false && p.statusCode === 200).length;

    // 20. Authority markers
    profile.referringDomains = Math.max(...pages.map(p => p.referringDomains || 0));
    profile.urlRating = Math.max(...pages.map(p => p.urlRating || 0));

    // 21. Social Presence
    if (rootPage?.socialLinks) {
       // Just check presence from the map
       if (rootPage.socialLinks.facebook) profile.facebookUrl = `https://facebook.com/${domain}`;
       if (rootPage.socialLinks.twitter || rootPage.socialLinks.x) profile.twitterUrl = `https://twitter.com/${domain}`;
       if (rootPage.socialLinks.instagram) profile.instagramUrl = `https://instagram.com/${domain}`;
       if (rootPage.socialLinks.youtube) profile.youtubeUrl = `https://youtube.com/${domain}`;
    }

    profile._meta = {
      crawledAt: Date.now(),
      aiAnalyzedAt: null,
      manualEditedAt: null,
      pagesCrawled: pages.length,
      source: 'micro-crawl'
    };

    return profile;
  }

  /**
   * Enrich a profile with AI analysis of the homepage content.
   * Extracts: businessName, valueProposition, employeeCountEstimate,
   * optInOffer, contentQualityAssessment, shippingOffers.
   */
  static async enrichWithAI(
    profile: CompetitorProfile,
    homepageText: string,
    aiComplete: (opts: { prompt: string; format: string; maxTokens?: number }) => Promise<{ text: string }>
  ): Promise<CompetitorProfile> {
    try {
      const truncatedText = homepageText.slice(0, 3000);
      const prompt = `Analyze this business homepage and extract the following information as JSON:
- businessName: The company/brand name
- valueProposition: Their main USP in one sentence
- employeeCountEstimate: Estimated team size bracket ("1-10", "11-50", "51-200", "201-500", "500+") based on about/team page signals, or null if unknown
- contentQualityAssessment: Overall content quality ("Excellent", "Good", "Average", "Poor")
- optInOffer: What they offer for email signup (e.g., "Free ebook", "10% discount", "Newsletter"), or null
- shippingOffers: Shipping offers mentioned (e.g., "Free shipping over $50"), or null

Homepage text:
${truncatedText}

Return JSON only: { "businessName": ..., "valueProposition": ..., "employeeCountEstimate": ..., "contentQualityAssessment": ..., "optInOffer": ..., "shippingOffers": ... }`;

      const response = await aiComplete({ prompt, format: 'json', maxTokens: 500 });
      const data = JSON.parse(response.text);

      if (data.businessName) profile.businessName = data.businessName;
      if (data.valueProposition) profile.valueProposition = data.valueProposition;
      if (data.employeeCountEstimate) profile.employeeCountEstimate = data.employeeCountEstimate;
      if (data.contentQualityAssessment) profile.contentQualityAssessment = data.contentQualityAssessment;
      if (data.optInOffer) profile.optInOffer = data.optInOffer;
      if (data.shippingOffers) profile.shippingOffers = data.shippingOffers;

      profile._meta.aiAnalyzedAt = Date.now();
    } catch (err) {
      console.error('[CompetitorProfileBuilder] AI Enrichment failed:', err);
    }
    return profile;
  }

  /**
   * Apply manual overrides. Only sets non-null values from the partial.
   * Used when the user edits a cell in the matrix.
   */
  static applyManualEdits(
    profile: CompetitorProfile,
    edits: Partial<CompetitorProfile>
  ): CompetitorProfile {
    const updated = { ...profile };
    Object.keys(edits).forEach(key => {
      const k = key as keyof CompetitorProfile;
      if (edits[k] !== undefined) {
        (updated as any)[k] = edits[k];
      }
    });
    updated._meta = { ...updated._meta, manualEditedAt: Date.now() };
    return updated;
  }

  /**
   * Merge multiple partial profiles. Later sources override earlier ones
   * (only for non-null values). _meta is merged specially.
   */
  static merge(base: CompetitorProfile, ...overlays: Partial<CompetitorProfile>[]): CompetitorProfile {
    let result = { ...base };

    for (const overlay of overlays) {
      Object.keys(overlay).forEach(key => {
        if (key === '_meta') return;
        
        const k = key as keyof CompetitorProfile;
        const val = overlay[k];
        
        if (val !== null && val !== undefined) {
          if (Array.isArray(val)) {
            if (val.length > 0) (result as any)[k] = val;
          } else {
            (result as any)[k] = val;
          }
        }
      });

      if (overlay._meta) {
        result._meta = {
          ...result._meta,
          crawledAt: overlay._meta.crawledAt || result._meta.crawledAt,
          aiAnalyzedAt: overlay._meta.aiAnalyzedAt || result._meta.aiAnalyzedAt,
          manualEditedAt: overlay._meta.manualEditedAt || result._meta.manualEditedAt,
          pagesCrawled: overlay._meta.pagesCrawled || result._meta.pagesCrawled,
          source: overlay._meta.source || result._meta.source
        };
      }
    }

    return result;
  }
}
