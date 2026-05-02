import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCallback } from 'react'

/**
 * Hook for navigation/drilling from the right sidebar back into the main view.
 * Provides consistent methods for selecting pages and applying filters.
 */
export function useDrill() {
  const {
    pages,
    setSelectedPage,
    setPageFilter,
    setActiveMacro,
    setMode,
    mode: currentMode
  } = useSeoCrawler()

  /**
   * Navigate to a specific page by selecting it in the main view.
   * If only a URL is provided, it tries to find the full page object.
   */
  const toPage = useCallback((p: any) => {
    if (!p) return
    
    // If we only have a URL, try to find the full page object in the current session
    if (p.url && Object.keys(p).length === 1) {
      const fullPage = pages.find(pg => pg.url === p.url)
      setSelectedPage(fullPage || p)
    } else {
      setSelectedPage(p)
    }
  }, [pages, setSelectedPage])

  /**
   * Drill into a category by applying a filter and setting the active macro.
   * Supports macro-specific logic (e.g., switching to WQA mode).
   */
  const toCategory = useCallback((macro: string, value: string) => {
    // If the macro is 'wqa' or specifically targets WQA features, ensure we are in WQA mode
    if (macro === 'wqa' && currentMode !== 'wqa') {
      setMode('wqa')
    }

    // Set the specific filter selection in the page filter state
    setPageFilter(prev => ({
      ...prev,
      selections: {
        ...prev.selections,
        [macro]: [value]
      }
    }))

    // Set as active macro to trigger specialized filtering/view in the main grid
    setActiveMacro(value)
  }, [setPageFilter, setActiveMacro, currentMode, setMode])

  return {
    toPage,
    toCategory
  }
}
