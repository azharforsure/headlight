import React from 'react'
import { Card, SectionTitle, Row, StatTile, MiniFunnel } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { UxStats } from '../../../../../services/right-sidebar/uxConversion'

export function UxConversionTab({ stats }: RsTabProps<UxStats>) {
	const c = stats.conversion
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				<StatTile label="With CTA" value={c.ctaPresent} />
				<StatTile label="With form" value={c.formPresent} />
				<StatTile label="Gated" value={c.gatedPages} />
				<StatTile label="Checkout/cart" value={c.checkoutPages} />
			</div>
			<Card>
				<SectionTitle>Funnel pages on site</SectionTitle>
				<MiniFunnel steps={[
					{ label: 'CTA pages', value: c.ctaPresent },
					{ label: 'Form pages', value: c.formPresent },
					{ label: 'Cart/checkout', value: c.checkoutPages },
				]} />
			</Card>
		</div>
	)
}
