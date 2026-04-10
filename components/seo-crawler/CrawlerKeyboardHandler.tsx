import { useEffect } from 'react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { useCrawlerUI } from '../../contexts/CrawlerUIContext';

export default function CrawlerKeyboardHandler() {
  const {
    handleStartPause,
    handleExport,
    saveCrawlSession,
    searchQuery,
    setSearchQuery,
  } = useSeoCrawler();

  const {
    showSettings,
    setShowSettings,
    showAutoFixModal,
    isFixing,
    setShowAutoFixModal,
    showListModal,
    setShowListModal,
    showScheduleModal,
    setShowScheduleModal,
    showColumnPicker,
    setShowColumnPicker,
    selectedPage,
    setSelectedPage,
  } = useCrawlerUI();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+F -> focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('headlight-grid-search');
        if (searchInput) searchInput.focus();
      }

      // Escape -> clear selection / close panels
      if (e.key === 'Escape') {
        if (showSettings) { setShowSettings(false); return; }
        if (showAutoFixModal) { if (!isFixing) setShowAutoFixModal(false); return; }
        if (showListModal) { setShowListModal(false); return; }
        if (showScheduleModal) { setShowScheduleModal(false); return; }
        if (showColumnPicker) { setShowColumnPicker(false); return; }
        if (selectedPage) { setSelectedPage(null); return; }
        if (searchQuery) { setSearchQuery(''); return; }
      }

      // Cmd/Ctrl+E -> export
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        handleExport();
      }

      // Cmd/Ctrl+S -> save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveCrawlSession('completed');
      }

      // Cmd/Ctrl+Enter -> start/pause
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleStartPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showSettings,
    showAutoFixModal,
    showListModal,
    showScheduleModal,
    showColumnPicker,
    selectedPage,
    searchQuery,
    isFixing,
    handleStartPause,
    handleExport,
    saveCrawlSession,
    setShowSettings,
    setShowAutoFixModal,
    setShowListModal,
    setShowScheduleModal,
    setShowColumnPicker,
    setSelectedPage,
    setSearchQuery,
  ]);

  return null;
}
