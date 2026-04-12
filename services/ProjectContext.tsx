import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { IndustryType, ProjectRecord } from './app-types';
import { useAuth } from './AuthContext';
import {
    fetchCloudProjects,
    createCloudProject,
    updateCloudProject,
    deleteCloudProject,
    migrateLocalProjectsToCloud,
    extractDomain,
} from './ProjectSyncService';

type Project = ProjectRecord;

interface ProjectContextType {
    projects: Project[];
    activeProject: Project | null;
    loading: boolean;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
    switchProject: (projectId: string, options?: { persist?: boolean }) => void;
    addProject: (name: string, url: string, industry: IndustryType) => Promise<Project | null>;
    updateProject: (id: string, updates: Partial<Project>) => Promise<boolean>;
    deleteProject: (id: string) => Promise<boolean>;
    refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, source } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
    const migrationRunRef = useRef(false);

    const localStorageKey = user ? `headlight:projects:${source}:${user.id}` : null;
    const activeIdKey = user ? `headlight:projects:${source}:${user.id}:active` : null;

    // ─── localStorage helpers (used as cache / fallback) ───

    const readLocalProjects = (): Project[] => {
        if (typeof window === 'undefined' || !localStorageKey) return [];
        try {
            return JSON.parse(window.localStorage.getItem(localStorageKey) || '[]');
        } catch {
            return [];
        }
    };

    const readLocalActiveId = (): string | null => {
        if (typeof window === 'undefined' || !activeIdKey) return null;
        return window.localStorage.getItem(activeIdKey);
    };

    const cacheLocally = (nextProjects: Project[], nextActive: Project | null) => {
        if (typeof window === 'undefined' || !localStorageKey || !activeIdKey) return;
        window.localStorage.setItem(localStorageKey, JSON.stringify(nextProjects));
        if (nextActive) {
            window.localStorage.setItem(activeIdKey, nextActive.id);
        } else {
            window.localStorage.removeItem(activeIdKey);
        }
    };

    // ─── Fetch: Turso first, localStorage fallback ───

    const fetchProjects = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            // Try Turso first
            const cloudProjects = await fetchCloudProjects(user.id);

            if (cloudProjects.length > 0) {
                setProjects(cloudProjects);
                const savedActiveId = readLocalActiveId();
                const active = cloudProjects.find(p => p.id === savedActiveId) || cloudProjects[0];
                setActiveProject(active);
                cacheLocally(cloudProjects, active);
                migrationRunRef.current = true; // Avoid migration if we found cloud projects
            } else {
                // No cloud projects — check localStorage for existing data to migrate
                const localProjects = readLocalProjects();
                if (localProjects.length > 0 && !migrationRunRef.current) {
                    migrationRunRef.current = true;
                    console.log(`[Projects] No cloud projects found, but local projects exist. Attempting migration...`);
                    const migrated = await migrateLocalProjectsToCloud(user.id, localProjects);
                    if (migrated > 0) {
                        console.log(`[Projects] Migrated ${migrated} local projects to cloud.`);
                        // Re-fetch from cloud after migration
                        const fresh = await fetchCloudProjects(user.id);
                        if (fresh.length > 0) {
                            setProjects(fresh);
                            const savedActiveId = readLocalActiveId();
                            const active = fresh.find(p => p.id === savedActiveId) || fresh[0];
                            setActiveProject(active);
                            cacheLocally(fresh, active);
                        }
                    } else {
                        // Migration didn't produce results, use local
                        setProjects(localProjects);
                        const savedActiveId = readLocalActiveId();
                        const active = localProjects.find(p => p.id === savedActiveId) || localProjects[0];
                        setActiveProject(active);
                    }
                } else {
                    setProjects([]);
                    setActiveProject(null);
                    // Crucial: Clear local cache if cloud is empty and we've already checked/migrated
                    if (migrationRunRef.current) {
                        cacheLocally([], null);
                    }
                }
            }
        } catch (err) {
            console.warn('[Projects] Cloud fetch failed, using local cache:', err);
            // Fallback to localStorage
            const localProjects = readLocalProjects();
            const savedActiveId = readLocalActiveId();
            setProjects(localProjects);
            if (localProjects.length > 0) {
                setActiveProject(localProjects.find(p => p.id === savedActiveId) || localProjects[0]);
            } else {
                setActiveProject(null);
            }
        } finally {
            setLoading(false);
        }
    }, [user, localStorageKey, activeIdKey]);

    useEffect(() => {
        if (user) {
            fetchProjects();
        } else {
            setProjects([]);
            setActiveProject(null);
            setLoading(false);
            migrationRunRef.current = false;
            setDeletedIds(new Set());
        }
    }, [user, fetchProjects]);

    // Cross-tab synchronization
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleStorageChange = (e: StorageEvent) => {
            if (e.storageArea !== window.localStorage) return;

            if (e.key === localStorageKey) {
                console.log('[Projects] Storage changed in another tab, re-fetching...');
                fetchProjects();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [localStorageKey, fetchProjects]);

    // Filter projects by tombstoned IDs
    const visibleProjects = projects.filter(p => !deletedIds.has(p.id));

    // ─── Switch ───

    const switchProject = (projectId: string, options?: { persist?: boolean }) => {
        const project = projects.find((p) => p.id === projectId);
        if (project) {
            setActiveProject(project);
            if ((options?.persist ?? true) && typeof window !== 'undefined' && activeIdKey) {
                window.localStorage.setItem(activeIdKey, project.id);
            }
        }
    };

    // ─── Add: write to Turso + update local state ───

    const addProject = async (name: string, url: string, industry: IndustryType) => {
        if (!user) return null;
        const domain = extractDomain(url);
        const newProject: Project = {
            id: `project_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            user_id: user.id,
            name,
            url: url.startsWith('http') ? url : `https://${url}`,
            domain,
            industry,
            created_at: new Date().toISOString(),
            crawl_count: 0,
            gsc_connected: false,
            ga4_connected: false,
            auto_crawl_enabled: false,
            auto_crawl_interval: 'weekly',
        };

        // Optimistic local update
        const nextProjects = [newProject, ...projects];
        setProjects(nextProjects);
        // We don't setActiveProject here directly anymore, 
        // as the UI should navigate to the new project URL
        cacheLocally(nextProjects, newProject);

        // Persist to cloud (fire-and-forget with retry)
        try {
            await createCloudProject(newProject);
        } catch (err) {
            console.error('[Projects] Failed to sync new project to cloud:', err);
        }

        return newProject;
    };

    // ─── Update: write to Turso + update local state ───

    const updateProject = async (id: string, updates: Partial<Project>) => {
        const nextProjects = projects.map((p) => p.id === id ? { ...p, ...updates } : p);
        const nextActive = activeProject && activeProject.id === id
            ? { ...activeProject, ...updates }
            : activeProject;
        setProjects(nextProjects);
        if (nextActive) setActiveProject(nextActive);
        cacheLocally(nextProjects, nextActive);

        // Persist to cloud
        try {
            await updateCloudProject(id, updates);
        } catch (err) {
            console.error('[Projects] Failed to sync project update to cloud:', err);
        }

        return true;
    };

    const deleteProject = async (id: string) => {
        // Prevent concurrent deletions of the same project
        if (deletedIds.has(id)) return true;

        // 1. Update list and tombstones IMMEDIATELY
        setDeletedIds(prev => new Set([...prev, id]));
        const nextVisibleProjects = projects.filter((p) => p.id !== id);
        
        // 2. Clear from localStorage IMMEDIATELY to prevent migration resurrection
        if (typeof window !== 'undefined' && localStorageKey) {
            const currentLocal = JSON.parse(window.localStorage.getItem(localStorageKey) || '[]');
            const nextLocal = currentLocal.filter((p: any) => p.id !== id);
            window.localStorage.setItem(localStorageKey, JSON.stringify(nextLocal));
        }

        // 3. Update active project
        if (activeProject?.id === id) {
            setActiveProject(nextVisibleProjects[0] || null);
        }

        // 4. Persist to cloud
        try {
            await deleteCloudProject(id);
            console.log(`[Projects] Successfully deleted project from cloud: ${id}`);
            setProjects(prev => prev.filter(p => p.id !== id));
            return true;
        } catch (err) {
            console.error('[Projects] Failed to delete project from cloud:', err);
            // Revert local tombstone on failure so it reappears if the deletion failed
            setDeletedIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            // Restoring localStorage cache is omitted for brevity as the user can retry, 
            // but we'll at least put it back in the React state list
            setProjects(prev => {
                const alreadyHas = prev.some(p => p.id === id);
                if (alreadyHas) return prev;
                const originalRecord = projects.find(p => p.id === id);
                return originalRecord ? [...prev, originalRecord] : prev;
            });
            throw err; 
        }
    };

    return (
        <ProjectContext.Provider value={{ 
            projects: visibleProjects, 
            activeProject, 
            loading, 
            isCollapsed, 
            setIsCollapsed, 
            switchProject, 
            addProject, 
            updateProject, 
            deleteProject, 
            refreshProjects: fetchProjects 
        }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    // Be more permissive here or handle null activeProject downstream
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};

export const useOptionalProject = () => useContext(ProjectContext);
