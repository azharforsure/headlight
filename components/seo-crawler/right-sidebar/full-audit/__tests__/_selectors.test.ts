import { describe, it, expect, vi } from 'vitest'
import { 
  selectStatusMix, 
  selectDepthDistribution, 
  selectCategoryDonut, 
  selectIndexable, 
  selectIssues, 
  selectPillars, 
  selectOverallScore, 
  selectScoreDistribution, 
  selectCrawlHealth 
} from '../_selectors'

// Mocking dependencies
vi.mock('../../../IssueTaxonomy', () => ({
  getPageIssues: vi.fn((p) => p.issues || [])
}))

vi.mock('@headlight/actions', () => ({
  getAllActions: vi.fn(() => [
    { code: 'C001', title: 'Thin Content', severity: 'S1' },
    { code: 'T001', title: '404 Error', severity: 'S2' }
  ])
}))

describe('Full Audit Selectors', () => {
  const mockPages: any[] = [
    { statusCode: 200, crawlDepth: 0, pageType: 'Article', indexable: true, contentScore: 80, pageScore: 85, issues: ['C001'] },
    { statusCode: 200, crawlDepth: 1, pageType: 'Product', indexable: true, contentScore: 70, pageScore: 75 },
    { statusCode: 301, crawlDepth: 2, pageType: 'Other', indexable: false, technicalScore: 50, pageScore: 40, issues: ['T001'] },
    { statusCode: 404, crawlDepth: 1, pageType: 'Doc', indexable: false, technicalScore: 20, pageScore: 10, issues: ['T001'] },
    { statusCode: 500, crawlDepth: 3, pageType: 'Other', indexable: false, technicalScore: 0, pageScore: 5 },
  ]

  it('selectStatusMix should correctly group status codes', () => {
    const mix = selectStatusMix(mockPages)
    expect(mix.ok).toBe(2)
    expect(mix.redirect).toBe(1)
    expect(mix.clientError).toBe(1)
    expect(mix.serverError).toBe(1)
    expect(mix.total).toBe(5)
  })

  it('selectDepthDistribution should bucket pages by depth', () => {
    const dist = selectDepthDistribution(mockPages, 3)
    expect(dist[0].count).toBe(1)
    expect(dist[1].count).toBe(2)
    expect(dist[2].count).toBe(1)
    expect(dist[3].count).toBe(1)
  })

  it('selectCategoryDonut should categorize by pageType', () => {
    const donut = selectCategoryDonut(mockPages)
    expect(donut.find(d => d.name === 'Article')?.value).toBe(1)
    expect(donut.find(d => d.name === 'Product')?.value).toBe(1)
    expect(donut.find(d => d.name === 'Doc')?.value).toBe(1)
    expect(donut.find(d => d.name === 'Other')?.value).toBe(2)
  })

  it('selectIndexable should count indexable pages', () => {
    const idx = selectIndexable(mockPages)
    expect(idx.indexable).toBe(2)
    expect(idx.notIndexable).toBe(3)
  })

  it('selectIssues should aggregate issues by code and severity', () => {
    const issues = selectIssues(mockPages)
    expect(issues.openTotal).toBe(3) // 1xC001 (critical) + 2xT001 (high)
    expect(issues.severity.critical).toBe(1)
    expect(issues.severity.high).toBe(2)
    expect(issues.rows.length).toBe(2)
    expect(issues.rows[0].code).toBe('T001') // Sorted by count (2)
    expect(issues.rows[1].code).toBe('C001') // Count (1)
  })

  it('selectPillars should average precomputed scores', () => {
    const pillars = selectPillars(mockPages)
    // contentScore: [80, 70] -> avg 75
    // technicalScore: [50, 20, 0] -> avg 23
    expect(pillars.content).toBe(75)
    expect(pillars.technical).toBe(23)
  })

  it('selectOverallScore should apply weights correctly', () => {
    const p = { content: 80, technical: 70, schema: 60, links: 50, a11y: 40, security: 30 }
    const score = selectOverallScore(p)
    // 80*0.2 + 70*0.25 + 60*0.1 + 50*0.15 + 40*0.15 + 30*0.15
    // 16 + 17.5 + 6 + 7.5 + 6 + 4.5 = 57.5 -> 58
    expect(score).toBe(58)
  })

  it('selectScoreDistribution should bucket by pageScore', () => {
    const dist = selectScoreDistribution(mockPages)
    expect(dist.find(d => d.bucket === '<50')?.count).toBe(3)
    expect(dist.find(d => d.bucket === '70-79')?.count).toBe(1)
    expect(dist.find(d => d.bucket === '80-89')?.count).toBe(1)
  })

  it('selectCrawlHealth should map site summary fields', () => {
    const mockSite = {
      lastSession: {
        startedAt: 1000,
        finishedAt: 2000,
        durationMs: 1000,
        pagesCrawled: 100,
        responseAvgMs: 150,
        errors: { timeouts: 5 }
      }
    }
    const health = selectCrawlHealth(mockSite)
    expect(health.pagesCrawled).toBe(100)
    expect(health.avgMs).toBe(150)
    expect(health.errors.timeouts).toBe(5)
    expect(health.errors.server).toBe(0)
  })
})
