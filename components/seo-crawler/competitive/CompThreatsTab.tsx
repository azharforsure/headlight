import React, { useMemo, useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, Zap } from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import { useOptionalProject } from '../../../services/ProjectContext';
import type { CompetitorProfile } from '../../../services/CompetitorMatrixConfig';
import { getCompetitorAlerts, getRankShiftAlerts } from '../../../services/CrawlerBridgeService';
import ThreatMeter from './shared/ThreatMeter';
import EmptyState from './shared/EmptyState';
import { CARD, SIDEBAR_SCROLL } from './shared/styles';

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
                content: comp.contentThreatScore ?? null,
                authority: comp.authorityThreatScore ?? null,
                speed: comp.siteSpeedScore != null ? Math.max(0, 100 - comp.siteSpeedScore) : null,
                innovation: comp.innovationThreatScore ?? null,
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
        return <EmptyState message="No competitors added." submessage="Add competitors to see threat analysis." />;
    }

    return (
        <div className={SIDEBAR_SCROLL}>
            <div className={CARD}>
                {activeComps.map((comp) => (
                    <div key={comp.domain} className="mb-3 last:mb-0">
                        <ThreatMeter level={(comp.threatLevel as 'Critical' | 'High' | 'Moderate' | 'Low') || 'Low'} label={comp.domain} />
                    </div>
                ))}
            </div>

            <div className={CARD}>
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#555]">Threat Heatmap</div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="pb-2 pr-2 text-left text-[9px] text-[#555]">Competitor</th>
                                <th className="px-1 pb-2 text-center text-[9px] text-[#555]">Content</th>
                                <th className="px-1 pb-2 text-center text-[9px] text-[#555]">Authority</th>
                                <th className="px-1 pb-2 text-center text-[9px] text-[#555]">Speed</th>
                                <th className="px-1 pb-2 text-center text-[9px] text-[#555]">Innovation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {heatmapData.map((row) => (
                                <tr key={row.domain}>
                                    <td className="max-w-[100px] truncate py-1 pr-2 text-[10px] text-[#aaa]">{row.domain}</td>
                                    {(['content', 'authority', 'speed', 'innovation'] as const).map((dim) => {
                                        const val = row[dim];
                                        return (
                                            <td key={dim} className="px-1 py-1">
                                                {val != null ? (
                                                    <div className={`rounded py-1 text-center text-[10px] font-bold ${threatColor(val)}`}>
                                                        {val}
                                                    </div>
                                                ) : (
                                                    <div className="rounded py-1 text-center text-[10px] text-[#333]">—</div>
                                                )}
                                            </td>
                                        );
                                    })}
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

            {activeComps.map((comp) => {
                const threats: Array<{ label: string; theirs: string; yours: string }> = [];
                const weaknesses: Array<{ label: string; theirs: string; yours: string }> = [];

                const compare = (label: string, theirVal: number | null, yourVal: number | null, unit = '') => {
                    if (theirVal == null || yourVal == null) return;
                    if (theirVal > yourVal * 1.1) {
                        threats.push({
                            label,
                            theirs: `${theirVal.toLocaleString()}${unit}`,
                            yours: `${yourVal.toLocaleString()}${unit}`,
                        });
                    } else if (yourVal > theirVal * 1.1) {
                        weaknesses.push({
                            label,
                            theirs: `${theirVal.toLocaleString()}${unit}`,
                            yours: `${yourVal.toLocaleString()}${unit}`,
                        });
                    }
                };

                compare('Content Velocity', comp.blogPostsPerMonth, ownProfile?.blogPostsPerMonth, '/mo');
                compare('Referring Domains', comp.referringDomains, ownProfile?.referringDomains);
                compare('Indexable Pages', comp.totalIndexablePages, ownProfile?.totalIndexablePages);
                compare('Tech Health', comp.techHealthScore, ownProfile?.techHealthScore, '/100');
                compare('GEO Score', comp.avgGeoScore, ownProfile?.avgGeoScore, '/100');
                compare('Schema Coverage', comp.schemaCoveragePct, ownProfile?.schemaCoveragePct, '%');
                compare('Link Velocity', comp.linkVelocity60d, ownProfile?.linkVelocity60d);

                return (
                    <div key={comp.domain} className={CARD}>
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={12} className="text-[#F5364E]" />
                                <span className="text-[12px] font-bold text-white">{comp.domain}</span>
                            </div>
                            <span
                                className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
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

                        {threats.length > 0 && (
                            <div className="mb-3">
                                <div className="mb-1.5 text-[10px] font-bold uppercase text-red-400/70">Why they're a threat</div>
                                {threats.slice(0, 4).map((t) => (
                                    <div key={t.label} className="flex items-center justify-between py-0.5 text-[10px]">
                                        <span className="text-[#888]">{t.label}</span>
                                        <span className="font-mono">
                                            <span className="text-red-400">{t.theirs}</span>
                                            <span className="mx-1 text-[#333]">vs</span>
                                            <span className="text-[#666]">{t.yours}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {weaknesses.length > 0 && (
                            <div>
                                <div className="mb-1.5 text-[10px] font-bold uppercase text-green-400/70">Where they're weak</div>
                                {weaknesses.slice(0, 3).map((w) => (
                                    <div key={w.label} className="flex items-center justify-between py-0.5 text-[10px]">
                                        <span className="text-[#888]">{w.label}</span>
                                        <span className="font-mono">
                                            <span className="text-green-400">{w.yours}</span>
                                            <span className="mx-1 text-[#333]">vs</span>
                                            <span className="text-[#666]">{w.theirs}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(comp.opportunityAgainstThem || 0) > 20 && (
                            <div className="mt-2 border-t border-[#1a1a1e] pt-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-[#666]">Opportunity</span>
                                    <span className="font-mono text-[11px] font-bold text-green-400">
                                        {comp.opportunityAgainstThem}/100
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            <div className={CARD}>
                <div className="mb-3 flex items-center gap-2">
                    <ShieldAlert size={12} className="text-orange-400" />
                    <span className="text-[11px] font-bold text-white">Competitive Intelligence</span>
                </div>
                <div className="space-y-2">
                    {compAlerts.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[#222] bg-[#0a0a0c] py-6 text-center text-[11px] text-[#444]">
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

            <div className={CARD}>
                <div className="mb-3 flex items-center gap-2">
                    <Zap size={12} className="text-blue-400" />
                    <span className="text-[11px] font-bold text-white">Rank Guard Alerts</span>
                </div>
                <div className="space-y-2">
                    {rankAlerts.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[#222] bg-[#0a0a0c] py-6 text-center text-[11px] text-[#444]">
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
