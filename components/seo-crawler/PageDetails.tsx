import React, { useState } from 'react';
import { 
    Minimize2, Code, Wand2, Database, AlertTriangle, Server, LinkIcon, CheckCircle2,
    Monitor, GitCompare, Accessibility, Eye, ShieldCheck, Info, Image, ArrowDownRight, ArrowUpRight, BarChart3,
    Repeat, Layers, FileJson, Hash
} from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';

const getSafeHostname = (url: string | undefined | null) => {
    if (!url) return 'example.com';
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
};

export default function PageDetails() {
    const {
        selectedPage, setSelectedPage,
        detailsHeight, setIsDraggingDetails,
        activeTab, setActiveTab,
        pages, diffResult, crawlHistory
    } = useSeoCrawler();

    const [linksSubTab, setLinksSubTab] = useState<'inlinks' | 'outlinks' | 'images'>('inlinks');

    if (!selectedPage) return null;

    return (
        <div style={{ height: detailsHeight }} className="border-t border-[#222] bg-[#111] flex flex-col shrink-0 relative">
            {/* Resize Handle */}
            <div 
                onMouseDown={() => setIsDraggingDetails(true)}
                className="absolute top-0 left-0 right-0 h-1.5 -mt-0.5 cursor-ns-resize z-50 transition-colors hover:bg-[#F5364E]"
            ></div>
            
            <div className="h-[34px] border-b border-[#222] flex items-center px-4 justify-between bg-[#0a0a0a]">
                <div className="flex h-full overflow-x-auto custom-scrollbar-hidden flex-1 mr-4">
                    {[
                        { id: 'details', label: 'Details' },
                        { id: 'links', label: 'Links', count: (selectedPage.inlinks || 0) + (selectedPage.outlinks || 0) },
                        { id: 'headers', label: 'Headings', count: Array.isArray(selectedPage.headingHierarchy) ? selectedPage.headingHierarchy.length : ((selectedPage.h1_1 ? 1 : 0) + (selectedPage.h2_1 ? 1 : 0) + (selectedPage.h2_2 ? 1 : 0)) },
                        { id: 'performance', label: 'Performance' },
                        { id: 'serp', label: 'SERP Preview' },
                        { id: 'source', label: 'Source' },
                        { id: 'ai', label: 'AI Analysis' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 pt-1 pb-1.5 text-[12px] font-medium border-r border-[#222] flex items-center gap-1.5 whitespace-nowrap shrink-0 ${activeTab === tab.id ? 'bg-[#111] text-white border-t-2 border-t-[#F5364E]' : 'bg-transparent text-[#888] hover:bg-[#111] hover:text-[#ccc] border-t-2 border-t-transparent'}`}
                        >
                            {tab.label} 
                            {tab.count !== undefined && <span className="text-[#555] font-mono text-[11px]">({tab.count})</span>}
                        </button>
                    ))}
                </div>
                <button onClick={() => setSelectedPage(null)} className="text-[#666] hover:text-white p-1 hover:bg-[#222] rounded transition-colors shrink-0"><Minimize2 size={13}/></button>
            </div>

            <div className="flex-1 overflow-auto bg-[#111] p-5 text-[13px] font-sans text-[#ccc] custom-scrollbar">
                
                {/* ═══ DETAILS TAB ═══ */}
                {activeTab === 'details' && (
                    <div>
                        {/* Page Issues Summary */}
                        {(() => {
                            const pageIssues: {label: string, type: string}[] = [];
                            if (selectedPage.statusCode >= 400) pageIssues.push({label: `${selectedPage.statusCode} Error`, type: 'error'});
                            if (!selectedPage.title || selectedPage.title.trim() === '') pageIssues.push({label: 'Missing Title', type: 'error'});
                            if (selectedPage.titleLength > 60) pageIssues.push({label: 'Title Too Long', type: 'warning'});
                            if (!selectedPage.metaDesc || selectedPage.metaDesc.trim() === '') pageIssues.push({label: 'Missing Meta Description', type: 'error'});
                            if (selectedPage.metaDescLength > 155) pageIssues.push({label: 'Meta Desc Too Long', type: 'warning'});
                            if (!selectedPage.h1_1 || selectedPage.h1_1Length === 0) pageIssues.push({label: 'No H1 Tag', type: 'error'});
                            if (selectedPage.loadTime > 1500) pageIssues.push({label: 'Slow Page', type: 'warning'});
                            if (selectedPage.indexable === false) pageIssues.push({label: 'Non-Indexable', type: 'notice'});
                            if (selectedPage.inlinks === 0 && selectedPage.crawlDepth > 0) pageIssues.push({label: 'Orphan', type: 'warning'});

                            if (pageIssues.length === 0) return null;
                            return (
                                <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-3 border-b border-[#222]">
                                    <span className="text-[10px] text-[#555] uppercase tracking-widest font-bold mr-1">Issues:</span>
                                    {pageIssues.map((issue, idx) => (
                                        <span key={idx} className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            issue.type === 'error' ? 'bg-red-500/15 text-red-400' :
                                            issue.type === 'warning' ? 'bg-orange-500/15 text-orange-400' :
                                            'bg-blue-500/15 text-blue-400'
                                        }`}>
                                            {issue.label}
                                        </span>
                                    ))}
                                </div>
                            );
                        })()}

                        <div className="mb-5 grid grid-cols-4 gap-3">
                            <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
                                <div className="text-[10px] text-[#666] uppercase tracking-widest">Recommended Action</div>
                                <div className="text-[13px] text-white font-semibold mt-1">{selectedPage.recommendedAction || 'Monitor'}</div>
                                <div className="text-[10px] text-[#777] mt-2 leading-relaxed">{selectedPage.recommendedActionReason || 'No strategic action has been assigned yet.'}</div>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
                                <div className="text-[10px] text-[#666] uppercase tracking-widest">Opportunity</div>
                                <div className="text-[20px] text-white font-black mt-1">{selectedPage.opportunityScore ?? 0}</div>
                                <div className="text-[10px] text-[#777] mt-2">Confidence {selectedPage.insightConfidence ?? 0}</div>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
                                <div className="text-[10px] text-[#666] uppercase tracking-widest">Business Value</div>
                                <div className="text-[20px] text-white font-black mt-1">{selectedPage.businessValueScore ?? 0}</div>
                                <div className="text-[10px] text-[#777] mt-2">Traffic quality {selectedPage.trafficQuality ?? 0}</div>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
                                <div className="text-[10px] text-[#666] uppercase tracking-widest">Authority</div>
                                <div className="text-[20px] text-white font-black mt-1">{selectedPage.authorityScore ?? 0}</div>
                                <div className="text-[10px] text-[#777] mt-2">Coverage {selectedPage.dataCoverage ?? 0}%</div>
                            </div>
                        </div>

                        <div className="max-w-6xl grid grid-cols-3 gap-8">
                            {/* Technical Audit */}
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black text-[#444] uppercase tracking-widest border-b border-[#222] pb-1">Technical</h4>
                                <div className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-[12px]">
                                    <span className="text-[#555]">Status</span>
                                    <span className={`${selectedPage.statusCode >= 400 ? 'text-red-400' : 'text-green-400'}`}>{selectedPage.statusCode} {selectedPage.status}</span>
                                    <span className="text-[#555]">Indexability</span>
                                    <span className="text-white">{selectedPage.indexabilityStatus}</span>
                                    <span className="text-[#555]">Canonical</span>
                                    <span className="text-blue-400 truncate text-[11px]">{selectedPage.canonical || 'None'}</span>
                                    <span className="text-[#555]">Robots Tag</span>
                                    <span className="text-white text-[11px]">{selectedPage.metaRobots1 || 'None'}</span>
                                    <span className="text-[#555]">Crawl Depth</span>
                                    <span className="text-white font-mono">{selectedPage.crawlDepth}</span>
                                    <span className="text-[#555]">LCP</span>
                                    <span className="text-white font-mono">{selectedPage.lcp !== undefined ? `${selectedPage.lcp}ms` : 'N/A'}</span>
                                </div>
                            </div>

                            {/* External Data (Ahrefs/SEMrush) */}
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black text-[#ffcc00] uppercase tracking-widest border-b border-[#ffcc00]/20 pb-1">External Authority</h4>
                                <div className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-[12px]">
                                    <span className="text-[#555]">URL Rating (UR)</span>
                                    <span className="text-white font-mono font-bold">{selectedPage.urlRating !== undefined ? selectedPage.urlRating : '—'}</span>
                                    <span className="text-[#555]">Ref. Domains</span>
                                    <span className="text-white font-mono font-bold">{selectedPage.referringDomains !== undefined ? selectedPage.referringDomains : '—'}</span>
                                    <span className="text-[#555]">Authority Score</span>
                                    <span className="text-white font-mono font-bold">{selectedPage.authorityScore !== undefined ? selectedPage.authorityScore : '—'}</span>
                                    <span className="text-[#555]">Data Source</span>
                                    <span className="text-[#888] italic">{selectedPage.urlRating !== undefined ? 'Imported CSV' : 'Not Connected'}</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black text-[#444] uppercase tracking-widest border-b border-[#222] pb-1">Content</h4>
                                <div className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-[12px]">
                                    <span className="text-[#555]">Title Length</span>
                                    <span className="text-white font-mono">{selectedPage.titleLength} chars ({selectedPage.titlePixelWidth}px)</span>
                                    <span className="text-[#555]">Meta Desc Length</span>
                                    <span className="text-white font-mono">{selectedPage.metaDescLength} chars</span>
                                    <span className="text-[#555]">Word Count</span>
                                    <span className="text-white font-mono">{selectedPage.wordCount} words</span>
                                    <span className="text-[#555]">Readability</span>
                                    <span className="text-white">{selectedPage.readability} ({selectedPage.fleschScore})</span>
                                    <span className="text-[#555]">CO2 Rating</span>
                                    <span className={`font-black ${selectedPage.carbonRating === 'A' ? 'text-green-400' : selectedPage.carbonRating ? 'text-orange-400' : 'text-[#666]'}`}>
                                        {selectedPage.carbonRating ? `${selectedPage.carbonRating} (${selectedPage.co2Mg}mg)` : 'Not collected'}
                                    </span>
                                    <span className="text-[#555]">GSC / GA4</span>
                                    <span className="text-white font-mono">{selectedPage.gscClicks || 0} clicks / {selectedPage.ga4Sessions || 0} sessions</span>
                                </div>
                            </div>

                            {/* Links */}
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black text-[#444] uppercase tracking-widest border-b border-[#222] pb-1">Link Structure</h4>
                                <div className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-[12px]">
                                    <span className="text-[#555]">Link Score</span>
                                    <span className="text-[#F5364E] font-black">{selectedPage.linkScore}</span>
                                    <span className="text-[#555]">Inlinks</span>
                                    <span className="text-white font-mono">{selectedPage.inlinks}</span>
                                    <span className="text-[#555]">Outlinks</span>
                                    <span className="text-white font-mono">{selectedPage.outlinks} (Unique: {selectedPage.uniqueOutlinks})</span>
                                    <span className="text-[#555]">External</span>
                                    <span className="text-white font-mono">{selectedPage.externalOutlinks}</span>
                                    <span className="text-[#555]">Response Time</span>
                                    <span className="text-white font-mono">{selectedPage.loadTime}ms</span>
                                </div>
                            </div>
                        </div>

                        {/* Response Headers (folded in) */}
                        {selectedPage.responseHeaders && typeof selectedPage.responseHeaders === 'object' && (
                            <div className="mt-6 pt-4 border-t border-[#222]">
                                <h4 className="text-[11px] font-black text-[#444] uppercase tracking-widest mb-3">Response Headers</h4>
                                <div className="bg-[#0a0a0a] border border-[#222] rounded overflow-hidden max-h-[200px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-[11px] font-mono">
                                        <tbody>
                                            {Object.entries(selectedPage.responseHeaders).map(([key, val]: [string, any]) => (
                                                <tr key={key} className="border-b border-[#1a1a1a] hover:bg-[#111]">
                                                    <td className="px-3 py-1 text-[#F5364E] font-medium w-[180px]">{key}</td>
                                                    <td className="px-3 py-1 text-[#ccc] break-all">{String(val)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* REDIRECT CHAIN VISUALIZATION */}
                        {selectedPage.redirectChainLength > 0 && Array.isArray(selectedPage.redirectChain) && (
                            <div className="mt-6 pt-4 border-t border-[#222]">
                                <h4 className="text-[11px] font-black text-[#444] uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Repeat size={12} className="text-orange-400" /> Redirect Chain ({selectedPage.redirectChainLength})
                                </h4>
                                <div className="space-y-2.5 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-[#222]">
                                    {selectedPage.redirectChain.map((url: string, idx: number) => (
                                        <div key={idx} className="flex items-start gap-3 relative z-10">
                                            <div className="w-3.5 h-3.5 rounded-full bg-[#111] border border-[#333] flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                            </div>
                                            <div className="flex-1 bg-[#0a0a0a] border border-[#222] rounded p-2 text-[11px] font-mono group hover:border-orange-500/30 transition-colors">
                                                <div className="text-[#666] text-[9px] mb-0.5 uppercase">Step {idx + 1}</div>
                                                <div className="text-[#ccc] break-all truncate max-w-[500px] font-mono">{url}</div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex items-start gap-3 relative z-10">
                                        <div className="w-3.5 h-3.5 rounded-full bg-[#111] border border-[#333] flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        </div>
                                        <div className="flex-1 bg-[#111] border border-[#222] rounded p-2 text-[11px] font-mono border-l-2 border-l-green-500/50">
                                            <div className="text-green-500/70 text-[9px] mb-0.5 uppercase font-bold">Final Destination</div>
                                            <div className="text-white break-all font-mono">{selectedPage.url}</div>
                                        </div>
                                    </div>
                                </div>
                                {selectedPage.redirectChainLength > 2 && (
                                    <div className="mt-3 flex items-center gap-2 text-[10px] text-red-400 bg-red-400/5 p-2 rounded border border-red-400/20">
                                        <AlertTriangle size={12} />
                                        <span>Heavy Redirect: 3+ hops detected. Optimize internal links to point directly to the destination.</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Accessibility checks (folded in) */}
                        <div className="mt-6 pt-4 border-t border-[#222]">
                            <h4 className="text-[11px] font-black text-[#444] uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ShieldCheck size={12} className="text-green-400" /> Accessibility
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Images without Alt', check: (selectedPage.missingAltImages || 0) === 0, count: selectedPage.missingAltImages || 0, tip: 'Add alt text for screen readers.' },
                                    { label: 'Heading Hierarchy', check: !!selectedPage.h1_1 && selectedPage.incorrectHeadingOrder !== true, count: !selectedPage.h1_1 ? 1 : (selectedPage.incorrectHeadingOrder ? 1 : 0), tip: 'Use one H1 and maintain a logical heading order.' },
                                    { label: 'Language Attribute', check: !!selectedPage.language, count: selectedPage.language ? 0 : 1, tip: 'Add lang attribute to <html>.' },
                                    { label: 'Forms Security', check: selectedPage.insecureForms !== true, count: selectedPage.insecureForms ? 1 : 0, tip: 'Forms on HTTPS pages should not submit to HTTP.' },
                                    { label: 'Mixed Content', check: selectedPage.mixedContent !== true, count: selectedPage.mixedContent ? 1 : 0, tip: 'Avoid insecure HTTP assets on HTTPS pages.' },
                                    { label: 'Hreflang Setup', check: selectedPage.hreflangNoSelf !== true && selectedPage.hreflangInvalid !== true, count: (selectedPage.hreflangNoSelf ? 1 : 0) + (selectedPage.hreflangInvalid ? 1 : 0), tip: 'Check alternate-language annotations when using hreflang.' },
                                ].map(item => (
                                    <div key={item.label} className={`bg-[#0a0a0a] border rounded p-2.5 ${item.check ? 'border-[#222]' : 'border-orange-500/30 bg-orange-500/5'}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-[#ccc]">{item.label}</span>
                                            {item.check ? <CheckCircle2 size={12} className="text-green-400" /> : <AlertTriangle size={12} className="text-orange-400" />}
                                        </div>
                                        {!item.check && <div className="text-[9px] text-orange-300/70">{item.count} issue{item.count !== 1 ? 's' : ''}</div>}
                                        <div className="text-[9px] text-[#444] mt-1">{item.tip}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Diff data (shown when available) */}
                        {diffResult && diffResult.changed && (() => {
                            const change = diffResult.changed.find((c: any) => c.url === selectedPage.url);
                            if (!change) return null;
                            return (
                                <div className="mt-6 pt-4 border-t border-[#222]">
                                    <h4 className="text-[11px] font-black text-[#444] uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <GitCompare size={12} className="text-blue-400" /> Changes Since Last Scan
                                    </h4>
                                    <div className="space-y-2">
                                        {change.changes.map((field: string) => (
                                            <div key={field} className="bg-[#0a0a0a] border border-[#222] rounded p-3">
                                                <div className="text-[10px] text-[#555] uppercase tracking-widest font-bold mb-2">{field}</div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-red-500/5 border border-red-500/15 rounded p-2">
                                                        <div className="text-[9px] text-red-400 uppercase tracking-widest mb-1">Before</div>
                                                        <div className="text-[11px] text-[#ccc] font-mono break-all">{String(change.oldData[field] ?? '—')}</div>
                                                    </div>
                                                    <div className="bg-green-500/5 border border-green-500/15 rounded p-2">
                                                        <div className="text-[9px] text-green-400 uppercase tracking-widest mb-1">After</div>
                                                        <div className="text-[11px] text-[#ccc] font-mono break-all">{String(change.newData[field] ?? '—')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* ═══ LINKS TAB (combined inlinks + outlinks + images) ═══ */}
                {activeTab === 'links' && (
                    <div className="h-full flex flex-col">
                        <div className="flex items-center gap-1 mb-3 bg-[#0a0a0a] rounded-lg p-0.5 border border-[#222] w-fit">
                            {[
                                { id: 'inlinks' as const, label: 'Inlinks', count: selectedPage.inlinks || 0, icon: <ArrowDownRight size={10} /> },
                                { id: 'outlinks' as const, label: 'Outlinks', count: selectedPage.outlinks || 0, icon: <ArrowUpRight size={10} /> },
                                { id: 'images' as const, label: 'Images', count: selectedPage.images?.length || 0, icon: <Image size={10} /> },
                            ].map(sub => (
                                <button
                                    key={sub.id}
                                    onClick={() => setLinksSubTab(sub.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
                                        linksSubTab === sub.id ? 'bg-[#222] text-white' : 'text-[#888] hover:text-[#ccc]'
                                    }`}
                                >
                                    {sub.icon} {sub.label}
                                    <span className="text-[#555] font-mono text-[10px]">{sub.count}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {(() => {
                                const listKey = linksSubTab === 'inlinks' ? 'inlinksList' : linksSubTab === 'outlinks' ? 'outlinksList' : 'images';
                                const items = selectedPage[listKey];
                                if (!items || !Array.isArray(items) || items.length === 0) {
                                    return (
                                        <div className="h-full flex items-center justify-center text-[#666] flex-col gap-3 py-8">
                                            <LinkIcon size={24} className="text-[#333]" />
                                            <span className="text-center max-w-[200px] text-[12px]">No {linksSubTab} found for this page.</span>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="space-y-0.5">
                                        {items.map((item: string, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2 py-1 px-2 hover:bg-[#1a1a1a] rounded group">
                                                <span className="text-[#555] font-mono text-[11px] w-6">{idx + 1}</span>
                                                <span className="text-[12px] truncate text-blue-400 group-hover:underline cursor-pointer">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* ═══ HEADINGS TAB ═══ */}
                {activeTab === 'headers' && (
                    <div className="max-w-4xl space-y-4">
                        <h4 className="text-[11px] font-black text-[#444] uppercase tracking-widest border-b border-[#222] pb-1">Heading Hierarchy</h4>
                        <div className="bg-[#0a0a0a] border border-[#222] rounded p-4 font-mono text-[12px]">
                            {(Array.isArray(selectedPage.headingHierarchy) && selectedPage.headingHierarchy.length > 0) || selectedPage.h1_1 ? (
                                <div className="space-y-1">
                                    {(Array.isArray(selectedPage.headingHierarchy) && selectedPage.headingHierarchy.length > 0
                                        ? selectedPage.headingHierarchy
                                        : [
                                            selectedPage.h1_1 ? { level: 1, text: selectedPage.h1_1 } : null,
                                            selectedPage.h1_2 ? { level: 1, text: selectedPage.h1_2 } : null,
                                            selectedPage.h2_1 ? { level: 2, text: selectedPage.h2_1 } : null,
                                            selectedPage.h2_2 ? { level: 2, text: selectedPage.h2_2 } : null
                                        ].filter(Boolean)
                                    ).map((heading: any, idx: number) => {
                                        const level = Number(heading.level) || 1;
                                        const indentClass = level === 1 ? '' : level === 2 ? 'ml-4' : level === 3 ? 'ml-8' : level === 4 ? 'ml-12' : level === 5 ? 'ml-16' : 'ml-20';
                                        const levelClass = level === 1 ? 'bg-[#F5364E]/5 border-[#F5364E] text-[#F5364E]' : 'bg-blue-500/5 border-blue-500 text-blue-400';

                                        return (
                                            <div key={`${level}-${idx}-${heading.text}`} className={`flex items-center gap-2 py-1 px-2 rounded border-l-2 ${indentClass} ${levelClass}`}>
                                                <span className="font-bold text-[11px] w-7 shrink-0">{`H${level}`}</span>
                                                <span className="text-white flex-1 truncate">{heading.text}</span>
                                            </div>
                                        );
                                    })}
                                    <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]">
                                        <span className={`px-2 py-0.5 rounded ${selectedPage.multipleH1s ? 'bg-orange-500/10 text-orange-400' : 'bg-[#111] text-[#666]'}`}>
                                            {selectedPage.multipleH1s ? 'Multiple H1s detected' : 'Single H1 structure'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded ${selectedPage.incorrectHeadingOrder ? 'bg-red-500/10 text-red-400' : 'bg-[#111] text-[#666]'}`}>
                                            {selectedPage.incorrectHeadingOrder ? 'Heading order issue detected' : 'Heading order looks valid'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-red-400 flex items-center gap-2 py-2">
                                    <AlertTriangle size={14}/>
                                    <span>No H1 tag found — this is a critical on-page issue.</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══ PERFORMANCE TAB (merged Network + Lighthouse) ═══ */}
                {activeTab === 'performance' && (
                    <div className="max-w-6xl space-y-6">
                        <div className="flex items-center justify-between border-b border-[#222] pb-3">
                            <div>
                                <h3 className="text-[14px] font-bold text-white flex items-center gap-2">
                                    <BarChart3 size={16} className="text-[#F5364E]" /> Performance & Web Vitals
                                </h3>
                                <p className="text-[11px] text-[#666]">Speed, timing, and core web vitals for this page</p>
                            </div>
                            {!selectedPage.lcp && (
                                <div className="px-4 py-1.5 bg-[#1a1a1a] border border-[#333] text-[#777] rounded text-[11px] font-medium">
                                    Enable Web Vitals before crawling to populate this panel
                                </div>
                            )}
                        </div>

                        {/* Core Web Vitals */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-[#0a0a0a] border border-[#222] rounded p-4 flex flex-col items-center text-center">
                                <div className="text-[10px] text-[#888] uppercase tracking-widest mb-2">LCP</div>
                                <div className={`text-2xl font-black font-mono mb-1 ${(selectedPage.lcp || 0) > 2500 ? 'text-red-400' : 'text-green-400'}`}>
                                    {selectedPage.lcp ? `${selectedPage.lcp}ms` : '--'}
                                </div>
                                <div className="text-[10px] text-[#555]">Good {'<'} 2.5s</div>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#222] rounded p-4 flex flex-col items-center text-center">
                                <div className="text-[10px] text-[#888] uppercase tracking-widest mb-2">CLS</div>
                                <div className={`text-2xl font-black font-mono mb-1 ${(selectedPage.cls || 0) > 0.1 ? 'text-red-400' : 'text-green-400'}`}>
                                    {selectedPage.cls !== undefined ? selectedPage.cls : '--'}
                                </div>
                                <div className="text-[10px] text-[#555]">Good {'<'} 0.1</div>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#222] rounded p-4 flex flex-col items-center text-center">
                                <div className="text-[10px] text-[#888] uppercase tracking-widest mb-2">INP</div>
                                <div className={`text-2xl font-black font-mono mb-1 ${(selectedPage.inp || 0) > 200 ? 'text-orange-400' : 'text-green-400'}`}>
                                    {selectedPage.inp ? `${selectedPage.inp}ms` : '--'}
                                </div>
                                <div className="text-[10px] text-[#555]">Good {'<'} 200ms</div>
                            </div>
                        </div>

                        {/* Timing Waterfall */}
                        <div className="bg-[#0a0a0a] border border-[#222] rounded p-4 space-y-4">
                            <h4 className="text-[11px] font-black text-[#444] uppercase tracking-widest">Timing</h4>
                            {[
                                { label: 'Response Time', value: selectedPage.loadTime || 0, max: 3000, unit: 'ms', color: '#F5364E' },
                                { label: 'Page Size', value: selectedPage.sizeBytes || 0, max: 5 * 1024 * 1024, unit: '', color: '#60a5fa', format: (v: number) => v > 1024 * 1024 ? `${(v / 1024 / 1024).toFixed(1)} MB` : v > 1024 ? `${(v / 1024).toFixed(1)} KB` : `${v} B` },
                                { label: 'LCP', value: selectedPage.lcp || 0, max: 5000, unit: 'ms', color: '#4ade80' },
                                { label: 'CLS', value: (selectedPage.cls || 0) * 1000, max: 500, unit: '', color: '#fbbf24', format: (v: number) => (v / 1000).toFixed(3) },
                            ].map(metric => (
                                <div key={metric.label}>
                                    <div className="flex justify-between text-[11px] mb-1">
                                        <span className="text-[#888]">{metric.label}</span>
                                        <span className="text-white font-mono">
                                            {metric.format ? metric.format(metric.value) : `${metric.value}${metric.unit}`}
                                        </span>
                                    </div>
                                    <div className="w-full h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden border border-[#222]">
                                        <div
                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                            style={{
                                                width: `${Math.min(100, (metric.value / metric.max) * 100)}%`,
                                                backgroundColor: metric.color,
                                                opacity: metric.value > 0 ? 1 : 0.2
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                            
                            {/* Summary row */}
                            <div className="mt-4 pt-3 border-t border-[#222] grid grid-cols-3 gap-4">
                                <div className="bg-[#111] rounded p-3 border border-[#1a1a1a]">
                                    <div className="text-[9px] text-[#555] uppercase tracking-widest mb-1">Content Type</div>
                                    <div className="text-[12px] text-white font-mono">{selectedPage.contentType || 'Unknown'}</div>
                                </div>
                                <div className="bg-[#111] rounded p-3 border border-[#1a1a1a]">
                                    <div className="text-[9px] text-[#555] uppercase tracking-widest mb-1">HTTP Version</div>
                                    <div className="text-[12px] text-white font-mono">{selectedPage.httpVersion || '--'}</div>
                                </div>
                                <div className="bg-[#111] rounded p-3 border border-[#1a1a1a]">
                                    <div className="text-[9px] text-[#555] uppercase tracking-widest mb-1">Status</div>
                                    <div className={`text-[12px] font-mono ${selectedPage.statusCode >= 400 ? 'text-red-400' : 'text-green-400'}`}>{selectedPage.statusCode} {selectedPage.status}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ SERP PREVIEW TAB (includes screenshot) ═══ */}
                {activeTab === 'serp' && (
                    <div className="grid grid-cols-2 gap-8 max-w-6xl">
                        <div>
                            <h4 className="text-[11px] font-black text-[#444] uppercase tracking-widest border-b border-[#222] pb-1 mb-4">Google SERP Preview</h4>
                            <div className="bg-white p-4 rounded border border-[#ddd] shadow-sm font-sans max-w-[600px]">
                                <div className="text-[#202124] text-[12px] flex items-center gap-1.5 mb-1">
                                    <span className="truncate">{selectedPage.url}</span>
                                    <span className="text-[#70757A] text-[10px]">▼</span>
                                </div>
                                <div className="text-[20px] text-[#1a0dab] leading-tight truncate hover:underline cursor-pointer mb-1 whitespace-nowrap overflow-hidden">
                                    {selectedPage.title || 'Untitled Page'}
                                </div>
                                <div className="text-[14px] text-[#4d5156] leading-[1.58] line-clamp-2">
                                    {selectedPage.metaDesc || 'No meta description found. Search engines will automatically generate a snippet from the page content.'}
                                </div>
                            </div>
                            {/* Character count indicators */}
                            <div className="mt-3 space-y-2 max-w-[600px]">
                                <div className="flex items-center gap-2 text-[10px]">
                                    <span className="text-[#555] w-12 shrink-0">Title</span>
                                    <div className="flex-1 h-1.5 bg-[#222] rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all ${(selectedPage.titleLength || 0) > 60 ? 'bg-red-500' : (selectedPage.titleLength || 0) < 30 ? 'bg-orange-400' : 'bg-green-500'}`}
                                            style={{width: `${Math.min(100, ((selectedPage.titleLength || 0) / 70) * 100)}%`}}
                                        />
                                    </div>
                                    <span className={`font-mono w-16 text-right ${(selectedPage.titleLength || 0) > 60 ? 'text-red-400' : 'text-[#666]'}`}>{selectedPage.titleLength || 0}/60</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px]">
                                    <span className="text-[#555] w-12 shrink-0">Meta</span>
                                    <div className="flex-1 h-1.5 bg-[#222] rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all ${(selectedPage.metaDescLength || 0) > 155 ? 'bg-red-500' : (selectedPage.metaDescLength || 0) < 70 ? 'bg-orange-400' : 'bg-green-500'}`}
                                            style={{width: `${Math.min(100, ((selectedPage.metaDescLength || 0) / 170) * 100)}%`}}
                                        />
                                    </div>
                                    <span className={`font-mono w-16 text-right ${(selectedPage.metaDescLength || 0) > 155 ? 'text-red-400' : 'text-[#666]'}`}>{selectedPage.metaDescLength || 0}/155</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black text-[#444] uppercase tracking-widest border-b border-[#222] pb-1 mb-4">Social Preview (Open Graph)</h4>
                            <div className="bg-[#1a1a1a] rounded-lg border border-[#333] overflow-hidden max-w-[500px]">
                                <div className="h-[200px] bg-[#222] flex items-center justify-center text-[#555] border-b border-[#333] relative">
                                    {selectedPage.screenshotUrl ? (
                                        <img src={selectedPage.screenshotUrl} alt="Page screenshot" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Monitor size={24} className="text-[#444]" />
                                            <span className="text-[11px]">og:image preview</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 bg-[#111]">
                                    <div className="text-[#888] text-[11px] uppercase tracking-wider mb-1">{getSafeHostname(selectedPage.url)}</div>
                                    <div className="text-[#eee] font-bold text-[14px] leading-tight mb-1 truncate">{selectedPage.title || 'Untitled Page'}</div>
                                    <div className="text-[#888] text-[12px] line-clamp-2">{selectedPage.metaDesc || 'No description provided.'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ SOURCE TAB (Raw HTML + Schema) ═══ */}
                {activeTab === 'source' && (
                    <div className="max-w-6xl space-y-4 h-full flex flex-col">
                        <div className="flex justify-between items-center border-b border-[#222] pb-1">
                            <h4 className="text-[11px] font-black text-[#444] uppercase tracking-widest">Source Code / DOM</h4>
                            <div className="px-3 py-1 text-[10px] font-medium rounded-sm bg-[#0a0a0a] border border-[#222] text-[#888]">
                                Raw HTML snapshot
                            </div>
                        </div>
                        <div className="flex-1 bg-[#0a0a0a] border border-[#222] rounded p-4 font-mono text-[11px] text-[#a6accd] overflow-y-auto custom-scrollbar relative">
                            {selectedPage.rawHtml ? (
                                <pre className="whitespace-pre-wrap">{selectedPage.rawHtml}</pre>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#666] gap-3">
                                    <Code size={32} className="opacity-50"/>
                                    <span className="text-[12px]">Source HTML was not stored for this crawl.</span>
                                    <span className="text-[11px] text-[#444]">This inspector currently shows extracted data, not a refetch-on-demand source viewer.</span>
                                </div>
                            )}
                        </div>

                        {/* Structured Data (folded in) */}
                        <div className="border-t border-[#222] pt-4">
                            <h4 className="text-[11px] font-black text-[#444] uppercase tracking-widest mb-2 flex items-center gap-2">
                                <FileJson size={12} className="text-blue-400" /> Structured Data (JSON-LD)
                            </h4>
                            <div className="bg-[#0a0a0a] border border-[#222] rounded p-4 font-mono text-[11px] text-[#a6accd] max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner">
                                {selectedPage.schema ? (
                                    <pre className="whitespace-pre-wrap">{JSON.stringify(selectedPage.schema, null, 2)}</pre>
                                ) : (
                                    <div className="text-[#666] flex items-center gap-2 py-2">
                                        <Code size={14} className="opacity-50"/>
                                        <span>No Schema.org structured data found on this page.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ AI ANALYSIS TAB ═══ */}
                {activeTab === 'ai' && (
                    <div className="max-w-6xl">
                        <div className="flex items-center justify-between mb-4 border-b border-[#222] pb-3">
                            <div>
                                <h3 className="text-[14px] font-bold text-white flex items-center gap-2">
                                    <Wand2 size={16} className="text-[#F5364E]" /> AI Analysis
                                </h3>
                                <p className="text-[11px] text-[#666]">Content quality, topic detection, and link structure insights</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-4 py-1.5 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-[#e0e0e0] rounded text-[11px] font-medium transition-colors">
                                    Generate Rewrite Suggestions
                                </button>
                                <button className="px-4 py-1.5 bg-[#F5364E]/10 hover:bg-[#F5364E]/20 text-[#F5364E] border border-[#F5364E]/30 rounded text-[11px] font-bold transition-colors">
                                    Run Deep Audit
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            {/* Content Quality */}
                            <div className="space-y-4">
                                <div className="bg-[#0a0a0a] border border-[#222] rounded-md p-4 h-full">
                                    <h4 className="text-[11px] font-black text-[#555] uppercase tracking-widest mb-3 border-b border-[#222] pb-2">
                                        Content Quality
                                    </h4>
                                    <ul className="space-y-3 text-[12px] text-[#bbb]">
                                        {selectedPage.wordCount < 300 && <li className="flex gap-2.5 items-start"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"/><span><strong className="text-white">Thin Content:</strong> Only {selectedPage.wordCount || 0} words. Consider adding more useful content.</span></li>}
                                        {selectedPage.readability && <li className="flex gap-2.5 items-start"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"/><span><strong className="text-white">Readability:</strong> {selectedPage.readability} level.</span></li>}
                                        {selectedPage.titleLength > 60 && <li className="flex gap-2.5 items-start"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"/><span><strong className="text-white">Title Too Long:</strong> Over the 60 character limit.</span></li>}
                                        {selectedPage.metaDescLength === 0 && <li className="flex gap-2.5 items-start"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"/><span><strong className="text-white">No Meta Description:</strong> Search engines will auto-generate snippets instead.</span></li>}
                                        {selectedPage.h1_1Length === 0 && <li className="flex gap-2.5 items-start"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"/><span><strong className="text-white">Missing H1:</strong> Every page needs a main heading.</span></li>}
                                        {(selectedPage.statusCode === 200 && selectedPage.titleLength > 30 && selectedPage.titleLength <= 60 && selectedPage.metaDescLength > 0 && selectedPage.h1_1Length > 0 && selectedPage.wordCount >= 300) && <li className="flex gap-2.5 items-start text-green-400"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"/><span>Content structure looks solid.</span></li>}
                                    </ul>
                                </div>

                                {/* Content Uniqueness & Clusters */}
                                <div className="bg-[#0a0a0a] border border-[#222] rounded-md p-4 h-full relative overflow-hidden">
                                    <h4 className="text-[11px] font-black text-[#555] uppercase tracking-widest mb-3 border-b border-[#222] pb-2">
                                        Content Uniqueness
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-[10px] text-[#888] uppercase tracking-widest">Similarity Score</div>
                                            <div className="text-[12px] font-mono text-white">
                                                {(() => {
                                                    const duplicates = pages.filter(p => p.url !== selectedPage.url && p.contentHash === selectedPage.contentHash);
                                                    return duplicates.length > 0 ? 'Duplicate' : 'Unique';
                                                })()}
                                            </div>
                                        </div>
                                        <div className="w-full h-1.5 bg-[#111] rounded-full overflow-hidden border border-[#222]">
                                            <div className={`h-full ${pages.some(p => p.url !== selectedPage.url && p.contentHash === selectedPage.contentHash) ? 'bg-red-500' : 'bg-green-500'}`} 
                                                style={{ width: pages.some(p => p.url !== selectedPage.url && p.contentHash === selectedPage.contentHash) ? '100%' : '100%' }}>
                                            </div>
                                        </div>

                                        {(() => {
                                            const duplicates = pages.filter(p => p.url !== selectedPage.url && p.contentHash === selectedPage.contentHash);
                                            if (duplicates.length > 0) {
                                                return (
                                                    <div className="space-y-2">
                                                        <div className="text-[10px] text-red-400 bg-red-400/5 p-2 rounded border border-red-400/10 flex items-start gap-2">
                                                            <Hash size={12} className="mt-0.5 shrink-0" />
                                                            <span>This page has identical content to <strong>{duplicates.length}</strong> other pages.</span>
                                                        </div>
                                                        <div className="max-h-[80px] overflow-y-auto custom-scrollbar-hidden">
                                                            {duplicates.map(d => (
                                                                <div key={d.url} className="text-[9px] text-[#666] truncate py-0.5 hover:text-[#888]">{d.url}</div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div className="text-[10px] text-green-400/70 bg-green-500/5 p-2 rounded border border-green-500/10">
                                                    Content fingerprint is unique across the current crawl dataset.
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Topics */}
                            <div className="space-y-4">
                                <div className="bg-[#0a0a0a] border border-[#222] rounded-md p-4 h-full">
                                    <h4 className="text-[11px] font-black text-[#555] uppercase tracking-widest mb-3 border-b border-[#222] pb-2">
                                        Content & Topics
                                    </h4>
                                    <div className="text-[12px] text-[#888] leading-relaxed">
                                        {selectedPage.embeddings ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-green-400 text-[11px] font-mono mb-2">
                                                    <CheckCircle2 size={14}/> Topic Analysis Complete
                                                </div>
                                                <div>
                                                    <span className="text-[#666] text-[10px] uppercase tracking-wider block mb-1">Topic Group</span>
                                                    <div className="text-white font-medium bg-[#111] px-2 py-1 rounded border border-[#333] inline-block">
                                                        {selectedPage.topicCluster || 'Not yet categorized'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-[#666] text-[10px] uppercase tracking-wider block mb-1">Content Type</span>
                                                    <div className="text-[#ccc] text-[12px]">
                                                        {selectedPage.funnelStage || 'Informational'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-[#666] text-[10px] uppercase tracking-wider block mb-1">Raw Data</span>
                                                    <div className="h-[40px] border border-[#333] rounded bg-[#111] p-1.5 text-[#444] text-[9px] font-mono overflow-hidden break-all">
                                                        [{selectedPage.embeddings.slice(0,10).map((n: number) => n.toFixed(3)).join(', ')} ...]
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-6">
                                                <Database size={24} className="text-[#333]" />
                                                <p className="text-[11px]">Enable <strong>Detect Topics</strong> in settings to analyze topics and content gaps.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Architecture */}
                            <div className="space-y-4">
                                <div className="bg-[#0a0a0a] border border-[#222] rounded-md p-4 h-full relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
                                    <h4 className="text-[11px] font-black text-[#555] uppercase tracking-widest mb-3 border-b border-[#222] pb-2 relative z-10">
                                        Link Strength
                                    </h4>
                                    <div className="space-y-4 relative z-10">
                                        <div>
                                            <div className="flex justify-between text-[11px] mb-1">
                                                <span className="text-[#888]">Link Score</span>
                                                <span className="text-white font-mono">{selectedPage.internalPageRank || '0.000'}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-[#111] rounded-full overflow-hidden border border-[#222]">
                                                <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (selectedPage.internalPageRank || 0) * 100)}%` }}></div>
                                            </div>
                                            <p className="text-[10px] text-[#555] mt-1">Based on inlink count and crawl depth.</p>
                                        </div>
                                        
                                        <div className="bg-[#111] border border-[#333] rounded p-3 text-[11px] text-[#ccc]">
                                            <div className="flex justify-between mb-2 pb-2 border-b border-[#222]">
                                                <span className="text-[#888]">Crawl Depth</span>
                                                <span className="text-white font-mono">{selectedPage.crawlDepth} clicks</span>
                                            </div>
                                            <div className="flex justify-between mb-2 pb-2 border-b border-[#222]">
                                                <span className="text-[#888]">Internal Links In</span>
                                                <span className="text-white font-mono">{selectedPage.inlinks}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#888]">Internal Links Out</span>
                                                <span className="text-white font-mono">{selectedPage.outlinks}</span>
                                            </div>
                                        </div>

                                        {selectedPage.inlinks < 3 && selectedPage.statusCode === 200 && (
                                            <div className="text-[11px] text-orange-400 bg-orange-500/10 p-2 rounded border border-orange-500/20">
                                                <strong>Low visibility:</strong> This page has very few internal links pointing to it. Add links from your main pages.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
