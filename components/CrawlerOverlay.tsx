import React, { useState, useEffect } from 'react';

/**
 * CrawlerOverlay
 * Full-screen overlay to render the crawler within the app.
 * Listens for 'headlight:open-crawler' event.
 */
export const CrawlerOverlay: React.FC = () => {
    const [url, setUrl] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        const handleOpen = (e: any) => {
            setUrl(e.detail.url);
            setIsMinimized(false);
        };
        window.addEventListener('headlight:open-crawler', handleOpen);
        return () => window.removeEventListener('headlight:open-crawler', handleOpen);
    }, []);

    if (!url) return null;

    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 z-[9999] bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl p-3 flex items-center gap-4 animate-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-sm font-medium text-white">Crawler Active</span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsMinimized(false)}
                        className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                    </button>
                    <button 
                        onClick={() => setUrl(null)}
                        className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col animate-in fade-in duration-200">
            {/* Header / Toolbar */}
            <div className="h-12 border-b border-[#222] bg-[#0a0a0a] flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="text-sm font-semibold text-white">Headlight Crawler</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => window.open(url, '_blank')}
                        className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open in New Tab
                    </button>
                    <div className="w-px h-4 bg-[#222] mx-1" />
                    <button 
                        onClick={() => setIsMinimized(true)}
                        className="p-1.5 hover:bg-[#222] rounded text-gray-400 hover:text-white transition-colors"
                        title="Minimize"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                        </svg>
                    </button>
                    <button 
                        onClick={() => setUrl(null)}
                        className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-500 transition-colors"
                        title="Close"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-[#080808]">
                <iframe 
                    src={url} 
                    className="w-full h-full border-none"
                    title="Crawler Content"
                />
            </div>
        </div>
    );
};
