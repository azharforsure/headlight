import React, { useMemo } from 'react';
import { 
    Activity, AlertCircle, CheckCircle2, 
    ArrowRight, TrendingUp, TrendingDown,
    Zap, Target, Shield, Layout, Settings, Radar
} from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import { useCrawlerUI } from '../../../contexts/CrawlerUIContext';
import ContentQualityRadar from '../charts/ContentQualityRadar';

export default function IssueDashboardView() {
    const { issueDashboardData, stats, healthScore } = useSeoCrawler();
    const { setFocusedIssueCategory } = useCrawlerUI();

    if (!issueDashboardData) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[var(--bg-main)]">
                <div className="text-center p-8 max-w-md">
                    <Activity className="w-12 h-12 text-[#333] mx-auto mb-4 animate-pulse" />
                    <h3 className="text-[16px] font-semibold text-white mb-2">Calculating Dashboard Metrics...</h3>
                    <p className="text-[12px] text-[#888]">
                        We're analyzing your crawl data to generate category scores and identify critical health issues.
                    </p>
                </div>
            </div>
        );
    }

    const { categoryScores, totalCritical, totalWarning, totalNotice, issueGroups, overallScore } = issueDashboardData;
    const totalIssues = issueGroups.length;
    const criticalIssues = totalCritical;

    return (
        <div className="flex-1 overflow-y-auto bg-[var(--bg-main)] custom-scrollbar">
            <div className="max-w-[1400px] mx-auto p-8 space-y-8">
                
                {/* --- Hero Section: Site Health --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-[#111] border border-[#222] rounded-2xl p-8 relative overflow-hidden group">
                        <div className="relative z-10">
                            <h1 className="text-[11px] uppercase tracking-[0.2em] text-[#666] font-bold mb-4">Site Health Overview</h1>
                            <div className="flex items-baseline gap-4 mb-2">
                                <span className={`text-[72px] font-bold tracking-tighter ${
                                    overallScore >= 90 ? 'text-green-500' : 
                                    overallScore >= 70 ? 'text-blue-400' : 'text-orange-500'
                                }`}>
                                    {Math.round(overallScore)}
                                </span>
                                <span className="text-[24px] text-[#444] font-medium">/ 100</span>
                            </div>
                            <p className="text-[14px] text-[#999] max-w-md leading-relaxed">
                                {overallScore >= 90 
                                    ? "Excellent! Your site follows most SEO best practices. Focus on minor optimizations to maintain this lead."
                                    : overallScore >= 70
                                    ? "Good health, but there are several category-level issues that could impact your rankings."
                                    : "Critical issues detected. Significant architectural or technical blockers are affecting your visibility."}
                            </p>
                        </div>
                        
                        {/* Subtle background glow */}
                        <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[120px] opacity-20 rounded-full ${
                            overallScore >= 90 ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                    </div>

                    <div className="bg-[#111] border border-[#222] rounded-2xl p-8 flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-[11px] uppercase tracking-widest text-[#666] mb-1">Total Issues</h3>
                                <div className="text-[32px] font-bold text-white">{totalIssues}</div>
                            </div>
                            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                                <AlertCircle className="text-orange-500" size={24} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-[12px]">
                                <span className="text-[#888]">Critical Blockers</span>
                                <span className="text-red-500 font-bold">{criticalIssues}</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-red-500" 
                                    style={{ width: `${Math.min(100, (criticalIssues / totalIssues) * 100)}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-[#555] leading-snug italic">
                                Critical issues have direct impact on crawlability or indexing.
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- Category Grid --- */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[14px] font-bold text-white uppercase tracking-wider">Thematic Performance</h2>
                        <div className="flex items-center gap-2 text-[11px] text-[#666]">
                            <TrendingUp size={12} className="text-green-500" />
                            <span>Compared to previous crawl (simulated)</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {categoryScores.map((cat) => (
                            <button
                                key={cat.category}
                                onClick={() => setFocusedIssueCategory(cat.category)}
                                className="bg-[#111] border border-[#222] rounded-xl p-5 hover:border-[#333] hover:bg-[#151515] transition-all group text-left"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] flex items-center justify-center text-[#888] group-hover:text-blue-400 transition-colors text-[20px]">
                                        {cat.icon}
                                    </div>
                                    <div className={`px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold ${getGradeBg(cat.grade)}`}>
                                        {cat.grade}
                                    </div>
                                </div>

                                <h3 className="text-[13px] font-semibold text-white mb-1 capitalize">{cat.category.replace(/_/g, ' ')}</h3>
                                <div className="flex items-center gap-3">
                                    <div className="text-[20px] font-bold text-[#eee]">{cat.score}</div>
                                    <div className="flex-1 h-1 bg-[#222] rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${getScoreColor(cat.score)}`}
                                            style={{ width: `${cat.score}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between text-[11px]">
                                    <span className="text-[#666]">{cat.criticalCount + cat.warningCount + cat.noticeCount} Issues Found</span>
                                    <ArrowRight size={14} className="text-[#333] group-hover:text-white transition-colors translate-x-0 group-hover:translate-x-1" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- Bottom Row: Visualization --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[#111] border border-[#222] rounded-2xl p-8">
                        <h3 className="text-[14px] font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
                            <Radar className="text-blue-400" size={16} />
                            Site Quality Signature
                        </h3>
                        <div className="h-[300px] flex items-center justify-center">
                            <ContentQualityRadar 
                                data={categoryScores.map(c => ({
                                    subject: c.category.replace(/_/g, ' '),
                                    A: c.score,
                                    fullMark: 100
                                }))} 
                            />
                        </div>
                    </div>

                    <div className="bg-[#111] border border-[#222] rounded-2xl p-8 space-y-6">
                        <h3 className="text-[14px] font-bold text-white flex items-center gap-2 uppercase tracking-tight">
                            <Target className="text-orange-500" size={16} />
                            High Impact Action Items
                        </h3>
                        <div className="space-y-3">
                            {categoryScores
                                .filter(c => (c.criticalCount + c.warningCount) > 0)
                                .sort((a, b) => a.score - b.score)
                                .slice(0, 4)
                                .map((cat, idx) => (
                                    <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-[#222] bg-[#0c0c0c] hover:border-[#333] transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[11px] font-bold text-[#666] shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[12px] font-semibold text-white">Optimize {cat.category.replace(/_/g, ' ')} architecture</div>
                                            <p className="text-[11px] text-[#666] leading-relaxed">
                                                Based on {cat.criticalCount + cat.warningCount} detected issues, improving this area could yield a significant boost in {cat.category.replace(/_/g, ' ')} performance.
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                        <button className="w-full py-3 rounded-xl border border-dashed border-[#333] text-[11px] text-[#666] hover:text-[#999] hover:border-[#444] transition-all">
                            View all recommendations
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

function getScoreColor(score: number) {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-orange-600';
}

function getGradeBg(grade: string) {
    switch (grade) {
        case 'A+': case 'A': return 'bg-green-500/10 text-green-500';
        case 'B': return 'bg-blue-500/10 text-blue-400';
        case 'C': return 'bg-yellow-500/10 text-yellow-500';
        case 'D': return 'bg-orange-500/10 text-orange-500';
        case 'F': return 'bg-red-500/10 text-red-500';
        default: return 'bg-[#222] text-[#888]';
    }
}
