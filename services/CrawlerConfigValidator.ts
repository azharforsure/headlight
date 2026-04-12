import { CrawlerConfig, AITaskToggles } from './CrawlerConfigTypes';

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const toPatterns = (raw: string) =>
  String(raw || '')
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);

export function validateCrawlConfig(config: CrawlerConfig): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const firstUrl = config.startUrls?.[0] || '';
  if (!firstUrl.trim()) {
    errors.push('Target URL is required.');
  } else {
    try {
      const normalized = firstUrl.startsWith('http') ? firstUrl : `https://${firstUrl}`;
      new URL(normalized);
    } catch {
      errors.push('Target URL is not a valid URL.');
    }
  }

  const maxPages = Number.parseInt(String(config.limit || '0'), 10);
  const maxDepth = Number.parseInt(String(config.maxDepth || '10'), 10);
  const threads = Number(config.threads || config.concurrent || 5);
  const crawlDelay = Number(config.rateLimitDelay || 0);

  if (Number.isFinite(maxPages) && maxPages < 0) errors.push('Max pages cannot be negative.');
  if (Number.isFinite(maxPages) && maxPages > 1_000_000) warnings.push('Crawling over 1M pages may take a very long time.');
  if (!Number.isFinite(maxDepth) || maxDepth < 0) errors.push('Max depth cannot be negative.');
  if (!Number.isFinite(threads) || threads < 1 || threads > 200) errors.push('Concurrency must be between 1 and 200.');
  if (Number.isFinite(crawlDelay) && crawlDelay < 0) errors.push('Crawl delay cannot be negative.');

  for (const pattern of toPatterns(config.includeRules)) {
    try {
      new RegExp(pattern);
    } catch {
      errors.push(`Invalid include pattern: ${pattern}`);
    }
  }
  for (const pattern of toPatterns(config.excludeRules)) {
    try {
      new RegExp(pattern);
    } catch {
      errors.push(`Invalid exclude pattern: ${pattern}`);
    }
  }

  for (const line of String(config.customHeaders || '').split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean)) {
    if (!line.includes(':')) {
      warnings.push(`Header line may be malformed: "${line}"`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export class CrawlerConfigValidator {
  /**
   * Validates and sanitizes a crawler configuration object.
   * Returns a sanitized copy of the config.
   * Throws an error if critical validation fails.
   */
  static validate(config: Partial<CrawlerConfig>): CrawlerConfig {
    const sanitized = { ...config } as CrawlerConfig;

    const validation = validateCrawlConfig(sanitized);
    if (!validation.valid) {
      throw new Error(validation.errors.join(' '));
    }

    // 1. Start URLs validation
    if (!sanitized.startUrls || !Array.isArray(sanitized.startUrls) || sanitized.startUrls.length === 0) {
      throw new Error('At least one Start URL is required.');
    }

    sanitized.startUrls = sanitized.startUrls
      .map(url => url.trim())
      .filter(url => {
        try {
          const u = new URL(url);
          return u.protocol === 'http:' || u.protocol === 'https:';
        } catch {
          return false;
        }
      });

    if (sanitized.startUrls.length === 0) {
      throw new Error('No valid Start URLs provided (must include http/https).');
    }

    // 2. Numerical clamping
    sanitized.limit = String(Math.max(1, Math.min(100000, parseInt(sanitized.limit || '100'))));
    sanitized.maxDepth = String(Math.max(1, Math.min(50, parseInt(sanitized.maxDepth || '10'))));
    sanitized.threads = Math.max(1, Math.min(50, sanitized.threads || 5));
    sanitized.concurrent = Math.max(1, Math.min(20, sanitized.concurrent || 5));
    sanitized.retryCount = Math.max(0, Math.min(5, sanitized.retryCount || 3));
    sanitized.requestTimeout = Math.max(1, Math.min(120, sanitized.requestTimeout || 30));

    // 3. String sanitization
    sanitized.userAgent = (sanitized.userAgent || 'HeadlightCrawler/1.0').trim().substring(0, 255);
    sanitized.allowedDomains = (sanitized.allowedDomains || '').trim();
    sanitized.includeRules = (sanitized.includeRules || '').trim();
    sanitized.excludeRules = (sanitized.excludeRules || '').trim();

    // 4. Mode validation
    const allowedModes = ['spider', 'list', 'sitemap', 'single'];
    if (!allowedModes.includes(sanitized.mode)) {
      sanitized.mode = 'spider';
    }

    // 5. Proxy validation
    if (sanitized.useProxy) {
      if (!sanitized.proxyUrl) {
        sanitized.useProxy = false;
      } else {
        try {
          new URL(sanitized.proxyUrl);
        } catch {
          sanitized.useProxy = false;
        }
      }
    }

    // 6. AI Config defaults if missing
    if (!sanitized.aiTasks) {
      sanitized.aiTasks = this.getDefaultAITasks();
    }
    
    sanitized.aiBatchSize = Math.max(1, Math.min(100, sanitized.aiBatchSize || 20));

    // 7. Security: Remove sensitive fields if they are just placeholders or whitespace
    if (sanitized.proxyPass && sanitized.proxyPass.trim() === '') sanitized.proxyPass = '';
    if (sanitized.authPass && sanitized.authPass.trim() === '') sanitized.authPass = '';

    return sanitized;
  }

  static getDefaultAITasks(): AITaskToggles {
    return {
      summarize: true,
      keywords: true,
      intent: true,
      quality: false,
      priority: true,
      fixSuggestions: true,
      competitiveGap: false,
      eeat: false,
      schemaGenerate: false,
      metaRewrite: false,
      altTextGenerate: false,
      sentiment: false,
      originality: false,
      aiDetection: false,
      contentGaps: false
    };
  }
}
