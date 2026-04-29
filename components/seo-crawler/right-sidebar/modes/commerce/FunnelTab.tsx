import React from 'react'
import { Card, SectionTitle, MiniFunnel } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { CommerceStats } from '../../../../../services/right-sidebar/commerce'

export function CommerceFunnelTab({ stats }: RsTabProps<CommerceStats>) {
	const f = stats.funnel
	return (
		<Card>
			<SectionTitle>Funnel pages on site</SectionTitle>
			<MiniFunnel steps={[
				{ label: 'PLP (collections)', value: f.plp },
				{ label: 'PDP (products)',    value: f.pdp },
				{ label: 'Cart',              value: f.cart },
				{ label: 'Checkout',          value: f.checkout },
				{ label: 'Thank-you',         value: f.thanks },
			]} />
		</Card>
	)
}
