import { 
  toCanonical as _toCanonical, 
  normalizeHref as _normalizeHref,
  toSitemapKey as _toSitemapKey,
  extractHostname as _extractHostname,
  getSafeHostname as _getSafeHostname
} from '../shared/url-normalization';

/**
 * UrlNormalization handles the consistent matching of URLs across disparate
 * data sources (GSC, GA4, Dexie, CSVs).
 */

export interface MatchResult {
    joinType: 'exact' | 'canonical' | 'redirect' | 'path' | null;
    confidence: number;
}

export class UrlNormalization {
  /**
   * Normalizes a URL to a "canonical identifier" for internal mapping.
   * Example: "https://www.example.com/blog/?utm_source=fb#hash" 
   * -> "example.com/blog"
   */
  static toCanonical = _toCanonical;

  /**
   * Normalize a URL to a clean full href.
   * Strips hash, optionally strips query params, removes default ports.
   */
  static normalizeHref = _normalizeHref;

  /**
   * Generate a stable key for sitemap URL matching.
   */
  static toSitemapKey = _toSitemapKey;

  /**
   * Extract the bare hostname from a URL, stripping www prefix.
   */
  static extractHostname = _extractHostname;

  /**
   * Get hostname from URL, returning the raw string as fallback.
   */
  static getSafeHostname = _getSafeHostname;

  /**
   * Extract domain (alias for extractHostname)
   */
  static extractDomain(url: string): string {
    return this.extractHostname(url);
  }

  /**
   * Specifically for GA4 which often reports without protocol/domain.
   * If input is "/path", and base is "example.com", returns "example.com/path".
   */
  static joinWithBase(path: string, base: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const cleanBase = base.replace(/\/$/, '');
    return this.toCanonical(`${cleanBase}${cleanPath}`);
  }

  /**
   * Checks if two URLs match after normalization.
   */
  static match(urlA: string, urlB: string): boolean {
    return this.toCanonical(urlA) === this.toCanonical(urlB);
  }

  /**
   * Layered Join Logic: Returns the best match type and confidence
   */
  static getMatchResult(pageUrl: string, dataUrl: string, finalUrl?: string): MatchResult {
    // 1. Exact Match (High Confidence)
    if (pageUrl === dataUrl) return { joinType: 'exact', confidence: 100 };
    
    const pageCanon = this.toCanonical(pageUrl);
    const dataCanon = this.toCanonical(dataUrl);
    
    // 2. Canonical Match (Very High Confidence)
    if (pageCanon === dataCanon) return { joinType: 'canonical', confidence: 98 };
    
    // 3. Redirect / Final URL Match (High Confidence)
    if (finalUrl) {
        const finalCanon = this.toCanonical(finalUrl);
        if (finalCanon === dataCanon) return { joinType: 'redirect', confidence: 95 };
    }
    
    // 4. Path Match (Moderate Confidence)
    // Useful for cross-domain or protocol mismatches
    const getPath = (u: string) => {
        try {
            const urlObj = new URL(u.startsWith('http') ? u : `https://example.com/${u.startsWith('/') ? u.slice(1) : u}`);
            return urlObj.pathname.replace(/\/$/, '') || '/';
        } catch {
            return u.split('?')[0].split('#')[0].replace(/^https?:\/\/[^\/]+/, '').replace(/\/$/, '') || '/';
        }
    };

    const pagePath = getPath(pageUrl);
    const dataPath = getPath(dataUrl);
    
    if (pagePath === dataPath && pagePath !== '/' && pagePath !== '') {
        return { joinType: 'path', confidence: 85 };
    }
    
    return { joinType: null, confidence: 0 };
  }
}
