import React from 'react'
import { KpiHeader, Chip, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { CommerceStats } from '../../../../../services/right-sidebar/commerce'

export function CommerceOverviewTab({ stats }: RsTabProps<CommerceStats>) {
	return (
		<div className="space-y-3">
			<KpiHeader score={stats.overallScore} label="Commerce health" chips={[
				<Chip key="products" tone="info">{stats.inventory.products} products</Chip>,
				<Chip key="collections" tone="info">{stats.inventory.collections} collections</Chip>,
				<Chip key="oos" tone={stats.inventory.outOfStock ? 'warn' : 'good'}>{stats.inventory.outOfStock} OOS</Chip>,
			]} />
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="With Product schema" value={stats.schema.withProductSchema} />
				<StatTile label="With breadcrumbs" value={stats.schema.withBreadcrumbs} />
				<StatTile label="Missing price" value={stats.price.missingPrice} tone={stats.price.missingPrice ? 'warn' : 'good'} />
				<StatTile label="Missing currency" value={stats.price.missingCurrency} tone={stats.price.missingCurrency ? 'warn' : 'good'} />
			</div>
		</div>
	)
}
