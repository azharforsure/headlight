// Source ladder — T0 is the highest-trust source, T8 is lowest.
export const SOURCE_TIERS = ["T0", "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"] as const;
export type SourceTier = (typeof SOURCE_TIERS)[number];

export const SOURCE_TAGS = [
	"source", // first-party (GSC, GA, Stripe)
	"browser", // headless browser measurement
	"scrape", // HTML/DOM scrape
	"ai", // model-inferred
	"est", // estimated/derived
	"default", // platform default
	"stale", // older than freshness window
	"lowN", // low sample size
] as const;
export type SourceTag = (typeof SOURCE_TAGS)[number];

export interface SourceStamp {
	tier: SourceTier;
	tags: ReadonlyArray<SourceTag>;
	provider: string; // e.g. "gsc", "playwright", "gemini-2.0-flash"
	observedAt: string; // ISO
	sampleSize?: number;
	confidence?: number; // 0..1
}

export const TIER_RANK: Record<SourceTier, number> = {
	T0: 0,
	T1: 1,
	T2: 2,
	T3: 3,
	T4: 4,
	T5: 5,
	T6: 6,
	T7: 7,
	T8: 8,
};
