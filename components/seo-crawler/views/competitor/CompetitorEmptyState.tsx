import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import { Crosshair, Plus, Sparkles } from 'lucide-react';

export default function CompetitorEmptyState() {
  const { setShowAddCompetitorInput, analysisPages } = useSeoCrawler();
  const hasCrawlData = (analysisPages?.length || 0) > 0;

  return (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center max-w-lg">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#F5364E]/10 flex items-center justify-center mb-5">
          <Crosshair size={28} className="text-[#F5364E]" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Competitive Analysis</h2>
        <p className="text-[13px] text-[#888] leading-6 mb-6">
          {hasCrawlData
            ? 'Add competitor domains to start comparing. Headlight will micro-crawl each one and build a full competitive profile with AI analysis.'
            : 'Run a crawl first, then add competitors to compare against your site.'}
        </p>
        {hasCrawlData && (
          <div className="flex flex-col gap-3 items-center">
            <button
              onClick={() => setShowAddCompetitorInput(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#ff5b70] to-[#d62839] text-[13px] font-bold text-white shadow-[0_12px_30px_rgba(245,54,78,0.22)] hover:-translate-y-[1px] transition-transform"
            >
              <Plus size={14} /> Add Competitor
            </button>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] text-[#888] hover:text-white hover:bg-[#1a1a1e] border border-[#222] transition-all"
            >
              <Sparkles size={12} /> Auto-Discover Competitors
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
