import { UrlNormalization } from './UrlNormalization';

export type EffectiveGoogleSelection = {
  siteUrl: string | null;
  propertyId: string | null;
  gscConfidence: number;
  ga4Confidence: number;
  source: 'saved' | 'detected' | 'manual' | 'fallback';
};

export interface GoogleAccountHistory {
  lastUsedGscForProject?: string;
  lastUsedGa4ForProject?: string;
  lastUsedGscForSite?: string;
  lastUsedGa4ForSite?: string;
}

/**
 * Resolver for GSC and GA4 properties based on crawl target.
 * Implements Phase 1 of the SEO Enrichment Upgrade.
 */
export class GoogleSelectionResolver {
  private static GSC_API = 'https://www.googleapis.com/webmasters/v3/sites';
  private static GA4_ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta';

  /**
   * Main entry point for resolving Google properties.
   */
  static async resolveEffectiveGoogleSelection(args: {
    accessToken: string;
    crawlUrl: string;
    existingSelection?: Partial<EffectiveGoogleSelection>;
    history?: GoogleAccountHistory;
  }): Promise<EffectiveGoogleSelection> {
    const { accessToken, crawlUrl, existingSelection, history } = args;
    
    // 1. Normalize crawl target
    const url = new URL(crawlUrl);
    const hostname = url.hostname.toLowerCase();
    const registrableDomain = hostname.replace(/^www\./, '');
    const origin = url.origin.toLowerCase();

    const crawlTarget = {
      hostname,
      registrableDomain,
      origin,
      url: crawlUrl
    };

    // 2. Resolve GSC
    let gscSiteUrl = existingSelection?.siteUrl || null;
    let gscConfidence = existingSelection?.gscConfidence || 0;
    let gscSource: EffectiveGoogleSelection['source'] = existingSelection?.source || 'detected';

    if (!gscSiteUrl || gscConfidence < 90) {
      const gscMatch = await this.detectGscProperty(accessToken, crawlTarget);
      if (gscMatch && gscMatch.confidence > gscConfidence) {
        gscSiteUrl = gscMatch.siteUrl;
        gscConfidence = gscMatch.confidence;
        gscSource = 'detected';
      }
    }

    // 3. Resolve GA4
    let ga4PropertyId = existingSelection?.propertyId || null;
    let ga4Confidence = existingSelection?.ga4Confidence || 0;
    let ga4Source: EffectiveGoogleSelection['source'] = existingSelection?.source || 'detected';

    if (!ga4PropertyId || ga4Confidence < 90) {
      const ga4Match = await this.detectGa4Property(accessToken, crawlTarget, history);
      if (ga4Match && ga4Match.confidence > ga4Confidence) {
        ga4PropertyId = ga4Match.propertyId;
        ga4Confidence = ga4Match.confidence;
        ga4Source = 'detected';
      }
    }

    return {
      siteUrl: gscSiteUrl,
      propertyId: ga4PropertyId,
      gscConfidence,
      ga4Confidence,
      source: (gscSource === 'manual' || ga4Source === 'manual') ? 'manual' : 'detected'
    };
  }

  private static async detectGscProperty(
    accessToken: string,
    crawl: { hostname: string; registrableDomain: string; origin: string }
  ): Promise<{ siteUrl: string; confidence: number } | null> {
    try {
      const response = await fetch(this.GSC_API, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) return null;
      const data = await response.json();
      const sites: Array<{ siteUrl: string }> = data.siteEntry || [];

      let bestMatch: { siteUrl: string; confidence: number } | null = null;

      for (const site of sites) {
        const score = this.scoreGscProperty(site.siteUrl, crawl);
        if (!bestMatch || score > bestMatch.confidence) {
          bestMatch = { siteUrl: site.siteUrl, confidence: score };
        }
      }

      return bestMatch;
    } catch {
      return null;
    }
  }

  private static scoreGscProperty(
    siteUrl: string, 
    crawl: { hostname: string; registrableDomain: string; origin: string }
  ): number {
    const cleanSiteUrl = siteUrl.toLowerCase().replace(/\/$/, '');
    const cleanOrigin = crawl.origin.replace(/\/$/, '');

    // 1. Exact domain property
    if (cleanSiteUrl === `sc-domain:${crawl.registrableDomain}`) return 100;
    
    // 2. Exact URL-prefix property
    if (cleanSiteUrl === cleanOrigin) return 95;
    
    // 3. Same hostname with protocol normalization
    if (cleanSiteUrl.replace(/^https?:\/\//, '') === crawl.hostname) return 85;
    
    // 4. Same registrable domain, different subdomain
    if (cleanSiteUrl.includes(crawl.registrableDomain)) return 60;
    
    return 0;
  }

  private static async detectGa4Property(
    accessToken: string,
    crawl: { hostname: string; registrableDomain: string; origin: string },
    history?: GoogleAccountHistory
  ): Promise<{ propertyId: string; confidence: number } | null> {
    try {
      const accounts = await this.fetchAllPaginated<any>(
        `${this.GA4_ADMIN_API}/accountSummaries`,
        accessToken,
        'accountSummaries'
      );

      let bestMatch: { propertyId: string; confidence: number } | null = null;

      for (const account of accounts) {
        for (const prop of account.propertySummaries || []) {
          const propertyId = prop.property.replace('properties/', '');
          
          // Get data streams for this property to find hostname match
          const streams = await this.fetchAllPaginated<any>(
            `${this.GA4_ADMIN_API}/properties/${propertyId}/dataStreams`,
            accessToken,
            'dataStreams'
          );

          let propertyScore = 0;
          for (const stream of streams) {
            if (stream.type !== 'WEB_DATA_STREAM') continue;
            
            const streamHost = (stream.webStreamData?.defaultUri || '')
              .replace(/^https?:\/\//, '')
              .replace(/^www\./, '')
              .replace(/\/$/, '')
              .toLowerCase();
            
            const score = this.scoreGa4Stream(streamHost, crawl.hostname, crawl.registrableDomain);
            if (score > propertyScore) propertyScore = score;
          }

          // Historical hints
          if (history?.lastUsedGa4ForProject === propertyId) propertyScore += 25;
          if (history?.lastUsedGa4ForSite === propertyId) propertyScore += 20;

          const finalScore = Math.min(100, propertyScore);
          if (!bestMatch || finalScore > bestMatch.confidence) {
            bestMatch = { propertyId, confidence: finalScore };
          }
        }
      }

      return bestMatch;
    } catch {
      return null;
    }
  }

  private static scoreGa4Stream(streamHost: string, hostname: string, registrableDomain: string): number {
    if (streamHost === hostname) return 100;
    if (streamHost.includes(registrableDomain)) return 70;
    return 0;
  }

  private static async fetchAllPaginated<T>(
    url: string,
    accessToken: string,
    listKey: string
  ): Promise<T[]> {
    const items: T[] = [];
    let pageToken: string | undefined;

    do {
      const requestUrl = new URL(url);
      requestUrl.searchParams.set('pageSize', '200');
      if (pageToken) requestUrl.searchParams.set('pageToken', pageToken);

      const response = await fetch(requestUrl.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) break;

      const data = await response.json();
      items.push(...(data[listKey] || []));
      pageToken = data.nextPageToken || undefined;
    } while (pageToken);

    return items;
  }
}
