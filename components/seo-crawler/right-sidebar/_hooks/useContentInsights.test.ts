import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useContentInsights } from './useContentInsights'

const MOCK_PAGES = [
    { isHtmlPage: true, wordCount: 200, topicCluster: 'pricing' },
    { isHtmlPage: true, wordCount: 1000, topicCluster: 'pricing' },
    { isHtmlPage: true, wordCount: 500 },
]

vi.mock('@/contexts/SeoCrawlerContext', () => ({
    useSeoCrawler: () => ({ 
        pages: MOCK_PAGES, 
        crawlHistory: [], 
        currentSessionId: 's1',
        compareSession: { pages: [] }
    })
}))

describe('useContentInsights', () => {
    it('computes basic rollups correctly', () => {
        const { result } = renderHook(() => useContentInsights())
        expect(result.current.total).toBe(3)
        expect(result.current.thin).toBe(1) // <300
        expect(result.current.wcMedian).toBe(500)
    })

    it('identifies topic clusters and orphans', () => {
        const { result } = renderHook(() => useContentInsights())
        // 'pricing' has 2 pages, one is 'uncategorised'
        expect(result.current.clusterRows.find(r => r.name === 'pricing')?.count).toBe(2)
        expect(result.current.orphanTopics).toBe(1) // the uncategorised one
    })
})
