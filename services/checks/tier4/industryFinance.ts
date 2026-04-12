import { CheckEvaluator } from '../types';

export const checkFinanceDisclaimer: CheckEvaluator = (page, ctx) => {
  if (ctx?.industry !== 'finance') return null;
  const hasDisclaimer = page.industrySignals?.hasFinancialDisclaimer;
  const isFinanceLike = /invest|stock|portfolio|retirement|crypto|mortgage|loan|tax/i.test(
    `${page.title || ''} ${page.h1_1 || ''} ${page.url || ''}`
  );
  if (!isFinanceLike && !hasDisclaimer) return null;

  return {
    checkId: 't4-finance-disclaimer',
    tier: 4, category: 'finance', name: 'Financial Disclaimer',
    severity: hasDisclaimer ? 'pass' : 'warning',
    value: { hasDisclaimer },
    expected: 'Clear financial disclaimer on advisory or informational finance pages',
    message: hasDisclaimer ? 'Financial disclaimer detected.' : 'No financial disclaimer detected on finance-related content.',
    auditModes: ['full'], industries: ['finance']
  };
};

export const checkFinanceCredentials: CheckEvaluator = (page, ctx) => {
  if (ctx?.industry !== 'finance') return null;
  const hasCredentials = page.industrySignals?.hasFinancialCredentials;
  const isFinanceLike = /invest|stock|portfolio|retirement|crypto|mortgage|loan|tax/i.test(
    `${page.title || ''} ${page.h1_1 || ''} ${page.url || ''}`
  );
  if (!isFinanceLike && !hasCredentials) return null;

  return {
    checkId: 't4-finance-credentials',
    tier: 4, category: 'finance', name: 'Financial Credentials',
    severity: hasCredentials ? 'pass' : 'info',
    value: { hasCredentials },
    expected: 'Author or reviewer credentials such as CFP, CPA, or CFA',
    message: hasCredentials ? 'Financial credentials detected.' : 'No financial credentials detected near finance content.',
    auditModes: ['full'], industries: ['finance']
  };
};

export const checkFinanceFreshness: CheckEvaluator = (page, ctx) => {
  if (ctx?.industry !== 'finance') return null;
  const dateValue = page.industrySignals?.financialDataDate || page.visibleDate;
  if (!dateValue) return null;

  const ageMs = Date.now() - new Date(dateValue).getTime();
  const isFresh = Number.isFinite(ageMs) && ageMs <= 180 * 24 * 60 * 60 * 1000;

  return {
    checkId: 't4-finance-freshness',
    tier: 4, category: 'finance', name: 'Financial Content Freshness',
    severity: isFresh ? 'pass' : 'warning',
    value: { date: dateValue, ageDays: Math.round(ageMs / (24 * 60 * 60 * 1000)) },
    expected: 'Finance content updated within the last 6 months',
    message: isFresh ? `Finance content appears fresh (${dateValue}).` : `Finance content may be stale (${dateValue}).`,
    auditModes: ['full', 'content'], industries: ['finance']
  };
};

export const financeChecks: Record<string, CheckEvaluator> = {
  't4-finance-disclaimer': checkFinanceDisclaimer,
  't4-finance-credentials': checkFinanceCredentials,
  't4-finance-freshness': checkFinanceFreshness,
};
