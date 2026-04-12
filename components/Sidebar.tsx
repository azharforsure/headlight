import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronLeft, ChevronDown, Plus, LayoutDashboard, Search, Sparkles,
    Globe, Target, Share2, Activity, Lightbulb, Briefcase, BellRing,
    Settings, Users, Trash2, X, LogOut, CheckSquare
} from 'lucide-react';
import { ViewType } from '../types';
import { useProject } from '../services/ProjectContext';
import { IndustryType } from '../services/app-types';
import { useAuth } from '../services/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
    currentView: ViewType;
    setCurrentView: (view: ViewType) => void;
}

// Custom Logo Component
const HeadlightLogo = ({ collapsed }: { collapsed?: boolean }) => (
    <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-white drop-shadow-[0_0_8px_rgba(245,54,78,0.5)]">
            <circle cx="9" cy="16" r="5" fill="currentColor" />
            <path d="M17 11H27" stroke="#F5364E" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M17 16H31" stroke="#F5364E" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M17 21H27" stroke="#F5364E" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        {!collapsed && (
            <div className="flex flex-col justify-center transition-opacity duration-300">
                <span className="text-white font-extrabold text-lg tracking-wider uppercase font-heading">Headlight</span>
            </div>
        )}
    </div>
);

const SidebarItem = ({ icon, label, active, onClick, hasNotification, badge, collapsed, indent }: any) => {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${active
                ? 'bg-white/10 text-white shadow-glow-sm border border-white/5'
                : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'
                } ${collapsed ? 'justify-center px-2' : ''} ${indent ? 'pl-8' : ''}`}
            title={collapsed ? label : undefined}
        >
            <div className={`transition-transform duration-200 ${active ? 'scale-110 text-brand-red' : 'group-hover:scale-110'}`}>
                {icon}
            </div>
            {!collapsed && (
                <span className={`text-sm font-medium ${active ? 'text-white' : ''} truncate`}>
                    {label}
                </span>
            )}
            {hasNotification && (
                <div className={`absolute w-2 h-2 rounded-full bg-brand-red border-2 border-[#0A0A0A] ${collapsed ? 'top-2 right-2' : 'right-3 top-1/2 -translate-y-1/2'}`}></div>
            )}
            {badge && !collapsed && (
                <span className={`ml-auto text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${active ? 'bg-white/20 text-white' : 'bg-brand-red/10 text-brand-red'
                    }`}>
                    {badge}
                </span>
            )}
        </button>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
    const { projects, activeProject, switchProject, addProject, isCollapsed, setIsCollapsed } = useProject();
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectUrl, setNewProjectUrl] = useState('');
    const [newProjectIndustry, setNewProjectIndustry] = useState<IndustryType>('saas');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const projectMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
                setIsProjectMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <aside
            className={`${isCollapsed ? 'w-[80px]' : 'w-[260px]'} relative shrink-0 hidden lg:flex flex-col border-r border-white/[0.08] bg-[#0A0A0A] z-40 transition-all duration-300 ease-in-out`}
        >
            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-[26px] w-6 h-6 bg-[#1A1A1A] border border-white/10 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:border-brand-red transition-all z-50 cursor-pointer shadow-lg group"
            >
                <ChevronLeft size={12} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''} group-hover:scale-110`} />
            </button>

            {/* A. Workspace / Project Switcher (Top of Sidebar) */}
            <div className={`pt-4 pb-2 flex flex-col gap-2 ${isCollapsed ? 'px-2 items-center' : 'px-4'}`}>
                {/* Logo Area */}
                <div className={`h-10 flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                    <HeadlightLogo collapsed={isCollapsed} />
                </div>

                {/* Project Select */}
                <div className="relative mt-2" ref={projectMenuRef}>
                    <button
                        onClick={() => !isCollapsed && setIsProjectMenuOpen(!isProjectMenuOpen)}
                        className={`w-full flex items-center gap-3 bg-[#151515] border border-white/10 rounded-xl hover:border-white/20 hover:bg-[#1A1A1A] transition-all group ${isCollapsed ? 'p-2 justify-center h-12' : 'p-3'
                            }`}
                    >
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shrink-0 uppercase">
                            {activeProject ? activeProject.name.substring(0, 2) : '?'}
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-xs font-bold text-white truncate">{activeProject ? activeProject.name : 'No Project'}</p>
                                <p className="text-[10px] text-gray-500 truncate">{activeProject ? activeProject.url : 'Add to start'}</p>
                            </div>
                        )}
                        {!isCollapsed && <ChevronDown size={14} className="text-gray-500 group-hover:text-white transition-colors" />}
                    </button>

                    {/* Project Dropdown */}
                    {isProjectMenuOpen && !isCollapsed && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-2 border-b border-white/5">
                                <input type="text" placeholder="Find project..." className="w-full bg-black/20 text-xs text-white p-2 rounded-lg border border-white/5 focus:outline-none focus:border-brand-red/50" />
                            </div>
                            <div className="max-h-48 overflow-y-auto scrollbar-thin">
                                {projects.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => { 
                                            navigate(`/project/${p.id}/dashboard?view=${currentView}`);
                                            setIsProjectMenuOpen(false); 
                                        }}
                                        className={`w-full flex items-center gap-3 p-2 hover:bg-white/5 transition-colors ${activeProject?.id === p.id ? 'bg-white/5' : ''}`}
                                    >
                                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-red to-orange-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                            {p.name.substring(0, 2)}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-white">{p.name}</p>
                                            <p className="text-[10px] text-gray-500">{p.url}</p>
                                        </div>
                                    </button>
                                ))}
                                {projects.length === 0 && (
                                    <div className="p-4 text-center text-xs text-gray-500">No projects yet.</div>
                                )}
                            </div>
                            <div className="p-2 border-t border-white/5 bg-[#111]">
                                <button
                                    onClick={() => { setIsProjectMenuOpen(false); setIsAddModalOpen(true); }}
                                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-white/5 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    <Plus size={12} /> Add Project
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* New Analysis Action */}
                <button
                    onClick={() => setCurrentView('content_predictor')}
                    className={`mt-2 bg-gradient-to-r from-brand-red to-[#FF5065] text-white rounded-xl flex items-center justify-center gap-2 group shadow-glow-sm hover:shadow-glow transition-all
                    ${isCollapsed ? 'w-10 h-10 p-0' : 'w-full py-2.5 px-4'}`}
                    title="New Analysis"
                >
                    <Plus size={16} className="text-white transition-transform" />
                    {!isCollapsed && <span className="text-xs font-bold uppercase tracking-wide">New Analysis</span>}
                </button>
            </div>

            {/* B. Navigation Groups */}
            <div className="flex-1 overflow-y-auto px-3 flex flex-col gap-6 py-4 scrollbar-hide">

                {/* Core */}
                <div className="flex flex-col gap-1">
                    {!isCollapsed && (
                        <div className="px-4 mb-1 animate-in fade-in duration-300">
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest font-heading">Core</span>
                        </div>
                    )}
                    <SidebarItem 
                        icon={<LayoutDashboard size={18} />} 
                        label="Overview" 
                        active={currentView === 'dashboard'} 
                        onClick={() => {
                            if (activeProject) navigate(`/project/${activeProject.id}/dashboard`);
                            else setCurrentView('dashboard');
                        }} 
                        collapsed={isCollapsed} 
                    />
                </div>

                {/* Intelligence (Strategy) */}
                <div className="flex flex-col gap-1">
                    {!isCollapsed && (
                        <div className="px-4 mb-1 animate-in fade-in duration-300">
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest font-heading">Intelligence</span>
                        </div>
                    )}
                    <SidebarItem 
                        icon={<Search size={18} />} 
                        label="Keyword Research" 
                        active={currentView === 'keyword_research'} 
                        onClick={() => {
                            if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=keyword_research`);
                            else setCurrentView('keyword_research');
                        }} 
                        collapsed={isCollapsed} 
                    />
                    <SidebarItem 
                        icon={<Sparkles size={18} />} 
                        label="Content Predictor" 
                        active={currentView === 'content_predictor'} 
                        onClick={() => {
                            if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=content_predictor`);
                            else setCurrentView('content_predictor');
                        }} 
                        badge="AI" 
                        collapsed={isCollapsed} 
                    />
                    <SidebarItem 
                        icon={<Globe size={18} />} 
                        label="Competitors" 
                        active={currentView === 'competitors'} 
                        onClick={() => {
                            if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=competitors`);
                            else setCurrentView('competitors');
                        }} 
                        collapsed={isCollapsed} 
                    />
                </div>

                {/* Performance (Tracking) */}
                <div className="flex flex-col gap-1">
                    {!isCollapsed && (
                        <div className="px-4 mb-1 animate-in fade-in duration-300">
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest font-heading">Performance</span>
                        </div>
                    )}
                    <SidebarItem 
                        icon={<Target size={18} />} 
                        label="Rank Tracker" 
                        active={currentView === 'rank_tracker'} 
                        onClick={() => {
                            if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=rank_tracker`);
                            else setCurrentView('rank_tracker');
                        }} 
                        collapsed={isCollapsed} 
                    />
                    <SidebarItem 
                        icon={<Share2 size={18} />} 
                        label="Mentions" 
                        active={currentView === 'mentions'} 
                        onClick={() => {
                            if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=mentions`);
                            else setCurrentView('mentions');
                        }} 
                        collapsed={isCollapsed} 
                    />
                    <SidebarItem 
                        icon={<Activity size={18} />} 
                        label="Site Audit" 
                        active={currentView === 'site_audit'} 
                        onClick={() => {
                            if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=site_audit`);
                            else setCurrentView('site_audit');
                        }} 
                        hasNotification 
                        collapsed={isCollapsed} 
                    />
                </div>

                {/* Operations (Execution) */}
                <div className="flex flex-col gap-1">
                    {!isCollapsed && (
                        <div className="px-4 mb-1 animate-in fade-in duration-300">
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest font-heading">Operations</span>
                        </div>
                    )}
                    <SidebarItem 
                        icon={<Lightbulb size={18} />} 
                        label="Opportunities" 
                        active={currentView === 'opportunities'} 
                        onClick={() => {
                            if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=opportunities`);
                            else setCurrentView('opportunities');
                        }} 
                        collapsed={isCollapsed} 
                    />
                    <SidebarItem 
                        icon={<CheckSquare size={18} />} 
                        label="Tasks" 
                        active={window.location.pathname.includes('/tasks')} 
                        onClick={() => {
                            if (activeProject) navigate(`/project/${activeProject.id}/tasks`);
                        }} 
                        collapsed={isCollapsed} 
                    />
                    <SidebarItem icon={<Briefcase size={18} />} label="Agency Hub" active={currentView === 'agency_hub'} onClick={() => {
                        if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=agency_hub`);
                        else setCurrentView('agency_hub');
                    }} collapsed={isCollapsed} />
                    <SidebarItem icon={<BellRing size={18} />} label="Automations" active={currentView === 'automation'} onClick={() => {
                        if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=automation`);
                        else setCurrentView('automation');
                    }} collapsed={isCollapsed} />
                </div>
            </div>

            {/* C. Footer: Settings & Profile */}
            <div className="p-3 bg-[#0A0A0A] border-t border-white/[0.08] flex flex-col gap-1">
                <SidebarItem
                    icon={<Settings size={18} />}
                    label="Project Settings"
                    active={currentView === 'settings_project'}
                    onClick={() => {
                        if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=settings_project`);
                        else setCurrentView('settings_project');
                    }}
                    collapsed={isCollapsed}
                />
                <SidebarItem
                    icon={<Users size={18} />}
                    label="Account Settings"
                    active={currentView === 'settings_account'}
                    onClick={() => {
                        if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=settings_account`);
                        else setCurrentView('settings_account');
                    }}
                    collapsed={isCollapsed}
                />

                {!isCollapsed ? (
                    <div className="mt-3 bg-[#111] rounded-xl border border-white/5 p-3 flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Credits</span>
                            <span className="text-xs text-white font-bold">4.2k <span className="text-gray-600">/ 5k</span></span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full w-[84%] bg-brand-red"></div>
                        </div>
                    </div>
                ) : (
                    <div className="mt-2 flex justify-center">
                        <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="w-[84%] h-full bg-brand-red"></div>
                        </div>
                    </div>
                )}

                <div className={`mt-2 flex items-center gap-3 px-1 py-1.5 rounded-lg hover:bg-white/5 transition-all group ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-brand-card border border-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400 overflow-hidden shrink-0 uppercase">
                        {user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2) || '??'}
                    </div>
                    {!isCollapsed && (
                        <>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{user?.fullName || 'User Account'}</p>
                                <p className="text-[10px] text-gray-400 truncate leading-tight capitalize">
                                    {(profile?.subscription_status || 'Free') + ' Plan'}
                                </p>
                            </div>
                            <button 
                                onClick={() => signOut()}
                                className="p-2 text-gray-500 hover:text-[#F5364E] hover:bg-[#F5364E]/10 rounded-lg transition-all"
                                title="Sign Out"
                            >
                                <LogOut size={14} />
                            </button>
                        </>
                    )}
                </div>
            </div>
            {/* Add Project Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#151515]">
                            <h3 className="text-lg font-bold text-white">Create New Project</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">Project Name</label>
                                <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={e => setNewProjectName(e.target.value)}
                                    placeholder="e.g. Acme Corp"
                                    className="w-full bg-[#050505] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-brand-red transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">Website URL</label>
                                <input
                                    type="url"
                                    value={newProjectUrl}
                                    onChange={e => setNewProjectUrl(e.target.value)}
                                    placeholder="https://acme.com"
                                    className="w-full bg-[#050505] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-brand-red transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">Industry</label>
                                <select
                                    value={newProjectIndustry}
                                    onChange={e => setNewProjectIndustry(e.target.value as any)}
                                    className="w-full bg-[#050505] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-brand-red transition-colors appearance-none"
                                >
                                    <option value="saas">SaaS / B2B</option>
                                    <option value="ecommerce">E-Commerce</option>
                                    <option value="local">Local Services</option>
                                    <option value="elearning">E-Learning</option>
                                </select>
                            </div>

                            <button
                                disabled={!newProjectName || !newProjectUrl || isSubmitting}
                                onClick={async () => {
                                    setIsSubmitting(true);
                                    const proj = await addProject(newProjectName, newProjectUrl, newProjectIndustry);
                                    setIsSubmitting(false);
                                    if (proj) {
                                        setIsAddModalOpen(false);
                                        setNewProjectName('');
                                        setNewProjectUrl('');
                                    }
                                }}
                                className="w-full mt-4 bg-brand-red text-white font-bold py-3 rounded-xl hover:bg-brand-red/90 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Project'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};
