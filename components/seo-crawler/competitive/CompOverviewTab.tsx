import React, { useMemo, useState } from 'react';
import { COMPARISON_ROWS, type CompetitorProfile } from '../../../services/CompetitorMatrixConfig';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import CompScoreCard from './shared/CompScoreCard';
import ThreatMeter from './shared/ThreatMeter';
import WinLoseBar from './shared/WinLoseBar';
import RadarComparisonChart from './shared/RadarComparisonChart';

function getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, key) => {
        if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
            return (acc as Record<string, unknown>)[key];
        }
        return undefined;
    }, obj);
}

function computeWinLossTie(
    own: CompetitorProfile | null,
    comp: CompetitorProfile
): { wins: number; losses: number; ties: number } {
    if (!own) return { wins: 0, losses: 0, ties: 0 };

    let wins = 0;
    let losses = 0;
    let ties = 0;

    const numericRows = COMPARISON_ROWS.filter((r) => ['number', 'score_100'].includes(r.format));
    for (const row of numericRows) {
        const ownVal = getNestedValue(own, String(row.profileKey));
        const compVal = getNestedValue(comp, String(row.profileKey));
        if (ownVal == null || compVal == null) continue;
        const ov = Number(ownVal);
        const cv = Number(compVal);
        if (Number.isNaN(ov) || Number.isNaN(cv)) continue;

        const isInverse = String(row.profileKey).toLowerCase().includes('threat');
        if (isInverse) {
            if (cv > ov + 5) wins++;
            else if (ov > cv + 5) losses++;
            else ties++;
        } else {
            if (ov > cv + 5) wins++;
            else if (cv > ov + 5) losses++;
            else ties++;
        }
    }
    return { wins, losses, ties };
}

const RADAR_DIMS = [
    { label: 'Search Visibility', profileKey: 'estimatedOrganicTraffic', max: 50000 },
    { label: 'Content Depth', profileKey: 'totalIndexablePages', max: 2000 },
    { label: 'Tech Health', profileKey: 'techHealthScore', max: 100 },
    { label: 'Authority', profileKey: 'referringDomains', max: 5000 },
    { label: 'Social', profileKey: 'facebookFans', max: 100000 },
    { label: 'AI Discoverability', profileKey: 'avgGeoScore', max: 100 },
] as const;

function profileToRadarScore(profile: CompetitorProfile | null, profileKey: string, max: number): number {
    if (!profile) return 0;
    const raw = Number(getNestedValue(profile, profileKey) || 0);
    return Math.min(100, Math.round((raw / max) * 100));
}

function qualityToScore(value: CompetitorProfile['contentQualityAssessment']): number {
    if (value === 'Excellent') return 100;
    if (value === 'Good') return 75;
    if (value === 'Average') return 50;
    if (value === 'Poor') return 25;
    return 0;
}

