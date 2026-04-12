import React, { useState, useEffect } from 'react';
import {
    RefreshCw, Download, ChevronDown, FileBarChart, FileSpreadsheet, FileJson,
    HelpCircle, Sparkles, AlertOctagon, GitMerge, Zap, Cpu, Database, Eye,
    FileText, Server, AlertTriangle, PlayCircle, CheckCircle2, ArrowRight,
    LayoutDashboard, ScrollText, Image as ImageIcon, Code2, DollarSign,
    Bot, Layers, BarChart as LucideBarChart, File, ExternalLink as ExternalLinkIcon, Check, Copy as CopyIcon,
    Terminal, Share2, Briefcase, Ghost, Repeat, Type, AlignLeft, ArrowUp, X,
    Lock, MousePointer2, SearchCheck, Activity, Flame, Hammer, Filter, Loader2
} from 'lucide-react';
import {
    ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    Radar, Tooltip, ComposedChart, CartesianGrid, XAxis, YAxis, Area, Bar,
    BarChart, Legend, Treemap, ScatterChart, Scatter, Cell, LineChart, Line, PieChart, Pie, AreaChart, ReferenceLine
} from 'recharts';
import { StrategicCard, DataCard, TechCard, TechnicalRow, LinkOpportunity, FilterButton } from './Widgets';
import {
    allAuditChecks, healthHistoryData, thematicScores as mockThematicScores, auditCategories, crawledPagesData,
    schemaData, canonicalData, wordCountData, cannibalizationData, freshnessData,
    depthData, linkEquityData, logAnalysisData, statusCodeData
} from '../../data/mockData';
import { useProject } from '../../services/ProjectContext';
import { getLatestAuditResult, getAuditIssues, getAuditPages, getAuditHistory } from '../../services/CrawlPersistenceService';
import { openCrawler } from '../../services/CrawlerLauncher';
import { PanelErrorBoundary } from '../PanelErrorBoundary';

// --- Sub-Components ---

const SmartScoreCard = ({ score, isSimulating, toggleSimulation }: any) => {
    // Gauge geometry
    const radius = 80;
    const circumference = 2 * Math.PI * radius; // ~502
    // We want a 270 degree gauge (0.75 of a circle).
    // Visible arc length
    const visibleCircumference = circumference * 0.75;

    // Mapped values
    const progress = score / 100;
    const progressLength = visibleCircumference * progress;

    return (
        <div className={`lg:col-span-1 bg-[#0F0F0F] rounded-3xl border ${isSimulating ? 'border-brand-green/30' : 'border-white/5'} p-0 flex flex-col relative overflow-hidden transition-all duration-500 group shadow-2xl h-full`}>
            {/* Background Effects */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isSimulating ? 'from-brand-green via-white to-brand-green' : 'from-brand-red via-orange-500 to-brand-red'} transition-all duration-1000`}></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[80px] rounded-full pointer-events-none"></div>

            {/* Header */}
            <div className="p-6 pb-2 flex justify-between items-start z-10">
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Site Health</h3>
                    <p className="text-xs text-gray-500 mt-1">Last crawl: Today, 9:00 AM</p>
                </div>
                <button
                    onClick={toggleSimulation}
                    className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 hover:scale-105 active:scale-95 ${isSimulating
                        ? 'bg-brand-green text-black border-brand-green shadow-[0_0_15px_rgba(34,197,94,0.6)]'
                        : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                        }`}
                >
                    {isSimulating ? <CheckCircle2 size={12} /> : <PlayCircle size={12} />}
                    {isSimulating ? 'Fixes Applied' : 'Simulate Fixes'}
                </button>
            </div>

            {/* Gauge Section - Balanced Spacing */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <div className="relative w-72 h-72 flex items-center justify-center -mb-4 mt-2">
                    {/* SVG Gauge */}
                    <svg className="w-full h-full transform rotate-[135deg]" viewBox="0 0 200 200">
                        {/* Track Background */}
                        <circle
                            cx="100" cy="100" r={radius}
                            fill="none"
                            stroke="#222"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={`${visibleCircumference} ${circumference}`}
                        />

                        {/* Progress */}
                        <circle
                            cx="100" cy="100" r={radius}
                            fill="none"
                            stroke={isSimulating ? "#22C55E" : "#F5364E"}
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={`${progressLength} ${circumference}`}
                            className="transition-all duration-700 ease-out drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                        />
                    </svg>

                    {/* Center Text (Counter-rotated to stay upright) */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-7xl lg:text-8xl font-heading font-extrabold tracking-tighter leading-none transition-colors duration-300 ${isSimulating ? 'text-brand-green' : 'text-white'}`}>
                            {score}
                        </span>
                        <span className={`text-sm font-bold uppercase tracking-widest mt-2 bg-white/5 px-3 py-1 rounded border border-white/5 ${isSimulating ? 'text-brand-green border-brand-green/20' : 'text-gray-400'}`}>
                            {score >= 90 ? 'Excellent' : 'Good'}
                        </span>
                        <span className="text-[10px] text-gray-600 mt-2 font-bold uppercase tracking-wide">Top 10% Industry</span>
                    </div>
                </div>
            </div>

            {/* Bottom: 3 KPIs - Replaces Score Opportunities */}
            <div className="bg-[#050505] border-t border-white/10 p-5 relative z-10 grid grid-cols-3 gap-0">
                <div className="flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold font-heading ${isSimulating ? 'text-brand-green' : 'text-red-500'}`}>
                        {isSimulating ? '0' : '5'}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-gray-500 mt-1 tracking-wide">Critical</span>
                </div>
                <div className="flex flex-col items-center justify-center border-l border-white/10">
                    <span className={`text-2xl font-bold font-heading ${isSimulating ? 'text-brand-green' : 'text-orange-500'}`}>
                        {isSimulating ? '12' : '45'}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-gray-500 mt-1 tracking-wide">Warnings</span>
                </div>
                <div className="flex flex-col items-center justify-center border-l border-white/10">
                    <span className="text-2xl font-bold font-heading text-brand-green">
                        {isSimulating ? '98%' : '92%'}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-gray-500 mt-1 tracking-wide">Healthy</span>
                </div>
            </div>
        </div>
    );
};

