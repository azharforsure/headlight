export type CheckSeverity = 'critical' | 'warning' | 'info' | 'pass';
export type CheckTier = 1 | 2 | 3 | 4;

export interface CheckResult {
  checkId: string;
  tier: CheckTier;
  category: string;
  name: string;
  severity: CheckSeverity;
  value: any;
  expected: any;
  message: string;
  affectedElement?: string;
  fixSuggestion?: string;
  auditModes: string[];
  industries: string[];
}

export type CheckEvaluator = (page: any, siteContext?: SiteContext) => CheckResult | null;

export interface SiteContext {
  allPages: any[];
  rootHostname: string;
  industry: string;
  projectId?: string;
  competitorPages?: any[];
  sitemapUrls?: Set<string>;
  robotsRules?: any;
}
