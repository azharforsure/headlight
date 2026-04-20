import type { MetricDescriptor } from "./descriptor";

export const COMPETITORS_METRIC_IDS = [
	"competitors.tracked.count",
	"competitors.overlap.keywords",
	"competitors.overlap.backlinks",
	"competitors.gap.keywords",
	"competitors.gap.content",
	"competitors.gap.features",
	"competitors.winRate",
	"competitors.lossRate",
	"competitors.sharedDomains",
	"competitors.velocity.newPages.30d",
	"competitors.velocity.newBacklinks.30d",
	"competitors.brand.strengthIndex",
] as const;

export type CompetitorsMetricId = (typeof COMPETITORS_METRIC_IDS)[number];
export type CompetitorsMetricDescriptor = MetricDescriptor & { namespace: "competitors"; id: CompetitorsMetricId };
