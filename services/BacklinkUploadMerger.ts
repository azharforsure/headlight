import { crawlDb, type CrawledPage } from './CrawlDatabase';
import { UrlNormalization } from './UrlNormalization';

export interface BacklinkUploadRow {
  url: string;
  referringDomains: number;
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

    const updates: Array<{ url: string } & Partial<CrawledPage>> = [];

    for (const row of rows) {
        const canonical = UrlNormalization.toCanonical(row.url);
        const page = pageMap.get(canonical);

        if (page) {
            updates.push({
                url: page.url,
                referringDomains: row.referringDomains,
                backlinkSource: 'csv',
                backlinkUploadOverride: true
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
