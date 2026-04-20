import type { MetricDescriptor } from "./descriptor";

export const TRAFFIC_METRIC_IDS = [
	"traffic.sessions",
	"traffic.users",
	"traffic.newUsers",
	"traffic.pageviews",
	"traffic.bounceRate",
	"traffic.avgSessionDuration",
	"traffic.organic.clicks",
	"traffic.organic.impressions",
	"traffic.organic.ctr",
	"traffic.organic.avgPosition",
	"traffic.direct.share",
	"traffic.referral.share",
	"traffic.social.share",
	"traffic.paid.share",
	"traffic.brand.share",
	"traffic.nonBrand.share",
	"traffic.country.top5",
	"traffic.device.mobileShare",
	"traffic.landingPages.count",
	"traffic.exitPages.top10",
] as const;

export type TrafficMetricId = (typeof TRAFFIC_METRIC_IDS)[number];
export type TrafficMetricDescriptor = MetricDescriptor & { namespace: "traffic"; id: TrafficMetricId };
