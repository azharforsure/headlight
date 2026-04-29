import React from 'react'
import { RsEmpty } from '../../RsEmpty'
import { Card, SectionTitle, Row, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { CommerceStats } from '../../../../../services/right-sidebar/commerce'
import { useSeoCrawler } from '../../../../../contexts/SeoCrawlerContext'

export function CommerceFeedTab({ stats }: RsTabProps<CommerceStats>) {
	const { openIntegrationsModal } = useSeoCrawler() as any
	if (!stats.feed.connected) return <RsEmpty
		title="Connect your store to compare crawl vs feed"
		hint="Connect Shopify, WooCommerce, or Magento to see which catalog items are missing from the live site or sitemap."
		cta={ { label: 'Connect store', onClick: () => openIntegrationsModal?.('shopify') } }
	/>
	return (
		<Card>
			<SectionTitle>Feed coverage</SectionTitle>
			<Row label="Items in feed" value={stats.feed.itemsInFeed ?? '—'} />
			<Row label="Missing on site" value={stats.feed.itemsMissingFromFeed ?? '—'} tone={(stats.feed.itemsMissingFromFeed ?? 0) ? 'warn' : 'good'} />
		</Card>
	)
}
