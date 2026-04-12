import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useProject } from './ProjectContext';

/**
 * ProjectUrlSync component
 * 
 * Synchronizes the browser's URL projectId with the ProjectContext activeProject.
 * It sits inside the BrowserRouter and monitors path changes.
 */
export const ProjectUrlSync: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { projects, activeProject, switchProject, loading } = useProject();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (loading) return;

        if (projects.length === 0) {
            return;
        }

        // 1. If we have a projectId in URL, ensure it's synced with Context
        if (projectId) {
            if (activeProject?.id !== projectId) {
                const project = projects.find(p => p.id === projectId);
                if (project) {
                    console.log(`[Sync] URL is ${projectId}, switching context...`);
                    switchProject(projectId, { persist: false });
                } else {
                    // Invalid project ID in URL (e.g. after deletion), 
                    // redirect to base dashboard to trigger fresh project selection.
                    console.warn(`[Sync] Invalid project ID in URL: ${projectId}`);
                    navigate('/dashboard', { replace: true });
                }
            }
        } 
        else if (location.pathname === '/crawler') {
            const targetId = activeProject?.id || projects[0]?.id;
            if (targetId) {
                navigate(`/project/${targetId}/crawler`, { replace: true });
            }
        }
        // 2. If we are at the root or /dashboard (handled by redirects in App.tsx), 
        // but have projects, redirect to the active project dashboard.
        else if (location.pathname === '/' || location.pathname === '/dashboard') {
            const targetId = activeProject?.id || projects[0]?.id;
            if (targetId) {
                console.log(`[Sync] No project in URL, redirecting to ${targetId}`);
                navigate(`/project/${targetId}/dashboard`, { replace: true });
            }
        }
    }, [projectId, projects, activeProject, loading, switchProject, navigate, location.pathname]);

    return null;
};
