import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import CompetitorMatrixGrid from './CompetitorMatrixGrid';
import CompetitorChartsView from './CompetitorChartsView';
import KeywordLandscapeView from './KeywordLandscapeView';
import CompetitorEmptyState from './CompetitorEmptyState';
import AddCompetitorModal from './AddCompetitorModal';

export default function CompetitorModeRouter() {
  const { competitiveViewMode, competitiveState, pages, showAddCompetitorInput, setShowAddCompetitorInput } = useSeoCrawler();
  const { ownProfile, competitorProfiles } = competitiveState;

  if (!ownProfile && competitorProfiles.size === 0 && pages.length === 0) {
    return <CompetitorEmptyState />;
  }

  if (!ownProfile && pages.length > 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5364E] mx-auto mb-4" />
          <p className="text-[12px] text-[#888]">Building your competitive profile from crawl data...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (competitiveViewMode) {
      case 'matrix':
        return <CompetitorMatrixGrid />;
      case 'charts':
        return <CompetitorChartsView />;
      case 'landscape':
        return <KeywordLandscapeView />;
      default:
        return <CompetitorMatrixGrid />;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden">
      <div className="flex-1 overflow-hidden">{renderView()}</div>
      <AddCompetitorModal isOpen={showAddCompetitorInput} onClose={() => setShowAddCompetitorInput(false)} />
    </div>
  );
}
