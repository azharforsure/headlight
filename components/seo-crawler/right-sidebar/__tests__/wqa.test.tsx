import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { WqaOverview } from '../wqa/WqaOverview'
import { WqaSearch } from '../wqa/WqaSearch'
import { SeoCrawlerProvider } from '@/contexts/SeoCrawlerContext'

const wrap = (children: React.ReactNode, pages: any[] = []) => (
    // @ts-ignore - initialState might be mock-only
    <SeoCrawlerProvider initialState={{ pages, mode: 'wqa' }}>{children}</SeoCrawlerProvider>
)

describe('WQA right sidebar', () => {
    it('shows empty state when no pages', () => {
        render(wrap(<WqaOverview />))
        expect(screen.getByText(/no crawl data yet/i)).toBeInTheDocument()
    })

    it('renders KPI tiles when pages exist', () => {
        const pages = [
            { url: 'https://x.com/a', qualityScore: 80, gscClicks: 100, gscImpressions: 1000, gscPosition: 4, statusCode: 200, indexable: true },
            { url: 'https://x.com/b', qualityScore: 60, gscClicks: 50,  gscImpressions: 800,  gscPosition: 12, statusCode: 200, indexable: true },
        ]
        render(wrap(<WqaSearch />, pages))
        expect(screen.getByText('Clicks 28d')).toBeInTheDocument()
        expect(screen.getByText('150')).toBeInTheDocument()
    })
})
