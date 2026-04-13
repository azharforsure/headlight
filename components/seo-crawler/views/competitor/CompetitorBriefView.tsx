import { useState, useCallback } from 'react';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import { RefreshCw, Download, Loader2, Sparkles } from 'lucide-react';
import type { CompetitorProfile } from '../../../../services/CompetitorMatrixConfig';

// ─── AI Prompt for Competitive Brief ───
function buildBriefPrompt(own: CompetitorProfile, competitors: CompetitorProfile[]): string {
  const profileSummary = (p: CompetitorProfile) => `
Domain: ${p.domain}
SEO Score: ${p.overallSeoScore || 'N/A'}
Referring Domains: ${p.referringDomains || 'N/A'}
Pages Indexed: ${p.pagesIndexed || 'N/A'}
Blog Posts/Month: ${p.blogPostsPerMonth || 'N/A'}
Avg Words/Article: ${p.avgWordsPerArticle || 'N/A'}
Content Quality: ${p.contentQualityAssessment || 'N/A'}
CMS: ${p.cmsType || 'N/A'}
Tech Health: ${p.techHealthScore || 'N/A'}
Has Pricing Page: ${p.hasTargetedLandingPages ? 'Yes' : 'No'}
Social Profiles: FB:${p.facebookFans || 0}, TW:${p.twitterFollowers || 0}, YT:${p.youtubeSubscribers || 0}, IG:${p.instagramFollowers || 0}
Value Proposition: ${p.valueProposition || 'Unknown'}
On-Page SEO Quality: ${p.onPageSeoQuality || 'N/A'}
URL Rating: ${p.urlRating || 'N/A'}
GEO Score: ${(p as any).avgGeoScore || 'N/A'}`.trim();

  return `You are a senior competitive intelligence analyst for SEO and digital strategy.

Analyze the following competitive landscape and produce a strategic brief.

## OUR SITE
${profileSummary(own)}

## COMPETITORS
${competitors.map((c, i) => `### Competitor ${i + 1}\n${profileSummary(c)}`).join('\n\n')}

## OUTPUT FORMAT
Return a JSON object with this exact structure:
{
  "executiveSummary": "2-3 sentence strategic overview of competitive position",
  "competitorAnalyses": [
    {
      "domain": "competitor domain",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "strategy": "One sentence describing their apparent strategy",
      "threatLevel": "low" | "medium" | "high"
    }
  ],
  "topAdvantages": ["Our advantage 1", "Our advantage 2", "Our advantage 3"],
  "topVulnerabilities": ["Our vulnerability 1", "Our vulnerability 2", "Our vulnerability 3"],
  "recommendedActions": [
    {
      "priority": "P0" | "P1" | "P2",
      "action": "What to do",
      "rationale": "Why",
      "estimatedEffort": "e.g. 2 weeks"
    }
  ],
  "overallThreatLevel": "low" | "moderate" | "high" | "critical",
  "competitivePosition": "1st" | "2nd" | "3rd" | "4th" | "5th+"
}`;
}

interface BriefData {
  executiveSummary: string;
  competitorAnalyses: Array<{
    domain: string;
    strengths: string[];
    weaknesses: string[];
    strategy: string;
    threatLevel: string;
  }>;
  topAdvantages: string[];
  topVulnerabilities: string[];
  recommendedActions: Array<{
    priority: string;
    action: string;
    rationale: string;
    estimatedEffort: string;
  }>;
  overallThreatLevel: string;
  competitivePosition: string;
}

export default function CompetitorBriefView() {
  const { ownProfile, competitorProfiles } = useSeoCrawler();
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateBrief = useCallback(async () => {
    if (!ownProfile || competitorProfiles.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      // Get AI engine from the servicedirectly
      const { AIRouter } = await import('../../../../services/ai/AIRouter');
      const router = new AIRouter();
      const prompt = buildBriefPrompt(ownProfile, competitorProfiles);
      const response = await router.complete({
        taskType: 'generate',
        prompt,
        systemPrompt: 'You are a competitive intelligence analyst. Return JSON only.',
        maxTokens: 1500,
        temperature: 0.3,
        format: 'json',
      });

      const data = JSON.parse(response.text);
      setBrief(data);
    } catch (err: any) {
      console.error('Failed to generate brief:', err);
      setError(err.message || 'Failed to generate brief');
    } finally {
      setLoading(false);
    }
  }, [ownProfile, competitorProfiles]);

  const PRIORITY_STYLES: Record<string, string> = {
    P0: 'bg-red-500/10 text-red-400 border-red-500/20',
    P1: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    P2: 'bg-green-500/10 text-green-400 border-green-500/20',
  };

  const THREAT_STYLES: Record<string, string> = {
    low: 'bg-green-500/10 text-green-400',
    moderate: 'bg-yellow-500/10 text-yellow-400',
    medium: 'bg-yellow-500/10 text-yellow-400',
    high: 'bg-red-500/10 text-red-400',
    critical: 'bg-red-500/20 text-red-300',
  };

  if (!brief && !loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center max-w-md">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#F5364E]/10 flex items-center justify-center mb-4">
            <Sparkles size={24} className="text-[#F5364E]" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">AI Competitive Brief</h2>
          <p className="text-[12px] text-[#888] mb-5">
            Generate an AI-powered strategic analysis of your competitive landscape. Includes strengths, weaknesses, threats, and recommended actions.
          </p>
          {error && <p className="text-[12px] text-red-400 mb-3">{error}</p>}
          <button
            onClick={generateBrief}
            disabled={!ownProfile || competitorProfiles.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#ff5b70] to-[#d62839] text-[13px] font-bold text-white shadow-[0_12px_30px_rgba(245,54,78,0.22)] hover:-translate-y-[1px] transition-transform disabled:opacity-40"
          >
            <Sparkles size={14} /> Generate Brief
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <Loader2 size={32} className="text-[#F5364E] animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-[#888]">Analyzing competitive landscape...</p>
        </div>
      </div>
    );
  }

  if (!brief) return null;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-[#0a0a0a]">
      {/* Header + Regenerate */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[16px] font-bold text-white">AI Competitive Brief</h2>
          <p className="text-[11px] text-[#666]">Generated from crawl data across {competitorProfiles.length} competitor(s)</p>
        </div>
        <button
          onClick={generateBrief}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-[#888] hover:text-white hover:bg-[#1a1a1e] border border-[#222]"
        >
          <RefreshCw size={12} /> Regenerate
        </button>
      </div>

      {/* Executive Summary */}
      <div className="rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#666]">Executive Summary</h3>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${THREAT_STYLES[brief.overallThreatLevel] || 'bg-[#1a1a1e] text-[#888]'}`}>
              Threat: {brief.overallThreatLevel?.toUpperCase()}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#F5364E]/10 text-[#F5364E] border border-[#F5364E]/20">
              Position: {brief.competitivePosition}
            </span>
          </div>
        </div>
        <p className="text-[13px] text-[#ccc] leading-6">{brief.executiveSummary}</p>
      </div>

      {/* Advantages + Vulnerabilities (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border border-green-500/10 bg-[#0d0d0f] p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-green-400 mb-3">🟢 Your Advantages</h3>
          <ul className="space-y-2">
            {brief.topAdvantages.map((adv, i) => (
              <li key={i} className="text-[12px] text-[#ccc] pl-3 border-l-2 border-green-500/30">{adv}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-red-500/10 bg-[#0d0d0f] p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-red-400 mb-3">🔴 Your Vulnerabilities</h3>
          <ul className="space-y-2">
            {brief.topVulnerabilities.map((vuln, i) => (
              <li key={i} className="text-[12px] text-[#ccc] pl-3 border-l-2 border-red-500/30">{vuln}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Per-Competitor Analysis */}
      <div className="rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-4 mb-4">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#666] mb-3">Competitor Analysis</h3>
        <div className="space-y-4">
          {brief.competitorAnalyses.map(comp => (
            <div key={comp.domain} className="border border-[#1a1a1e] rounded-lg p-4 bg-[#0a0a0a]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-bold text-white">{comp.domain}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${THREAT_STYLES[comp.threatLevel] || ''}`}>
                  {comp.threatLevel?.toUpperCase()} THREAT
                </span>
              </div>
              <p className="text-[11px] text-[#999] mb-3 italic">"{comp.strategy}"</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-green-400">Strengths</span>
                  <ul className="mt-1 space-y-1">
                    {comp.strengths.map((s, i) => (
                      <li key={i} className="text-[11px] text-[#aaa]">• {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-red-400">Weaknesses</span>
                  <ul className="mt-1 space-y-1">
                    {comp.weaknesses.map((w, i) => (
                      <li key={i} className="text-[11px] text-[#aaa]">• {w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-4">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#666] mb-3">Recommended Actions</h3>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[#1a1a1e]">
              <th className="text-left px-3 py-2 text-[10px] font-bold uppercase text-[#666] w-[60px]">Priority</th>
              <th className="text-left px-3 py-2 text-[10px] font-bold uppercase text-[#666]">Action</th>
              <th className="text-left px-3 py-2 text-[10px] font-bold uppercase text-[#666]">Rationale</th>
              <th className="text-left px-3 py-2 text-[10px] font-bold uppercase text-[#666] w-[80px]">Effort</th>
            </tr>
          </thead>
          <tbody>
            {brief.recommendedActions.map((action, i) => (
              <tr key={i} className="border-b border-[#111]">
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${PRIORITY_STYLES[action.priority] || 'bg-[#1a1a1e] text-[#888]'}`}>
                    {action.priority}
                  </span>
                </td>
                <td className="px-3 py-2 text-white font-medium">{action.action}</td>
                <td className="px-3 py-2 text-[#888]">{action.rationale}</td>
                <td className="px-3 py-2 text-[#666]">{action.estimatedEffort}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
