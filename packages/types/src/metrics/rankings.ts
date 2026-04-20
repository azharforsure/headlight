import type { MetricDescriptor } from "./descriptor";

export const RANKINGS_METRIC_IDS = [
	"rankings.tracked.count",
	"rankings.top3.count",
	"rankings.top10.count",
	"rankings.top100.count",
	"rankings.avgPosition",
	"rankings.movers.up",
	"rankings.movers.down",
	"rankings.visibility.share",
	"rankings.serpFeatures.owned",
	"rankings.featuredSnippets.count",
	"rankings.peopleAlsoAsk.count",
	"rankings.aiOverview.appearances",
	"rankings.volatility.7d",
	"rankings.cannibalization.count",
	"rankings.striking.distance.count",
] as const;

export type RankingMetricId = (typeof RANKINGS_METRIC_IDS)[number];
export type RankingMetricDescriptor = MetricDescriptor & { namespace: "rankings"; id: RankingMetricId };
