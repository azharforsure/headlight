import React, { useEffect, useMemo } from 'react';
import { ExternalLink, Maximize2, MessageCircle, Minimize2, UserPlus } from 'lucide-react';
import { useSeoCrawler, type InspectorTab } from '../../../contexts/SeoCrawlerContext';
import GeneralTab from './GeneralTab';
import SeoTab from './SeoTab';
import ContentTab from './ContentTab';
import LinksTab from './LinksTab';
import SchemaTab from './SchemaTab';
import PerformanceTab from './PerformanceTab';
import ImagesTab from './ImagesTab';
import SocialTab from './SocialTab';
import GscTab from './GscTab';
import Ga4Tab from './Ga4Tab';
import AiTab from './AiTab';

const TABS: Array<{ id: InspectorTab; label: string; count?: (page: any) => number | undefined }> = [
    { id: 'general', label: 'General' },
    { id: 'seo', label: 'SEO' },
    { id: 'content', label: 'Content' },
    { id: 'links', label: 'Links', count: (page) => Number(page?.inlinks || 0) + Number(page?.outlinks || 0) },
    { id: 'schema', label: 'Schema', count: (page) => Array.isArray(page?.schemaTypes) ? page.schemaTypes.length : 0 },
    { id: 'performance', label: 'Performance' },
    { id: 'images', label: 'Images', count: (page) => Number(page?.totalImages || 0) },
    { id: 'social', label: 'Social' },
    { id: 'gsc', label: 'GSC', count: (page) => page?.gscClicks !== undefined && page?.gscClicks !== null ? Number(page.gscClicks) : undefined },
    { id: 'ga4', label: 'GA4', count: (page) => page?.ga4Sessions !== undefined && page?.ga4Sessions !== null ? Number(page.ga4Sessions) : undefined },
    { id: 'ai', label: 'AI' }
];

const TAB_COMPONENTS: Record<InspectorTab, React.FC<{ page: any }>> = {
    general: GeneralTab,
    seo: SeoTab,
    content: ContentTab,
    links: LinksTab,
    schema: SchemaTab,
    performance: PerformanceTab,
    images: ImagesTab,
    social: SocialTab,
    gsc: GscTab,
    ga4: Ga4Tab,
    ai: AiTab
};

export default function InspectorShell() {
    const {
        selectedPage, setSelectedPage,
        detailsHeight, setIsDraggingDetails,
        activeTab, setActiveTab,
        inspectorCollapsed, setInspectorCollapsed
    } = useSeoCrawler();

    const ActiveTabComponent = useMemo(() => TAB_COMPONENTS[activeTab] || GeneralTab, [activeTab]);

    useEffect(() => {
        if (!selectedPage) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            const tabIds = TABS.map((tab) => tab.id);
            const currentIndex = tabIds.indexOf(activeTab);

            if ((event.ctrlKey || event.metaKey) && event.key === '[' && currentIndex > 0) {
                event.preventDefault();
                setActiveTab(tabIds[currentIndex - 1]);
            }
            if ((event.ctrlKey || event.metaKey) && event.key === ']' && currentIndex < tabIds.length - 1) {
                event.preventDefault();
                setActiveTab(tabIds[currentIndex + 1]);
            }
            if (event.key === 'Escape') {
                setSelectedPage(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPage, activeTab, setActiveTab, setSelectedPage]);

    if (!selectedPage) return null;

    if (inspectorCollapsed) {
        return (
            <div className="h-[44px] border-t border-[#222] bg-[#111] flex items-center justify-between px-4 shrink-0">
                <div className="text-[11px] font-mono text-[#888] truncate">
                    PAGE DETAIL: <span className="text-blue-400">{selectedPage.url}</span>
                </div>
                <button
                    onClick={() => setInspectorCollapsed(false)}
                    className="text-[#888] hover:text-white p-1 rounded hover:bg-[#222] transition-colors"
                    title="Expand inspector"
                >
                    <Maximize2 size={13} />
                </button>
            </div>
        );
    }

    return (
        <div style={{ height: detailsHeight }} className="border-t border-[#222] bg-[#111] flex flex-col shrink-0 relative">
            <div
                onMouseDown={() => setIsDraggingDetails(true)}
                className="absolute top-0 left-0 right-0 h-1.5 -mt-0.5 cursor-ns-resize z-50 transition-colors hover:bg-[#F5364E]"
            />

            <div className="h-[34px] border-b border-[#222] flex items-center px-4 justify-between bg-[#0a0a0a] shrink-0">
                <div className="flex h-full overflow-x-auto custom-scrollbar-hidden flex-1 mr-4">
                    {TABS.map((tab) => {
                        const count = tab.count ? tab.count(selectedPage) : undefined;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-3 pt-1 pb-1.5 text-[11px] font-medium border-r border-[#222] flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-[#111] text-white border-t-2 border-t-[#F5364E]'
                                        : 'bg-transparent text-[#888] hover:bg-[#111] hover:text-[#ccc] border-t-2 border-t-transparent'
                                }`}
                            >
                                {tab.label}
                                {count !== undefined && (
                                    <span className="text-[#555] font-mono text-[10px]">({count})</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button className="text-[#666] hover:text-white p-1 hover:bg-[#222] rounded transition-colors" title="Assign">
                        <UserPlus size={13} />
                    </button>
                    <button className="text-[#666] hover:text-white p-1 hover:bg-[#222] rounded transition-colors" title="Comment">
                        <MessageCircle size={13} />
                    </button>
                    <button
                        onClick={() => window.open(selectedPage.url, '_blank', 'noopener,noreferrer')}
                        className="text-[#666] hover:text-white p-1 hover:bg-[#222] rounded transition-colors"
                        title="Open in new tab"
                    >
                        <ExternalLink size={13} />
                    </button>
                    <button
                        onClick={() => setInspectorCollapsed(true)}
                        className="text-[#666] hover:text-white p-1 hover:bg-[#222] rounded transition-colors"
                        title="Collapse"
                    >
                        <Minimize2 size={13} />
                    </button>
                </div>
            </div>

            <div className="h-[28px] border-b border-[#1a1a1a] flex items-center px-4 bg-[#0d0d0d] shrink-0">
                <span className="text-[11px] font-mono text-[#F5364E] font-medium">PAGE DETAIL:</span>
                <span className="text-[11px] font-mono text-blue-400 ml-2 truncate">{selectedPage.url}</span>
            </div>

            <div className="flex-1 overflow-auto bg-[#111] p-5 text-[13px] text-[#ccc] custom-scrollbar">
                <ActiveTabComponent page={selectedPage} />
            </div>
        </div>
    );
}
