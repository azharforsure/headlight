import { crawlDb, type CrawledPage } from './CrawlDatabase';
import { UrlNormalization } from './UrlNormalization';

export interface KeywordUploadRow {
  url: string;
  keyword: string;
  volume: number;
  position: number;
  traffic: number;
}

export class KeywordUploadMerger {
  private static chooseStrategicRow(rows: KeywordUploadRow[]): KeywordUploadRow {
    return [...rows].sort((left, right) => {
      if ((right.traffic || 0) !== (left.traffic || 0)) return (right.traffic || 0) - (left.traffic || 0);
      if ((right.volume || 0) !== (left.volume || 0)) return (right.volume || 0) - (left.volume || 0);
      const leftPos = left.position > 0 ? left.position : Number.POSITIVE_INFINITY;
      const rightPos = right.position > 0 ? right.position : Number.POSITIVE_INFINITY;
      return leftPos - rightPos;
    })[0];
  }

  private static chooseBestRankingRow(rows: KeywordUploadRow[]): KeywordUploadRow {
    return [...rows].sort((left, right) => {
      const leftPos = left.position > 0 ? left.position : Number.POSITIVE_INFINITY;
      const rightPos = right.position > 0 ? right.position : Number.POSITIVE_INFINITY;
      if (leftPos !== rightPos) return leftPos - rightPos;
      if ((right.traffic || 0) !== (left.traffic || 0)) return (right.traffic || 0) - (left.traffic || 0);
      return (right.volume || 0) - (left.volume || 0);
    })[0];
  }

  /**
   * Merges a list of uploaded keyword rows into the crawl database.
   * This overrides the primary keyword with the uploaded strategic keyword
   * while still preserving a best-ranking row from the uploaded set until GSC
   * data is available.
   */
  static async mergeFromCsv(crawlId: string, rows: KeywordUploadRow[]) {
    // 1. Get all pages for this crawl
    const pages = await crawlDb.pages.where('crawlId').equals(crawlId).toArray();
    
    // 2. Map pages by canonical URL for fast lookup
    const pageMap = new Map<string, CrawledPage>();
    pages.forEach(p => {
      pageMap.set(UrlNormalization.toCanonical(p.url), p);
    });

    const rowsByCanonical = new Map<string, KeywordUploadRow[]>();
    rows.forEach((row) => {
      const canonical = UrlNormalization.toCanonical(row.url);
      const bucket = rowsByCanonical.get(canonical) || [];
      bucket.push(row);
      rowsByCanonical.set(canonical, bucket);
    });

    const updates: Array<{ url: string } & Partial<CrawledPage>> = [];

    // 3. Match CSV rows to pages
    for (const [canonical, matchedRows] of rowsByCanonical.entries()) {
      const page = pageMap.get(canonical);
      const mainRow = this.chooseStrategicRow(matchedRows);
      const bestRow = this.chooseBestRankingRow(matchedRows);

      if (page) {
        updates.push({
          url: page.url,
          mainKeyword: mainRow.keyword,
          mainKwSearchVolume: mainRow.volume || null,
          mainKwPosition: mainRow.position || null,
          mainKeywordSource: 'upload',
          bestKeyword: bestRow?.keyword || null,
          bestKwSearchVolume: bestRow?.volume || null,
          bestKwPosition: bestRow?.position || null,
          bestKeywordSource: bestRow?.keyword ? 'upload' : page.bestKeywordSource,
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
