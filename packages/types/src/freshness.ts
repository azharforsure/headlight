export const FRESHNESS = ["live", "recent", "fresh", "ok", "stale", "unknown"] as const;
export type Freshness = (typeof FRESHNESS)[number];

export const FRESHNESS_MAX_AGE_MS: Record<Freshness, number | null> = {
	live: 60_000, // < 1 min
	recent: 15 * 60_000, // < 15 min
	fresh: 24 * 60 * 60_000, // < 1 day
	ok: 7 * 24 * 60 * 60_000, // < 1 week
	stale: 30 * 24 * 60 * 60_000, // < 30 days (still shown but tagged)
	unknown: null, // unknown freshness
};
