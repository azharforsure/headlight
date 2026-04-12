import { IndustryFilter } from './CheckRegistry';

export interface AITaskToggles {
  summarize: boolean;
  keywords: boolean;
  intent: boolean;
  quality: boolean;
  priority: boolean;
  fixSuggestions: boolean;
  competitiveGap: boolean;
  eeat: boolean;
  schemaGenerate: boolean;
  metaRewrite: boolean;
  altTextGenerate: boolean;
  sentiment: boolean;
  originality: boolean;
  aiDetection: boolean;
  contentGaps: boolean;
}

export interface AlertChannels {
  email: boolean;
  inApp: boolean;
  slack: boolean;
  webhook: boolean;
}

export interface CustomExtractionRule {
  id: string;
  name: string;
  selector: string;
  pages: string;       // glob pattern like /products/*
  condition: 'exists' | 'not_empty' | 'matches' | 'missing';
  severity: 'critical' | 'warning' | 'info';
}

export interface CustomFieldExtractor {
  id: string;
  name: string;
  cssSelector: string;
  regex?: string;
  extractType: 'text' | 'attribute' | 'html';
  attributeName?: string;
}

export type SettingsTabId = 'general' | 'performance' | 'integrations' | 'ai' | 'rules' | 'extraction' | 'scheduling' | 'storage' | 'api';

export interface CrawlerConfig {
  // GENERAL
  startUrls: string[];
  mode: 'spider' | 'list' | 'sitemap' | 'single';
  industry: IndustryFilter;
  limit: string;
  maxDepth: string;
  threads: number;
  crawlSpeed: 'slow' | 'normal' | 'fast' | 'turbo';
  userAgent: string;
  respectRobots: boolean;
  followRedirects: boolean;
  maxRedirectHops: number;
  cookieConsent: 'auto-accept' | 'ignore' | 'skip';
  useGhostEngine: boolean;
  fallbackToServer: boolean;

  // URL LIST SETTINGS
  urlListSource: 'manual' | 'upload' | 'import';
  manualUrls: string;
  sitemapSource: 'auto' | 'manual';
  importSitemapUrl: string;
  uploadedFileName?: string;

  // PERFORMANCE
  concurrent: number;
  psiApiKey: string;
  requestTimeout: number; // seconds
  retryOnFail: boolean;
  retryCount: number;
  rateLimit: boolean;
  rateLimitDelay: number; // ms
  useProxy: boolean;
  proxyUrl: string;
  proxyPort: string;
  proxyUser: string;
  proxyPass: string;
  viewportWidth: number;
  viewportHeight: number;
  jsRenderingComparison: boolean;
  captureScreenshots: boolean;
  screenshotStorage: 'local' | 'r2' | 'gdrive';
  screenshotViewportWidth: number;
  screenshotViewportHeight: number;

  // AI
  aiEnabled: boolean;
  aiAutoRotation: boolean;
  aiBatchSize: number;
  aiTasks: AITaskToggles;
  aiProviderOrder: string[];
  aiCustomKeys: {
    openai: string;
    anthropic: string;
    gemini: string;
    cohere: string;
  };

  // RULES
  includeRules: string;
  excludeRules: string;
  ignoreQueryParams: boolean;
  allowedDomains: string;
  customHeaders: string;
  customCookies: string;
  authUser: string;
  authPass: string;
  authType: 'none' | 'basic' | 'bearer' | 'cookie';
  authBearerToken: string;
  customExtractionRules: CustomExtractionRule[];

  // EXTRACTION
  jsRendering: boolean;
  fetchWebVitals: boolean;
  crawlResources: boolean;
  extractCss: string;
  extractRegex: string;
  customFieldExtractors: CustomFieldExtractor[];

  // SCHEDULING
  scheduleEnabled: boolean;
  scheduleFrequency: 'daily' | 'weekly' | 'monthly';
  scheduleDay: string;
  scheduleTime: string;
  scheduleCron: string;
  changeDetection: boolean;
  alertOnScoreDrop: boolean;
  alertOnNew404s: boolean;
  alertOnNewIssues: boolean;
  alertChannels: AlertChannels;
  webhookUrl: string;
  slackWebhookUrl: string;
  changeMonitorEnabled: boolean;
  changeMonitorInterval: '15min' | '1hr' | '6hr' | 'daily';

  // STORAGE
  cloudSync: 'metadata' | 'full' | 'off';
  gscSiteUrl: string;
  ga4PropertyId: string;
  gscApiKey: string;
  bingAccessToken: string;
  indexNowApiKey: string;
  indexNowAutoSubmit: boolean;
  externalEnrichment: boolean;
  rawHtmlBackup: 'off' | 'local' | 'google-drive' | 'r2';
  exportOnCrawl: 'none' | 'csv' | 'json' | 'google-sheets';
  retentionSessions: number;
  autoBackupDestination: 'none' | 'google-drive' | 'r2' | 'github';
  githubBackupRepo: string; // "owner/repo"
  
  // Computed (not persisted)
  _localStorageUsed?: number;
  _localStorageLimit?: number;
}
