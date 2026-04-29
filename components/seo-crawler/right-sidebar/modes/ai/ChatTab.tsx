import React from 'react'
import { Card, SectionTitle } from '../../shared'
import { RsEmpty } from '../../RsEmpty'

export function AiChatTab() {
	return (
		<RsEmpty
			title="AI context chat"
			hint="Ask questions about your crawl data, find patterns, or generate content ideas."
			cta={ { label: 'Open AI Assistant', onClick: () => {} } }
		/>
	)
}
