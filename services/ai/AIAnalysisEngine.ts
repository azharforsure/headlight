import { AIRouter } from './AIRouter';
import * as prompts from './tasks/prompts';

export interface PageAIResult {
  url: string;
  // t3-content-summary
  summary?: string;
  // t3-content-quality
  contentQualityScore?: number;
  contentStrengths?: string[];
  contentWeaknesses?: string[];
  // t3-content-intent
  searchIntent?: string;
  intentConfidence?: number;
  // t3-content-eeat
  eeatScore?: number;
  eeatBreakdown?: Record<string, number>;
  eeatSuggestions?: string[];
  // t3-keyword-extract
  extractedKeywords?: Array<{ phrase: string; intent: string; relevance: number }>;
  // t3-entity-extraction
  entities?: Array<{ name: string; type: string; count: number }>;
  // t3-topic-cluster
  topicCluster?: string;
  primaryTopic?: string;
  // t3-fix-suggestion
  fixSuggestions?: Array<{ fix: string; impact: string; effort: string; code?: string }>;
  // t3-content-sentiment
  sentiment?: string;
  // Meta rewrite (if meta is missing/poor)
  suggestedMeta?: string;
  // Errors during analysis
  errors?: string[];
}

export class AIAnalysisEngine {
  private router: AIRouter;

  constructor(router: AIRouter) {
    this.router = router;
  }

  // ─── Analyze a single page ────────────────────────
  async analyzePage(page: {
    url: string;
    title: string;
    metaDesc: string;
    h1_1: string;
    textContent: string;
    wordCount: number;
    issues: Array<{ id: string; label: string; detail?: string }>;
  }): Promise<PageAIResult> {
    const result: PageAIResult = { url: page.url, errors: [] };

    // 1. Summary (t3-content-summary)
    try {
      const resp = await this.router.complete(
        prompts.buildSummaryRequest(page.url, page.title, page.textContent)
      );
      result.summary = resp.text;
    } catch (e: any) { result.errors!.push(`summary: ${e.message}`); }

    // 2. Search intent (t3-content-intent)
    try {
      const resp = await this.router.complete(
        prompts.buildIntentRequest(page.url, page.title, page.metaDesc, page.h1_1)
      );
      const data = JSON.parse(resp.text);
      result.searchIntent = data.intent;
      result.intentConfidence = data.confidence;
    } catch (e: any) { result.errors!.push(`intent: ${e.message}`); }

    // 3. Content quality score (t3-content-quality) — only if 100+ words
    if (page.wordCount >= 100) {
      try {
        const resp = await this.router.complete(
          prompts.buildQualityScoreRequest(page.url, page.title, page.textContent, page.wordCount)
        );
        const data = JSON.parse(resp.text);
        result.contentQualityScore = data.quality;
        result.contentStrengths = data.strengths;
        result.contentWeaknesses = data.weaknesses;
      } catch (e: any) { result.errors!.push(`quality: ${e.message}`); }
    }

    // 4. Keyword extraction (t3-keyword-extract)
    if (page.wordCount >= 50) {
      try {
        const resp = await this.router.complete(
          prompts.buildKeywordExtractionRequest(page.url, page.title, page.textContent)
        );
        const data = JSON.parse(resp.text);
        result.extractedKeywords = data.keywords;
      } catch (e: any) { result.errors!.push(`keywords: ${e.message}`); }
    }

    // 5. Topic cluster (t3-topic-cluster)
    try {
      const resp = await this.router.complete(
        prompts.buildTopicClusterRequest(page.url, page.title, page.textContent)
      );
      const data = JSON.parse(resp.text);
      result.topicCluster = data.cluster;
      result.primaryTopic = data.primaryTopic;
    } catch (e: any) { result.errors!.push(`cluster: ${e.message}`); }

    // 6. EEAT Assessment (t3-content-eeat)
    if (page.wordCount >= 200) {
      try {
        const resp = await this.router.complete(
          prompts.buildEEATRequest(page.url, page.textContent, false, false) // signals could be improved
        );
        const data = JSON.parse(resp.text);
        result.eeatScore = data.overall;
        result.eeatSuggestions = data.suggestions;
        result.eeatBreakdown = {
          experience: data.experience,
          expertise: data.expertise,
          authoritativeness: data.authoritativeness,
          trustworthiness: data.trustworthiness
        };
      } catch (e: any) { result.errors!.push(`eeat: ${e.message}`); }
    }

    // 7. Fix suggestions for top issues (t3-fix-suggestion)
    if (page.issues.length > 0) {
      const topIssues = page.issues.slice(0, 3); // top 3 issues only
      const fixes: PageAIResult['fixSuggestions'] = [];
      for (const issue of topIssues) {
        try {
          const resp = await this.router.complete(
            prompts.buildFixSuggestionRequest(
              page.url, issue.label, issue.detail || '', page.textContent.slice(0, 500)
            )
          );
          fixes.push(JSON.parse(resp.text));
        } catch { /* skip individual fix failures */ }
      }
      result.fixSuggestions = fixes;
    }

    // 7. Meta rewrite if missing
    if (!page.metaDesc) {
      try {
        const keywords = result.extractedKeywords?.map(k => k.phrase) || [];
        const resp = await this.router.complete(
          prompts.buildMetaRewriteRequest(page.url, page.title, '', keywords, page.textContent)
        );
        const data = JSON.parse(resp.text);
        result.suggestedMeta = data.metaDescription;
      } catch (e: any) { result.errors!.push(`meta: ${e.message}`); }
    }

    return result;
  }

  // ─── Batch analyze all pages ──────────────────────
  async analyzePages(
    pages: Array<Parameters<AIAnalysisEngine['analyzePage']>[0]>,
    onProgress?: (done: number, total: number, currentUrl: string) => void
  ): Promise<PageAIResult[]> {
    const results: PageAIResult[] = [];

    // Process pages sequentially with small delay to respect rate limits
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      onProgress?.(i, pages.length, page.url);

      const result = await this.analyzePage(page);
      results.push(result);

      // Small delay between pages (100ms)
      if (i < pages.length - 1) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    onProgress?.(pages.length, pages.length, 'Complete');
    return results;
  }

  // ─── Generate crawl narrative ─────────────────────
  async generateCrawlNarrative(stats: Parameters<typeof prompts.buildCrawlNarrativeRequest>[0]): Promise<string> {
    const resp = await this.router.complete(prompts.buildCrawlNarrativeRequest(stats));
    return resp.text;
  }
}
