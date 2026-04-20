import type { MetricDescriptor } from "./descriptor";

export const LOCAL_METRIC_IDS = [
	"local.gbp.verified",
	"local.gbp.categories.count",
	"local.gbp.photos.count",
	"local.gbp.reviews.count",
	"local.gbp.reviews.avgRating",
	"local.gbp.posts.30d",
	"local.nap.consistency.score",
	"local.citations.count",
	"local.citations.missingTop50",
	"local.mapPack.appearances",
	"local.mapPack.avgPosition",
	"local.localPack.share",
	"local.reviews.responseRate",
] as const;

export type LocalMetricId = (typeof LOCAL_METRIC_IDS)[number];
export type LocalMetricDescriptor = MetricDescriptor & { namespace: "local"; id: LocalMetricId };
