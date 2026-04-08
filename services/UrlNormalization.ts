/**
 * UrlNormalization handles the consistent matching of URLs across disparate
 * data sources (GSC, GA4, Dexie, CSVs).
 * 
 * Rules:
 * 1. Strip protocol (optional, source-dependent)
 * 2. Strip 'www' (optional, source-dependent)
 * 3. Strip trailing slashes
 * 4. Strip UTM parameters and fragments
 * 5. Handle case-insensitivity (lowercase all)
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
  static toCanonical(url: string, options: { 
    stripProtocol?: boolean; 
    stripWww?: boolean; 
    stripTrailingSlash?: boolean;
    lowercase?: boolean;
  } = {}): string {
    if (!url) return '';

    let normalized = url.trim();

    // 1. Lowercase for consistency
    if (options.lowercase !== false) {
      normalized = normalized.toLowerCase();
    }

    // 2. Remove fragments and query strings
    normalized = normalized.split('#')[0].split('?')[0];

    // 3. Strip protocol
    if (options.stripProtocol !== false) {
      normalized = normalized.replace(/^https?:\/\//, '');
    }

    // 4. Strip WWW
    if (options.stripWww !== false) {
      normalized = normalized.replace(/^www\./, '');
    }

    // 5. Strip trailing slash
    if (options.stripTrailingSlash !== false) {
      normalized = normalized.replace(/\/$/, '');
    }

    return normalized;
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
