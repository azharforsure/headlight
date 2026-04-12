import { CheckEvaluator } from '../types';
import { businessSignalChecks } from './businessSignals';
import { socialMediaChecks } from './socialMedia';
import { adsPpcChecks } from './adsPpc';
import { conversionUxChecks } from './conversionUx';
import { techDebtChecks } from './techDebt';
import { ecommerceChecks } from './industryEcommerce';
import { localChecks } from './industryLocal';
import { newsChecks } from './industryNews';
import { saasChecks } from './industrySaas';
import { healthcareChecks } from './industryHealthcare';
import { financeChecks } from './industryFinance';
import { educationChecks } from './industryEducation';
import { competitorChecks } from './competitor';
import { citationChecks } from './citations';

export const allTier4Checks: Record<string, CheckEvaluator> = {
  ...businessSignalChecks,
  ...socialMediaChecks,
  ...competitorChecks,
  ...citationChecks,
  ...adsPpcChecks,
  ...conversionUxChecks,
  ...techDebtChecks,
  ...ecommerceChecks,
  ...localChecks,
  ...newsChecks,
  ...saasChecks,
  ...healthcareChecks,
  ...financeChecks,
  ...educationChecks,
};
