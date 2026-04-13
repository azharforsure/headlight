import React, { Component, ErrorInfo, ReactNode } from 'react';
import { SeoCrawlerProvider, getHashRouteSearchParams } from '../contexts/SeoCrawlerContext';
import CrawlerHeader from '../components/seo-crawler/CrawlerHeader';
import CrawlerSubHeader from '../components/seo-crawler/CrawlerSubHeader';
import SiteExplorer from '../components/seo-crawler/SiteExplorer';
import AuditViewRouter from '../components/seo-crawler/AuditViewRouter';

import AuditSidebar from '../components/seo-crawler/AuditSidebar';
import StatusBar from '../components/seo-crawler/StatusBar';
import CrawlerModals from '../components/seo-crawler/CrawlerModals';
import { CollaborationOverlay } from '../components/seo-crawler/CollaborationOverlay';
import CrawlerEmptyState from '../components/seo-crawler/CrawlerEmptyState';
import CrawlProgressOverlay from '../components/seo-crawler/CrawlProgressOverlay';
import ComparisonView from '../components/seo-crawler/ComparisonView';
import ExportDialog from '../components/seo-crawler/ExportDialog';
import MobileBottomSheet from '../components/seo-crawler/MobileBottomSheet';
import AIChatDrawer from '../components/seo-crawler/AIChatDrawer';
import CrawlerSettingsDrawer from '../components/seo-crawler/CrawlerSettingsDrawer';
import { PanelErrorBoundary } from '../components/PanelErrorBoundary';
import OnboardingTour from '../components/seo-crawler/OnboardingTour';
import { useSeoCrawler } from '../contexts/SeoCrawlerContext';
import { useOptionalProject } from '../services/ProjectContext';
import { useBreakpoint } from '../hooks/useBreakpoint';

import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    errorMessage: string;
}

class SeoCrawlerErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, errorMessage: '' };
    }

    static getDerivedStateFromError(error: Error) {
        return {
            hasError: true,
            errorMessage: error?.message || 'Unknown crawler error'
        };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[SeoCrawler] Runtime error:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen bg-[var(--bg-main)] text-[var(--text-secondary)] flex items-center justify-center p-6">
                    <div className="max-w-xl w-full rounded-lg border border-[#2a2a2a] bg-[#111] p-5">
                        <div className="text-[11px] uppercase tracking-widest text-[#888] mb-2">Crawler Error</div>
                        <div className="text-[16px] text-white font-semibold mb-2">The crawler UI hit a runtime error.</div>
                        <div className="text-[12px] text-[#aaa] leading-relaxed">
                            {this.state.errorMessage}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

import { CrawlerUIProvider } from '../contexts/CrawlerUIContext';

export default function SeoCrawlerWrapper() {
    const params = getHashRouteSearchParams();
    const isSetup = params.get('setup') === 'true';

    return (
        <SeoCrawlerErrorBoundary>
            <CrawlerUIProvider>
                <SeoCrawlerProvider>
                    <SeoCrawlerLayout />
                </SeoCrawlerProvider>
            </CrawlerUIProvider>
        </SeoCrawlerErrorBoundary>
    );
}


function SeoCrawlerLayout() {
    const { isMobile, isTablet } = useBreakpoint();
    useKeyboardShortcuts();
    const [showMobileExplorer, setShowMobileExplorer] = React.useState(false);
    const [showMobileAudit, setShowMobileAudit] = React.useState(false);
    // const [isSettingsOpen, setIsSettingsOpen] = React.useState(false); // REMOVED
    const {
        showCollabOverlay,
        setShowCollabOverlay,
        pages,
        crawlHistory,
        showComparisonView,
        setShowComparisonView,
        showExportDialog,
        setShowExportDialog,
        showAiChat,
        setShowAiChat,
        showSettings,
        setShowSettings
    } = useSeoCrawler();

    const projectContext = useOptionalProject();
    const { projects = [], activeProject = null, loading: projectsLoading } = projectContext || {};
    
    const params = getHashRouteSearchParams();
    const isSetup = params.get('setup') === 'true';

    // Only show the "Get Started" empty state if there are absolutely no projects on the dashboard.
    // We wait for projectsLoading to be false to avoid flickering.
    const shouldShowEmptyState = !projectsLoading && !isSetup && !activeProject && projects.length === 0;

    const isCompactLayout = isMobile || isTablet;

    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('setup') === 'true') {
            setShowSettings(true);
        }
    }, [window.location.search]);

    return (
        <div className="flex flex-col h-screen bg-[var(--bg-main)] text-[var(--text-secondary)] font-sans overflow-hidden">
            <CrawlerHeader />
            {!showComparisonView && <CrawlerSubHeader />}

            <div className="flex-1 flex min-h-0 relative overflow-hidden">
                {!isCompactLayout && (
                    <PanelErrorBoundary name="Site Explorer" fallback={<div className="m-3 rounded border border-[#2b2b2f] bg-[#111] p-3 text-[12px] text-[#999]">Category tree failed to load.</div>}>
                        <SiteExplorer />
                    </PanelErrorBoundary>
                )}
                <PanelErrorBoundary name="Audit View" fallback={<div className="m-3 rounded border border-[#2b2b2f] bg-[#111] p-3 text-[12px] text-[#999]">Audit view failed to load.</div>}>
                    <AuditViewRouter />
                </PanelErrorBoundary>

                {!isCompactLayout && (
                    <PanelErrorBoundary name="Audit Sidebar" fallback={<div className="m-3 rounded border border-[#2b2b2f] bg-[#111] p-3 text-[12px] text-[#999]">Audit panel failed to load.</div>}>
                        <AuditSidebar />
                    </PanelErrorBoundary>
                )}

                <CollaborationOverlay 
                    isOpen={showCollabOverlay} 
                    onClose={() => setShowCollabOverlay(false)} 
                />
            </div>

            <PanelErrorBoundary name="Status Bar" fallback={<div className="h-[36px] border-t border-[#2b2b2f] bg-[#0f0f12]" />}>
                <StatusBar />
            </PanelErrorBoundary>

            <CrawlerModals />

            {showComparisonView && <ComparisonView onClose={() => setShowComparisonView(false)} />}
            {showExportDialog && <ExportDialog onClose={() => setShowExportDialog(false)} />}
            <AIChatDrawer isOpen={showAiChat} onClose={() => setShowAiChat(false)} />
            {isSetup && <CrawlerSettingsDrawer isOpen={showSettings} onClose={() => setShowSettings(false)} />}
            <OnboardingTour />
            
            {shouldShowEmptyState && <CrawlerEmptyState />}

            {!shouldShowEmptyState && isCompactLayout && (
                <>
                    <div className="pointer-events-none fixed bottom-16 right-4 z-[60] flex flex-col gap-3">
                        <button
                            onClick={() => setShowMobileExplorer(true)}
                            className="pointer-events-auto rounded-full border border-[#2f2f35] bg-[#111] px-4 py-3 text-[12px] font-bold text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                        >
                            Filters
                        </button>
                        <button
                            onClick={() => setShowMobileAudit(true)}
                            className="pointer-events-auto rounded-full border border-[#2f2f35] bg-[#111] px-4 py-3 text-[12px] font-bold text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                        >
                            Audit
                        </button>
                    </div>

                    <MobileBottomSheet isOpen={showMobileExplorer} onClose={() => setShowMobileExplorer(false)} title="Site Explorer" defaultHeight={82}>
                        <SiteExplorer embedded />
                    </MobileBottomSheet>

                    <MobileBottomSheet isOpen={showMobileAudit} onClose={() => setShowMobileAudit(false)} title="Audit Panel" defaultHeight={82}>
                        <AuditSidebar embedded />
                    </MobileBottomSheet>
                </>
            )}
        </div>
    );
}
