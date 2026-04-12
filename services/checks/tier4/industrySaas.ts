import { CheckResult, CheckEvaluator } from '../types';

export const checkSaasPricing: CheckEvaluator = (page) => {
  const isPricingPage = /(pricing|plans|packages|subscription)/i.test(page.url);
  if (!isPricingPage) return null;
  const hasPricingTable = page.industrySignals?.hasPricingTable;

  return {
    checkId: 't4-saas-pricing',
    tier: 4, category: 'saas', name: 'Pricing Page Quality',
    severity: hasPricingTable ? 'pass' : 'info',
    value: { hasPricingTable },
    expected: 'Structured pricing table on pricing page',
    message: hasPricingTable ? 'Pricing table detected.' : 'Pricing page found but no structured pricing table detected.',
    auditModes: ['full'], industries: ['saas']
  };
};

export const checkSaasDocs: CheckEvaluator = (page) => {
  if (page.crawlDepth !== 0) return null;
  const hasDocs = page.industrySignals?.hasDocsLink;

  return {
    checkId: 't4-saas-docs',
    tier: 4, category: 'saas', name: 'Documentation Quality',
    severity: hasDocs ? 'pass' : 'info',
    value: { hasDocs },
    expected: 'Link to documentation or help center',
    message: hasDocs ? 'Documentation link found.' : 'No clear link to documentation or help center found.',
    auditModes: ['full'], industries: ['saas']
  };
};

export const checkSaasStatusPage: CheckEvaluator = (page) => {
  if (page.crawlDepth !== 0) return null;
  const hasStatus = page.industrySignals?.hasStatusPage;

  return {
    checkId: 't4-saas-status-page',
    tier: 4, category: 'saas', name: 'Status Page',
    severity: hasStatus ? 'pass' : 'info',
    value: { hasStatus },
    expected: 'Link to service status page',
    message: hasStatus ? 'Status page link found.' : 'No service status page link found.',
    auditModes: ['full'], industries: ['saas']
  };
};

export const checkSaasChangelog: CheckEvaluator = (page) => {
  if (page.crawlDepth !== 0) return null;
  const hasChangelog = page.industrySignals?.hasChangelog;

  return {
    checkId: 't4-saas-changelog',
    tier: 4, category: 'saas', name: 'Changelog Presence',
    severity: hasChangelog ? 'pass' : 'info',
    value: { hasChangelog },
    expected: 'Link to changelog or release notes',
    message: hasChangelog ? 'Changelog or release notes link found.' : 'No changelog or release notes link found.',
    auditModes: ['full'], industries: ['saas']
  };
};

export const checkSaasIntegrations: CheckEvaluator = (page) => {
  if (page.crawlDepth !== 0) return null;
  const hasIntegrations = page.industrySignals?.hasIntegrationsPage;

  return {
    checkId: 't4-saas-integrations',
    tier: 4, category: 'saas', name: 'Integrations Page',
    severity: hasIntegrations ? 'pass' : 'info',
    value: { hasIntegrations },
    expected: 'Link to integrations, apps, or marketplace content',
    message: hasIntegrations ? 'Integrations page link found.' : 'No integrations or marketplace page link found.',
    auditModes: ['full'], industries: ['saas']
  };
};

export const checkSaasComparison: CheckEvaluator = (page) => {
  if (page.crawlDepth !== 0) return null;
  const hasComparison = page.industrySignals?.hasComparisonPages;

  return {
    checkId: 't4-saas-comparison',
    tier: 4, category: 'saas', name: 'Comparison Pages',
    severity: hasComparison ? 'pass' : 'info',
    value: { hasComparison },
    expected: 'Presence of competitor comparison or alternative pages',
    message: hasComparison ? 'Comparison-page link found.' : 'No comparison or alternative page link found.',
    auditModes: ['full', 'competitor_gap'], industries: ['saas']
  };
};

export const checkSaasSecurity: CheckEvaluator = (page) => {
  if (page.crawlDepth !== 0) return null;
  const hasSecurity = page.industrySignals?.hasSecurityPage;

  return {
    checkId: 't4-saas-security',
    tier: 4, category: 'saas', name: 'Security / Compliance Page',
    severity: hasSecurity ? 'pass' : 'info',
    value: { hasSecurity },
    expected: 'Security, trust, or compliance page visible from the main site',
    message: hasSecurity ? 'Security or compliance page link found.' : 'No security or compliance page link found.',
    auditModes: ['full', 'security'], industries: ['saas']
  };
};

export const saasChecks: Record<string, CheckEvaluator> = {
  't4-saas-pricing': checkSaasPricing,
  't4-saas-docs': checkSaasDocs,
  't4-saas-status-page': checkSaasStatusPage,
  't4-saas-changelog': checkSaasChangelog,
  't4-saas-integrations': checkSaasIntegrations,
  't4-saas-comparison': checkSaasComparison,
  't4-saas-security': checkSaasSecurity,
};
