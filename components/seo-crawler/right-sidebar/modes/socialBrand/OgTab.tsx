import React from 'react'
import { Card, SectionTitle, ProgressBar } from '../../shared'
import type { RsTabProps } from '../../../../../services/right-sidebar/types'
import type { SocialStats } from '../../../../../services/right-sidebar/socialBrand'

export function SocialOgTab({ stats }: RsTabProps<SocialStats>) {
	const o = stats.og
	return (
		<Card>
			<SectionTitle>Open Graph & Twitter coverage</SectionTitle>
			<div className="text-[10px] text-[#888] mb-1">og:title</div>
			<ProgressBar value={o.withOgTitle} max={o.total || 1} />
			<div className="text-[10px] text-[#888] mt-2 mb-1">og:image</div>
			<ProgressBar value={o.withOgImage} max={o.total || 1} />
			<div className="text-[10px] text-[#888] mt-2 mb-1">twitter:card</div>
			<ProgressBar value={o.withTwitterCard} max={o.total || 1} />
		</Card>
	)
}
