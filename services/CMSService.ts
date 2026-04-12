import { 
    crawlDb, 
    getHtmlPages, 
    type CrawledPage 
} from './CrawlDatabase';
import { UrlNormalization } from './UrlNormalization';

export class CMSService {
    /**
     * 1. WordPress Detection & Metadata
     */
    static async fetchWpMetadata(siteUrl: string): Promise<Record<string, any> | null> {
        try {
            const apiEndpoint = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts?per_page=1`;
            const response = await fetch(apiEndpoint);
            if (!response.ok) return null;
            return { type: 'wordpress' };
        } catch {
            return null;
        }
    }

    /**
     * 2. Shopify Detection & Metadata
     */
    static async fetchShopifyMetadata(siteUrl: string): Promise<Record<string, any> | null> {
        try {
            const apiEndpoint = `${siteUrl.replace(/\/$/, '')}/products.json?limit=1`;
            const response = await fetch(apiEndpoint);
            if (!response.ok) return null;
            const data = await response.json();
            if (!data.products) return null;
            return { type: 'shopify' };
        } catch {
            return null;
        }
    }

    /**
     * Main Enrichment Entry Point
     */
    static async enrichSession(
        sessionId: string, 
        siteUrl: string, 
        onProgress?: (msg: string) => void
    ): Promise<{ cms: string | null; enriched: number }> {
        onProgress?.('Detecting CMS (WordPress/Shopify)...');
        
        let cmsType: 'wordpress' | 'shopify' | null = null;
        
        // Try WordPress
        if (await this.fetchWpMetadata(siteUrl)) {
            cmsType = 'wordpress';
        } else if (await this.fetchShopifyMetadata(siteUrl)) {
            cmsType = 'shopify';
        }

        if (!cmsType) {
            onProgress?.('No supported CMS detected.');
            return { cms: null, enriched: 0 };
        }

        onProgress?.(`${cmsType.toUpperCase()} detected! Enriching page metadata...`);

        const htmlPages = await getHtmlPages(sessionId);
        const origin = new URL(siteUrl).origin;
        const updates: Array<{ url: string } & Partial<CrawledPage>> = [];

        for (const page of htmlPages) {
            try {
                if (cmsType === 'wordpress') {
                    // WP REST API discovery for specific page/post
                    // We'd ideally fetch /wp-json/wp/v2/posts?slug=... or lookup by URL
                    // For now we tag the site type and extract what we can
                    updates.push({
                        url: page.url,
                        cmsType: 'wordpress',
                        // In a deep integration, we'd fetch individual page meta here
                    });
                } else if (cmsType === 'shopify') {
                    updates.push({
                        url: page.url,
                        cmsType: 'shopify',
                    });
                }
            } catch (err) {
                // Silent fail for individual pages
            }
        }

        if (updates.length > 0) {
            await crawlDb.transaction('rw', crawlDb.pages, async () => {
                for (const update of updates) {
                    await crawlDb.pages.update(update.url, update);
                }
            });
        }

        return { cms: cmsType, enriched: updates.length };
    }
}
