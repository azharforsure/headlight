import type { MetricDescriptor } from "./descriptor";

export const COMMERCE_METRIC_IDS = [
	"commerce.products.total",
	"commerce.products.outOfStock",
	"commerce.products.noDescription",
	"commerce.products.noImage",
	"commerce.products.duplicateTitle",
	"commerce.schema.productCoverage",
	"commerce.schema.offerErrors",
	"commerce.schema.reviewCoverage",
	"commerce.reviews.avgRating",
	"commerce.reviews.count",
	"commerce.cart.abandonmentRate",
	"commerce.checkout.friction.score",
	"commerce.pdp.ctrFromSerp",
	"commerce.plp.avgProductsPerPage",
	"commerce.internationalization.currencies",
] as const;

export type CommerceMetricId = (typeof COMMERCE_METRIC_IDS)[number];
export type CommerceMetricDescriptor = MetricDescriptor & { namespace: "commerce"; id: CommerceMetricId };
