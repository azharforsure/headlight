import type { CrawledPage } from '../CrawlDatabase'
export function makePage(p: Partial<CrawledPage>): CrawledPage {
	return {
		url: 'https://example.com/',
		statusCode: 200,
		title: 'Example',
		metaDescription: 'Example description',
		h1s: ['Example'],
		wordCount: 800,
		bytes: 50_000,
		responseTimeMs: 250,
		depth: 0,
		inboundInternalLinks: 5,
		images: [],
		outgoingLinks: [],
		schemaTypes: [],
		...p,
	} as CrawledPage
}
