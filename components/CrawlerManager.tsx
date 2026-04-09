import React, { useEffect } from 'react';
import { useProject } from '../services/ProjectContext';
import { openCrawler } from '../services/CrawlerLauncher';
import { CrawlerOverlay } from './CrawlerOverlay';

export const CrawlerManager: React.FC = () => {
    const { activeProject } = useProject();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toUpperCase() === 'C') {
                e.preventDefault();
                if (activeProject?.id) {
                    openCrawler(activeProject.id, { view: 'main' });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeProject?.id]);

    return <CrawlerOverlay />;
};
