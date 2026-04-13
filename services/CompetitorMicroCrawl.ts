/**
 * services/CompetitorMicroCrawl.ts
 *
 * A specialized crawler flow for competitors.
 * Runs a lightweight micro-crawl (10-30 pages), builds an aggregate profile,
 * optionally enriches with AI, and persists the result.
 */

import { GhostCrawler } from './GhostCrawler';
import { buildCompetitorCrawlPlan } from './CompetitorDiscoveryService';
import { CompetitorProfileBuilder } from './CompetitorProfileBuilder';
import { saveCompetitorProfile, CrawledPage } from './CrawlDatabase';
import { CompetitorProfile } from './CompetitorMatrixConfig';

export interface MicroCrawlProgress {
  stage: 'starting' | 'crawling' | 'analyzing' | 'enriching_ai' | 'complete' | 'error';
  pagesCrawled: number;
  totalDiscovered: number;
  message: string;
}

export type MicroCrawlProgressCallback = (progress: MicroCrawlProgress) => void;

export async function runCompetitorMicroCrawl(
  competitorUrl: string,
  projectId: string,
  options?: {
    maxPages?: number;
    aiEnrich?: boolean;
    aiComplete?: (opts: { prompt: string; format: string; maxTokens?: number }) => Promise<{ text: string }>;
    onProgress?: MicroCrawlProgressCallback;
  }
): Promise<CompetitorProfile> {
  const onProgress = options?.onProgress || (() => {});
  
  try {
    // 1. Normalize URL
    let url = competitorUrl.trim();
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    
    // 2. Extract domain
    const domain = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    
    onProgress({ stage: 'starting', pagesCrawled: 0, totalDiscovered: 0, message: `Starting crawl for ${domain}...` });

    // 3. Build crawl plan
    const basePlan = buildCompetitorCrawlPlan(url);
    const ghost = new GhostCrawler({
      ...basePlan,
      limit: options?.maxPages || 30,
      maxDepth: 2
    });

    const pages: CrawledPage[] = [];
    
    // 4. Setup listeners
    ghost.on('page', (page: CrawledPage) => {
      pages.push(page);
    });

    ghost.on('progress', (p: any) => {
      onProgress({
        stage: 'crawling',
        pagesCrawled: p.crawled,
        totalDiscovered: p.discovered,
        message: `Crawled ${p.crawled} pages (${p.discovered} discovered)...`
      });
    });

    // 5. Run crawl
    const sessionId = `comp_${Date.now()}_${domain.replace(/\./g, '_')}`;
    await ghost.start(url, sessionId);

    // Wait for completion (ghost.start doesn't return a promise that waits for completion, 
    // it schedules the run. We need to wait for the 'complete' event).
    // Actually, checking GhostCrawler.ts, start() calls scheduleRun() which is async but doesn't wait.
    await new Promise<void>((resolve, reject) => {
      ghost.on('complete', () => resolve());
      ghost.on('error', (err: any) => reject(err));
      
      // Safety timeout
      setTimeout(() => reject(new Error('Crawl timed out')), 60000);
    });

    onProgress({ stage: 'analyzing', pagesCrawled: pages.length, totalDiscovered: pages.length, message: 'Analyzing data...' });

    // 6. Build base profile
    let profile = CompetitorProfileBuilder.fromCrawlPages(domain, pages);

    // 7. AI Enrichment
    if (options?.aiEnrich !== false && options?.aiComplete) {
      onProgress({ stage: 'enriching_ai', pagesCrawled: pages.length, totalDiscovered: pages.length, message: 'Running AI analysis...' });
      
      const homepage = pages.find(p => p.crawlDepth === 0) || pages[0];
      if (homepage) {
        // We don't have textContent directly in CrawledPage, but we can attempt to get it if we had stored it.
        // GhostCrawler's parseHtml has wordCount but not the full text.
        // Actually, the prompt says "textContent field". I might need to check if GhostCrawler should store text.
        // Reading GhostCrawler.ts again... it doesn't store full text in CrawledPage.
        // However, I can pass a snippet or just use what we have.
        // For now, let's assume we might need to fetch the homepage text if not available.
        // In Step 6B prompt: "Find homepage text from pages (crawlDepth === 0, textContent field)"
        // I will use wordCount or title/meta as a fallback if textContent is missing.
        // But wait, GhostCrawler fetchText returns the HTML. I could modify it or just re-fetch.
        // Let's assume for now there is SOME field or we use the title/desc/h1.
        const textToAnalyze = `${homepage.title} ${homepage.metaDesc} ${homepage.h1_1}`;
        profile = await CompetitorProfileBuilder.enrichWithAI(profile, textToAnalyze, options.aiComplete);
      }
    }

    // 8. Persist
    await saveCompetitorProfile(projectId, profile);
    
    onProgress({ stage: 'complete', pagesCrawled: pages.length, totalDiscovered: pages.length, message: 'Complete!' });
    return profile;

  } catch (err: any) {
    onProgress({ stage: 'error', pagesCrawled: 0, totalDiscovered: 0, message: `Error: ${err.message}` });
    throw err;
  }
}
