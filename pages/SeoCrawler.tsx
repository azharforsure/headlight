import React, { Component, ErrorInfo, ReactNode } from 'react';
import { SeoCrawlerProvider } from '../contexts/SeoCrawlerContext';
import CrawlerHeader from '../components/seo-crawler/CrawlerHeader';
import SiteExplorer from '../components/seo-crawler/SiteExplorer';
import MainDataView from '../components/seo-crawler/MainDataView';
import AuditSidebar from '../components/seo-crawler/AuditSidebar';
import StatusBar from '../components/seo-crawler/StatusBar';
import CrawlerModals from '../components/seo-crawler/CrawlerModals';
import { CollaborationOverlay } from '../components/seo-crawler/CollaborationOverlay';
import { useSeoCrawler } from '../contexts/SeoCrawlerContext';

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
                <div className="h-screen bg-[#070707] text-[#e0e0e0] flex items-center justify-center p-6">
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

export default function SeoCrawlerWrapper() {
    return (
        <SeoCrawlerErrorBoundary>
            <SeoCrawlerProvider>
                <SeoCrawlerLayout />
            </SeoCrawlerProvider>
        </SeoCrawlerErrorBoundary>
    );
}

function SeoCrawlerLayout() {
    const { showCollabOverlay, setShowCollabOverlay } = useSeoCrawler();

    return (
        <div className="flex flex-col h-screen bg-[#070707] text-[#e0e0e0] font-sans overflow-hidden">
            <CrawlerHeader />

            <div className="flex-1 flex min-h-0 relative">
                <SiteExplorer />

                <MainDataView />

                <AuditSidebar />

                <CollaborationOverlay 
                    isOpen={showCollabOverlay} 
                    onClose={() => setShowCollabOverlay(false)} 
                />
            </div>

            <StatusBar />

            <CrawlerModals />
        </div>
    );
}
