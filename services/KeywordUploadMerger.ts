import { crawlDb, type CrawledPage } from './CrawlDatabase';
import { UrlNormalization } from './UrlNormalization';

export interface KeywordUploadRow {
  url: string;
  keyword: string;
  volume: number;
}

export class KeywordUploadMerger {
  /**
   * Merges a list of uploaded keyword rows into the crawl database.
   * This overrides "mainKeyword" and "mainKwSearchVolume" with 'upload' source.
   */
  static async mergeFromCsv(crawlId: string, rows: KeywordUploadRow[]) {
    // 1. Get all pages for this crawl
    const pages = await crawlDb.pages.where('crawlId').equals(crawlId).toArray();
    
    // 2. Map pages by canonical URL for fast lookup
    const pageMap = new Map<string, CrawledPage>();
    pages.forEach(p => {
      pageMap.set(UrlNormalization.toCanonical(p.url), p);
    });

    const updates: Array<{ url: string } & Partial<CrawledPage>> = [];

    // 3. Match CSV rows to pages
    for (const row of rows) {
      const canonical = UrlNormalization.toCanonical(row.url);
      const page = pageMap.get(canonical);

      if (page) {
        updates.push({
          url: page.url,
          mainKeyword: row.keyword,
          mainKwSearchVolume: row.volume,
          mainKeywordSource: 'csv',
          volumeEstimationMethod: 'upload'
        });
      }
    }

    // 4. Bulk update
    if (updates.length > 0) {
      await crawlDb.transaction('rw', crawlDb.pages, async () => {
        for (const update of updates) {
          await crawlDb.pages.update(update.url, update);
        }
      });
    }

    return updates.length;
  }
}
