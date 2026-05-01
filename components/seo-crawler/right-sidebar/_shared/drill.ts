import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'

export function useDrill() {
  const { setActiveCategories, setActiveMacro, setSelectedPage, setSelectedRows, scrollGridIntoView } = useSeoCrawler() as any
  
  return {
    toCategory: (group: string, sub: string) => {
      setActiveMacro?.(null)
      setActiveCategories?.([{ group, sub }])
      setSelectedRows?.(new Set())
      scrollGridIntoView?.()
    },
    toIssue: (issueId: string) => {
      setActiveMacro?.(issueId)
      scrollGridIntoView?.()
    },
    toPage:  (page: any) => {
      setSelectedPage?.(page)
      // Usually selecting a page also opens the inspector, which is handled by context
    },
  }
}
