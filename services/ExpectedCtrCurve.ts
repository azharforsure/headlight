/**
 * ExpectedCtrCurve.ts
 *
 * Expected CTR by Google SERP position, derived from industry averages.
 * Used to calculate CTR gap (actual vs expected) for action prioritization.
 */

const CTR_CURVE: Record<number, number> = {
  1: 0.276,
  2: 0.158,
  3: 0.11,
  4: 0.08,
  5: 0.069,
  6: 0.055,
  7: 0.045,
  8: 0.038,
  9: 0.032,
  10: 0.028,
  11: 0.021,
  12: 0.019,
  13: 0.017,
  14: 0.015,
  15: 0.013,
  16: 0.012,
  17: 0.011,
  18: 0.01,
  19: 0.009,
  20: 0.008,
};

export function getExpectedCtr(position: number): number {
  if (!position || position <= 0) return 0;

  const rounded = Math.round(position);
  if (rounded <= 20) return CTR_CURVE[rounded] || 0.008;
  if (rounded <= 50) return Math.max(0.003, 0.008 - ((rounded - 20) / 30) * 0.005);
  if (rounded <= 100) return 0.002;
  return 0;
}

export function getCtrGap(position: number, actualCtr: number): number {
  return Number(actualCtr || 0) - getExpectedCtr(position);
}

export function estimateCtrImprovementClicks(
  impressions: number,
  position: number,
  actualCtr: number
): number {
  const expected = getExpectedCtr(position);
  if (actualCtr >= expected) return 0;
  return Math.round(Math.max(0, Number(impressions || 0) * (expected - actualCtr)));
}

export function estimatePositionImprovementClicks(
  impressions: number,
  currentPosition: number,
  positionGain = 3
): number {
  const currentExpectedCtr = getExpectedCtr(currentPosition);
  const newPosition = Math.max(1, Number(currentPosition || 0) - positionGain);
  const newExpectedCtr = getExpectedCtr(newPosition);
  return Math.round(Math.max(0, Number(impressions || 0) * (newExpectedCtr - currentExpectedCtr)));
}
