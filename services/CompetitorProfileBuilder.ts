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
import type { CompetitiveBrief } from './CompetitorModeTypes';

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
    profile.socialTotalFollowers =
      (profile.facebookFans || 0) +
      (profile.twitterFollowers || 0) +
      (profile.youtubeSubscribers || 0) +
      (profile.instagramFollowers || 0);
    const socialActivity =
      (profile.facebookUpdatesPerMonth || 0) +
      (profile.twitterUpdatesPerMonth || 0) +
      (profile.youtubeUpdatesPerMonth || 0);
    profile.socialGrowthRate = socialActivity > 0 ? Math.min(100, socialActivity * 2) : null;

    profile._meta = {
      crawledAt: Date.now(),
      aiAnalyzedAt: null,
      manualEditedAt: null,
      pagesCrawled: pages.length,
      source: 'micro-crawl'
    };

    // ═══ NEW: Consolidated scores ═══

    // ── Search Visibility ──
    const allGscClicks = htmlPages.reduce((sum, p) => sum + (p.gscClicks || 0), 0);
    const allGscImpressions = htmlPages.reduce((sum, p) => sum + (p.gscImpressions || 0), 0);
    profile.estimatedOrganicTraffic = allGscClicks || null;

    const pagesWithPosition = htmlPages.filter(p => p.gscPosition && p.gscPosition > 0);
    if (pagesWithPosition.length > 0) {
      const posSum = pagesWithPosition.reduce((sum, p) => sum + (p.gscPosition || 0), 0);
      profile.avgOrganicPosition = Math.round((posSum / pagesWithPosition.length) * 10) / 10;
      profile.keywordsInTop3 = pagesWithPosition.filter(p => (p.gscPosition || 100) <= 3).length;
      profile.keywordsInTop10 = pagesWithPosition.filter(p => (p.gscPosition || 100) <= 10).length;
      profile.keywordsInTop20 = pagesWithPosition.filter(p => (p.gscPosition || 100) <= 20).length;
      profile.totalRankingKeywords = pagesWithPosition.length;
    }

    // Branded traffic % — rough heuristic: pages where main keyword contains the domain name
    const domainRoot = domain.split('.')[0].toLowerCase();
    const brandedPages = pagesWithPosition.filter(p =>
      (p.mainKeyword || '').toLowerCase().includes(domainRoot)
    );
    if (pagesWithPosition.length > 0) {
      const brandedClicks = brandedPages.reduce((s, p) => s + (p.gscClicks || 0), 0);
      profile.brandedTrafficPct = allGscClicks > 0 
        ? Math.round((brandedClicks / allGscClicks) * 100)
        : null;
    }

    // Heuristic Share of Voice: Ratio of Top 10 keywords to total pages crawled
    if (profile.keywordsInTop10 && pages.length > 0) {
      profile.shareOfVoice = Math.min(100, Math.round((profile.keywordsInTop10 / pages.length) * 100));
    }
    profile.keywordOverlapPct = profile.totalRankingKeywords
      ? Math.round(((profile.keywordsInTop10 || 0) / Math.max(1, profile.totalRankingKeywords)) * 100)
      : null;
    profile.topGrowingKeywords = pagesWithPosition
      .sort((a, b) => (b.sessionsDelta || 0) - (a.sessionsDelta || 0))
      .map((p) => p.mainKeyword)
      .filter(Boolean)
      .slice(0, 3) as string[];

    // ── Content Depth & Quality ──
    const indexablePages = pages.filter(p => p.indexable !== false && p.statusCode === 200 && p.isHtmlPage);
    profile.totalIndexablePages = indexablePages.length;

    // SERP Features: Pages with schema that triggers rich results
    profile.serpFeatureCount = indexablePages.filter(p => 
      p.hasProductSchema || p.hasFaqSchema || p.hasReviewSchema || p.hasRecipeSchema || p.hasVideoSchema
    ).length || null;

    if (indexablePages.length > 0) {
      const totalWords = indexablePages.reduce((s, p) => s + (p.wordCount || 0), 0);
      profile.avgContentLength = Math.round(totalWords / indexablePages.length);
    }

    // Content freshness: % of pages with visibleDate or lastModified within 6 months
    const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;
    const freshPages = indexablePages.filter(p => {
      const ts = Date.parse(p.visibleDate || p.lastModified || '');
      return Number.isFinite(ts) && ts >= sixMonthsAgo;
    });
    profile.contentFreshnessScore = indexablePages.length > 0
      ? Math.round((freshPages.length / indexablePages.length) * 100)
      : null;

    // Topic coverage breadth (count unique topicCluster values)
    const clusters = new Set(indexablePages.map(p => p.topicCluster).filter(Boolean));
    profile.topicCoverageBreadth = clusters.size || null;

    // Content efficiency
    if (profile.totalIndexablePages && profile.totalIndexablePages > 0 && allGscClicks > 0) {
      profile.contentEfficiency = Math.round(allGscClicks / profile.totalIndexablePages);
    }

    // Duplicate %
    const duplicates = indexablePages.filter(p => p.exactDuplicate || p.nearDuplicateMatch);
    profile.duplicateContentPct = indexablePages.length > 0
      ? Math.round((duplicates.length / indexablePages.length) * 100)
      : null;

    // Thin content %
    const thinPages = indexablePages.filter(p => (p.wordCount || 0) < 300);
    profile.thinContentPct = indexablePages.length > 0
      ? Math.round((thinPages.length / indexablePages.length) * 100)
      : null;

    // Schema coverage %
    const schemaPages = indexablePages.filter(p => p.schemaTypes && p.schemaTypes.length > 0);
    profile.schemaCoveragePct = indexablePages.length > 0
      ? Math.round((schemaPages.length / indexablePages.length) * 100)
      : null;

    // FAQ/HowTo count
    profile.faqHowToCount = indexablePages.filter(p =>
      p.schemaTypes?.includes('FAQPage') ||
      p.schemaTypes?.includes('HowTo') ||
      p.hasQuestionFormat
    ).length || null;
    profile.recentNewPages = indexablePages.filter((p) => {
      const ts = Date.parse(p.visibleDate || '');
      return Number.isFinite(ts) && ts >= (Date.now() - 30 * 24 * 60 * 60 * 1000);
    }).length || null;
    const pageAges = indexablePages
      .map((p) => Date.parse(p.visibleDate || p.lastModified || ''))
      .filter((ts) => Number.isFinite(ts))
      .map((ts) => (Date.now() - ts) / (30 * 24 * 60 * 60 * 1000));
    profile.averagePageAge = pageAges.length > 0
      ? Math.round(pageAges.reduce((sum, age) => sum + age, 0) / pageAges.length)
      : null;
    if (indexablePages.length > 0) {
      const recent90 = indexablePages.filter((p) => {
        const ts = Date.parse(p.visibleDate || p.lastModified || '');
        return Number.isFinite(ts) && ts >= (Date.now() - 90 * 24 * 60 * 60 * 1000);
      }).length;
      const older90 = indexablePages.filter((p) => {
        const ts = Date.parse(p.visibleDate || p.lastModified || '');
        return Number.isFinite(ts) && ts < (Date.now() - 90 * 24 * 60 * 60 * 1000);
      }).length;
      if (older90 > 0) {
        profile.contentVelocityTrend = Math.round(((recent90 - older90) / older90) * 100);
      }
    }

    // ── Technical Health ──
    const techScores = indexablePages.map(p => p.techHealthScore).filter((s): s is number => s !== null && s !== undefined);
    profile.techHealthScore = techScores.length > 0
      ? Math.round(techScores.reduce((a, b) => a + b, 0) / techScores.length)
      : null;

    // CWV pass rate
    const cwvPages = indexablePages.filter(p => p.lcp !== null && p.lcp !== undefined);
    const cwvPassing = cwvPages.filter(p =>
      (p.lcp || 0) <= 2500 &&
      (p.cls || 0) <= 0.1 &&
      (p.inp || 0) <= 200
    );
    profile.cwvPassRate = cwvPages.length > 0
      ? Math.round((cwvPassing.length / cwvPages.length) * 100)
      : null;

    // Mobile friendliness (use lighthouse accessibility as proxy if available)
    const mobileLhScores = indexablePages
      .map(p => p.lighthouseAccessibility)
      .filter((s): s is number => s !== null && s !== undefined);
    profile.mobileFriendlinessScore = mobileLhScores.length > 0
      ? Math.round(mobileLhScores.reduce((a, b) => a + b, 0) / mobileLhScores.length)
      : null;

    // Security grade
    if (rootPage) {
      const hasHttps = rootPage.statusCode === 200; // server crawler only gets https
      const hasHsts = !!(rootPage as any).hasHsts;
      const hasCsp = !!(rootPage as any).hasCsp;
      const secScore = (hasHttps ? 40 : 0) + (hasHsts ? 25 : 0) + (hasCsp ? 20 : 0) +
        ((rootPage as any).sslGrade === 'A' ? 15 : (rootPage as any).sslGrade === 'B' ? 10 : 5);
      profile.securityGrade = secScore >= 85 ? 'A' : secScore >= 65 ? 'B' : secScore >= 45 ? 'C' : secScore >= 25 ? 'D' : 'F';
    }

    // Crawlability score
    const robotsOk = indexablePages.filter(p => p.indexable !== false).length;
    const inSitemap = indexablePages.filter(p => p.inSitemap).length;
    const depthOk = indexablePages.filter(p => (p.crawlDepth || 0) <= 3).length;
    profile.crawlabilityScore = indexablePages.length > 0
      ? Math.round(((robotsOk + inSitemap + depthOk) / (indexablePages.length * 3)) * 100)
      : null;

    // Site speed score (avg lighthouse performance)
    const perfScores = indexablePages
      .map(p => p.lighthousePerformance)
      .filter((s): s is number => s !== null && s !== undefined);
    profile.siteSpeedScore = perfScores.length > 0
      ? Math.round(perfScores.reduce((a, b) => a + b, 0) / perfScores.length)
      : null;

    // JS render dependency %
    const jsDepPages = indexablePages.filter(p => p.jsRenderDiff?.criticalContentJsOnly);
    profile.jsRenderDependencyPct = indexablePages.length > 0
      ? Math.round((jsDepPages.length / indexablePages.length) * 100)
      : null;

    // ── AI Discoverability ──
    const geoScores = indexablePages.map(p => p.geoScore).filter((s): s is number => s !== null && s !== undefined);
    profile.avgGeoScore = geoScores.length > 0
      ? Math.round(geoScores.reduce((a, b) => a + b, 0) / geoScores.length)
      : null;

    const citationScores = indexablePages.map(p => p.citationWorthiness).filter((s): s is number => s !== null && s !== undefined);
    profile.avgCitationWorthiness = citationScores.length > 0
      ? Math.round(citationScores.reduce((a, b) => a + b, 0) / citationScores.length)
      : null;

    profile.hasLlmsTxt = rootPage ? !!(rootPage as any).hasLlmsTxt : null;

    // AI bot access policy
    if (rootPage && (rootPage as any).aiBotAccess) {
      const access = (rootPage as any).aiBotAccess;
      const blocked = Object.values(access).every(v => v === 'blocked' || v === 'disallow');
      const open = Object.values(access).every(v => v === 'allow');
      profile.aiBotAccessPolicy = blocked ? 'blocked' : open ? 'open' : 'partial';
    }

    const passageReady = indexablePages.filter(p => (p.passageReadiness || 0) >= 60);
    profile.passageReadyPct = indexablePages.length > 0
      ? Math.round((passageReady.length / indexablePages.length) * 100)
      : null;

    const snippetReady = indexablePages.filter(p => p.hasFeaturedSnippetPatterns || p.answerBoxReady);
    profile.featuredSnippetReadyPct = indexablePages.length > 0
      ? Math.round((snippetReady.length / indexablePages.length) * 100)
      : null;

    // ── User Experience & Conversion ──
    const bouncePages = indexablePages.filter(p => p.ga4BounceRate !== null && p.ga4BounceRate !== undefined);
    if (bouncePages.length > 0) {
      profile.avgBounceRate = Math.round(
        (bouncePages.reduce((s, p) => s + (p.ga4BounceRate || 0), 0) / bouncePages.length) * 100
      );
    }

    const sessionPages = indexablePages.filter(p => p.ga4EngagementTimePerPage || p.ga4AvgSessionDuration);
    if (sessionPages.length > 0) {
      profile.avgSessionDuration = Math.round(
        sessionPages.reduce((s, p) => s + (p.ga4EngagementTimePerPage || p.ga4AvgSessionDuration || 0), 0) / sessionPages.length
      );
    }

    // Conversion path count — pages matching known conversion patterns
    const conversionPatterns = /(signup|register|checkout|contact|demo|trial|pricing|quote|get-started|book)/i;
    profile.conversionPathCount = indexablePages.filter(p => conversionPatterns.test(p.url)).length || null;

    // CTA density
    const ctaPages = indexablePages.filter(p => p.ctaTexts && p.ctaTexts.length > 0);
    profile.ctaDensityScore = indexablePages.length > 0
      ? Math.min(100, Math.round((ctaPages.length / indexablePages.length) * 100))
      : null;

    // Email opt-in quality
    if (rootPage) {
      const hasOptIn = profile.hasEmailOptIn;
      const hasOffer = profile.optInOffer;
      profile.emailOptInQuality = hasOptIn && hasOffer ? 'Strong' : hasOptIn ? 'Basic' : 'None';
    }

    // Trust signal score
    if (rootPage) {
      let trust = 0;
      if ((rootPage as any).privacyPageLinked) trust += 15;
      if ((rootPage as any).termsPageLinked) trust += 15;
      if ((rootPage as any).hasCookieBanner) trust += 10;
      if ((rootPage as any).hasTestimonials) trust += 15;
      if ((rootPage as any).hasCaseStudies) trust += 15;
      if ((rootPage as any).hasCustomerLogos) trust += 15;
      if ((rootPage as any).hasTrustBadges) trust += 15;
      profile.trustSignalScore = Math.min(100, trust);
    }

    // ── Threat & Opportunity ──
    const avgScore = profile.overallSeoScore || 50;
    const traffic = profile.estimatedOrganicTraffic || 0;
    
    if (traffic > 1000 && avgScore > 80) profile.threatLevel = 'Critical';
    else if (traffic > 500 || avgScore > 70) profile.threatLevel = 'High';
    else if (traffic > 100 || avgScore > 50) profile.threatLevel = 'Moderate';
    else profile.threatLevel = 'Low';

    profile.opportunityAgainstThem = Math.max(0, 100 - avgScore);

    return profile;

  }

  /**
   * AI-enrichment logic: Extracts business intelligence from homepage text.
   */
  static async fromAiAnalysis(
    domain: string,
    homepageText: string,
    aiComplete: (opts: { prompt: string; format: string; maxTokens?: number }) => Promise<{ text: string }>
  ): Promise<Partial<CompetitorProfile>> {
    try {
      const prompt = `Analyze this business homepage and extract competitive intelligence.

Domain: ${domain}
Homepage text (first 3000 chars):
${homepageText.substring(0, 3000)}

Return JSON with these fields (use null if not determinable):
{
  "businessName": "Company name",
  "valueProposition": "Their main USP in one sentence",
  "employeeCountEstimate": "1-10" | "11-50" | "51-200" | "201-500" | "500+" | null,
  "isActivelyBlogging": boolean,
  "contentQualityAssessment": "Excellent" | "Good" | "Average" | "Poor",
  "hasEmailOptIn": boolean,
  "optInOffer": "Description of opt-in offer or null",
  "shippingOffers": "Free shipping / flat rate / etc or null",
  "onPageSeoQuality": "Good" | "Average" | "Poor",
  "topContentTypeByShares": "Blog posts" | "Guides" | "Videos" | "Tools" | null,
  "emailOptInQuality": "Strong" | "Basic" | "None",
  "topicCoverageBreadth": number or null (estimated unique content topics/categories visible)
}`;

      const response = await aiComplete({ prompt, format: 'json', maxTokens: 600 });
      return JSON.parse(response.text);
    } catch (err) {
      console.error('[CompetitorProfileBuilder] AI Analysis failed:', err);
      return {};
    }
  }


  /**
   * Generates a profile for the current site from a crawl session.
   */
  static fromOwnCrawlSession(
    pages: CrawledPage[],
    domain: string
  ): CompetitorProfile {
    const crawlProfile = this.fromCrawlPages(domain, pages);
    return this.merge(
      createEmptyProfile(domain),
      crawlProfile,
      { businessName: 'Our Site' }
    );
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
   * Merges multiple partial profiles in order. First non-null wins.
   */
  static merge(...partials: Partial<CompetitorProfile>[]): CompetitorProfile {
    const base = createEmptyProfile('');
    for (const partial of partials) {
      for (const [key, value] of Object.entries(partial)) {
        if (value !== null && value !== undefined) {
          (base as any)[key] = value;
        }
      }
    }
    return base;
  }

  /**
   * Generates an AI-written competitive brief comparing your profile vs competitors.
   */
  static async generateCompetitiveBrief(
    yourProfile: CompetitorProfile,
    competitorProfiles: CompetitorProfile[],
    aiComplete: (opts: { prompt: string; format: string; maxTokens?: number }) => Promise<{ text: string }>
  ): Promise<Omit<CompetitiveBrief, 'generatedAt'>> {
    const profileSummary = (p: CompetitorProfile) => `
Domain: ${p.domain}
SEO Score: ${p.overallSeoScore || 'N/A'}
Referring Domains: ${p.referringDomains || 'N/A'}
Pages Indexed: ${p.pagesIndexed || 'N/A'}
Blog Posts/Month: ${p.blogPostsPerMonth || 'N/A'}
Avg Words/Article: ${p.avgWordsPerArticle || 'N/A'}
Content Quality: ${p.contentQualityAssessment || 'N/A'}
CMS: ${p.cmsType || 'N/A'}
Tech Health: ${p.techHealthScore || 'N/A'}
Has Pricing Page: ${p.hasTargetedLandingPages ? 'Yes' : 'No'}
Social Presence: FB:${!!p.facebookUrl}, TW:${!!p.twitterUrl}, YT:${!!p.youtubeUrl}, IG:${!!p.instagramUrl}
Value Proposition: ${p.valueProposition || 'Unknown'}
On-Page SEO Quality: ${p.onPageSeoQuality || 'N/A'}
URL Rating: ${p.urlRating || 'N/A'}
GEO Score: ${(p as any).avgGeoScore || 'N/A'}`.trim();

    const prompt = `You are a senior competitive intelligence analyst for SEO and digital strategy.

Analyze the following competitive landscape and produce a strategic brief.

## OUR SITE
${profileSummary(yourProfile)}

## COMPETITORS
${competitorProfiles.map((c, i) => `### Competitor ${i + 1}\n${profileSummary(c)}`).join('\n\n')}

## OUTPUT FORMAT
Return a JSON object with this exact structure:
{
  "executiveSummary": "2-3 sentence strategic overview of competitive position",
  "competitorAnalyses": [
    {
      "domain": "competitor domain",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "strategy": "One sentence describing their apparent strategy",
      "threatLevel": "low" | "medium" | "high"
    }
  ],
  "topAdvantages": ["Our advantage 1", "Our advantage 2", "Our advantage 3"],
  "topVulnerabilities": ["Our vulnerability 1", "Our vulnerability 2", "Our vulnerability 3"],
  "recommendedActions": [
    {
      "priority": "P0" | "P1" | "P2",
      "action": "What to do",
      "rationale": "Why",
      "estimatedEffort": "e.g. 2 weeks"
    }
  ],
  "overallThreatLevel": "low" | "moderate" | "high" | "critical",
  "competitivePosition": "1st" | "2nd" | "3rd" | "4th" | "5th+"
}`;

    try {
      const response = await aiComplete({ prompt, format: 'json', maxTokens: 1500 });
      return JSON.parse(response.text);
    } catch (err) {
      console.error('[CompetitorProfileBuilder] Brief generation failed:', err);
      return {
        executiveSummary: 'Unable to generate brief. Run a crawl with AI enabled and try again.',
        competitorAnalyses: [],
        topAdvantages: [],
        topVulnerabilities: [],
        recommendedActions: [],
        overallThreatLevel: 'low',
        competitivePosition: 'Unknown'
      };
    }
  }
}
