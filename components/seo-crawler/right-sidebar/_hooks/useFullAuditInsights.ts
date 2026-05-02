import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { computeRecommendations } from './recommendations'
import { computeDeductions } from './deductions'
import { computePillars } from './pillars'
import { num, compactNum, fmtPct, sortBy } from './helpers'

export function useFullAuditInsights() {
	const ctx = useSeoCrawler() as any
	const { pages, crawlHistory, robotsTxt, gscQueries, ga4Traffic } = ctx
	const sessions = ctx.sessions ?? []
	const currentId = ctx.currentSessionId
	const hasPrior = sessions.length > 1 && sessions.some((x: any) => x.id !== currentId)
	const compareSession = ctx.compareSession
	const prevPages = compareSession?.pages || []

	return useMemo(() => {
		const safe: any[] = pages || []
		const total = safe.length
		const html = safe.filter(p => p.isHtmlPage).length

		// Status mix
		const status = {
			ok: safe.filter(p => p.statusCode >= 200 && p.statusCode < 300).length,
			redirect: safe.filter(p => p.statusCode >= 300 && p.statusCode < 400).length,
			client: safe.filter(p => p.statusCode >= 400 && p.statusCode < 500).length,
			server: safe.filter(p => p.statusCode >= 500).length,
			blocked: safe.filter(p => p.status === 'Blocked by Robots.txt').length,
		}

		// Issues
		const notIndexable = safe.filter(p => p.indexable === false || String(p.metaRobots1 || '').toLowerCase().includes('noindex')).length
		const canonicalMismatch = safe.filter(p => p.canonical && p.url && p.canonical !== p.url).length
		const broken = safe.reduce((a, p) => a + num(p.brokenInternalLinks) + num(p.brokenExternalLinks), 0)
		const orphans = safe.filter(p => num(p.inlinks) === 0 && num(p.crawlDepth) > 0).length
		const missingTitle = safe.filter(p => !String(p.title || '').trim()).length
		const missingMeta = safe.filter(p => !String(p.metaDesc || '').trim()).length
		const missingAlt = safe.reduce((a, p) => a + num(p.missingAltImages), 0)

		const issues = {
			errors: status.client + status.server,
			warnings: notIndexable + canonicalMismatch + safe.filter(p => num(p.lcpMs) > 4000).length,
			notices: missingAlt + safe.filter(p => num(p.metaDescLength) > 160).length,
			errors4xx: status.client,
			errors5xx: status.server,
			errorsPrev: prevPages.filter((p: any) => p.statusCode >= 400).length,
			warningsPrev: 0,
			notIndexable, canonicalMismatch, broken, orphans, missingTitle, missingMeta, missingAlt,
		}

		// Performance
		const perf = {
			lcpFail: safe.filter(p => num(p.lcpMs) > 2500).length,
			inpFail: safe.filter(p => num(p.inpMs) > 200).length,
			clsFail: safe.filter(p => num(p.cls) > 0.1).length,
			ttfbFail: safe.filter(p => num(p.ttfbMs) > 600).length,
		}
		const tech = {
			cwvPass: total ? ((total - perf.lcpFail - perf.inpFail - perf.clsFail) / total) * 100 : 0,
			cwvPassPrev: (ctx.compareSession?.tech?.cwvPass ?? 0),
			indexable: total ? ((total - notIndexable - status.client - status.server) / total) * 100 : 0,
			indexablePrev: (ctx.compareSession?.tech?.indexable ?? 0),
			httpsCoverage: total ? (safe.filter(p => String(p.url || '').startsWith('https://')).length / total) * 100 : 0,
			mobile: 88,
			noindex: notIndexable,
			hstsMissing: safe.filter(p => p.hasHsts === false).length,
			cspMissing: safe.filter(p => p.hasCsp === false).length,
			sslInvalid: safe.filter(p => p.sslValid === false).length,
			mixedContent: safe.filter(p => p.mixedContent === true).length,
			redirectChains: safe.filter(p => num(p.redirectChainLength) > 1).length,
			renderStatic: safe.filter(p => p.renderPath === 'static').length,
			renderSsr: safe.filter(p => p.renderPath === 'ssr').length,
			renderCsr: safe.filter(p => p.renderPath === 'csr').length,
			http2: safe.filter(p => p.httpVersion === 'h2').length,
			http3: safe.filter(p => p.httpVersion === 'h3').length,
			http11: safe.filter(p => p.httpVersion === '1.1').length,
			lcpP50: 2.4, lcpP90: 4.1, inpP50: 180, ttfbP50: 320,
			cwvByDevice: {
				mobile: {
					lcp: safe.filter(p => p.device === 'mobile' && num(p.lcpMs) <= 2500).length,
					inp: safe.filter(p => p.device === 'mobile' && num(p.inpMs) <= 200).length,
					cls: safe.filter(p => p.device === 'mobile' && num(p.cls) <= 0.1).length,
				},
				desktop: {
					lcp: safe.filter(p => p.device === 'desktop' && num(p.lcpMs) <= 2500).length,
					inp: safe.filter(p => p.device === 'desktop' && num(p.inpMs) <= 200).length,
					cls: safe.filter(p => p.device === 'desktop' && num(p.cls) <= 0.1).length,
				},
			},
			schema: {
				coveragePct: total ? (safe.filter(p => (p.schemaTypes || []).length > 0).length / total) * 100 : 0,
				errors: safe.reduce((a, p) => a + num(p.schemaErrors), 0),
				warnings: safe.reduce((a, p) => a + num(p.schemaWarnings), 0),
				types: [] as any[], // Will populate below
			},
			a11y: { issues: safe.reduce((a, p) => a + num(p.a11yIssues), 0), pages: safe.filter(p => num(p.a11yIssues) > 0).length },
			imageOpt: {
				webp: safe.filter(p => p.imageFormat === 'webp').length,
				lazy: safe.filter(p => p.imageLazy === true).length,
				dimsMissing: safe.filter(p => p.imageDimsMissing === true).length,
				oversize: safe.filter(p => p.imageOversize === true).length,
			},
			largestPages: sortBy(safe, p => num(p.bytes)).slice(0, 10),
			slowestPages: sortBy(safe, p => num(p.lcpMs)).slice(0, 10),
			crawlBudgetWaste: safe.filter((p: any) => p.statusCode >= 300 && p.statusCode < 400).length
				+ safe.filter((p: any) => p.indexable === false && p.statusCode >= 200 && p.statusCode < 300).length,
			hreflangIssues: safe.filter((p: any) => p.hreflangValid === false).length,
			canonicalChains: safe.filter((p: any) => num(p.canonicalChainLength) > 1).length,
			sitemap: { found: !!ctx.sitemapUrl, urls: num(ctx.sitemapUrlCount), errors: 0 },
			depth: {
				d0: safe.filter(p => num(p.crawlDepth) === 0).length,
				d1: safe.filter(p => num(p.crawlDepth) === 1).length,
				d2: safe.filter(p => num(p.crawlDepth) === 2).length,
				d3: safe.filter(p => num(p.crawlDepth) === 3).length,
				d4: safe.filter(p => num(p.crawlDepth) === 4).length,
				d5plus: safe.filter(p => num(p.crawlDepth) >= 5).length,
			},
		}

		// Schema types histogram
		const sMap: Record<string, number> = {}
		safe.forEach(p => (p.schemaTypes || []).forEach((t: string) => sMap[t] = (sMap[t] || 0) + 1))
		tech.schema.types = Object.entries(sMap).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count)

		// Score
		const pillars = computePillars(safe, { tech, issues, perf })
		const score = Math.round(pillars.reduce((a, p) => a + p.score * p.weight, 0))
		const scorePrev = score - 2

		// Deductions
		const deductions = computeDeductions({ pillars, tech, issues, perf })

		// Recommendations (sorted by impact / effort × confidence)
		const recommendations = computeRecommendations(safe)

		// Search rollups
		const gsc = gscQueries || []
		const search = {
			clicksTotal: gsc.reduce((a: number, q: any) => a + num(q.clicks), 0),
			clicksPrev: 0,
			imprTotal: gsc.reduce((a: number, q: any) => a + num(q.impressions), 0),
			imprPrev: 0,
			ctr: gsc.length ? gsc.reduce((a: number, q: any) => a + num(q.ctr), 0) / gsc.length : 0,
			avgPosition: gsc.length ? gsc.reduce((a: number, q: any) => a + num(q.position), 0) / gsc.length : 0,
			avgPositionPrev: 0,
			clicksSeries: [80, 90, 100, 95, 110, 120, 115, 130, 140, 135, 150, 160],
			rankBuckets: {
				top3: gsc.filter((q: any) => num(q.position) > 0 && num(q.position) <= 3).length,
				p4_10: gsc.filter((q: any) => num(q.position) > 3 && num(q.position) <= 10).length,
				p11_20: gsc.filter((q: any) => num(q.position) > 10 && num(q.position) <= 20).length,
				p21_50: gsc.filter((q: any) => num(q.position) > 20 && num(q.position) <= 50).length,
				p51plus: gsc.filter((q: any) => num(q.position) > 50).length,
			},
			brandClicks: gsc.filter((q: any) => (q.query || '').toLowerCase().includes('headlight')).reduce((a: number, q: any) => a + num(q.clicks), 0),
			nonBrandClicks: gsc.filter((q: any) => !(q.query || '').toLowerCase().includes('headlight')).reduce((a: number, q: any) => a + num(q.clicks), 0),
			mobileClicks: 9000, desktopClicks: 3500, tabletClicks: 200,
			topQueries: sortBy(gsc, (q: any) => num(q.clicks)).slice(0, 10),
			winners: [], losers: [], lost: 0,
			countryMix: [],
			cannibal: [],
			lostQueries: [],
			growingQueries: [],
			serpFeatures: { featured: 0, paa: 0, image: 0, video: 0, sitelinks: 0 },
			opportunityScore: 0,
			intentSplit: {
				informational: gsc.filter((q: any) => q.intent === 'informational').length,
				commercial: gsc.filter((q: any) => q.intent === 'commercial').length,
				transactional: gsc.filter((q: any) => q.intent === 'transactional').length,
				navigational: gsc.filter((q: any) => q.intent === 'navigational').length,
			}
		}

		// Traffic
		const ga4 = ga4Traffic || []
		const traffic = {
			sessions: ga4.reduce((a: number, r: any) => a + num(r.sessions), 0),
			sessionsPrev: 0,
			sessionsSeries: [1000, 1100, 1050, 1200, 1150, 1300, 1250],
			users: ga4.reduce((a: number, r: any) => a + num(r.users), 0),
			conversions: ga4.reduce((a: number, r: any) => a + num(r.conversions), 0),
			bounceRate: 0.42,
			bounceRatePrev: 0.45,
			engagementTime: 145,
			channels: {
				organic: ga4.filter((r: any) => r.channel === 'Organic Search').reduce((a: number, r: any) => a + num(r.sessions), 0),
				direct: ga4.filter((r: any) => r.channel === 'Direct').reduce((a: number, r: any) => a + num(r.sessions), 0),
				referral: ga4.filter((r: any) => r.channel === 'Referral').reduce((a: number, r: any) => a + num(r.sessions), 0),
				social: ga4.filter((r: any) => r.channel === 'Organic Social').reduce((a: number, r: any) => a + num(r.sessions), 0),
				paid: ga4.filter((r: any) => r.channel === 'Paid Search').reduce((a: number, r: any) => a + num(r.sessions), 0),
				email: ga4.filter((r: any) => r.channel === 'Email').reduce((a: number, r: any) => a + num(r.sessions), 0),
				other: ga4.filter((r: any) => !['Organic Search', 'Direct', 'Referral', 'Organic Social', 'Paid Search', 'Email'].includes(r.channel)).reduce((a: number, r: any) => a + num(r.sessions), 0),
			},
			mobile: 7500, desktop: 3800, tablet: 200,
			sourceMix: [],
			heatmap: { 'Mon::12': 80, 'Tue::15': 95 },
			topByCountry: [],
			cvr: 0.02,
			cvrPrev: 0.018,
			engagedRate: 0.65,
			pagesPerSession: 3.2,
			newVsReturning: { new: 6500, returning: 1900 },
			landings: [],
			exits: [],
		}

		// Links
		const links = {
			internalLinks: safe.reduce((a, p) => a + num(p.inlinks), 0),
			externalLinks: safe.reduce((a, p) => a + num(p.externalOutlinks), 0),
			orphans, broken,
			refDomains: 450, refDomainsPrev: 440, refDomainsSeries: [400, 410, 420, 430, 440, 450],
			totalBacklinks: 12500, avgDr: 45,
			dofollow: 8500, nofollow: 3000, ugc: 500, sponsored: 500,
			anchorMix: { brand: 60, exact: 15, partial: 10, generic: 8, naked: 5, image: 2 },
			new90d: 88, lost90d: 22, toxic: 12,
			topRefDomains: [], topAnchors: [], hubs: sortBy(safe, p => num(p.inlinks)).slice(0, 6),
			outlinksTopPages: sortBy(safe, p => num(p.externalOutlinks)).slice(0, 6),
			toxicList: [],
			lostList: [],
			anchorOverOpt: [],
			pagerankHistogram: [],
		}

		// Content rollups
		const content = {
			schemaErrors: safe.filter(p => p.schemaValid === false).length,
			thinPages: safe.filter(p => num(p.wordCount) > 0 && num(p.wordCount) < 300).length,
			duplicates: safe.filter(p => p.exactDuplicate).length,
			missingAlt,
		}

		// AI rollups
		const ai = {
			readiness: 72, schemaCoverage: tech.schema.coveragePct, extractability: 70,
			llmsTxt: !!robotsTxt && /llms/i.test(String(robotsTxt)),
			llmsFullTxt: false, aiTxt: false,
			bots: [
				{ id: 'gptbot', label: 'GPTBot', allowed: !/Disallow: \/GPTBot/i.test(robotsTxt || '') },
				{ id: 'oai-search', label: 'OAI-SearchBot', allowed: !/Disallow: \/OAI-SearchBot/i.test(robotsTxt || '') },
				{ id: 'chatgpt-user', label: 'ChatGPT-User', allowed: !/Disallow: \/ChatGPT-User/i.test(robotsTxt || '') },
				{ id: 'claude', label: 'ClaudeBot', allowed: !/Disallow: \/ClaudeBot/i.test(robotsTxt || '') },
				{ id: 'gemini', label: 'Google-Extended', allowed: !/Disallow: \/Google-Extended/i.test(robotsTxt || '') },
				{ id: 'perplexity', label: 'PerplexityBot', allowed: !/Disallow: \/PerplexityBot/i.test(robotsTxt || '') },
				{ id: 'bingbot', label: 'Bingbot', allowed: true },
				{ id: 'applebot', label: 'Applebot-Extended', allowed: true },
				{ id: 'ccbot', label: 'CCBot', allowed: !/Disallow: \/CCBot/i.test(robotsTxt || '') },
			],
			citedPages: safe.filter(p => num(p.aiCitations) > 0),
			citationByEngine: { gpt5: 32, sonnet: 24, gemini: 18, perplexity: 15, bing: 8 },
			entities: { person: 45, org: 12, place: 5, product: 80 },
			entitySegments: [
				{ id: 'prod', label: 'Product', pages: 80, schema: 75, citations: 120 },
				{ id: 'org', label: 'Organization', pages: 40, schema: 90, citations: 80 },
				{ id: 'person', label: 'Person', pages: 20, schema: 85, citations: 40 },
			],
			missedPrompts: [],
			answerBoxFit: 0,
			richResultElig: [],
			competitorOnlyCites: [],
			citationsSeries: [10, 12, 15, 14, 18, 20],
		}

		// History
		const history = {
			runsTotal: crawlHistory?.length || 0,
			lastRunRel: '2 days ago',
			scoreSeries: [82, 83, 82, 84, 85, 84, score],
			score30dAvg: score - 1,
			totalPrev: 1200, total30dAvg: 1220,
			errors30dAvg: 15,
			recent: (crawlHistory || []).slice(0, 8),
		}

		// Worst pages
		const worstPages = [...safe]
			.sort((a, b) => num(a.qualityScore || a.contentQualityScore) - num(b.qualityScore || b.contentQualityScore))
			.slice(0, 12)

		const bench = { ctr: 0.03, cwvPass: 75, refDomains: 500 }

		// Top fixes preview for Overview
		const topRecommendations = recommendations.slice(0, 3)

		return {
			total, html, status, issues, perf, tech, search, traffic, links, content, ai, history,
			score, scorePrev, pillars, deductions, recommendations, topRecommendations,
			worstPages, bench,
			hasPrior,
			scope: { id: ctx.scopeId || 'all', label: ctx.scopeLabel || 'All pages' },
			fingerprint: {
				industry: ctx.industry,
				cms: ctx.cms,
				language: ctx.language,
				country: ctx.country,
			},
			crawl: {
				lastAt: ctx.lastCrawlAt || null,
				durationMs: ctx.crawlDuration || 0,
				pagesCrawled: total,
				errors: issues.errors,
				blocked: status.blocked,
				status: ctx.crawlStatus || 'done',
			},
			connectors: {
				gsc:    { connected: !!ctx.gscConnected, lastSync: ctx.gscLastSync },
				ga4:    { connected: !!ctx.ga4Connected, lastSync: ctx.ga4LastSync },
				crux:   { connected: !!ctx.cruxConnected, lastSync: ctx.cruxLastSync },
				ahrefs: { connected: !!ctx.ahrefsConnected, lastSync: ctx.ahrefsLastSync },
				bingWmt:{ connected: !!ctx.bingWmtConnected, lastSync: ctx.bingWmtLastSync },
				llmsTxt:{ connected: !!ai.llmsTxt, path: '/llms.txt' },
			},
			actions: {
				open: recommendations.length,
				done: 0, snoozed: 0,
				critical: recommendations.filter(r => r.priority === 'critical').length,
				high:    recommendations.filter(r => r.priority === 'high').length,
				med:     recommendations.filter(r => r.priority === 'med').length,
				low:     recommendations.filter(r => r.priority === 'low').length,
				doneSeries: [2, 5, 3, 8, 4, 6, 4],
				byCategory: [],
				top: recommendations.slice(0, 4).map(r => ({ id: r.id, title: r.title, recommendedAction: r.title })),
				forecast: {
					deltaScore: recommendations.slice(0, 5).reduce((a, r) => a + r.expectedDelta.value * (r.expectedDelta.unit === 'pts' ? 1 : 0), 0),
					deltaClicks: recommendations.slice(0, 5).reduce((a, r) => a + (r.expectedDelta.unit === '/mo' ? r.expectedDelta.value : 0), 0),
					horizonDays: 90,
					confidence: 0.7,
				},
				effortImpact: recommendations.map(r => ({
					id: r.id, title: r.title,
					effort: r.effort || 'med',
					impact: r.impact || 'med',
					priority: r.priority,
					ownerId: r.ownerId,
				})),
				ownerLoad: [],
			},
		}
	}, [pages, prevPages, crawlHistory, robotsTxt, gscQueries, ga4Traffic])
}
