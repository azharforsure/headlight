import React, { useMemo, useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import { useOptionalProject } from '../../../services/ProjectContext';
import type { CompetitorProfile } from '../../../services/CompetitorMatrixConfig';
import { getCompetitorAlerts, getRankShiftAlerts } from '../../../services/CrawlerBridgeService';
import ThreatMeter from './shared/ThreatMeter';

export default function CompThreatsTab() {
    const { competitiveState } = useSeoCrawler();
    const projectContext = useOptionalProject();
    const activeProject = projectContext?.activeProject || null;
    const { ownProfile, competitorProfiles, activeCompetitorDomains } = competitiveState;
    const [compAlerts, setCompAlerts] = useState<any[]>([]);
    const [rankAlerts, setRankAlerts] = useState<any[]>([]);

    const activeComps = useMemo(
        () => activeCompetitorDomains.map((d) => competitorProfiles.get(d)).filter(Boolean) as CompetitorProfile[],
        [activeCompetitorDomains, competitorProfiles]
    );

    useEffect(() => {
        if (!activeProject?.id) return;
        getCompetitorAlerts(activeProject.id).then(setCompAlerts).catch(() => setCompAlerts([]));
        getRankShiftAlerts(activeProject.id).then(setRankAlerts).catch(() => setRankAlerts([]));
    }, [activeProject?.id]);

    const heatmapData = useMemo(
        () =>
            activeComps.map((comp) => ({
                domain: comp.domain,
                content: comp.contentThreatScore || 0,
                authority: comp.authorityThreatScore || 0,
                innovation: comp.innovationThreatScore || 0,
                overall: comp.threatLevel || 'Low',
            })),
        [activeComps]
    );

    const threatColor = (score: number) => {
        if (score >= 70) return 'bg-red-500/30 text-red-400';
        if (score >= 50) return 'bg-orange-500/20 text-orange-400';
        if (score >= 30) return 'bg-yellow-500/15 text-yellow-400';
        return 'bg-green-500/10 text-green-400';
    };

    if (activeComps.length === 0) {
        return <div className="p-4 text-center text-[12px] text-[#555]">No competitors added. Add competitors to see threat analysis.</div>;
    }

    return (
        <div className="custom-scrollbar h-full space-y-4 overflow-y-auto p-3">
            <div className="rounded-xl border border-[#222] bg-[#0d0d0f] p-3">
                {activeComps.map((comp) => (
                    <div key={comp.domain} className="mb-3 last:mb-0">
                        <ThreatMeter level={(comp.threatLevel as 'Critical' | 'High' | 'Moderate' | 'Low') || 'Low'} label={comp.domain} />
                    </div>
                ))}
            </div>

            <div className="rounded-xl border border-[#222] bg-[#0d0d0f] p-3">
                <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#666]">Threat Heatmap</div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="pb-2 pr-2 text-left text-[9px] text-[#555]">Competitor</th>
                                <th className="px-1 pb-2 text-center text-[9px] text-[#555]">Content</th>
                                <th className="px-1 pb-2 text-center text-[9px] text-[#555]">Authority</th>
                                <th className="px-1 pb-2 text-center text-[9px] text-[#555]">Innovation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {heatmapData.map((row) => (
                                <tr key={row.domain}>
                                    <td className="max-w-[100px] truncate py-1 pr-2 text-[10px] text-[#aaa]">{row.domain}</td>
                                    {(['content', 'authority', 'innovation'] as const).map((dim) => (
                                        <td key={dim} className="px-1 py-1">
                                            <div className={`rounded py-1 text-center text-[10px] font-bold ${threatColor(row[dim])}`}>
                                                {row[dim]}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-2 flex justify-center gap-3">
                    {[
                        { label: 'Low', color: 'bg-green-500' },
                        { label: 'Moderate', color: 'bg-yellow-500' },
                        { label: 'High', color: 'bg-orange-500' },
                        { label: 'Critical', color: 'bg-red-500' },
                    ].map((l) => (
                        <div key={l.label} className="flex items-center gap-1">
                            <div className={`h-2 w-2 rounded-full ${l.color}`} />
                            <span className="text-[8px] text-[#555]">{l.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {activeComps.map((comp) => (
                <div key={comp.domain} className="rounded-xl border border-[#222] bg-[#0d0d0f] p-3">
                    <div className="mb-2 flex items-center gap-2">
                        <AlertTriangle size={12} className="text-[#F5364E]" />
                        <span className="text-[11px] font-bold text-white">{comp.domain}</span>
                        <span
                            className={`ml-auto rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                                comp.threatLevel === 'Critical'
                                    ? 'bg-red-400/10 text-red-400'
                                    : comp.threatLevel === 'High'
                                    ? 'bg-orange-400/10 text-orange-400'
                                    : comp.threatLevel === 'Moderate'
                                    ? 'bg-yellow-400/10 text-yellow-400'
                                    : 'bg-green-400/10 text-green-400'
                            }`}
                        >
                            {comp.threatLevel || 'Low'}
                        </span>
                    </div>
                    <div className="space-y-1.5">
                        {[
                            { label: 'Content Velocity', theirs: comp.blogPostsPerMonth, yours: ownProfile?.blogPostsPerMonth, unit: '/mo' },
                            { label: 'Referring Domains', theirs: comp.referringDomains, yours: ownProfile?.referringDomains, unit: '' },
                            { label: 'Indexable Pages', theirs: comp.totalIndexablePages, yours: ownProfile?.totalIndexablePages, unit: '' },
                        ].map((metric) => {
                            const diff = Number(metric.theirs || 0) - Number(metric.yours || 0);
                            return (
                                <div key={metric.label} className="flex items-center text-[10px]">
                                    <span className="flex-1 text-[#666]">{metric.label}</span>
                                    <span className="mr-2 font-mono text-[#888]">{metric.yours ?? '—'}</span>
                                    <span className="text-[#333]">→</span>
                                    <span className={`ml-2 font-mono ${diff > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        {metric.theirs ?? '—'}
                                        {metric.unit}
                                    </span>
                                    {diff !== 0 && (
                                        <span className={`ml-1 ${diff > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                            {diff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {(comp.opportunityAgainstThem || 0) > 30 && (
                        <div className="mt-2 rounded bg-green-400/5 px-2 py-1 text-[10px] text-green-400">
                            Opportunity score: {comp.opportunityAgainstThem}/100
                        </div>
                    )}
                </div>
            ))}

            <div className="rounded-xl border border-[#222] bg-[#0d0d0f] p-3">
                <div className="mb-3 flex items-center gap-2">
                    <ShieldAlert size={12} className="text-orange-400" />
                    <span className="text-[11px] font-bold text-white">Competitive Intelligence</span>
                </div>
                <div className="space-y-2">
                    {compAlerts.length === 0 ? (
                        <div className="rounded border border-dashed border-[#222] py-6 text-center text-[11px] text-[#444]">
                            No recent competitor moves detected.
                        </div>
                    ) : (
                        compAlerts.slice(0, 5).map((alert) => (
                            <div key={alert.id} className="rounded border border-[#1a1a1e] bg-[#0a0a0a] p-2.5">
                                <div className="mb-1 flex items-start justify-between gap-2">
                                    <span className="text-[11px] font-bold text-white">{alert.competitor}</span>
                                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                                        alert.priority === 'Critical' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                                    }`}>
                                        {alert.priority}
                                    </span>
                                </div>
                                <p className="text-[11px] text-[#888]">{alert.description}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="rounded-xl border border-[#222] bg-[#0d0d0f] p-3">
                <div className="mb-3 flex items-center gap-2">
                    <Zap size={12} className="text-blue-400" />
                    <span className="text-[11px] font-bold text-white">Rank Guard Alerts</span>
                </div>
                <div className="space-y-2">
                    {rankAlerts.length === 0 ? (
                        <div className="rounded border border-dashed border-[#222] py-6 text-center text-[11px] text-[#444]">
                            Rankings are currently stable.
                        </div>
                    ) : (
                        rankAlerts.slice(0, 5).map((alert) => (
                            <div key={alert.id} className="rounded border border-[#1a1a1e] bg-[#0a0a0a] p-2.5">
                                <div className="mb-1 flex items-center gap-1.5">
                                    <Zap size={10} className="text-blue-400" />
                                    <span className="text-[11px] font-bold text-white">{alert.title}</span>
                                </div>
                                <p className="text-[11px] text-[#888]">{alert.description}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
