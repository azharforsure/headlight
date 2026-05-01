import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function useCommerceInsights() {
  const { pages } = useSeoCrawler()
  return useMemo(() => {
    const safe = pages || []
    const products = safe.filter(p => p.isProduct === true || (Array.isArray(p.schemaTypes) && p.schemaTypes.includes('Product')))
    const collections = safe.filter(p => p.isCollection === true || (Array.isArray(p.schemaTypes) && p.schemaTypes.includes('CollectionPage')))
    const total = products.length

    const inventory = {
      inStock:   products.filter(p => p.availability === 'in_stock').length,
      oos:       products.filter(p => p.availability === 'out_of_stock').length,
      preorder:  products.filter(p => p.availability === 'preorder').length,
      backorder: products.filter(p => p.availability === 'backorder').length,
      unknown:   products.filter(p => !p.availability).length,
    }

    const schema = {
      hasProduct: safePct(products.filter(p => Array.isArray(p.schemaTypes) && p.schemaTypes.includes('Product')).length, total),
      validProduct: safePct(products.filter(p => p.productSchemaValid === true).length, total),
      missingGtin: products.filter(p => !p.gtin && !p.mpn).length,
      missingPrice: products.filter(p => !p.price).length,
      missingAvailability: products.filter(p => !p.availability).length,
      hasReviewSchema: safePct(products.filter(p => Array.isArray(p.schemaTypes) && p.schemaTypes.includes('Review')).length, total),
    }

    const feed = {
      approved: products.filter(p => p.feedStatus === 'approved').length,
      warnings: products.filter(p => p.feedStatus === 'warning').length,
      errors:   products.filter(p => p.feedStatus === 'error').length,
      missing:  products.filter(p => !p.feedStatus).length,
    }

    const funnel = {
      pdpViews:   products.reduce((a, p) => a + Number(p.ga4Views || 0), 0),
      atc:        products.reduce((a, p) => a + Number(p.ga4AddtoCart || 0), 0),
      checkouts:  products.reduce((a, p) => a + Number(p.ga4Checkouts || 0), 0),
      purchases:  products.reduce((a, p) => a + Number(p.ga4Transactions || 0), 0),
      revenue:    products.reduce((a, p) => a + Number(p.ga4EcommerceRevenue || 0), 0),
    }

    const reviews = {
      total: products.reduce((a, p) => a + Number(p.reviewCount || 0), 0),
      avg:   (() => {
        const seen = products.filter(p => Number(p.reviewCount) > 0)
        if (!seen.length) return 0
        return seen.reduce((a, p) => a + Number(p.reviewAverage || 0), 0) / seen.length
      })(),
      noReviews: products.filter(p => Number(p.reviewCount || 0) === 0).length,
    }

    return { total, products, collections, inventory, schema, feed, funnel, reviews }
  }, [pages])
}
