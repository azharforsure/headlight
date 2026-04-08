import React from 'react';
import { Clock, Layers, Keyboard, Cpu, Route } from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';

const getSafeHostname = (url: string | undefined | null) => {
    if (!url) return '';
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
};

export default function StatusBar() {
    const { 
        isCrawling, elapsedTime, crawlRate, crawlRuntime, isAuthenticated, viewMode, pages, trialPagesLimit, crawlHistory
    } = useSeoCrawler();

    const statusMeta = (() => {
        if (isCrawling || crawlRuntime.stage === 'crawling' || crawlRuntime.stage === 'connecting') {
            return {
                dotClass: 'bg-green-500 animate-pulse',
                label: crawlRuntime.stage === 'connecting' ? 'Connecting Scanner' : 'Scanning Site'
            };
        }

        if (crawlRuntime.stage === 'completed') {
            return {
                dotClass: 'bg-blue-400',
                label: 'Scan Complete'
            };
        }

        if (crawlRuntime.stage === 'paused') {
            return {
                dotClass: 'bg-yellow-500',
                label: 'Scan Paused'
            };
        }

        if (crawlRuntime.stage === 'error') {
            return {
                dotClass: 'bg-red-500',
                label: 'Scan Error'
            };
        }

        return {
            dotClass: 'bg-blue-500/50',
            label: 'Ready to Scan'
        };
    })();

    return (
        <div className="h-[28px] bg-[#0a0a0a] border-t border-[#1a1a1a] flex items-center px-4 justify-between shrink-0 select-none text-[11px] text-[#666]">
            {/* Left side: Status */}
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`}></div>
                    <span className="text-[#555]">{statusMeta.label}</span>
                </span>

                <span className="text-[#333]">|</span>
                <span className="text-[#444] text-[9px] font-bold uppercase tracking-widest">Beta</span>
                
                {pages[0]?.url ? (
                    <>
                        <span className="text-[#333]">|</span>
                        <span className="text-[#ccc] font-medium tracking-tight">
                            {getSafeHostname(pages[0].url)}
                        </span>
                    </>
                ) : crawlHistory?.length > 0 && (
                    <>
                        <span className="text-[#333]">|</span>
                        <span className="text-[#555]">{crawlHistory.length} Sessions in History</span>
                    </>
                )}

                {(isCrawling || crawlRuntime.stage === 'completed' || crawlRuntime.stage === 'paused' || crawlRuntime.stage === 'error') && (
                    <>
                        <span className="text-[#333]">|</span>
                        <span className="flex items-center gap-1 font-mono text-[#888]"><Clock size={11} className="text-[#444]"/> {elapsedTime}</span>
                        <span className="text-[#333]">|</span>
                        <span className="font-mono text-[#888]">{crawlRate} p/s</span>
                        <span className="text-[#333]">|</span>
                        <span className="flex items-center gap-1 font-mono text-[#888]"><Route size={11} className="text-[#444]"/> {crawlRuntime.queued} queued</span>
                        <span className="text-[#333]">|</span>
                        <span className="flex items-center gap-1 font-mono text-[#888]"><Cpu size={11} className="text-[#444]"/> {crawlRuntime.activeWorkers}/{crawlRuntime.concurrency}</span>
                    </>
                )}
            </div>

            {/* Right side: Helpers */}
            <div className="flex items-center gap-4 text-[#666]">
                <span className="flex items-center gap-1.5">
                    <Layers size={12} className="text-[#555]" />
                    {viewMode === 'grid' ? 'Grid View' : 'Map View'}
                </span>

                <span className="text-[#333]">|</span>

                <span className="flex items-center gap-1.5">
                    <Keyboard size={12} className="text-[#555]"/> Press ⌘+E to Export
                </span>

                {!isAuthenticated ? (
                    <span className="text-orange-400/80">Guest Mode ({trialPagesLimit} URL limit)</span>
                ) : (
                    <span className="text-blue-400/80">Signed In</span>
                )}

                <span className="text-[#333]">|</span>

                <span className="text-[#444] text-[10px]">© 2024 - {new Date().getFullYear()} Headlight SEO</span>
            </div>
        </div>
    );
}
