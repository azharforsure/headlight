import type { MetricDescriptor } from "./descriptor";

export const TECHNICAL_METRIC_IDS = [
	"technical.crawl.budgetUsed",
	"technical.crawl.blockedByRobots",
	"technical.crawl.errors.4xx",
	"technical.crawl.errors.5xx",
	"technical.crawl.redirects.chainAvg",
	"technical.crawl.depth.avg",
	"technical.indexability.noindex.count",
	"technical.indexability.canonical.missing",
	"technical.indexability.canonical.conflicts",
	"technical.sitemap.present",
	"technical.sitemap.urlCount",
	"technical.sitemap.errors",
	"technical.robots.present",
	"technical.robots.disallow.count",
	"technical.https.enforced",
	"technical.hsts.present",
	"technical.mixedContent.count",
	"technical.hreflang.errors",
	"technical.structuredData.errors",
	"technical.structuredData.coverage",
	"technical.mobile.usable",
] as const;

export type TechnicalMetricId = (typeof TECHNICAL_METRIC_IDS)[number];
export type TechnicalMetricDescriptor = MetricDescriptor & { namespace: "technical"; id: TechnicalMetricId };
