import React, { useEffect } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext'
import { RsTabBar } from './RsTabBar'
import { RsRouter } from './RsRouter'
import { getRsTabsFor } from './registry'

const MIN_W = 320
const MAX_W = 640

export function RsShell() {
    const {
        mode,
        showAuditSidebar, setShowAuditSidebar,
        auditSidebarWidth, setAuditSidebarWidth,
        isDraggingSidebar, setIsDraggingSidebar,
        rsTab, setRsTab,
    } = useSeoCrawler()

    const reg = getRsTabsFor(mode)
    const fallbackTabId = reg?.tabs[0]?.id ?? null

    useEffect(() => {
        if (reg && !rsTab[mode] && fallbackTabId) {
            setRsTab(mode, fallbackTabId)
        }
    }, [mode, reg, rsTab, fallbackTabId, setRsTab])

    const startX = React.useRef(0)
    const startW = React.useRef(0)

    const onMouseDown = (e: React.MouseEvent) => {
        startX.current = e.clientX
        startW.current = auditSidebarWidth
        setIsDraggingSidebar(true)
        document.body.style.cursor = 'col-resize'
        const onMove = (ev: MouseEvent) => {
            const dx = startX.current - ev.clientX
            const next = Math.max(MIN_W, Math.min(MAX_W, startW.current + dx))
            setAuditSidebarWidth(next)
        }
        const onUp = () => {
            setIsDraggingSidebar(false)
            document.body.style.cursor = ''
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
    }

    return (
        <aside
            id="rs-shell"
            className="relative flex h-full flex-col border-l border-[#1a1a1a] bg-[#0a0a0a] transition-[width] duration-300 ease-in-out"
            style={{ width: showAuditSidebar ? auditSidebarWidth : 0 }}
        >
            {/* Drag Handle (only when open) */}
            {showAuditSidebar && (
                <div
                    onMouseDown={onMouseDown}
                    className={`absolute left-0 top-0 z-50 h-full w-1 cursor-col-resize transition-colors ${
                        isDraggingSidebar ? 'bg-[#F5364E]/40' : 'bg-transparent hover:bg-[#F5364E]/30'
                    }`}
                />
            )}

            {/* Toggle Button (persistent) */}
            <button
                onClick={() => setShowAuditSidebar(!showAuditSidebar)}
                className="absolute -left-[18px] top-1/2 -translate-y-1/2 z-[100] flex h-12 w-[18px] items-center justify-center rounded-l border border-r-0 border-[#222] bg-[#0a0a0a] text-[#888] shadow-xl hover:text-white hover:bg-[#1a1a1a] transition-colors"
                title={showAuditSidebar ? "Collapse insights" : "Expand insights"}
            >
                {showAuditSidebar ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Content (only when open) */}
            {showAuditSidebar && (
                <>
                    <RsTabBar />
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <RsRouter />
                    </div>
                </>
            )}
        </aside>
    )
}
