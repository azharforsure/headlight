import type { MetricDescriptor } from "./descriptor";

export const CONTENT_METRIC_IDS = [
	"content.pages.total",
	"content.pages.indexable",
	"content.pages.thin",
	"content.pages.duplicate",
	"content.pages.orphan",
	"content.pages.stale",
	"content.readability.avgGrade",
	"content.titles.missing",
	"content.titles.tooLong",
	"content.metaDesc.missing",
	"content.h1.missing",
	"content.h1.multiple",
	"content.images.missingAlt",
	"content.wordCount.median",
	"content.topicCoverage.score",
	"content.intent.mismatchCount",
	"content.eat.authorBio.missing",
	"content.eat.lastUpdatedStale",
	"content.contentGaps.count",
] as const;

export type ContentMetricId = (typeof CONTENT_METRIC_IDS)[number];
export type ContentMetricDescriptor = MetricDescriptor & { namespace: "content"; id: ContentMetricId };
