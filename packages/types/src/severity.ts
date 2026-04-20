export const SEVERITY_BANDS = ["blocking", "revenueLoss", "highLeverage", "strategic", "hygiene"] as const;
export type SeverityBand = (typeof SEVERITY_BANDS)[number];

export const SEVERITY_WEIGHT: Record<SeverityBand, number> = {
	blocking: 100,
	revenueLoss: 80,
	highLeverage: 60,
	strategic: 40,
	hygiene: 20,
};
