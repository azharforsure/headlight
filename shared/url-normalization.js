/**
 * Shared URL normalization logic used by both server (Node.js) and client (Vite).
 */

/**
 * Normalize a URL to a clean full href.
 * Strips hash, optionally strips query params, removes standard ports.
 */
export function normalizeHref(rawUrl, baseUrl = undefined, options = {}) {
    try {
        const url = baseUrl ? new URL(rawUrl, baseUrl) : new URL(rawUrl);
        url.hash = ''; // Remove fragment
        if (options.ignoreQueryParams) {
            url.search = '';
        }
        // Remove standard ports
        if ((url.protocol === 'http:' && url.port === '80') || (url.protocol === 'https:' && url.port === '443')) {
            url.port = '';
        }
        return url.href;
    } catch {
        return null;
    }
}

/**
 * Generate a canonical "key" for stable URL matching.
 * Format: hostname/path (all lowercase, no protocol, no www, no query, no hash, no trailing slash)
 */
export function toCanonical(url, options = {}) {
    if (!url) return '';

    try {
        // Ensure protocol for URL constructor if missing
        const urlStr = String(url).trim();
        const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
        
        let hostname = parsed.hostname.toLowerCase();
        if (options.stripWww !== false) {
            hostname = hostname.replace(/^www\./i, '');
        }

        let pathname = parsed.pathname.toLowerCase();
        if (options.stripTrailingSlash !== false) {
            pathname = pathname.replace(/\/+$/, '');
        }
        // Ensure we don't have double slashes at the end or start
        if (!pathname.startsWith('/')) pathname = '/' + pathname;
        if (pathname === '/') pathname = '';

        return `${hostname}${pathname}`;
    } catch {
        // Robust fallback for malformed URLs
        return String(url)
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//i, '')
            .replace(/^www\./i, '')
            .split('?')[0]
            .split('#')[0]
            .replace(/\/+$/, '');
    }
}

/**
 * Generate a stable key for sitemap matching.
 * Uses ignoreQueryParams: true and stripped protocol/www/slash.
 */
export function toSitemapKey(rawUrl, baseUrl = undefined) {
    const normalized = normalizeHref(rawUrl, baseUrl, { ignoreQueryParams: true });
    if (!normalized) return '';
    return toCanonical(normalized);
}

/**
 * Extract bare hostname without www.
 */
export function extractHostname(url) {
    if (!url) return '';
    try {
        const urlStr = String(url).trim();
        return new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`)
            .hostname
            .replace(/^www\./i, '')
            .toLowerCase();
    } catch {
        return '';
    }
}

/**
 * Get hostname from URL, returning the raw string as fallback.
 */
export function getSafeHostname(url) {
    if (!url) return 'example.com';
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}
