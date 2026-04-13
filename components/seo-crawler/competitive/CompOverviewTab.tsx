import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { COMPARISON_ROWS, type CompetitorProfile } from '../../../services/CompetitorMatrixConfig';
import WinLoseBar from './shared/WinLoseBar';
import RadarComparisonChart from './shared/RadarComparisonChart';
import EmptyState from './shared/EmptyState';
import {
  CARD,
  CARD_HIGHLIGHT,
  DIVIDER,
  KEY_NUMBER,
  SECTION_HEADER_WITH_MARGIN,
  SIDEBAR_SCROLL,
} from './shared/styles';
import { useCompetitiveMetrics } from './hooks/useCompetitiveMetrics';

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function computeWinLossTie(own: CompetitorProfile | null, comp: CompetitorProfile) {
  if (!own) return { wins: 0, losses: 0, ties: 0 };

  let wins = 0;
  let losses = 0;
  let ties = 0;

  const numericRows = COMPARISON_ROWS.filter((row) => ['number', 'score_100'].includes(row.format));
  for (const row of numericRows) {
    const ownVal = getNestedValue(own, String(row.profileKey));
    const compVal = getNestedValue(comp, String(row.profileKey));
    if (ownVal == null || compVal == null) continue;

    const ov = Number(ownVal);
    const cv = Number(compVal);
    if (Number.isNaN(ov) || Number.isNaN(cv)) continue;

    const isInverse = String(row.profileKey).toLowerCase().includes('threat');
    if (isInverse) {
      if (cv > ov + 5) wins += 1;
      else if (ov > cv + 5) losses += 1;
      else ties += 1;
    } else {
      if (ov > cv + 5) wins += 1;
      else if (cv > ov + 5) losses += 1;
      else ties += 1;
    }
  }

  return { wins, losses, ties };
}

const RADAR_DIMS = [
  { label: 'Search Visibility', profileKey: 'estimatedOrganicTraffic', max: 50000 },
  { label: 'Content Depth', profileKey: 'totalIndexablePages', max: 2000 },
  { label: 'Tech Health', profileKey: 'techHealthScore', max: 100 },
  { label: 'Authority', profileKey: 'referringDomains', max: 5000 },
  { label: 'UX & Conversion', profileKey: 'trustSignalScore', max: 100 },
  { label: 'Social Presence', profileKey: 'socialTotalFollowers', max: 100000 },
  { label: 'AI Readiness', profileKey: 'avgGeoScore', max: 100 },
  { label: 'Content Freshness', profileKey: 'contentFreshnessScore', max: 100 },
] as const;

function profileToRadarScore(profile: CompetitorProfile | null, profileKey: string, max: number): number {
  if (!profile) return 0;
  const raw = Number(getNestedValue(profile, profileKey) || 0);
  return Math.min(100, Math.round((raw / max) * 100));
}

