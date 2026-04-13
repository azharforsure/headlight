import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import CompetitorToolbar from './CompetitorToolbar';
import CompetitorMatrixGrid from './CompetitorMatrixGrid';
import CompetitorChartsView from './CompetitorChartsView';
import CompetitorBattlefieldView from './CompetitorBattlefieldView';
import CompetitorTimelineView from './CompetitorTimelineView';
import CompetitorBriefView from './CompetitorBriefView';
import CompetitorEmptyState from './CompetitorEmptyState';

export default function CompetitorModeRouter() {
  const { competitiveViewMode, competitorProfiles, ownProfile } = useSeoCrawler();

  // If no profiles at all, show empty state
  if (!ownProfile && competitorProfiles.length === 0) {
    return <CompetitorEmptyState />;
  }

  const renderView = () => {
    switch (competitiveViewMode) {
      case 'matrix':      return <CompetitorMatrixGrid />;
      case 'charts':      return <CompetitorChartsView />;
      case 'battlefield': return <CompetitorBattlefieldView />;
      case 'timeline':    return <CompetitorTimelineView />;
      case 'brief':       return <CompetitorBriefView />;
      default:            return <CompetitorMatrixGrid />;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden">
      <CompetitorToolbar />
      <div className="flex-1 overflow-hidden">
        {renderView()}
      </div>
    </div>
  );
}
