import type { MetricDescriptor } from "./descriptor";

export const UX_METRIC_IDS = [
	"ux.cwv.lcp.p75",
	"ux.cwv.inp.p75",
	"ux.cwv.cls.p75",
	"ux.cwv.ttfb.p75",
	"ux.cwv.passingShare",
	"ux.engagement.scrollDepth.median",
	"ux.engagement.rageClicks",
	"ux.engagement.deadClicks",
	"ux.conversion.rate",
	"ux.conversion.funnel.dropoff.top",
	"ux.accessibility.violations",
	"ux.accessibility.contrastFails",
	"ux.forms.abandonmentRate",
	"ux.navigation.searchUsageRate",
] as const;

export type UxMetricId = (typeof UX_METRIC_IDS)[number];
export type UxMetricDescriptor = MetricDescriptor & { namespace: "ux"; id: UxMetricId };
