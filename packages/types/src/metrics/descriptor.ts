import type { Mode } from "../modes";
import type { MetricRole } from "../roles";
import type { SourceStamp } from "../sources";
import type { Freshness } from "../freshness";

export type MetricUnit =
	| "count"
	| "percent"
	| "ratio"
	| "ms"
	| "seconds"
	| "bytes"
	| "usd"
	| "rank"
	| "score"
	| "boolean"
	| "string";

export type MetricScope = "project" | "site" | "template" | "page" | "keyword" | "link" | "competitor" | "market";

export interface MetricDescriptor {
	id: string; // e.g. "technical.crawl.budgetUsed"
	namespace: MetricNamespace;
	name: string;
	unit: MetricUnit;
	scope: MetricScope;
	roles: ReadonlyArray<MetricRole>;
	modes: ReadonlyArray<Mode>;
	sourceLadder: ReadonlyArray<string>; // ordered provider ids
	formula?: string; // human-readable
	docsUrl?: string;
}

export interface MetricValue<T = number> {
	metricId: string;
	value: T;
	freshness: Freshness;
	source: SourceStamp;
	scope: MetricScope;
	scopeId: string; // id of project/page/keyword/etc
	capturedAt: string; // ISO
}

export const METRIC_NAMESPACES = [
	"traffic",
	"rankings",
	"content",
	"technical",
	"links",
	"ux",
	"paid",
	"commerce",
	"social",
	"ai",
	"competitors",
	"local",
] as const;
export type MetricNamespace = (typeof METRIC_NAMESPACES)[number];