export default function CompOverviewTab() {
  const { ownProfile, activeComps, advantages, vulnerabilities } = useCompetitiveMetrics();

  const winLossData = useMemo(
    () => activeComps.map((comp) => ({ domain: comp.domain, ...computeWinLossTie(ownProfile, comp) })),
    [ownProfile, activeComps]
  );

  const radarData = useMemo(() => {
    const compAvgProfile: Record<string, number> = {};
    for (const dim of RADAR_DIMS) {
      const vals = activeComps
        .map((c) => Number(getNestedValue(c, dim.profileKey) || 0))
        .filter((v) => v > 0);
      compAvgProfile[dim.profileKey] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }

    return RADAR_DIMS.map((dim) => ({
      dimension: dim.label,
      'Your Site': profileToRadarScore(ownProfile, dim.profileKey, dim.max),
      'Competitor Avg': Math.min(100, Math.round((compAvgProfile[dim.profileKey] / dim.max) * 100)),
    }));
  }, [ownProfile, activeComps]);

  const radarDomains = useMemo(
    () => [
      { domain: 'Your Site', color: '#F5364E', isOwn: true },
      { domain: 'Competitor Avg', color: '#555' },
    ],
    []
  );

  const yourScore = ownProfile?.overallSeoScore ?? 0;
  const compAvgScore =
    activeComps.length > 0
      ? Math.round(activeComps.reduce((sum, c) => sum + Number(c.overallSeoScore || 0), 0) / activeComps.length)
      : 0;
  const scoreDelta = yourScore - compAvgScore;

  const quickPriority = useMemo(() => {
    if (vulnerabilities.length === 0) return null;
    const top = vulnerabilities[0];
    return `Focus on ${top.label} - you're at ${top.yours} vs competitor avg. Gap: ${top.delta}.`;
  }, [vulnerabilities]);

  if (!ownProfile && activeComps.length === 0) {
    return (
      <div className={SIDEBAR_SCROLL}>
        <EmptyState
          icon={<Users size={24} />}
          message="No competitive data yet. Add competitors and run a crawl."
        />
      </div>
    );
  }

  return (
    <div className={SIDEBAR_SCROLL}>
      <div className={CARD}>
        <div className={SECTION_HEADER_WITH_MARGIN}>Your Competitive Position</div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="mb-1 text-[10px] text-[#666]">Your Score</div>
            <div className={KEY_NUMBER}>{yourScore}</div>
          </div>
          <div className="text-right">
            <div className="mb-1 text-[10px] text-[#666]">Competitor Avg</div>
            <div className="font-mono text-[20px] font-black text-[#666]">{compAvgScore}</div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-[30px] text-[10px] text-[#F5364E]">You</span>
            <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-[#111]">
              <div className="h-full rounded-full bg-[#F5364E]" style={{ width: `${yourScore}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-[30px] text-[10px] text-[#555]">Avg</span>
            <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-[#111]">
              <div className="h-full rounded-full bg-[#444]" style={{ width: `${compAvgScore}%` }} />
            </div>
          </div>
        </div>

        {scoreDelta !== 0 && (
          <div className={`mt-2 text-[11px] ${scoreDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {scoreDelta > 0 ? 'Ahead' : 'Behind'} by {Math.abs(scoreDelta)} points
          </div>
        )}
      </div>

      <div className={CARD}>
        <div className={SECTION_HEADER_WITH_MARGIN}>Competitive Radar</div>
        <RadarComparisonChart data={radarData} domains={radarDomains} />
      </div>

      <div className={CARD}>
        <div className={SECTION_HEADER_WITH_MARGIN}>Head-to-Head</div>
        {winLossData.length > 0 ? (
          <div className="space-y-2">
            {winLossData.map((wl) => (
              <WinLoseBar key={wl.domain} {...wl} />
            ))}
          </div>
        ) : (
          <p className="py-2 text-center text-[11px] text-[#555]">No competitors to compare.</p>
        )}
      </div>

      {advantages.length > 0 && (
        <div className={CARD}>
          <div className={SECTION_HEADER_WITH_MARGIN}>Where You Win</div>
          <div className="space-y-2">
            {advantages.map((a, i) => (
              <div key={`${a.label}-${i}`} className="flex items-center justify-between">
                <span className="text-[11px] text-green-400">✓ {a.label}</span>
                <span className="font-mono text-[11px] font-bold text-green-400">{a.delta}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {vulnerabilities.length > 0 && (
        <div className={CARD}>
          <div className={SECTION_HEADER_WITH_MARGIN}>Where You Lose</div>
          <div className="space-y-2">
            {vulnerabilities.map((v, i) => (
              <div key={`${v.label}-${i}`} className="flex items-center justify-between">
                <span className="text-[11px] text-red-400">✗ {v.label}</span>
                <span className="font-mono text-[11px] font-bold text-red-400">{v.delta}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {quickPriority && (
        <div className={CARD_HIGHLIGHT}>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#F5364E]">#1 Priority</div>
          <p className="text-[12px] leading-relaxed text-[#ccc]">{quickPriority}</p>
        </div>
      )}

      <div className={DIVIDER} />
    </div>
  );
}
