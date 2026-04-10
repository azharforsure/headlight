import React, { useMemo, useState } from 'react';
import { ArrowLeft, MessageSquare, Share2, Sparkles, UserPlus } from 'lucide-react';
import { getPageIssues } from './IssueTaxonomy';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { useCrawlerUI } from '../../contexts/CrawlerUIContext';

type DetailTab = 'seo' | 'links' | 'perf' | 'ai' | 'more';

interface MobilePageDetailProps {
    page: any;
    onClose: () => void;
}

const tabs: Array<{ id: DetailTab; label: string }> = [
    { id: 'seo', label: 'SEO' },
    { id: 'links', label: 'Links' },
    { id: 'perf', label: 'Perf' },
    { id: 'ai', label: 'AI' },
    { id: 'more', label: 'More' }
];

const Metric = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="rounded-xl border border-[#212126] bg-[#0d0d10] p-4">
        <div className="text-[10px] uppercase tracking-[0.22em] text-[#666]">{label}</div>
        <div className="mt-2 text-[16px] font-black text-white">{value}</div>
    </div>
);

export default function MobilePageDetail({ page, onClose }: MobilePageDetailProps) {
    const { } = useSeoCrawler();
    const { setAutoFixItems, setShowAutoFixModal, setShowCollabOverlay, setCollabOverlayTarget } = useCrawlerUI();
    const [activeTab, setActiveTab] = useState<DetailTab>('seo');
    const issues = useMemo(() => getPageIssues(page), [page]);

    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({ title: page.title || page.url, url: page.url });
            return;
        }
        await navigator.clipboard.writeText(page.url);
    };

    const renderTab = () => {
        if (activeTab === 'seo') {
            return (
                <div className="grid grid-cols-2 gap-3">
                    <Metric label="Title" value={page.title || 'Missing'} />
                    <Metric label="Meta description" value={page.metaDesc || 'Missing'} />
                    <Metric label="H1" value={page.h1_1 || 'Missing'} />
                    <Metric label="Canonical" value={page.canonical || 'Missing'} />
                    <Metric label="Indexability" value={page.indexabilityStatus || (page.indexable ? 'Indexable' : 'Non-indexable')} />
                    <Metric label="Issues" value={issues.length} />
                </div>
            );
        }

        if (activeTab === 'links') {
            return (
                <div className="grid grid-cols-2 gap-3">
                    <Metric label="Crawl depth" value={page.crawlDepth ?? 0} />
                    <Metric label="Inlinks" value={page.inlinks ?? 0} />
                    <Metric label="Outlinks" value={page.outlinks ?? 0} />
                    <Metric label="External links" value={page.externalOutlinks ?? 0} />
                    <Metric label="Internal rank" value={page.internalPageRank ?? 0} />
                    <Metric label="Link equity" value={page.linkEquity ?? 0} />
                </div>
            );
        }

        if (activeTab === 'perf') {
            return (
                <div className="grid grid-cols-2 gap-3">
                    <Metric label="LCP" value={page.lcp ? `${(Number(page.lcp) / 1000).toFixed(2)}s` : '--'} />
                    <Metric label="CLS" value={page.cls ?? '--'} />
                    <Metric label="INP" value={page.inp ? `${page.inp}ms` : '--'} />
                    <Metric label="Response" value={page.loadTime ? `${page.loadTime}ms` : '--'} />
                    <Metric label="Page size" value={page.sizeBytes ? `${Math.round(Number(page.sizeBytes) / 1024)} KB` : '--'} />
                    <Metric label="DOM nodes" value={page.domNodeCount ?? '--'} />
                </div>
            );
        }

        if (activeTab === 'ai') {
            return (
                <div className="space-y-3">
                    <Metric label="Intent" value={page.searchIntent || 'Not analyzed'} />
                    <Metric label="Topic cluster" value={page.topicCluster || 'Not clustered'} />
                    <Metric label="Priority" value={page.strategicPriority || 'Not scored'} />
                    <Metric label="Recommended action" value={page.recommendedAction || 'No recommendation yet'} />
                </div>
            );
        }

        return (
            <div className="space-y-3">
                <Metric label="URL" value={page.url} />
                <Metric label="Status code" value={page.statusCode || '--'} />
                <Metric label="Language" value={page.language || '--'} />
                <Metric label="Schema" value={Array.isArray(page.schemaTypes) && page.schemaTypes.length > 0 ? page.schemaTypes.join(', ') : 'Missing'} />
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[75] flex flex-col bg-[#09090b]">
            <div className="border-b border-[#202025] px-4 py-3">
                <button onClick={onClose} className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#ddd]">
                    <ArrowLeft size={16} />
                    Back
                </button>
                <div className="mt-3">
                    <div className="truncate text-[15px] font-black text-white">{page.title || page.url}</div>
                    <div className="mt-1 truncate text-[12px] text-[#6d93ff]">{page.url}</div>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto border-b border-[#202025] px-4 py-3 custom-scrollbar-hidden">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] ${
                            activeTab === tab.id ? 'bg-[#F5364E] text-white' : 'bg-[#141419] text-[#888]'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="mb-4 rounded-2xl border border-[#23232a] bg-[#111115] p-4">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-[#666]">Issue tracking</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {issues.length === 0 ? (
                            <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[11px] font-semibold text-green-300">
                                No active issues
                            </span>
                        ) : (
                            issues.map((issue) => (
                                <span key={issue.id} className="rounded-full border border-[#2f2f36] bg-[#17171b] px-3 py-1 text-[11px] font-semibold text-[#ddd]">
                                    {issue.label}
                                </span>
                            ))
                        )}
                    </div>
                </div>
                {renderTab()}
            </div>

            <div className="grid grid-cols-4 gap-2 border-t border-[#202025] px-4 py-3">
                <button
                    onClick={() => {
                        setAutoFixItems([{ ...page, fixStatus: 'pending', generatedMeta: page.metaDesc || '' }]);
                        setShowAutoFixModal(true);
                    }}
                    className="inline-flex flex-col items-center gap-1 rounded-xl border border-[#2e2e33] bg-[#141419] px-2 py-3 text-[10px] font-bold text-white"
                >
                    <Sparkles size={16} />
                    AI Fix All
                </button>
                <button
                    onClick={() => {
                        setCollabOverlayTarget({ type: 'page', id: page.url, title: page.title || page.url });
                        setShowCollabOverlay(true);
                    }}
                    className="inline-flex flex-col items-center gap-1 rounded-xl border border-[#2e2e33] bg-[#141419] px-2 py-3 text-[10px] font-bold text-white"
                >
                    <UserPlus size={16} />
                    Assign
                </button>
                <button
                    onClick={() => {
                        setCollabOverlayTarget({ type: 'page', id: page.url, title: page.title || page.url });
                        setShowCollabOverlay(true);
                    }}
                    className="inline-flex flex-col items-center gap-1 rounded-xl border border-[#2e2e33] bg-[#141419] px-2 py-3 text-[10px] font-bold text-white"
                >
                    <MessageSquare size={16} />
                    Comment
                </button>
                <button
                    onClick={() => { void handleShare(); }}
                    className="inline-flex flex-col items-center gap-1 rounded-xl border border-[#2e2e33] bg-[#141419] px-2 py-3 text-[10px] font-bold text-white"
                >
                    <Share2 size={16} />
                    Share
                </button>
            </div>
        </div>
    );
}
