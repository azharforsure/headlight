import React, { memo } from 'react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import WqaGridView       from './views/WqaGridView';
import WqaOverviewView   from './views/WqaOverviewView';
import WqaActionsView    from './views/WqaActionsView';
import WqaStructureView  from './views/WqaStructureView';
import EmptyViewState    from './views/shared/EmptyViewState';
import WqaViewSwitcher   from './WqaViewSwitcher';

const MemoGrid      = memo(WqaGridView);
const MemoOverview  = memo(WqaOverviewView);
const MemoActions   = memo(WqaActionsView);
const MemoStructure = memo(WqaStructureView);

export default function WqaMainCanvas() {
    const { wqaState, setWqaState, pages } = useSeoCrawler() as any;
    const mode = wqaState?.viewMode || 'grid';

    if (!pages || pages.length === 0) {
        return (
            <EmptyViewState
                title="No crawl data yet"
                subtitle="Start a crawl from the header to populate this view."
            />
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <React.Suspense fallback={<div className="p-12 text-[#444] text-[12px] font-mono animate-pulse text-center">Loading view engine...</div>}>
                {(() => {
                    switch (mode) {
                        case 'overview':  return <MemoOverview />;
                        case 'actions':   return <MemoActions />;
                        case 'structure': return <MemoStructure />;
                        case 'grid':
                        default:          return <MemoGrid />;
                    }
                })()}
            </React.Suspense>
        </div>
    );
}