export default function CompOverviewTab() {
    const { competitiveState } = useSeoCrawler();
    const { ownProfile, competitorProfiles, activeCompetitorDomains } = competitiveState;
    const [selectedDomain, setSelectedDomain] = useState<string>('');

    const activeComps = useMemo(
        () => activeCompetitorDomains.map((d) => competitorProfiles.get(d)).filter(Boolean) as CompetitorProfile[],
        [activeCompetitorDomains, competitorProfiles]
    );

    const selectedComp = useMemo(() => {
        if (activeComps.length === 0) return null;
        return activeComps.find((comp) => comp.domain === selectedDomain) || activeComps[0];
    }, [activeComps, selectedDomain]);

    const overallThreat = useMemo<'Critical' | 'High' | 'Moderate' | 'Low'>(() => {
        const levels = activeComps.map((c) => c.threatLevel).filter(Boolean);
        if (levels.includes('Critical')) return 'Critical';
        if (levels.includes('High')) return 'High';
        if (levels.includes('Moderate')) return 'Moderate';
        return 'Low';
    }, [activeComps]);

    const winLossData = useMemo(
        () =>
            activeComps.map((comp) => ({
                domain: comp.domain,
                ...computeWinLossTie(ownProfile, comp),
            })),
        [ownProfile, activeComps]
    );

    const radarData = useMemo(
        () =>
            RADAR_DIMS.map((dim) => {
                const point: Record<string, string | number> = { dimension: dim.label };
                if (ownProfile) point['Your Site'] = profileToRadarScore(ownProfile, dim.profileKey, dim.max);
                activeComps.forEach((comp) => {
                    point[comp.domain] = profileToRadarScore(comp, dim.profileKey, dim.max);
                });
                return point;
            }),
        [ownProfile, activeComps]
    );

    const radarDomains = useMemo(() => {
        const domains: Array<{ domain: string; color: string; isOwn?: boolean }> = [];
        if (ownProfile) domains.push({ domain: 'Your Site', color: '#F5364E', isOwn: true });
        const colors = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ec4899'];
        activeComps.forEach((comp, i) => {
            domains.push({ domain: comp.domain, color: colors[i % colors.length] });
        });
        return domains;
    }, [ownProfile, activeComps]);

    const { advantages, vulnerabilities } = useMemo(() => {
        if (!ownProfile || activeComps.length === 0) return { advantages: [] as Array<{ label: string; delta: string }>, vulnerabilities: [] as Array<{ label: string; delta: string }> };

        const adv: Array<{ label: string; delta: string }> = [];
        const vul: Array<{ label: string; delta: string }> = [];

        const avgOf = (key: keyof CompetitorProfile) => {
            const vals = activeComps.map((c) => Number(c[key] || 0)).filter((v) => v > 0);
            return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        };

        const checkDim = (label: string, ownVal: number, avgComp: number, unit = '') => {
            const diff = ownVal - avgComp;
            if (diff > 0) adv.push({ label, delta: `+${Math.round(diff).toLocaleString()}${unit}` });
            else if (diff < 0) vul.push({ label, delta: `${Math.round(diff).toLocaleString()}${unit}` });
        };

        checkDim('Referring Domains', Number(ownProfile.referringDomains || 0), avgOf('referringDomains'));
        checkDim('Indexable Pages', Number(ownProfile.totalIndexablePages || 0), avgOf('totalIndexablePages'));
        const ownQuality = qualityToScore(ownProfile.contentQualityAssessment);
        const avgCompQuality =
            activeComps.reduce((sum, c) => sum + qualityToScore(c.contentQualityAssessment), 0) / activeComps.length;
        checkDim('Content Quality', ownQuality, avgCompQuality);
        checkDim('Tech Health', Number(ownProfile.techHealthScore || 0), avgOf('techHealthScore'), '%');
        checkDim('CWV Pass Rate', Number(ownProfile.cwvPassRate || 0), avgOf('cwvPassRate'), '%');
        checkDim('GEO Score', Number(ownProfile.avgGeoScore || 0), avgOf('avgGeoScore'));
        checkDim('Blog Posts/Mo', Number(ownProfile.blogPostsPerMonth || 0), avgOf('blogPostsPerMonth'));
        checkDim('Schema Coverage', Number(ownProfile.schemaCoveragePct || 0), avgOf('schemaCoveragePct'), '%');

        const parseDelta = (delta: string) => Number(delta.replace(/[^0-9.-]/g, ''));
        return {
            advantages: adv.sort((a, b) => parseDelta(b.delta) - parseDelta(a.delta)).slice(0, 3),
            vulnerabilities: vul.sort((a, b) => parseDelta(a.delta) - parseDelta(b.delta)).slice(0, 3),
        };
    }, [ownProfile, activeComps]);

    if (!ownProfile && activeComps.length === 0) {
        return (
            <div className="p-4 text-center text-[12px] text-[#555]">
                <p className="mb-2">No competitive data yet.</p>
                <p>Add competitors and run a crawl to see your competitive overview.</p>
            </div>
        );
    }

    return (
        <div className="custom-scrollbar h-full space-y-4 overflow-y-auto p-3">
            <div className="rounded-xl border border-[#222] bg-[#0d0d0f] p-3">
                <ThreatMeter level={overallThreat} label="Overall Competitive Threat" />
            </div>

            <div className="rounded-xl border border-[#222] bg-[#0d0d0f] p-3">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#666]">Competitive Radar</div>
                <RadarComparisonChart data={radarData} domains={radarDomains} />
            </div>

            <div className="rounded-xl border border-[#222] bg-[#0d0d0f] p-3">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#666]">Head-to-Head</div>
                {winLossData.length > 0 ? (
                    winLossData.map((wl) => <WinLoseBar key={wl.domain} {...wl} />)
                ) : (
                    <div className="py-2 text-center text-[11px] text-[#555]">No competitors to compare.</div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2">
                {ownProfile && <CompScoreCard domain={ownProfile.domain} score={ownProfile.overallSeoScore || null} isOwn />}
                {activeComps.map((comp) => (
                    <CompScoreCard
                        key={comp.domain}
                        domain={comp.domain}
                        score={comp.overallSeoScore || null}
                        threatLevel={comp.threatLevel}
                    />
                ))}
            </div>

            {advantages.length > 0 && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-green-400">Your Advantages</div>
                    {advantages.map((a, i) => (
                        <div key={`${a.label}-${i}`} className="flex justify-between py-1 text-[11px]">
                            <span className="text-[#ccc]">{a.label}</span>
                            <span className="font-mono font-bold text-green-400">{a.delta}</span>
                        </div>
                    ))}
                </div>
            )}

            {vulnerabilities.length > 0 && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-red-400">Vulnerabilities</div>
                    {vulnerabilities.map((v, i) => (
                        <div key={`${v.label}-${i}`} className="flex justify-between py-1 text-[11px]">
                            <span className="text-[#ccc]">{v.label}</span>
                            <span className="font-mono font-bold text-red-400">{v.delta}</span>
                        </div>
                    ))}
                </div>
            )}

            {ownProfile && selectedComp && (
                <div className="rounded-xl border border-[#222] bg-[#0d0d0f] p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#666]">Current Delta Snapshot</div>
                        <select
                            value={selectedComp.domain}
                            onChange={(e) => setSelectedDomain(e.target.value)}
                            className="h-[24px] rounded border border-[#222] bg-[#111] px-2 text-[10px] text-[#ccc] focus:outline-none"
                        >
                            {activeComps.map((comp) => (
                                <option key={comp.domain} value={comp.domain}>
                                    {comp.domain}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        {[
                            { label: 'Organic Traffic', own: ownProfile.estimatedOrganicTraffic, comp: selectedComp.estimatedOrganicTraffic },
                            { label: 'Referring Domains', own: ownProfile.referringDomains, comp: selectedComp.referringDomains },
                            { label: 'Indexable Pages', own: ownProfile.totalIndexablePages, comp: selectedComp.totalIndexablePages },
                            { label: 'Tech Health', own: ownProfile.techHealthScore, comp: selectedComp.techHealthScore },
                            { label: 'CWV Pass Rate', own: ownProfile.cwvPassRate, comp: selectedComp.cwvPassRate },
                        ].map((metric) => {
                            const ownVal = Number(metric.own || 0);
                            const compVal = Number(metric.comp || 0);
                            const delta = ownVal - compVal;
                            return (
                                <div key={metric.label} className="flex items-center justify-between text-[10px]">
                                    <span className="text-[#888]">{metric.label}</span>
                                    <div className="flex items-center gap-2 font-mono">
                                        <span className="text-white">{ownVal.toLocaleString()}</span>
                                        <span className="text-[#444]">vs</span>
                                        <span className="text-[#aaa]">{compVal.toLocaleString()}</span>
                                        <span className={delta >= 0 ? 'text-green-400' : 'text-red-400'}>
                                            {delta >= 0 ? '+' : ''}
                                            {delta.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
