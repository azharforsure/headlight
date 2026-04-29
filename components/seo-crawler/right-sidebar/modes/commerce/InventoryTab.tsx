import React from 'react'
import { Card, SectionTitle, Row, StatTile } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { CommerceStats } from '../../../../../services/right-sidebar/commerce'

export function CommerceInventoryTab({ stats }: RsTabProps<CommerceStats>) {
	const i = stats.inventory
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="Products" value={i.products} />
				<StatTile label="Collections" value={i.collections} />
				<StatTile label="Out of stock" value={i.outOfStock} tone={i.outOfStock ? 'warn' : 'good'} />
				<StatTile label="Low stock" value={i.lowStock} tone={i.lowStock ? 'warn' : 'good'} />
			</div>
			<Card>
				<SectionTitle>Pricing hygiene</SectionTitle>
				<Row label="With price" value={stats.price.withPrice} />
				<Row label="Missing price" value={stats.price.missingPrice} tone={stats.price.missingPrice ? 'warn' : 'good'} />
				<Row label="Missing currency" value={stats.price.missingCurrency} tone={stats.price.missingCurrency ? 'warn' : 'good'} />
			</Card>
		</div>
	)
}
