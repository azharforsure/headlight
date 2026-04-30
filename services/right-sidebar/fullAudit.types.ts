export interface FullAuditStats {
  // Hero
  overallScore: number
  radar: { axis: string; value: number }[]
  heroChips: { label: string; value: string; tone: 'good'|'warn'|'bad'|'info'|'neutral' }[]

  // Site fingerprint (from wqaState + pages)
  fingerprint: {
    domain: string
    cms: string | null
    language: string | null
    industry: string | null
    isMultiLanguage: boolean
    jsFramework: string | null
    pageCount: number
  }

  // GSC search performance (30d) — null when not connected
  search: {
    connected: boolean
    totalClicks: number
    totalImpressions: number
    avgCtr: number          // 0..1
    avgPosition: number | null
    clicksTrend: number[]   // sparkline points (length up to 30)
    pagesLosingTraffic: number
    pagesGainingTraffic: number
  } | null

  // Risk signals (deterministic from pages + filters)
  risk: {
    losingTraffic: number
    declining: number
    broken: number
    orphans: number
    redirectChains: number
    duplicateTitles: number
  }

  // Tech tab
  tech: {
    httpsPct: number
    avgResponseMs: number | null
    indexablePct: number
    nonIndexablePct: number
    brokenPages: number
    schemaCoveragePct: number
    statusMix: { code: '2xx'|'3xx'|'4xx'|'5xx'; count: number; color: string }[]
    sitemapCoveragePct: number
    robotsPresent: boolean
    avgCrawlDepth: number
    depthHistogram: { label: string; value: number }[]
    cwv: {
      connected: boolean
      lcpMs: number | null
      cls: number | null
      inpMs: number | null
      passRatePct: number | null
    }
  }

  // Content tab
  content: {
    titleCoveragePct: number
    descCoveragePct: number
    h1CoveragePct: number
    thinPct: number
    avgWords: number
    dupTitles: number
    dupDescriptions: number
    readabilityAvg: number | null
    readabilityHistogram: { label: string; value: number }[]
    topTopics: { label: string; value: number }[]      // top 6 from page.topicCluster
    authorCoveragePct: number
  }

  // Links tab
  links: {
    avgInternalLinks: number
    avgExternalLinks: number
    orphanPages: number
    redirectChains: number
    brokenLinks: number
    inlinkDistribution: number[]                       // sparkline of sorted inlinks
    topHubs: { url: string; inlinks: number }[]        // top 5
    topOrphans: { url: string; depth: number }[]       // top 5
    externalDomains: { domain: string; count: number }[] // top 5
  }

  // Actions
  actions: {
    id: string
    label: string
    effort: 'low'|'medium'|'high'
    impact: number
    band: 'tech'|'content'|'links'|'schema'
    filter?: Record<string, unknown>
  }[]
}
