import React, { ChangeEvent, useMemo, useRef, useState } from 'react';
import { FileText, Globe, ListPlus, Play, Search, Sparkles, Upload } from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { useCrawlerUI } from '../../contexts/CrawlerUIContext';
import { AUDIT_MODES, INDUSTRY_FILTERS } from '../../services/AuditModeConfig';
import type { AuditMode, IndustryFilter } from '../../services/CheckRegistry';

const QUICK_MODES: Array<{ id: 'full' | AuditMode; label: string }> = [
    { id: 'full', label: 'Full Audit' },
    { id: 'technical_seo', label: 'Technical SEO' },
    { id: 'content', label: 'Content Audit' },
    { id: 'website_quality', label: 'Website Quality' }
];

const SPEED_OPTIONS: Array<'slow' | 'normal' | 'fast' | 'turbo'> = ['normal', 'fast', 'turbo', 'slow'];

const parseUrlsFromText = (text: string) => {
    return text
        .split(/\r?\n|,/)
        .map((value) => value.trim())
        .filter(Boolean)
        .filter((value, index, items) => items.indexOf(value) === index);
};

const readFileText = (file: File) => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error('Failed to read file.'));
        reader.readAsText(file);
    });
};

export default function CrawlerEmptyState() {
    const {
        urlInput,
        setUrlInput,
        listUrls,
        setListUrls,
        setCrawlingMode,
        handleStartPause,
        config,
        setConfig,
        applyAuditMode,
        handleImport,
        addLog
    } = useSeoCrawler();

    const {
        setShowSettings,
        setSettingsTab,
        setShowListModal,
    } = useCrawlerUI();

    const sitemapInputRef = useRef<HTMLInputElement | null>(null);
    const csvInputRef = useRef<HTMLInputElement | null>(null);
    const [quickUrl, setQuickUrl] = useState(urlInput || '');
    const [quickMode, setQuickMode] = useState<'full' | AuditMode>('full');
    const [quickIndustry, setQuickIndustry] = useState<IndustryFilter>('all');
    const [quickMaxPages, setQuickMaxPages] = useState(config.limit || '1000');
    const [quickDepth, setQuickDepth] = useState(config.maxDepth || '10');
    const [quickSpeed, setQuickSpeed] = useState<typeof SPEED_OPTIONS[number]>(config.crawlSpeed || 'fast');

    const selectedMode = useMemo(
        () => AUDIT_MODES.find((mode) => mode.id === quickMode),
        [quickMode]
    );

    const startQuickCrawl = () => {
        const normalizedUrl = quickUrl.trim();
        if (!normalizedUrl) {
            addLog('Enter a website URL before starting the crawl.', 'warn', { source: 'system' });
            return;
        }

        setUrlInput(normalizedUrl);
        setCrawlingMode('spider');
        setConfig((previous) => ({
            ...previous,
            mode: 'spider',
            limit: quickMaxPages,
            maxDepth: quickDepth,
            crawlSpeed: quickSpeed
        }));
        applyAuditMode([quickMode], quickIndustry);
        window.setTimeout(() => handleStartPause(), 0);
    };

    const openIntegrations = () => {
        setSettingsTab('integrations');
        setShowSettings(true);
    };

    const handleSitemapImport = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await readFileText(file);
            const xml = new DOMParser().parseFromString(text, 'application/xml');
            const urls = Array.from(xml.getElementsByTagName('loc'))
                .map((node) => node.textContent?.trim() || '')
                .filter(Boolean);

            if (urls.length === 0) {
                throw new Error('No URLs found in sitemap file.');
            }

            setCrawlingMode('list');
            setListUrls(urls.join('\n'));
            setShowListModal(true);
            addLog(`Loaded ${urls.length} URLs from sitemap.`, 'success', { source: 'system' });
        } catch (error) {
            addLog((error as Error).message || 'Failed to parse sitemap file.', 'error', { source: 'system' });
        } finally {
            event.target.value = '';
        }
    };

    const handleCsvImport = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await readFileText(file);
            const urls = parseUrlsFromText(text).filter((value) => /^https?:\/\//i.test(value));

            if (urls.length > 0) {
                setCrawlingMode('list');
                setListUrls(urls.join('\n'));
                setShowListModal(true);
                addLog(`Loaded ${urls.length} URLs from CSV.`, 'success', { source: 'system' });
            } else {
                await handleImport(file);
            }
        } catch (error) {
            addLog((error as Error).message || 'Failed to import CSV file.', 'error', { source: 'system' });
        } finally {
            event.target.value = '';
        }
    };

    return (
        <div className="flex-1 overflow-auto bg-[#0a0a0a] px-6 py-10 md:px-10">
            <div className="mx-auto flex min-h-full w-full max-w-4xl items-center justify-center">
                <div className="w-full rounded-[28px] border border-[#1f1f22] bg-[radial-gradient(circle_at_top,rgba(245,54,78,0.08),transparent_34%),linear-gradient(180deg,#111_0%,#090909_100%)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:p-10">
                    <div className="mx-auto max-w-3xl text-center">
                        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-[#2a2a2f] bg-[#121215] text-[#F5364E] shadow-[0_0_40px_rgba(245,54,78,0.15)]">
                            <Search size={34} />
                        </div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#777]">Crawler Workspace</div>
                        <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">Start your first crawl</h1>
                        <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-6 text-[#8a8a8f]">
                            Enter a website URL, pick an audit profile, and launch a crawl. Headlight will collect crawlability,
                            on-page, performance, and issue-tracking data into the workspace.
                        </p>
                    </div>

                    <div className="mx-auto mt-8 max-w-3xl space-y-5">
                        <div className="rounded-2xl border border-[#242428] bg-[#0d0d0f] p-3 shadow-inner">
                            <div className="flex flex-col gap-3 rounded-xl border border-[#2c2c31] bg-[#09090b] px-4 py-3 md:flex-row md:items-center">
                                <Globe size={18} className="mt-3 hidden text-[#666] md:block" />
                                <input
                                    value={quickUrl}
                                    onChange={(event) => setQuickUrl(event.target.value)}
                                    placeholder="https://example.com"
                                    className="h-10 flex-1 bg-transparent text-[15px] text-white placeholder:text-[#555] focus:outline-none"
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            startQuickCrawl();
                                        }
                                    }}
                                />
                                <button
                                    onClick={startQuickCrawl}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#ff5b70] to-[#d62839] px-4 text-[13px] font-bold text-white shadow-[0_12px_30px_rgba(245,54,78,0.22)] transition-transform hover:-translate-y-[1px]"
                                >
                                    <Play size={14} fill="currentColor" />
                                    Start Crawl
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-5">
                            <label className="space-y-1.5 md:col-span-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#666]">Mode</span>
                                <select
                                    value={quickMode}
                                    onChange={(event) => setQuickMode(event.target.value as 'full' | AuditMode)}
                                    className="h-11 w-full rounded-xl border border-[#242428] bg-[#101013] px-3 text-[12px] text-white focus:border-[#F5364E] focus:outline-none"
                                >
                                    {QUICK_MODES.map((mode) => (
                                        <option key={mode.id} value={mode.id}>{mode.label}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="space-y-1.5 md:col-span-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#666]">Industry</span>
                                <select
                                    value={quickIndustry}
                                    onChange={(event) => setQuickIndustry(event.target.value as IndustryFilter)}
                                    className="h-11 w-full rounded-xl border border-[#242428] bg-[#101013] px-3 text-[12px] text-white focus:border-[#F5364E] focus:outline-none"
                                >
                                    {INDUSTRY_FILTERS.map((industry) => (
                                        <option key={industry.id} value={industry.id}>{industry.label}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="space-y-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#666]">Speed</span>
                                <select
                                    value={quickSpeed}
                                    onChange={(event) => setQuickSpeed(event.target.value as typeof SPEED_OPTIONS[number])}
                                    className="h-11 w-full rounded-xl border border-[#242428] bg-[#101013] px-3 text-[12px] text-white focus:border-[#F5364E] focus:outline-none"
                                >
                                    {SPEED_OPTIONS.map((speed) => (
                                        <option key={speed} value={speed}>{speed}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="grid gap-3 md:grid-cols-4">
                            <div className="rounded-2xl border border-[#242428] bg-[#101013] p-4">
                                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#666]">Quick config</div>
                                <div className="mt-2 text-[13px] font-semibold text-white">{selectedMode?.label || 'Full Audit'}</div>
                                <div className="mt-1 text-[11px] text-[#777]">{selectedMode?.description || 'All checks and categories.'}</div>
                            </div>
                            <label className="rounded-2xl border border-[#242428] bg-[#101013] p-4">
                                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#666]">Max pages</span>
                                <input
                                    value={quickMaxPages}
                                    onChange={(event) => setQuickMaxPages(event.target.value)}
                                    className="mt-3 h-10 w-full rounded-xl border border-[#2b2b31] bg-[#09090b] px-3 text-[13px] text-white focus:border-[#F5364E] focus:outline-none"
                                />
                            </label>
                            <label className="rounded-2xl border border-[#242428] bg-[#101013] p-4">
                                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#666]">Depth</span>
                                <input
                                    value={quickDepth}
                                    onChange={(event) => setQuickDepth(event.target.value)}
                                    className="mt-3 h-10 w-full rounded-xl border border-[#2b2b31] bg-[#09090b] px-3 text-[13px] text-white focus:border-[#F5364E] focus:outline-none"
                                />
                            </label>
                            <div className="rounded-2xl border border-[#242428] bg-[#101013] p-4">
                                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#666]">Ready state</div>
                                <div className="mt-3 text-[18px] font-black text-white">{listUrls ? listUrls.split('\n').filter(Boolean).length : 0}</div>
                                <div className="mt-1 text-[11px] text-[#777]">Imported list URLs waiting to crawl</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px flex-1 bg-[#202024]" />
                            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#555]">Or</div>
                            <div className="h-px flex-1 bg-[#202024]" />
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            <button
                                onClick={() => {
                                    setCrawlingMode('list');
                                    setShowListModal(true);
                                }}
                                className="flex items-center justify-between rounded-2xl border border-[#242428] bg-[#101013] px-4 py-4 text-left transition-colors hover:border-[#F5364E]/40 hover:bg-[#131317]"
                            >
                                <div>
                                    <div className="text-[12px] font-semibold text-white">Paste URL list</div>
                                    <div className="mt-1 text-[11px] text-[#777]">Upload a controlled set of landing pages.</div>
                                </div>
                                <ListPlus size={16} className="text-[#888]" />
                            </button>
                            <button
                                onClick={() => sitemapInputRef.current?.click()}
                                className="flex items-center justify-between rounded-2xl border border-[#242428] bg-[#101013] px-4 py-4 text-left transition-colors hover:border-[#F5364E]/40 hover:bg-[#131317]"
                            >
                                <div>
                                    <div className="text-[12px] font-semibold text-white">Import sitemap</div>
                                    <div className="mt-1 text-[11px] text-[#777]">Parse XML locally and queue discovered URLs.</div>
                                </div>
                                <Upload size={16} className="text-[#888]" />
                            </button>
                            <button
                                onClick={() => csvInputRef.current?.click()}
                                className="flex items-center justify-between rounded-2xl border border-[#242428] bg-[#101013] px-4 py-4 text-left transition-colors hover:border-[#F5364E]/40 hover:bg-[#131317]"
                            >
                                <div>
                                    <div className="text-[12px] font-semibold text-white">Import CSV</div>
                                    <div className="mt-1 text-[11px] text-[#777]">Reuse exported crawl lists or prior datasets.</div>
                                </div>
                                <FileText size={16} className="text-[#888]" />
                            </button>
                        </div>

                        <div className="grid gap-3 rounded-2xl border border-[#242428] bg-[#101013] p-4 md:grid-cols-3">
                            <button
                                onClick={openIntegrations}
                                className="flex items-center gap-3 rounded-xl border border-[#242428] bg-[#0c0c0f] px-4 py-3 text-left hover:border-[#2f2f36]"
                            >
                                <Sparkles size={16} className="text-emerald-400" />
                                <div>
                                    <div className="text-[12px] font-semibold text-white">Connect Google Search Console</div>
                                    <div className="text-[11px] text-[#777]">Bring impressions, clicks, and position data.</div>
                                </div>
                            </button>
                            <button
                                onClick={openIntegrations}
                                className="flex items-center gap-3 rounded-xl border border-[#242428] bg-[#0c0c0f] px-4 py-3 text-left hover:border-[#2f2f36]"
                            >
                                <Sparkles size={16} className="text-sky-400" />
                                <div>
                                    <div className="text-[12px] font-semibold text-white">Connect Google Analytics</div>
                                    <div className="text-[11px] text-[#777]">Join crawl issues to sessions, bounce, and conversions.</div>
                                </div>
                            </button>
                            <button
                                onClick={() => {
                                    setSettingsTab('ai');
                                    setShowSettings(true);
                                }}
                                className="flex items-center gap-3 rounded-xl border border-[#242428] bg-[#0c0c0f] px-4 py-3 text-left hover:border-[#2f2f36]"
                            >
                                <Sparkles size={16} className="text-violet-400" />
                                <div>
                                    <div className="text-[12px] font-semibold text-white">Configure AI providers</div>
                                    <div className="text-[11px] text-[#777]">Enable summaries, intent, quality, and fix suggestions.</div>
                                </div>
                            </button>
                        </div>

                        <p className="text-center text-[11px] text-[#666]">
                            Tip: start with a focused crawl limit and fast speed for the first pass, then widen scope once the issue map is stable.
                        </p>
                    </div>
                </div>
            </div>

            <input ref={sitemapInputRef} type="file" accept=".xml,text/xml,application/xml" className="hidden" onChange={handleSitemapImport} />
            <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvImport} />
        </div>
    );
}
