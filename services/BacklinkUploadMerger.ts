import { crawlDb, type CrawledPage } from './CrawlDatabase';
import { UrlNormalization } from './UrlNormalization';

export interface BacklinkUploadRow {
  url: string;
  referringDomains: number;
  backlinks: number;
  urlRating: number;
}

export class BacklinkUploadMerger {
  /**
   * Merges uploaded backlink counts into the database.
   */
  static async mergeFromCsv(crawlId: string, rows: BacklinkUploadRow[]) {
    const pages = await crawlDb.pages.where('crawlId').equals(crawlId).toArray();
    const pageMap = new Map<string, CrawledPage>();
    
    pages.forEach(p => {
        pageMap.set(UrlNormalization.toCanonical(p.url), p);
    });

    const strongestByCanonical = new Map<string, BacklinkUploadRow>();

    for (const row of rows) {
      const canonical = UrlNormalization.toCanonical(row.url);
      const existing = strongestByCanonical.get(canonical);
      if (
        !existing ||
        (row.referringDomains || 0) > (existing.referringDomains || 0) ||
        (row.backlinks || 0) > (existing.backlinks || 0) ||
        (row.urlRating || 0) > (existing.urlRating || 0)
      ) {
        strongestByCanonical.set(canonical, row);
      }
    }

    const updates: Array<{ url: string } & Partial<CrawledPage>> = [];

    for (const [canonical, row] of strongestByCanonical.entries()) {
      const page = pageMap.get(canonical);

      if (page) {
        updates.push({
          url: page.url,
          referringDomains: row.referringDomains,
          backlinks: row.backlinks || null,
          urlRating: row.urlRating || null,
          backlinkSource: 'upload',
          backlinkUploadOverride: true,
          backlinkEnrichedAt: Date.now()
        });
      }
    }

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
