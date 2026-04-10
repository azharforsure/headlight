import { useEffect } from 'react';
import { useSeoCrawler } from '../contexts/SeoCrawlerContext';
import { useCrawlerUI } from '../contexts/CrawlerUIContext';

type ShortcutHandlers = Partial<Record<
    'escape' | 'help' | 'up' | 'down' | 'enter' | 'space' | 'search' | 'commandPalette' | 'export',
    () => void
>>;

export function useKeyboardShortcuts(handlers: ShortcutHandlers = {}) {
    const {
        setSearchQuery,
    } = useSeoCrawler();

    const {
        setShowExportDialog,
        setLeftSidebarWidth,
        leftSidebarWidth,
        setSelectedPage,
    } = useCrawlerUI();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const meta = e.metaKey || e.ctrlKey;
            const target = e.target as HTMLElement | null;
            const tagName = target?.tagName || '';
            const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName) || target?.isContentEditable === true;

            if (e.key === 'Escape') {
                handlers.escape?.();
                if (!handlers.escape) setSelectedPage(null);
            }

            if (e.key === '?' && !isInput) {
                handlers.help?.();
            }

            if (e.key === 'ArrowUp' && !isInput) {
                e.preventDefault();
                handlers.up?.();
            }

            if (e.key === 'ArrowDown' && !isInput) {
                e.preventDefault();
                handlers.down?.();
            }

            if (e.key === 'Enter' && !isInput) {
                handlers.enter?.();
            }

            if (e.key === ' ' && !isInput) {
                e.preventDefault();
                handlers.space?.();
            }

            if (meta && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                handlers.search?.();
                if (handlers.search) return;
                const searchInput = document.getElementById('headlight-grid-search');
                if (searchInput) {
                    searchInput.focus();
                } else {
                    setSearchQuery('');
                }
            }

            if (meta && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                handlers.commandPalette?.();
            }

            if (meta && e.shiftKey && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                handlers.export?.();
                if (handlers.export) return;
                setShowExportDialog(true);
            }

            // Backward-compatible shortcut: Cmd/Ctrl + E
            if (meta && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                handlers.export?.();
                if (handlers.export) return;
                setShowExportDialog(true);
            }

            if (meta && e.key === '/') {
                e.preventDefault();
                setLeftSidebarWidth(leftSidebarWidth < 50 ? 250 : 0);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlers, leftSidebarWidth, setLeftSidebarWidth, setSearchQuery, setShowExportDialog, setSelectedPage]);
}
