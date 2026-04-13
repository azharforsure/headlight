import React from 'react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import AuditPane from './AuditPane';
import IssueDashboardView from './views/IssueDashboardView';
import CompetitorMatrixView from './views/CompetitorMatrixView';
import AiDiscoverabilityView from './views/AiDiscoverabilityView';
import GeoSpatialView from './views/GeoSpatialView';
import StrategicOpportunityView from './views/StrategicOpportunityView';
import VisualHeatMapView from './views/VisualHeatMapView';

export default function AuditViewRouter() {
    const { activeViewType } = useSeoCrawler();

    switch (activeViewType) {
        case 'competitor_matrix':
            return <CompetitorMatrixView />;
        case 'ai_view':
            return <AiDiscoverabilityView />;
        case 'geo_view':
            return <GeoSpatialView />;
        case 'opportunity_view':
            return <StrategicOpportunityView />;
        case 'visual_heat_map':
            return <VisualHeatMapView />;
        case 'issue_dashboard':
            return <IssueDashboardView />;
        case 'grid':
        default:
            return <AuditPane />;
    }
}