const CrawlStatusWidget = () => (
    <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-5 flex flex-col justify-between h-[160px] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-green/20 to-transparent"></div>

        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-bold text-white text-sm">Crawl Status</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Googlebot Smartphone</p>
            </div>
            <div className="flex items-center gap-2 bg-green-500/10 px-2 py-1 rounded border border-green-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] text-green-500 font-bold uppercase tracking-wide">Finished</span>
            </div>
        </div>

        <div className="space-y-3">
            <div className="flex justify-between text-xs">
                <span className="text-gray-400">Pages Crawled</span>
                <span className="text-white font-mono">1,215 / 5,000</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className="bg-brand-green h-full w-[24%] shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase tracking-wide">Duration</span>
                    <span className="text-xs text-white font-bold">14m 20s</span>
                </div>
                <div className="h-4 w-px bg-white/10"></div>
                <div className="flex flex-col text-right">
                    <span className="text-[9px] text-gray-500 uppercase tracking-wide">Avg Speed</span>
                    <span className="text-xs text-white font-bold">1.2s</span>
                </div>
            </div>
        </div>
    </div>
);

const AuditOverview = ({ showHelp }: any) => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">

        {/* NEW REVENUE AT RISK CARD - AGENCY TOOL */}
        <div className="bg-gradient-to-r from-red-900/10 to-[#0F0F0F] rounded-3xl border border-red-500/20 p-8 flex flex-col md:flex-row items-center justify-between shadow-[0_0_30px_rgba(239,68,68,0.05)]">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                        <DollarSign size={20} />
                    </div>
                    <h3 className="text-xl font-bold font-heading text-white">Estimated Revenue Risk</h3>
                    <button onClick={() => showHelp("Revenue Risk", "We calculate this by looking at the traffic value of pages that are currently broken (404s) or loading too slowly.")} className="text-gray-600 hover:text-white"><HelpCircle size={16} /></button>
                </div>
                <p className="text-gray-400 text-sm max-w-lg">
                    Based on the traffic value of pages currently returning errors or loading too slowly.
                </p>
            </div>
            <div className="flex items-center gap-6 mt-6 md:mt-0">
                <div className="text-right">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Monthly Loss</p>
                    <p className="text-4xl font-extrabold text-white font-heading tracking-tight">$4,250<span className="text-gray-600 text-xl font-normal">.00</span></p>
                </div>
                <button className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-3 rounded-xl shadow-glow-sm transition-all text-sm">
                    View Impact Report
                </button>
            </div>
        </div>

        <PanelErrorBoundary name="Strategic Overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StrategicCard
                    title="Google's Attention"
                    value="94%"
                    sub="Efficiency"
                    desc="Time search bots spend on valuable pages vs junk."
                    trend="up"
                    severity="good"
                    icon={<Eye size={20} />}
                />
                <StrategicCard
                    title="Content Score"
                    value="76"
                    sub="/ 100"
                    desc="Quality of your text compared to competitors."
                    trend="flat"
                    severity="warning"
                    icon={<FileText size={20} />}
                />
                <StrategicCard
                    title="Bot Visits"
                    value="2.4k"
                    sub="Daily"
                    desc="Total Googlebot requests in the last 24 hours."
                    trend="up"
                    severity="good"
                    icon={<Bot size={20} />}
                />
            </div>
        </PanelErrorBoundary>

        {/* Health History & Severity Stack */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-6 h-[320px] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-white text-lg">Health Trend History</h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase">
                            <div className="w-2 h-2 rounded-full bg-brand-green"></div> Score
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase">
                            <div className="w-2 h-2 rounded-full bg-red-500/50"></div> Errors
                        </div>
                    </div>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={healthHistoryData}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} dy={10} />
                            <YAxis yAxisId="left" orientation="left" stroke="#22C55E" axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 10 }} domain={[0, 100]} />
                            <YAxis yAxisId="right" orientation="right" stroke="#EF4444" axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 10 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                            <Area yAxisId="left" type="monotone" dataKey="score" stroke="#22C55E" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                            <Bar yAxisId="right" dataKey="errors" barSize={12} fill="#EF4444" radius={[4, 4, 0, 0]} opacity={0.6} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-6 h-[320px] flex flex-col">
                <h3 className="font-bold text-white text-lg mb-6">Issue Types</h3>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                            { name: 'Technical', critical: 3, warning: 5, notice: 10 },
                            { name: 'Content', critical: 0, warning: 8, notice: 5 },
                            { name: 'Links', critical: 0, warning: 3, notice: 2 },
                            { name: 'Speed', critical: 1, warning: 4, notice: 8 },
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} dy={10} />
                            <YAxis hide />
                            <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                            <Legend />
                            <Bar dataKey="critical" stackId="a" fill="#EF4444" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="warning" stackId="a" fill="#F59E0B" />
                            <Bar dataKey="notice" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
);

