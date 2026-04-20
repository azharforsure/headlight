import type { UrlString } from "./primitives";
import type { Mode } from "./modes";

export const CRAWL_STATUS = [
	"queued",
	"running",
	"paused",
	"succeeded",
	"partial",
	"failed",
	"canceled",
] as const;
export type CrawlStatus = (typeof CRAWL_STATUS)[number];

export interface CrawlConfig {
	seed: UrlString;
	maxPages: number;
	maxDepth: number;
	mode: Mode;
	respectRobots: boolean;
	renderJs: boolean;
	sitemaps: ReadonlyArray<UrlString>;
	includePatterns: ReadonlyArray<string>;
	excludePatterns: ReadonlyArray<string>;
	concurrency: number;
	rateLimitPerHost: number;
}

export interface CrawlProgress {
	discovered: number;
	fetched: number;
	parsed: number;
	failed: number;
	skipped: number;
}
