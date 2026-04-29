/**
 * ForecastService.ts
 *
 * Projecting SEO growth based on action buckets and historical data.
 * Weights derived from AXIS_EFFECT table (Content, Tech, Authority).
 */
import { AssignedAction } from '@headlight/actions';
import { computeWqaSiteStats, computeWqaActionGroups, deriveWqaScore } from './right-sidebar/wqa';

export interface ForecastResult {
  currentScore: number;
  projectedScore: number;
  estimatedClickGain: number;
  confidence: number; // 0-100
  breakdown: {
    technical: number;
    content: number;
    authority: number;
  };
}

const AXIS_EFFECT = {
  technical: { weight: 0.35, ceiling: 15 },
  content: { weight: 0.45, ceiling: 25 },
  authority: { weight: 0.20, ceiling: 40 },
};

export function computeForecast(
  currentScore: number,
  actions: AssignedAction[],
  siteContext: { totalPages: number; crawlDepth: number; industry: string }
): ForecastResult {
  let techGain = 0;
  let contentGain = 0;
  let authorityGain = 0;
  let totalClickGain = 0;

  for (const action of actions) {
    const impact = action.estimatedImpact || 0;
    totalClickGain += impact;

    if (action.category === 'technical') {
      techGain += (action.priority <= 3 ? 2 : 0.5);
    } else if (action.category === 'content') {
      contentGain += (action.priority <= 3 ? 3 : 1);
    } else if (action.category === 'industry' || action.action === 'Acquire Backlinks') {
      authorityGain += 2;
    }
  }

  // Cap the gains based on ceiling
  techGain = Math.min(techGain, AXIS_EFFECT.technical.ceiling);
  contentGain = Math.min(contentGain, AXIS_EFFECT.content.ceiling);
  authorityGain = Math.min(authorityGain, AXIS_EFFECT.authority.ceiling);

  const totalPoints = techGain + contentGain + authorityGain;
  const projectedScore = Math.min(100, currentScore + totalPoints);

  // Confidence decreases with site size and crawl depth (complexity increases)
  let confidence = 85; 
  if (siteContext.totalPages > 1000) confidence -= 10;
  if (siteContext.crawlDepth > 5) confidence -= 5;
  if (actions.length < 5) confidence -= 10;

  return {
    currentScore,
    projectedScore: Math.round(projectedScore),
    estimatedClickGain: Math.round(totalClickGain),
    confidence: Math.max(40, confidence),
    breakdown: {
      technical: Math.round(techGain),
      content: Math.round(contentGain),
      authority: Math.round(authorityGain),
    },
  };
}

export function computeForecastFromPages(
  pages: any[],
  industry: any
): ForecastResult {
  const stats = computeWqaSiteStats(pages, industry);
  const { score } = deriveWqaScore(stats);
  const actions = computeWqaActionGroups(pages);
  
  return computeForecast(score, actions, {
    totalPages: pages.length,
    crawlDepth: Math.max(...pages.map((p: any) => Number(p.crawlDepth || 0))),
    industry: String(industry)
  });
}

export const ForecastService = {
  computeForecast: computeForecastFromPages,
  computeForecastRaw: computeForecast
};
