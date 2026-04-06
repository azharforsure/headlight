/**
 * VolumeEstimation provides a fallback for search volume when SEMrush or Ahrefs
 * data is missing.
 * 
 * Methodology:
 * It uses a standard CTR model to estimate "Total Searches" from observed 
 * "Impressions" at a specific "Position".
 */

// Average CTR by position (standard curve)
const POSITION_CTR_CURVE: Record<number, number> = {
  1: 0.35,
  2: 0.17,
  3: 0.12,
  4: 0.08,
  5: 0.05,
  6: 0.04,
  7: 0.03,
  8: 0.02,
  9: 0.02,
  10: 0.015,
};

export class VolumeEstimation {
  /**
   * Estimates search volume derived from GSC data.
   * 
   * Formula: Estimated Volume = Impressions / (CTR at position)
   */
  static fromImpressions(impressions: number, position: number): number {
    if (!impressions || !position) return 0;

    // Use floor of position to match curve
    const posIndex = Math.floor(position);
    const ctr = POSITION_CTR_CURVE[posIndex] || 0.01; // default to 1% if deep down

    // Avoid division by zero
    if (ctr === 0) return impressions;

    const estimated = impressions / ctr;

    // Return rounded result
    return Math.round(estimated);
  }

  /**
   * Refined estimation for a list of queries.
   */
  static estimateForPage(queries: Array<{ impressions: number; position: number }>): number {
    if (queries.length === 0) return 0;

    // We usually estimate based on the main keyword (highest impressions)
    const main = queries.sort((a, b) => b.impressions - a.impressions)[0];
    return this.fromImpressions(main.impressions, main.position);
  }
}
