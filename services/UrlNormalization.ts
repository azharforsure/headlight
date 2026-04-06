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
}
