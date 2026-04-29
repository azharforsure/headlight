import React from 'react'
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext'
import { RsShell } from './right-sidebar/RsShell'

export default function AuditSidebar() {
	const { showAuditSidebar } = useSeoCrawler() as any
	if (!showAuditSidebar) return null
	return <RsShell />
}
