import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { MonitorPlay, Target, Share2, Activity, HelpCircle, Sparkles, Send, Plus, SearchCheck, ArrowUp, ArrowDown, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { KPICard } from './Widgets';
import { performanceData, sparklineData1, sparklineData2, sparklineData3, sparklineData4, distributionData } from '../../data/mockData';
import { useProject } from '../../services/ProjectContext';
import { fetchProjectCrawlerIntegrations } from '../../services/CrawlerIntegrationsService';
import { getLatestAuditResult, getAuditAggregatedMetrics, getAuditPages } from '../../services/CrawlPersistenceService';
import { generateDashboardInsights } from '../../services/AppIntelligenceService';
import { getProjectMetrics } from '../../services/DashboardDataService';

export const DashboardOverview = ({ openPanel, topMovers, competitorData, showHelp }: any) => {
    const { activeProject } = useProject();
    const [chatInput, setChatInput] = useState('');
    const [insights, setInsights] = useState<any[]>([]);
    const [loadingInsights, setLoadingInsights] = useState(true);
    const [visibilityScore, setVisibilityScore] = useState<number | null>(null);
    const [visibilityTrend, setVisibilityTrend] = useState<string | null>(null);
    const [avgPosition, setAvgPosition] = useState<string>('...');
    const [mentionCount, setMentionCount] = useState<string>('...');
    const [siteHealthScore, setSiteHealthScore] = useState<string>('...');
    const [gscData, setGscData] = useState<any[]>([]);
    const [totalClicks, setTotalClicks] = useState<number | null>(null);
    const [totalSessions, setTotalSessions] = useState<number | null>(null);
    const [loadingGsc, setLoadingGsc] = useState(true);
    const [crawlStatus, setCrawlStatus] = useState<any>(null);

    useEffect(() => {
        const fetchInsights = async () => {
            if (!activeProject) return;
            setLoadingInsights(true);
            try {
                const generated = await generateDashboardInsights(activeProject.name, activeProject.url);
                setInsights(generated.insights);
                setVisibilityScore(generated.visibility.overallScore);
                const trendPrefix = generated.visibility.trend === 'up' ? '+' : '-';
                setVisibilityTrend(`${trendPrefix}${generated.visibility.trendValue}%`);

                const projectMetrics = await getProjectMetrics(activeProject.id);
                setAvgPosition(projectMetrics.avgPosition ? projectMetrics.avgPosition.toFixed(1) : '—');
                setMentionCount(projectMetrics.mentionCount.toLocaleString());

                const latestAudit = await getLatestAuditResult(activeProject.id);
                if (latestAudit) {
                    setSiteHealthScore(latestAudit.score?.toString() || '—');
                    
                    // Fetch aggregated metrics from the audit instead of real-time API call
                    const metrics = await getAuditAggregatedMetrics(latestAudit.id);
                    if (metrics && (metrics.gscClicks > 0 || metrics.ga4Sessions > 0)) {
                        setTotalClicks(metrics.gscClicks);
                        setTotalSessions(metrics.ga4Sessions);
                        setLoadingGsc(false);
                    }

                    const auditPages = await getAuditPages(latestAudit.id, 0, 8);
                    const syncedPages = auditPages.pages
                        .filter((page: any) => Number(page.gsc_clicks || 0) > 0 || Number(page.ga4_sessions || 0) > 0)
                        .map((page: any) => ({
                            keys: [page.url],
                            clicks: Number(page.gsc_clicks || 0),
                            impressions: Number(page.gsc_impressions || 0),
                            position: Number(page.gsc_position || 0),
                            sessions: Number(page.ga4_sessions || 0)
                        }));
                    setGscData(syncedPages);
                } else {
                    setSiteHealthScore('—');
                }

                // Fallback to real-time fetch if no audit data exists or if specifically requested
                if (loadingGsc) {
                    const integrationResult = await fetchProjectCrawlerIntegrations(activeProject.id);
                    const gscConnection = integrationResult.connections.google;

                    if (gscConnection && (gscConnection.selection?.siteUrl || gscConnection.metadata?.siteUrl)) {
                        console.info('[DashboardOverview] GSC fallback skipped because crawler integrations no longer expose client-side tokens.');
                    }
                    setLoadingGsc(false);
                }

            } finally {
                setLoadingGsc(false);
                setLoadingInsights(false);
            }
        };

        fetchInsights();

        if (activeProject?.id) {
            setCrawlStatus(null);
        }
    }, [activeProject?.id]);

    return (
        <div className="space-y-6">
            {/* Live Crawl Banner */}
            {crawlStatus && crawlStatus.status === 'running' && (
                <div className="bg-brand-red/10 border border-brand-red/20 rounded-xl p-4 flex items-center justify-between animate-pulse mb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-red p-2 rounded-lg shadow-lg shadow-brand-red/20">
                            <Activity className="h-5 w-5 text-white animate-spin" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">Strategic Crawl in Progress...</p>
                            <p className="text-xs text-secondary/70 truncate max-w-md">Scanning: {crawlStatus.current_url}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-sm font-black text-brand-red">{Math.round(crawlStatus.progress)}%</p>
                            <p className="text-[10px] text-secondary/50 uppercase tracking-widest font-bold">{crawlStatus.urls_crawled} URLs</p>
                        </div>
                        <div className="w-32 bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div 
                                className="bg-brand-red h-full transition-all duration-700 ease-out" 
                                style={{ width: `${crawlStatus.progress}%` }}
                            />
                        </div>
                        <button 
                            onClick={() => openPanel('crawler')}
                            className="text-[10px] bg-brand-red hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-red/20"
                        >
                            View Live
                        </button>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <KPICard
                    title="Search Presence"
                    value={visibilityScore !== null ? `${visibilityScore}%` : "..."}
                    trend={visibilityTrend || ""}
                    icon={<MonitorPlay size={16} className="text-brand-red" />}
                    chartData={sparklineData1}
                    strokeColor="#F5364E"
                    helpText="The percentage of time your brand appears in AI answers (like ChatGPT) and search results for your keywords."
                    onHelp={showHelp}
                />
                <KPICard
                    title="Avg. Position"
                    value={avgPosition}
                    trend=""
                    icon={<Target size={16} className="text-[#2DD4BF]" />}
                    chartData={sparklineData2}
                    strokeColor="#2DD4BF"
                    helpText="Your average ranking across all keywords. Lower is better (1 is best)."
                    onHelp={showHelp}
                />
                <KPICard
                    title="Brand Mentions"
                    value={mentionCount}
                    trend=""
                    icon={<Share2 size={16} className="text-brand-purple" />}
                    chartData={sparklineData3}
                    strokeColor="#A855F7"
                    helpText="How many times people talked about your brand on social media, blogs, and news sites recently."
                    onHelp={showHelp}
                />
                <KPICard
                    title="Site Health"
                    value={siteHealthScore}
                    trend=""
                    icon={<Activity size={16} className="text-orange-500" />}
                    chartData={sparklineData4}
                    strokeColor="#F97316"
                    isScore
                    helpText="A score out of 100 representing how technically sound your website is (speed, errors, security)."
                    onHelp={showHelp}
                />
            </div>

            {/* B. Main Analysis Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-[#0F0F0F] rounded-2xl border border-white/5 p-6 flex flex-col h-[420px] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red/0 via-brand-red/50 to-brand-red/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-white font-bold font-heading text-lg">AI vs Regular Search</h3>
                                <button onClick={() => showHelp("AI vs Regular Search", "This compares how often you appear in AI Chatbots (like ChatGPT) versus traditional Google Search links.")} className="text-gray-500 hover:text-white"><HelpCircle size={16} /></button>
                            </div>
                            <p className="text-gray-500 text-xs mt-1">Comparing <span className="text-brand-red">AI Chat</span> vs <span className="text-gray-400">Regular Search</span> over last 30 days</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F5364E" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#F5364E" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorTrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#333" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#333" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#666', fontFamily: 'Inter' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#666', fontFamily: 'Inter' }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '12px', fontFamily: 'Inter' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="traditional"
                                    stroke="#444"
                                    strokeWidth={2}
                                    fill="url(#colorTrad)"
                                    name="Traditional"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="ai"
                                    stroke="#F5364E"
                                    strokeWidth={3}
                                    fill="url(#colorAi)"
                                    name="AI Search"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="xl:col-span-1 flex flex-col gap-6 h-[420px]">
                    <div className="flex-[0.4] bg-[#0F0F0F] rounded-2xl border border-white/5 p-4 flex items-center justify-between relative overflow-hidden">
                        <div className="z-10">
                            <h4 className="text-sm font-bold font-heading text-white mb-2">Ranking Distribution</h4>
                            <div className="space-y-1.5">
                                {distributionData.map((d) => (
                                    <div key={d.name} className="flex items-center gap-2 text-xs text-gray-400">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                                        <span>{d.name}:</span>
                                        <span className="text-white font-bold">{d.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="w-28 h-28 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distributionData}
                                        innerRadius={25}
                                        outerRadius={40}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {distributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="flex-1 bg-[#0F0F0F] rounded-2xl border border-white/5 p-5 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red opacity-[0.03] blur-[80px] rounded-full pointer-events-none"></div>
                        <div className="flex items-center gap-2 mb-4 z-10">
                            <Sparkles size={16} className="text-brand-red" />
                            <h3 className="text-white font-bold font-heading text-sm">Action Plan</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-1 space-y-3 z-10 scrollbar-thin mb-3">
                            {loadingInsights ? (
                                <div className="text-center py-4 text-xs text-gray-500 animate-pulse">Generating insights...</div>
                            ) : insights.length === 0 ? (
                                <div className="text-center py-4 text-xs text-gray-500">No new insights available.</div>
                            ) : (
                                insights.map((insight: any) => (
                                    <div
                                        key={insight.id}
                                        onClick={() => openPanel('insight', { title: insight.type, desc: insight.message })}
                                        className="p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors group cursor-pointer hover:bg-white/[0.06] flex items-start gap-3"
                                    >
                                        <div className={`mt-0.5 shrink-0 ${insight.type === 'Warning' ? 'text-orange-500' : insight.type === 'Success' ? 'text-brand-green' : 'text-blue-400'}`}>
                                            {insight.type === 'Warning' ? <AlertTriangle size={14} /> : insight.type === 'Success' ? <CheckCircle2 size={14} /> : <Sparkles size={14} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h4 className="text-xs font-bold text-gray-200">{insight.type}</h4>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">{insight.metric}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">{insight.message}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="relative z-10 mt-auto">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Ask about your rankings..."
                                className="w-full bg-[#111] border border-white/10 rounded-lg pl-3 pr-10 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/50 transition-colors"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-red transition-colors">
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* C. Competitor & Top Movers */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-[#0F0F0F] rounded-2xl border border-white/5 p-6 flex flex-col">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h3 className="text-xl font-bold font-heading text-white">Compare vs Competitors</h3>
                            <p className="text-gray-500 text-xs mt-1">See how you stack up against market leaders</p>
                        </div>
                        <button
                            onClick={() => openPanel('competitor_add')}
                            className="text-xs font-bold text-gray-500 hover:text-white transition-colors flex items-center gap-1 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10"
                        >
                            <Plus size={12} /> Add Competitor
                        </button>
                    </div>
                    <div className="flex-1 w-full min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={competitorData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#666', fontFamily: 'Inter' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#666', fontFamily: 'Inter' }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#111' }}
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '12px', fontFamily: 'Inter' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={40}>
                                    {competitorData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="xl:col-span-1 flex flex-col">
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-xl font-bold font-heading text-white">Google Search Console</h3>
                    </div>
                    <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-4 flex-1 flex flex-col">
                        {(totalClicks !== null || totalSessions !== null) && (
                            <div className="mb-4 flex items-center gap-2 text-[10px] text-gray-400">
                                {totalClicks !== null && <span className="rounded border border-white/10 bg-white/5 px-2 py-1">{totalClicks.toLocaleString()} clicks</span>}
                                {totalSessions !== null && <span className="rounded border border-white/10 bg-white/5 px-2 py-1">{totalSessions.toLocaleString()} sessions</span>}
                            </div>
                        )}
                        {!gscData.length && loadingGsc ? (
                            <div className="flex-1 flex items-center justify-center text-xs text-gray-500 animate-pulse">Loading queries...</div>
                        ) : gscData.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <SearchCheck size={32} className="text-gray-600 mb-3" />
                                <h4 className="text-sm font-bold text-white mb-2">No synced GSC data</h4>
                                <p className="text-xs text-gray-500 mb-4 px-4">Connect Google in the crawler or project settings, then sync a property.</p>
                                <a href="/crawler" className="px-4 py-2 bg-brand-red text-white text-xs font-bold rounded-lg hover:bg-brand-redHover transition-colors">Open Crawler</a>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {gscData.map((row: any, i: number) => (
                                    <div key={i} className="flex flex-col gap-1 p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-white/5">
                                        <p className="text-sm font-bold text-gray-200 truncate">{row.keys[0]}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-brand-green bg-brand-green/10 px-1.5 py-0.5 rounded font-bold">{row.clicks} clicks</span>
                                                <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{row.impressions} imp.</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400">{row.sessions > 0 ? `${row.sessions} sessions` : `Pos: ${row.position.toFixed(1)}`}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
};
