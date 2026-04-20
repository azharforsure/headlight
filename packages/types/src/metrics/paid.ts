import type { MetricDescriptor } from "./descriptor";

export const PAID_METRIC_IDS = [
	"paid.spend.total",
	"paid.spend.perChannel",
	"paid.impressions",
	"paid.clicks",
	"paid.ctr",
	"paid.cpc.avg",
	"paid.cpa.avg",
	"paid.roas",
	"paid.conversionRate",
	"paid.qualityScore.avg",
	"paid.landingPage.mismatchRate",
	"paid.negatives.missingCount",
	"paid.search.brand.share",
	"paid.search.nonBrand.share",
	"paid.serp.overlap.organicVsPaid",
] as const;

export type PaidMetricId = (typeof PAID_METRIC_IDS)[number];
export type PaidMetricDescriptor = MetricDescriptor & { namespace: "paid"; id: PaidMetricId };
