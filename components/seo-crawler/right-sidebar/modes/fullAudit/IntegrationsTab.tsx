import React from 'react'
import { Card, SectionTitle, Chip, Row, ProgressBar } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { FaSiteStats } from '../../../../../services/right-sidebar/fullAudit'
import { useSeoCrawler } from '../../../../../contexts/SeoCrawlerContext'

const LIST: { key: string; label: string }[] = [
	{ key: 'gsc', label: 'Google Search Console' },
	{ key: 'ga4', label: 'Google Analytics 4' },
	{ key: 'gbp', label: 'Google Business Profile' },
	{ key: 'googleAds', label: 'Google Ads' },
	{ key: 'metaAds', label: 'Meta Ads' },
	{ key: 'shopify', label: 'Shopify' },
	{ key: 'woocommerce', label: 'WooCommerce' },
	{ key: 'magento', label: 'Magento' },
	{ key: 'twitter', label: 'X / Twitter' },
	{ key: 'facebook', label: 'Facebook' },
	{ key: 'linkedin', label: 'LinkedIn' },
]

export function FaIntegrationsTab({ stats, deps }: RsTabProps<FaSiteStats>) {
	const { openIntegrationsModal } = useSeoCrawler() as any
	const conn = deps.integrationConnections ?? {}
	return (
		<div className="space-y-3">
			<Card>
				<SectionTitle>Coverage</SectionTitle>
				<ProgressBar value={stats.integrationCoverage.connected} max={stats.integrationCoverage.total} />
				<div className="text-[10px] text-[#888] mt-1">{stats.integrationCoverage.connected} / {stats.integrationCoverage.total} connected</div>
			</Card>
			<Card>
				<SectionTitle action={<button className="text-[10px] text-[#F5364E] hover:underline" onClick={() => openIntegrationsModal?.()}>Manage</button>}>Providers</SectionTitle>
				{LIST.map(i => (
					<Row key={i.key} label={i.label} value={<Chip tone={conn[i.key]?.status === 'connected' ? 'good' : 'neutral'}>{conn[i.key]?.status === 'connected' ? 'connected' : 'off'}</Chip>} />
				))}
			</Card>
		</div>
	)
}
