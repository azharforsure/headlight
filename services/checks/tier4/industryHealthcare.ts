import { CheckResult, CheckEvaluator } from '../types';

export const checkHealthAuthor: CheckEvaluator = (page) => {
  const hasMedicalAuthor = page.industrySignals?.hasMedicalAuthor;
  const isMedicalContent = page.textContent?.toLowerCase().includes('treatment') || page.textContent?.toLowerCase().includes('diagnosis');
  if (!isMedicalContent && !hasMedicalAuthor) return null;

  return {
    checkId: 't4-health-author',
    tier: 4, category: 'healthcare', name: 'Medical Author Attribution',
    severity: hasMedicalAuthor ? 'pass' : 'warning',
    value: { hasMedicalAuthor },
    expected: 'Verified medical author attribution',
    message: hasMedicalAuthor ? 'Medical author attribution found.' : 'Medical content detected without clear author credentials. Critical for E-E-A-T.',
    auditModes: ['full'], industries: ['healthcare']
  };
};

export const checkHealthDisclaimer: CheckEvaluator = (page) => {
  const hasDisclaimer = page.industrySignals?.hasMedicalDisclaimer;
  if (page.crawlDepth !== 0 && !hasDisclaimer) return null;

  return {
    checkId: 't4-health-disclaimer',
    tier: 4, category: 'healthcare', name: 'Medical Disclaimer',
    severity: hasDisclaimer ? 'pass' : 'info',
    value: { hasDisclaimer },
    expected: 'Medical disclaimer on health-related pages',
    message: hasDisclaimer ? 'Medical disclaimer found.' : 'No medical disclaimer detected on the site.',
    auditModes: ['full'], industries: ['healthcare']
  };
};

export const checkHealthReviewed: CheckEvaluator = (page) => {
  const hasMedicalReview = page.industrySignals?.hasMedicalReview;
  const isMedicalContent = page.textContent?.toLowerCase().includes('treatment') || page.textContent?.toLowerCase().includes('diagnosis');
  if (!isMedicalContent && !hasMedicalReview) return null;

  return {
    checkId: 't4-health-reviewed',
    tier: 4, category: 'healthcare', name: 'Medical Review Signals',
    severity: hasMedicalReview ? 'pass' : 'info',
    value: { hasMedicalReview },
    expected: 'Visible medically reviewed byline or review-language pattern',
    message: hasMedicalReview ? 'Medical review language detected.' : 'No medical review signal detected on health-related content.',
    auditModes: ['full'], industries: ['healthcare']
  };
};

export const checkHealthSchema: CheckEvaluator = (page) => {
  const hasMedicalSchema = page.industrySignals?.hasMedicalSchema;
  const isMedicalContent = page.textContent?.toLowerCase().includes('treatment') || page.textContent?.toLowerCase().includes('diagnosis');
  if (!isMedicalContent && !hasMedicalSchema) return null;

  return {
    checkId: 't4-health-schema',
    tier: 4, category: 'healthcare', name: 'Medical Schema',
    severity: hasMedicalSchema ? 'pass' : 'info',
    value: { hasMedicalSchema },
    expected: 'MedicalWebPage, MedicalCondition, Drug, or Physician schema on health content',
    message: hasMedicalSchema ? 'Medical schema detected.' : 'No medical schema detected on health-related content.',
    auditModes: ['full'], industries: ['healthcare']
  };
};

export const healthcareChecks: Record<string, CheckEvaluator> = {
  't4-health-author': checkHealthAuthor,
  't4-health-disclaimer': checkHealthDisclaimer,
  't4-health-reviewed': checkHealthReviewed,
  't4-health-schema': checkHealthSchema,
};
