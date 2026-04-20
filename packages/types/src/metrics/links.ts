import type { MetricDescriptor } from "./descriptor";

export const LINKS_METRIC_IDS = [
	"links.referring.domains",
	"links.referring.ips",
	"links.backlinks.total",
	"links.backlinks.dofollow",
	"links.backlinks.nofollow",
	"links.anchor.brandedShare",
	"links.anchor.exactMatchShare",
	"links.anchor.toxicShare",
	"links.newDomains.30d",
	"links.lostDomains.30d",
	"links.internal.orphans",
	"links.internal.avgInboundPerPage",
	"links.internal.brokenCount",
	"links.external.brokenCount",
	"links.authority.domain",
	"links.authority.page.median",
] as const;

export type LinksMetricId = (typeof LINKS_METRIC_IDS)[number];
export type LinksMetricDescriptor = MetricDescriptor & { namespace: "links"; id: LinksMetricId };
