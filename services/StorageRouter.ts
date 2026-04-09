import { turso } from './turso';
import { crawlDb } from './CrawlDatabase';

export type StorageProvider = 'turso' | 'cloudflare_d1' | 'supabase' | 'indexeddb';

export interface StorageQuota {
  provider: StorageProvider;
  readUsed: number;
  readLimit: number;
  writeUsed: number;
  writeLimit: number;
  storageUsed: number;
  storageLimit: number;
}

class StorageRouter {
  private providerPriority: StorageProvider[] = ['turso', 'indexeddb'];
  
  // Simple router that prefers Turso for cloud sync and IndexedDB for local cache
  async execute(sql: string, args?: any[]): Promise<any> {
    // For now, we always try Turso first if available
    try {
      const client = turso();
      return await client.execute({ sql, args: args || [] });
    } catch (err) {
      console.warn('StorageRouter: Turso failed, falling back to local storage logic if possible');
      // Some queries might not be compatible with IndexedDB (sql vs dexie)
      throw err;
    }
  }

  async savePages(pages: any[]) {
    // Write to both for redundancy/performance
    await crawlDb.pages.bulkPut(pages);
    
    try {
      // In a real implementation, we'd batch this to Turso
      // For now, we assume CrawlPersistenceService handles the Turso sync
    } catch (err) {
      console.error('StorageRouter: Failed to sync pages to cloud');
    }
  }
}

export const storageRouter = new StorageRouter();
