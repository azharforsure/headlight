import { countWhere, pct, score100 } from './_helpers'
import { CommerceOverviewTab, CommerceInventoryTab, CommerceSchemaTab, CommerceFeedTab, CommerceFunnelTab } from '../../components/seo-crawler/right-sidebar/modes/commerce'
import type { RsDataDeps, RsModeBundle } from './types'

export interface CommerceStats {
	overallScore: number
	inventory: { products: number; collections: number; outOfStock: number; lowStock: number }
	schema: { withProductSchema: number; withReviewSchema: number; withFaqSchema: number; withBreadcrumbs: number; total: number }
	feed: { connected: boolean; itemsInFeed: number | null; itemsMissingFromFeed: number | null }
	funnel: { plp: number; pdp: number; cart: number; checkout: number; thanks: number }
	price: { withPrice: number; missingPrice: number; missingCurrency: number }
}

export function computeCommerceStats(deps: RsDataDeps): CommerceStats {
	const pages = deps.pages
	const n = pages.length
	const products    = countWhere(pages, p => p.pageType === 'product' || /\/(products?|p)\//.test(p.url || ''))
	const collections = countWhere(pages, p => p.pageType === 'collection' || /\/(collections?|c)\//.test(p.url || ''))
	const plp         = countWhere(pages, p => p.pageType === 'collection' || /\/(category|c)\//.test(p.url || ''))
	const cart        = countWhere(pages, p => /\/cart\b/.test(p.url || ''))
	const checkout    = countWhere(pages, p => /\/checkout\b/.test(p.url || ''))
	const thanks      = countWhere(pages, p => /\/(thank-you|order-complete)\b/.test(p.url || ''))

	let outOfStock = 0, lowStock = 0
	let productSchema = 0, reviewSchema = 0, faqSchema = 0, breadcrumbs = 0
	let withPrice = 0, missingPrice = 0, missingCurrency = 0
	for (const p of pages) {
		if (p['stockStatus'] === 'out_of_stock') outOfStock++
		if (p['stockStatus'] === 'low_stock') lowStock++
		const t = Array.isArray(p['schemaTypes']) ? p['schemaTypes'] : []
		if (t.includes('Product'))     productSchema++
		if (t.includes('Review') || t.includes('AggregateRating')) reviewSchema++
		if (t.includes('FAQPage') || p['hasFaqSchema'])     faqSchema++
		if (t.includes('BreadcrumbList') || p['hasBreadcrumbSchema']) breadcrumbs++
		if (typeof p['price'] === 'number')  withPrice++
		else if (p.pageType === 'product') missingPrice++
		if (p.pageType === 'product' && !p['priceCurrency']) missingCurrency++
	}

	const ic = deps.integrationConnections ?? {}
	const feedConnected = !!(ic['shopify']?.status === 'connected' || ic['woocommerce']?.status === 'connected' || ic['magento']?.status === 'connected')
	const overallScore = score100([
		{ weight: 2, value: pct(productSchema, Math.max(1, products)) },
		{ weight: 1, value: pct(breadcrumbs, n) },
		{ weight: 1, value: 100 - pct(missingPrice, Math.max(1, products)) },
		{ weight: 1, value: 100 - pct(outOfStock, Math.max(1, products)) },
	])

	return {
		overallScore,
		inventory: { products, collections, outOfStock, lowStock },
		schema:    { withProductSchema: productSchema, withReviewSchema: reviewSchema, withFaqSchema: faqSchema, withBreadcrumbs: breadcrumbs, total: n },
		feed:      { connected: feedConnected, itemsInFeed: null, itemsMissingFromFeed: null },
		funnel:    { plp, pdp: products, cart, checkout, thanks },
		price:     { withPrice, missingPrice, missingCurrency },
	}
}

export const commerceBundle: RsModeBundle<CommerceStats> = {
	mode: 'commerce',
	accent: 'green',
	defaultTabId: 'commerce_overview',
	tabs: [
		{ id: 'commerce_overview',  label: 'Overview',  Component: CommerceOverviewTab },
		{ id: 'commerce_inventory', label: 'Inventory', Component: CommerceInventoryTab },
		{ id: 'commerce_schema',    label: 'Schema',    Component: CommerceSchemaTab },
		{ id: 'commerce_feed',      label: 'Feed',      Component: CommerceFeedTab },
		{ id: 'commerce_funnel',    label: 'Funnel',    Component: CommerceFunnelTab },
	],
	computeStats: computeCommerceStats,
}