const IssueGroup = ({ title, type, issues, openFix }: any) => {
    if (issues.length === 0) return null;

    const colorClass =
        type === 'critical' ? 'text-red-500 border-red-500/30 bg-red-500/10' :
            type === 'warning' ? 'text-orange-500 border-orange-500/30 bg-orange-500/10' :
                type === 'passed' ? 'text-brand-green border-brand-green/30 bg-brand-green/10' :
                    'text-blue-500 border-blue-500/30 bg-blue-500/10';

    const bgClass =
        type === 'critical' ? 'bg-gradient-to-b from-red-500/5 to-transparent' : '';

    return (
        <div className={`space-y-4 rounded-3xl p-6 border border-white/5 ${bgClass}`}>
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg border ${colorClass}`}>
                    {type === 'critical' ? <Flame size={18} /> :
                        type === 'warning' ? <AlertTriangle size={18} /> :
                            type === 'passed' ? <CheckCircle2 size={18} /> :
                                <CheckCircle2 size={18} />}
                </div>
                <div>
                    <h3 className={`text-lg font-bold uppercase tracking-wide ${type === 'critical' ? 'text-red-500' :
                        type === 'warning' ? 'text-orange-500' :
                            type === 'passed' ? 'text-brand-green' :
                                'text-blue-500'
                        }`}>
                        {title}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">{issues.length} {type === 'passed' ? 'Checks Passed' : 'Issues Found'}</p>
                </div>
            </div>

            <div className="space-y-3">
                {issues.map((issue: any) => (
                    <div
                        key={issue.id}
                        onClick={() => openFix(issue)} // Open slide-over directly
                        className={`bg-[#111] border rounded-2xl transition-all duration-300 overflow-hidden group hover:border-white/20 relative cursor-pointer border-white/5 hover:bg-white/5`}
                    >
                        {/* Score Impact Badge (Absolute) - Hide for passed */}
                        {type !== 'passed' && (
                            <div className="absolute top-0 right-0 p-3 z-10 hidden md:block">
                                <div className="flex items-center gap-1.5 bg-[#050505] border border-white/10 rounded-lg px-2 py-1 shadow-xl">
                                    <span className={`text-[10px] font-bold ${type === 'critical' ? 'text-red-400' : 'text-orange-400'}`}>
                                        -{type === 'critical' ? '5' : '2'} Score
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="p-4 flex items-center justify-between relative z-0">
                            <div className="flex items-center gap-4 flex-1 min-w-0 pr-16 md:pr-0">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <h4 className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors truncate">{issue.title}</h4>
                                        {issue.trend === 'new' && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30 uppercase font-bold tracking-wide">New</span>}
                                        {issue.trend === 'recurring' && <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/30 uppercase font-bold tracking-wide flex items-center gap-1"><Repeat size={8} /> Recurring</span>}
                                    </div>
                                    <div className="flex items-center gap-6 text-xs text-gray-500">
                                        <span className="flex items-center gap-1.5 text-gray-400"><File size={12} /> {issue.count} Pages</span>
                                        {type !== 'passed' && (
                                            <span className="flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${issue.effort === 'Low' ? 'bg-brand-green' : 'bg-orange-500'}`}></span>
                                                {issue.effort} Effort
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mr-4">
                                {issue.trafficImpact > 0 && (
                                    <div className="hidden lg:flex flex-col items-end mr-4">
                                        <span className="text-[10px] text-brand-green font-black uppercase tracking-tighter">+ {issue.trafficImpact} Clicks</span>
                                        <span className="text-[9px] text-gray-600 font-bold">Est. Recovery</span>
                                    </div>
                                )}
                                <span className="text-xs font-bold text-brand-red flex items-center gap-1 group-hover:translate-x-1 transition-transform">Details <ArrowRight size={12} /></span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

const AuditAllIssues = ({ openPanel, auditChecks, healthScore }: any) => {
    const [filterCategory, setFilterCategory] = useState('all');

    const categories = ['all', 'strategic', 'technical', 'content', 'links', 'performance', 'ai_readiness'];

    // Use fetched checks if available, otherwise fallback to mock
    const activeChecks = auditChecks && auditChecks.length > 0 ? auditChecks : allAuditChecks;

    const filteredIssues = activeChecks.filter((issue: any) => {
        if (filterCategory !== 'all' && issue.category?.toLowerCase() !== filterCategory.toLowerCase()) return false;
        return true;
    });

    const criticalIssues = filteredIssues.filter((i: any) => i.priority === 'Critical' && i.type === 'error');
    const warningIssues = filteredIssues.filter((i: any) => (i.priority === 'High' || i.priority === 'Medium') && i.type === 'warning');
    const noticeIssues = filteredIssues.filter((i: any) => (i.priority === 'Low' || i.type === 'notice') && i.type !== 'passed');
    const passedIssues = filteredIssues.filter((i: any) => i.type === 'passed');

    // Updated to assume openPanel is passed correctly
    const openFix = (issue: any) => {
        if (openPanel) {
            openPanel('audit_issue_detail', issue);
        } else {
            console.error("openPanel is not defined");
        }
    };

    return (
        <>
            <PanelErrorBoundary name="Audit Issues List">
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 min-h-[700px]">
                    {/* NEW: Health Projection Bar (Gamification) */}
                    <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-brand-green shadow-[0_0_15px_rgba(34,197,94,0.4)]"></div>
                        <div className="flex-1 z-10">
                            <h3 className="text-lg font-bold text-white font-heading">Strategic Impact Projection</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Resolving the <span className="text-red-500 font-bold">{criticalIssues.length} critical issues</span> could recover an estimated 
                                <span className="text-brand-green font-bold ml-1">
                                    {filteredIssues.reduce((acc: number, i: any) => acc + (i.trafficImpact || 0), 0)} monthly clicks
                                </span>.
                            </p>
                        </div>

                        <div className="flex-1 w-full md:max-w-xl z-10">
                            <div className="flex justify-between text-xs font-bold mb-2">
                                <span className="text-gray-400">Current Health: {healthScore}</span>
                                <span className="text-brand-green">Optimized: {Math.min(100, healthScore + (criticalIssues.length * 5))}</span>
                            </div>
                            <div className="h-4 bg-[#222] rounded-full overflow-hidden relative flex shadow-inner">
                                {/* Base Score */}
                                <div className="h-full bg-brand-red/80 z-20 transition-all duration-1000" style={{ width: `${healthScore}%` }} title="Current Score"></div>
                                {/* Potential Gain */}
                                <div className="h-full bg-brand-green/40 animate-pulse z-10 transition-all duration-1000" style={{ width: `${Math.min(100 - healthScore, criticalIssues.length * 5)}%` }} title="Potential Gain"></div>
                            </div>
                        </div>

                        <div className="z-10 shrink-0">
                            <button className="bg-white text-black text-xs font-bold px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors shadow-lg flex items-center gap-2">
                                <PlayCircle size={14} /> Simulate Fixes
                            </button>
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 bg-[#050505]/95 backdrop-blur-xl py-4 z-20 border-b border-white/5">
                        <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 scrollbar-hide">
                            <FilterButton label="All Issues" count={activeChecks.length} active={filterCategory === 'all'} onClick={() => setFilterCategory('all')} />
                            {categories.filter(c => c !== 'all').map(cat => (
                                <FilterButton
                                    key={cat}
                                    label={cat}
                                    count={activeChecks.filter((i: any) => i.category?.toLowerCase() === cat.toLowerCase()).length}
                                    active={filterCategory === cat}
                                    onClick={() => setFilterCategory(cat)}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><SearchCheck size={14} /></div>
                                <input
                                    type="text"
                                    placeholder="Search specific error..."
                                    className="w-full bg-[#111] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-brand-red/50 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Grouped Issues List */}
                    <div className="space-y-8 pb-12">
                        <IssueGroup
                            title="Critical Issues (Fix Now)"
                            type="critical"
                            issues={criticalIssues}
                            openFix={openFix}
                        />

                        <IssueGroup
                            title="Warnings (Schedule)"
                            type="warning"
                            issues={warningIssues}
                            openFix={openFix}
                        />

                        <IssueGroup
                            title="Notices (Backlog)"
                            type="notice"
                            issues={noticeIssues}
                            openFix={openFix}
                        />

                        {/* NEW PASSED SECTION */}
                        <IssueGroup
                            title="Passed Audits (Healthy)"
                            type="passed"
                            issues={passedIssues}
                            openFix={openFix}
                        />

                        {/* Empty State / All Clear */}
                        {filteredIssues.length === 0 && (
                            <div className="p-12 text-center bg-[#0F0F0F] rounded-3xl border border-white/5 border-dashed">
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">All Clear!</h3>
                                <p className="text-gray-500">No issues found in this category. Great job.</p>
                            </div>
                        )}
                    </div>
                </div>
            </PanelErrorBoundary>
        </>
    )
};

const AuditCrawledPages = ({ openPanel }: any) => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-xl font-bold font-heading text-white">Crawled Pages (1,215)</h3>
            <div className="flex gap-3">
                <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-gray-300 hover:text-white flex items-center gap-2">
                    <Filter size={14} /> Filter
                </button>
                <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-gray-300 hover:text-white flex items-center gap-2">
                    <Download size={14} /> Export CSV
                </button>
            </div>
        </div>

        <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-white/[0.05] text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 text-left">URL</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-center">Type</th>
                            <th className="px-6 py-4 text-center">Depth</th>
                            <th className="px-6 py-4 text-center">Links In</th>
                            <th className="px-6 py-4 text-right">Links Out</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {crawledPagesData.map((page, i) => (
                            <tr key={i} onClick={() => openPanel('url_detail', page)} className="group hover:bg-white/[0.02] transition-colors cursor-pointer">
                                <td className="px-6 py-4">
                                    <span className="text-sm text-blue-400 hover:underline hover:text-blue-300 truncate block max-w-xs">{page.url}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${page.status === 200 ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                        page.status === 404 ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                            'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                                        }`}>
                                        {page.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center text-xs text-gray-400">{page.type}</td>
                                <td className="px-6 py-4 text-center text-sm text-white font-mono">{page.depth}</td>
                                <td className="px-6 py-4 text-center text-sm text-white font-mono">{page.linksIn}</td>
                                <td className="px-6 py-4 text-right text-sm text-gray-400 font-mono">{page.linksOut}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Pagination Mockup */}
            <div className="p-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
                <span>Showing 1-10 of 1,215</span>
                <div className="flex gap-2">
                    <button className="px-3 py-1 bg-white/5 rounded hover:bg-white/10 disabled:opacity-50">Prev</button>
                    <button className="px-3 py-1 bg-white/5 rounded hover:bg-white/10 text-white">Next</button>
                </div>
            </div>
        </div>
    </div>
);

const AuditLogAnalysis = ({ showHelp }: any) => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-xl font-bold font-heading text-white">Log File Analysis</h3>
        <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-6 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={logAnalysisData}>
                    <defs>
                        <linearGradient id="colorBot" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                    <Area type="monotone" dataKey="botHits" stroke="#3B82F6" fillOpacity={1} fill="url(#colorBot)" name="Googlebot Hits" />
                    <Area type="monotone" dataKey="userVisits" stroke="#22C55E" fillOpacity={1} fill="url(#colorUser)" name="User Visits" />
                    <Legend />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
);

const AuditArchitecture = ({ showHelp }: any) => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-xl font-bold font-heading text-white">Site Architecture</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-6">
                <h4 className="text-lg font-bold text-white mb-4">Crawl Depth</h4>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={depthData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#222" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#888', fontSize: 11 }} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                            <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-6">
                <h4 className="text-lg font-bold text-white mb-4">Orphaned Pages</h4>
                <div className="flex items-center justify-center h-[250px] flex-col text-center">
                    <div className="text-5xl font-bold text-white mb-2 font-heading">8</div>
                    <p className="text-gray-500 text-sm">Pages with no incoming internal links.</p>
                    <button className="mt-4 px-4 py-2 bg-white/5 text-white text-xs font-bold rounded-lg border border-white/10 hover:bg-white/10">View Orphans</button>
                </div>
            </div>
        </div>
    </div>
);

const AuditPerformance = ({ showHelp }: any) => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-xl font-bold font-heading text-white">Performance (Core Web Vitals)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TechCard title="LCP" metric="2.4s" status="Needs Imp" desc="Largest Contentful Paint" color="red" icon={<Zap size={18} />} />
            <TechCard title="FID" metric="14ms" status="Good" desc="First Input Delay" color="green" icon={<MousePointer2 size={18} />} />
            <TechCard title="CLS" metric="0.05" status="Good" desc="Cumulative Layout Shift" color="green" icon={<LayoutDashboard size={18} />} />
        </div>
        <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-6">
            <h4 className="text-lg font-bold text-white mb-4">Speed Trends</h4>
            <div className="h-[300px] flex items-center justify-center text-gray-500">
                Chart Placeholder
            </div>
        </div>
    </div>
);

const AuditAIReadiness = ({ showHelp }: any) => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-xl font-bold font-heading text-white">AI Readiness & Schema</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-6">
                <h4 className="text-lg font-bold text-white mb-4">Structured Data Distribution</h4>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={schemaData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                                {schemaData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-6">
                <h4 className="text-lg font-bold text-white mb-4">AI Access Control</h4>
                <div className="space-y-4">
                    <TechnicalRow label="GPTBot Access" status="secure" msg="Allowed" />
                    <TechnicalRow label="CCBot (Common Crawl)" status="secure" msg="Allowed" />
                    <TechnicalRow label="Google-Extended" status="secure" msg="Allowed" />
                </div>
            </div>
        </div>
    </div>
);

const AuditIndexation = ({ showHelp }: any) => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-xl font-bold font-heading text-white">Indexation Status</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-6">
                <h4 className="text-lg font-bold text-white mb-4">Status Codes</h4>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statusCodeData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {statusCodeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-6">
                <h4 className="text-lg font-bold text-white mb-4">Canonicalization</h4>
                <div className="space-y-4">
                    {canonicalData.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl">
                            <span className="text-sm text-gray-300">{item.name}</span>
                            <span className="text-sm font-bold text-white">{item.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const AuditContent = ({ showHelp }: any) => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-xl font-bold font-heading text-white">Content Audit</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-6">
                <h4 className="text-lg font-bold text-white mb-4">Word Count Distribution</h4>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={wordCountData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                            <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-6">
                <h4 className="text-lg font-bold text-white mb-4">Content Freshness</h4>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={freshnessData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#222" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#888', fontSize: 11 }} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                            <Bar dataKey="count" fill="#EC4899" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
);

const AuditTechnical = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-xl font-bold font-heading text-white">Technical Specs</h3>
        <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-6">
            <h4 className="text-lg font-bold text-white mb-6">Security & Protocols</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                <TechnicalRow label="SSL Certificate" status="secure" msg="Valid (Expires in 200 days)" />
                <TechnicalRow label="HTTPS Only" status="good" />
                <TechnicalRow label="Mixed Content" status="good" msg="0 Issues" />
                <TechnicalRow label="HSTS Enabled" status="good" />
                <TechnicalRow label="TLS 1.2/1.3" status="good" />
                <TechnicalRow label="X-Frame-Options" status="good" msg="DENY" />
            </div>
        </div>
    </div>
);

const AuditLinks = ({ showHelp }: any) => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-xl font-bold font-heading text-white">Link Analysis</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-6">
                <h4 className="text-lg font-bold text-white mb-4">Internal Link Equity</h4>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <Treemap
                            data={linkEquityData}
                            dataKey="size"
                            aspectRatio={4 / 3}
                            stroke="#111"
                            fill="#333"
                        >
                            <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                        </Treemap>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-6">
                <h4 className="text-lg font-bold text-white mb-4">Link Opportunities</h4>
                <div className="space-y-4">
                    <LinkOpportunity source="/blog/seo-strategy" target="/features/analytics" anchor="analytics dashboard" impact="High" />
                    <LinkOpportunity source="/blog/content-marketing" target="/services/content" anchor="content services" impact="Medium" />
                </div>
            </div>
        </div>
    </div>
);

// --- Main View ---

export const SiteAuditView = ({ showHelp, openPanel }: { showHelp: (t: string, d: string) => void, openPanel: (t: string, d: any) => void }) => {
    const { activeProject } = useProject();
    const [subView, setSubView] = useState('overview'); // overview, issues, pages, indexation, content, technical, links
    const [isExportOpen, setIsExportOpen] = useState(false);

    const [isCrawling, setIsCrawling] = useState(false);
    const [auditData, setAuditData] = useState<any>(null);
    const [healthScore, setHealthScore] = useState(0);
    const [isSimulating, setIsSimulating] = useState(false);
    const [loadingAudit, setLoadingAudit] = useState(true);
    const [realIssues, setRealIssues] = useState<any[]>([]);
    const [realPages, setRealPages] = useState<any[]>([]);
    const [realPagesTotal, setRealPagesTotal] = useState(0);
    const [realPagesPage, setRealPagesPage] = useState(0);
    const [realHistory, setRealHistory] = useState<any[]>([]);
    const [realThematicScores, setRealThematicScores] = useState<any[]>([]);
    const [lastCrawlTimestamp, setLastCrawlTimestamp] = useState<string | null>(null);
    const hasRealData = auditData !== null && auditData?.crawl_session_id;

    // Load latest audit result from Supabase when project changes
    useEffect(() => {
        const loadLatestAudit = async () => {
            if (!activeProject) { setLoadingAudit(false); return; }
            setLoadingAudit(true);
            try {
                // 1. Fetch the latest completed audit result
                const latestAudit = await getLatestAuditResult(activeProject.id);
                if (latestAudit) {
                    setAuditData(latestAudit);
                    setHealthScore(latestAudit.score || 0);
                    setLastCrawlTimestamp(latestAudit.completed_at || latestAudit.created_at);

                    // 2. Fetch real issues if this is from the real crawler
                    if (latestAudit.crawl_session_id) {
                        const issues = await getAuditIssues(latestAudit.id);
                        if (issues.length > 0) {
                            setRealIssues(issues.map((i: any) => ({
                                id: i.id,
                                title: i.title,
                                desc: i.description,
                                category: i.category,
                                priority: i.priority,
                                type: i.issue_type,
                                count: i.affected_count,
                                preview: i.affected_urls?.slice(0, 5) || [],
                                effort: i.effort,
                                aiFix: i.ai_fix,
                                trend: i.trend,
                                scoreImpact: i.score_impact,
                                trafficImpact: i.traffic_impact
                            })));
                        }

                        // 3. Fetch thematic scores from audit data
                        if (latestAudit.thematic_scores && Array.isArray(latestAudit.thematic_scores)) {
                            setRealThematicScores(latestAudit.thematic_scores);
                        }

                        // 4. Fetch first page of audit pages
                        const { pages: firstPage, total } = await getAuditPages(latestAudit.id, 0, 10);
                        setRealPages(firstPage.map((p: any) => ({
                            url: p.url,
                            status: p.status_code,
                            type: p.content_type || 'text/html',
                            depth: p.depth,
                            linksIn: p.links_in || p.inlinks || 0,
                            linksOut: p.links_out || p.outlinks || 0
                        })));
                        setRealPagesTotal(total);
                    }

                    // 5. Fetch audit history for trend charts
                    const history = await getAuditHistory(activeProject.id);
                    if (history.length > 0) {
                        setRealHistory(history.map((h: any) => ({
                            date: new Date(h.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            score: h.score,
                            errors: h.errors_count + h.warnings_count
                        })));
                    }
                }
            } catch (e) { /* No previous audit, that's fine */ }
            setLoadingAudit(false);
        };
        loadLatestAudit();
    }, [activeProject?.id]);

    const handleCrawl = () => {
        if (!activeProject || !activeProject.url) {
            alert("No valid project URL provided.");
            return;
        }
        // Navigate to the full crawler with the project URL and Project ID pre-filled
        window.location.href = `/project/${activeProject.id}/crawler?url=${encodeURIComponent(activeProject.url)}`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header with Export */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-extrabold text-white">Site Audit</h1>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        {activeProject ? (
                            <>
                                Targeting: <a href={activeProject.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{activeProject.url}</a>
                                {lastCrawlTimestamp && (
                                    <span className="text-gray-600 text-xs ml-2">
                                        • Last crawl: {new Date(lastCrawlTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </>
                        ) : 'Select a project to begin auditing.'}
                    </p>
                </div>
                <div className="flex gap-3 relative">
                    <button 
                        onClick={() => openCrawler(activeProject?.id, { view: 'main' })}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        <Zap size={14} />
                        Open in Crawler
                    </button>
                    <button
                        onClick={handleCrawl}
                        disabled={isCrawling || !activeProject}
                        className={`flex items-center gap-2 text-white font-bold px-4 py-2.5 rounded-xl shadow-glow-sm transition-colors ${isCrawling ? 'bg-gray-600 cursor-not-allowed' : 'bg-brand-red hover:bg-brand-redHover'
                            }`}
                    >
                        {isCrawling ? <><Loader2 size={16} className="animate-spin" /> Crawling...</> : <><RefreshCw size={16} /> Re-Crawl</>}
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setIsExportOpen(!isExportOpen)}
                            className="flex items-center gap-2 bg-white/5 border border-white/10 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors"
                        >
                            <Download size={16} /> Export <ChevronDown size={14} />
                        </button>
                        {isExportOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-[#111] border border-white/10 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <button className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-3">
                                    <FileBarChart size={16} className="text-red-500" /> PDF Report
                                </button>
                                <button className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-3">
                                    <FileSpreadsheet size={16} className="text-green-500" /> Export CSV
                                </button>
                                <button className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-3">
                                    <FileJson size={16} className="text-blue-500" /> Export JSON
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 1. Health Command Center */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[420px] h-auto">
                <SmartScoreCard score={healthScore} isSimulating={isSimulating} toggleSimulation={() => setIsSimulating(!isSimulating)} />

                {/* Thematic Score Radar */}
                <div className="lg:col-span-1 bg-[#0F0F0F] rounded-3xl border border-white/5 p-0 overflow-hidden flex flex-col h-full relative group">
                    {/* Header / Title Area */}
                    <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] shrink-0">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide">Analysis Breakdown</h3>
                                    <p className="text-[10px] text-gray-500 mt-0.5">Holistic view of 6 key vectors</p>
                                </div>
                                <button onClick={() => showHelp("Analysis Breakdown", "This chart shows your performance across 6 key areas compared to the industry average.")} className="text-gray-600 hover:text-white"><HelpCircle size={14} /></button>
                            </div>
                            <button className="text-[10px] font-bold bg-white/5 hover:bg-white/10 text-gray-400 px-2 py-1 rounded transition-colors">
                                Compare
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col relative px-5 py-4 min-h-0">
                        {/* Radar Chart Container - Centered and Styled */}
                        <div className="flex-1 w-full relative mb-2 min-h-[140px]">
                            {/* Recharts Radar */}
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={realThematicScores.length > 0 ? realThematicScores : mockThematicScores}>
                                    <PolarGrid stroke="#222" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10, fontWeight: 600 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="Score" dataKey="score" stroke="#22C55E" strokeWidth={2} fill="#22C55E" fillOpacity={0.2} />
                                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                            {/* Absolute badge for average */}
                            <div className="absolute top-0 right-0 bg-[#111] border border-white/10 p-2 rounded-lg shadow-xl hidden sm:block">
                                <div className="text-[10px] text-gray-500 uppercase font-bold">Industry Avg</div>
                                <div className="text-xs font-bold text-gray-300">68/100</div>
                            </div>
                        </div>

                        {/* Insight / Text Block */}
                        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5 mb-3 shrink-0">
                            <div className="flex items-start gap-2">
                                <Sparkles size={14} className="text-brand-purple mt-0.5 shrink-0" />
                                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                                    <span className="text-gray-200 font-bold">Imbalanced Profile:</span> Excellent technical foundation (Security, Crawling) but <span className="text-red-400 font-bold">Speed</span> performance is dragging down your overall mobile rankings.
                                </p>
                            </div>
                        </div>

                        {/* Dense Metrics Row */}
                        <div className="grid grid-cols-2 gap-2 shrink-0">
                            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex flex-col justify-center">
                                <span className="text-[9px] text-red-400 uppercase font-bold mb-1">Lowest Vector</span>
                                <div className="flex justify-between items-end">
                                    <span className="text-xs text-white font-bold">Speed</span>
                                    <span className="text-xs text-red-500 font-bold">75</span>
                                </div>
                            </div>
                            <div className="p-2 bg-brand-green/10 border border-brand-green/20 rounded-lg flex flex-col justify-center">
                                <span className="text-[9px] text-brand-green uppercase font-bold mb-1">Highest Vector</span>
                                <div className="flex justify-between items-end">
                                    <span className="text-xs text-white font-bold">Security</span>
                                    <span className="text-xs text-brand-green font-bold">100</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Crawl Status & Priorities */}
                <div className="lg:col-span-1 flex flex-col gap-6 h-full">
                    <CrawlStatusWidget />

                    <div className="flex-1 bg-[#0F0F0F] rounded-3xl border border-white/5 p-5 flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-white text-sm">Top Priorities</h3>
                            <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded font-bold border border-red-500/20 uppercase">Action Req</span>
                        </div>
                        <div className="space-y-2 flex-1 overflow-y-auto scrollbar-hide pr-1">
                            {(hasRealData && realIssues.length > 0
                                ? realIssues.filter(c => c.type === 'error' || c.priority === 'Critical' || c.priority === 'High').slice(0, 3)
                                : allAuditChecks.filter(c => c.type === 'error').slice(0, 3)
                            ).map((issue, idx) => (
                                <div key={issue.id || idx} onClick={() => openPanel('audit_issue_detail', issue)} className="p-3 bg-white/[0.03] rounded-xl border border-white/5 flex gap-3 items-start group hover:border-red-500/30 transition-colors cursor-pointer hover:bg-white/[0.05]">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold text-gray-200 group-hover:text-white leading-tight truncate">{issue.title}</h4>
                                        <p className="text-[10px] text-gray-500 mt-0.5">{issue.count || issue.affected_count || 0} pages • {issue.priority || 'High'} Impact</p>
                                    </div>
                                    <ArrowRight size={12} className="text-gray-600 group-hover:text-white mt-1" />
                                </div>
                            ))}
                            {hasRealData && realIssues.length === 0 && (
                                <div className="p-4 text-center text-gray-500 text-xs">
                                    <CheckCircle2 size={20} className="mx-auto mb-2 text-green-500" />
                                    <p className="font-bold text-gray-400">No critical issues found</p>
                                    <p className="mt-1">Your site is in good shape.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Modern Navigation Tabs */}
            <div className="flex overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex items-center p-1 bg-white/[0.03] rounded-xl border border-white/10">
                    {auditCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSubView(cat.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap ${subView === cat.id
                                ? 'text-black bg-white shadow-lg scale-100'
                                : 'text-gray-500 hover:text-gray-200 hover:bg-white/5 scale-95 hover:scale-100'
                                }`}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. Sub-View Content Area */}
            <div className="min-h-[600px]">
                {subView === 'overview' && <AuditOverview showHelp={showHelp} />}
                {subView === 'issues' && (
                    <AuditAllIssues 
                        openPanel={openPanel} 
                        auditChecks={hasRealData && realIssues.length > 0 ? realIssues : (auditData?.issues || allAuditChecks)} 
                        healthScore={healthScore}
                    />
                )}
                {subView === 'logs' && <AuditLogAnalysis showHelp={showHelp} />}
                {subView === 'architecture' && <AuditArchitecture showHelp={showHelp} />}
                {subView === 'performance' && <AuditPerformance showHelp={showHelp} />}
                {subView === 'ai_readiness' && <AuditAIReadiness showHelp={showHelp} />}
                {subView === 'pages' && <AuditCrawledPages openPanel={openPanel} />}
                {subView === 'indexation' && <AuditIndexation showHelp={showHelp} />}
                {subView === 'content' && <AuditContent showHelp={showHelp} />}
                {subView === 'technical' && <AuditTechnical />}
                {subView === 'links' && <AuditLinks showHelp={showHelp} />}
            </div>
        </div>
    );
};
