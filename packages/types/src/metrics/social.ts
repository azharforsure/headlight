import type { MetricDescriptor } from "./descriptor";

export const SOCIAL_METRIC_IDS = [
	"social.followers.total",
	"social.followers.perChannel",
	"social.engagement.rate",
	"social.mentions.count",
	"social.mentions.sentiment",
	"social.shareOfVoice",
	"social.brand.searchVolume",
	"social.brand.searchTrend.30d",
	"social.ogImage.coverage",
	"social.twitterCard.coverage",
	"social.socialReferralTraffic.share",
] as const;

export type SocialMetricId = (typeof SOCIAL_METRIC_IDS)[number];
export type SocialMetricDescriptor = MetricDescriptor & { namespace: "social"; id: SocialMetricId };
