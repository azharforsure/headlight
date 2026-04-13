import React from 'react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import CompOverviewTab from './CompOverviewTab';
import CompGapsTab from './CompGapsTab';
import CompThreatsTab from './CompThreatsTab';
import CompBriefTab from './CompBriefTab';
import CompTasksTab from './CompTasksTab';
import CompNotesTab from './CompNotesTab';

export default function CompSidebarRouter() {
    const { activeAuditTab } = useSeoCrawler();

    switch (activeAuditTab) {
        case 'comp_overview':
            return <CompOverviewTab />;
        case 'comp_gaps':
            return <CompGapsTab />;
        case 'comp_threats':
            return <CompThreatsTab />;
        case 'comp_brief':
            return <CompBriefTab />;
        case 'tasks':
            return <CompTasksTab />;
        case 'comp_notes':
            return <CompNotesTab />;
        default:
            return <CompOverviewTab />;
    }
}
