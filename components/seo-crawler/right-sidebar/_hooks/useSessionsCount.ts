// components/seo-crawler/right-sidebar/_hooks/useSessionsCount.ts
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'

export function useSessionsCount(): number {
  const ctx: any = useSeoCrawler()
  const list = ctx?.sessions ?? ctx?.crawlSessions ?? ctx?.history ?? []
  return Array.isArray(list) ? list.length : 0
}

export function useHasTrend(): boolean {
  return useSessionsCount() > 1
}
