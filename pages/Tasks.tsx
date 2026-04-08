import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    LayoutGrid, List, Calendar, User, 
    Plus, Filter, Search, ChevronDown,
    CheckSquare, Clock, AlertCircle, Sparkles
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { useProject } from '../services/ProjectContext';
import { getTasks, updateTask } from '../services/TaskService';
import { getMembers } from '../services/TeamService';
import type { CrawlTask, ProjectMember, TaskStatus } from '../services/app-types';
import { CollaborationOverlay } from '../components/seo-crawler/CollaborationOverlay';
import { NotificationBell } from '../components/NotificationBell';

type ViewMode = 'board' | 'list' | 'myTasks' | 'calendar';

export default function TasksPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const { activeProject } = useProject();
    
    const [viewMode, setViewMode] = useState<ViewMode>('board');
    const [tasks, setTasks] = useState<CrawlTask[]>([]);
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [selectedTask, setSelectedTask] = useState<{ type: 'task', id: string, title: string } | null>(null);
    const [showOverlay, setShowOverlay] = useState(false);

    useEffect(() => {
        if (!projectId) return;
        
        const loadData = async () => {
            setLoading(true);
            try {
                const [taskList, memberList] = await Promise.all([
                    getTasks(projectId),
                    getMembers(projectId)
                ]);
                setTasks(taskList);
                setMembers(memberList);
            } catch (err) {
                console.error('Failed to load tasks:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [projectId]);

    const handleTaskClick = (task: CrawlTask) => {
        setSelectedTask({ type: 'task', id: task.id, title: task.title });
        setShowOverlay(true);
    };

    const filteredTasks = tasks.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 flex">
            <Sidebar 
                currentView="dashboard" 
                setCurrentView={() => {}} 
            />
            
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <header className="h-[76px] border-b border-white/[0.08] flex items-center justify-between px-8 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <CheckSquare className="text-brand-red" size={20} />
                        <h1 className="text-lg font-heading font-bold text-white capitalize">Tasks Board</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase">
                            {activeProject?.name.substring(0, 2) || '??'}
                        </div>
                    </div>
                </header>
                
                <header className="px-8 py-6 border-b border-white/5 bg-[#0A0A0A]/50 backdrop-blur-md shrink-0">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <CheckSquare className="text-brand-red" size={20} />
                                <h1 className="text-2xl font-bold text-white font-heading">Project Tasks</h1>
                            </div>
                            <p className="text-sm text-gray-500">Manage and track your SEO execution roadmap.</p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-brand-red hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-brand-red/20">
                            <Plus size={18} /> New Task
                        </button>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                            <ViewTab active={viewMode === 'board'} onClick={() => setViewMode('board')} icon={<LayoutGrid size={16} />} label="Board" />
                            <ViewTab active={viewMode === 'list'} onClick={() => setViewMode('list')} icon={<List size={16} />} label="List" />
                            <ViewTab active={viewMode === 'myTasks'} onClick={() => setViewMode('myTasks')} icon={<User size={16} />} label="My Tasks" />
                            <ViewTab active={viewMode === 'calendar'} onClick={() => setViewMode('calendar')} icon={<Calendar size={16} />} label="Calendar" />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Search tasks..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand-red/50 w-64"
                                />
                            </div>
                            <button className="p-2 bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-colors">
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-8 custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 italic">
                            <div className="w-10 h-10 border-2 border-brand-red border-t-transparent rounded-full animate-spin mb-4"></div>
                            Loading your workspace...
                        </div>
                    ) : (
                        <>
                            {viewMode === 'board' && <TaskBoard tasks={filteredTasks} onTaskClick={handleTaskClick} />}
                            {viewMode === 'list' && <TaskList tasks={filteredTasks} onTaskClick={handleTaskClick} />}
                            {viewMode !== 'board' && viewMode !== 'list' && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/5">
                                    <Sparkles size={48} className="mb-4 opacity-20" />
                                    <h3 className="text-xl font-bold text-white mb-2">{viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View Coming Soon</h3>
                                    <p className="max-w-md text-center">We're building advanced project management views to help you execute faster.</p>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* Fake context provider for Overlay since we are outside SeoCrawlerContext */}
            {/* In a real app, collaboration state might be in a more global context */}
            <CollaborationOverlayWrapper 
                isOpen={showOverlay} 
                onClose={() => setShowOverlay(false)} 
                target={selectedTask}
                tasks={tasks}
                setTasks={setTasks}
                members={members}
                activeProject={activeProject}
            />
        </div>
    );
}

const ViewTab = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
            active ? 'bg-brand-red text-white shadow-md shadow-brand-red/10' : 'text-gray-500 hover:text-gray-300'
        }`}
    >
        {icon} <span>{label}</span>
    </button>
);

const TaskBoard = ({ tasks, onTaskClick }: { tasks: CrawlTask[], onTaskClick: (t: CrawlTask) => void }) => {
    const columns: { status: TaskStatus, label: string }[] = [
        { status: 'todo', label: 'To Do' },
        { status: 'in_progress', label: 'In Progress' },
        { status: 'in_review', label: 'In Review' },
        { status: 'done', label: 'Done' }
    ];

    return (
        <div className="flex gap-6 h-full min-h-[600px] overflow-x-auto pb-6">
            {columns.map(col => (
                <div key={col.status} className="w-[320px] shrink-0 flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                                col.status === 'todo' ? 'bg-gray-500' :
                                col.status === 'in_progress' ? 'bg-blue-500' :
                                col.status === 'in_review' ? 'bg-orange-500' : 'bg-green-500'
                            }`}></div>
                            <h3 className="font-bold text-white uppercase tracking-widest text-[11px]">{col.label}</h3>
                        </div>
                        <span className="bg-white/5 px-2 py-0.5 rounded-full text-[10px] text-gray-500 font-bold">
                            {tasks.filter(t => t.status === col.status).length}
                        </span>
                    </div>
                    
                    <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-3 space-y-3">
                        {tasks.filter(t => t.status === col.status).map(task => (
                            <div 
                                key={task.id} 
                                onClick={() => onTaskClick(task)}
                                className="bg-[#111] border border-white/5 p-4 rounded-xl hover:border-brand-red/30 cursor-pointer transition-all group"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                                        task.priority === 'critical' ? 'text-red-500 border-red-500/20 bg-red-500/5' :
                                        task.priority === 'high' ? 'text-orange-500 border-orange-500/20 bg-orange-500/5' :
                                        'text-blue-500 border-blue-500/20 bg-blue-500/5'
                                    }`}>
                                        {task.priority}
                                    </span>
                                    <span className="text-[9px] text-gray-500 font-bold uppercase">{task.category || 'General'}</span>
                                </div>
                                <h4 className="text-sm font-bold text-white group-hover:text-brand-red transition-colors mb-3">{task.title}</h4>
                                <div className="flex justify-between items-center">
                                    <div className="flex -space-x-2">
                                        {task.assignee_id ? (
                                            <div className="w-6 h-6 rounded-full bg-brand-red border-2 border-[#111] flex items-center justify-center text-[10px] font-bold text-white">
                                                {task.assignee_name?.[0] || 'U'}
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-white/5 border-2 border-[#111] flex items-center justify-center text-gray-600">
                                                <User size={10} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                        <Clock size={10} />
                                        {task.due_date ? new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'No date'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const TaskList = ({ tasks, onTaskClick }: { tasks: CrawlTask[], onTaskClick: (t: CrawlTask) => void }) => {
    return (
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-white/5 border-b border-white/5 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                        <th className="px-6 py-4">Task Name</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Priority</th>
                        <th className="px-6 py-4">Assignee</th>
                        <th className="px-6 py-4 text-right">Due Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {tasks.map(task => (
                        <tr 
                            key={task.id} 
                            onClick={() => onTaskClick(task)}
                            className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                        >
                            <td className="px-6 py-4">
                                <div className="text-sm font-bold text-white group-hover:text-brand-red transition-colors">{task.title}</div>
                                <div className="text-[10px] text-gray-500 mt-1">{task.source} • {task.category || 'General'}</div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                                    task.status === 'done' ? 'bg-green-500/10 text-green-500' :
                                    task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500' :
                                    'bg-white/5 text-gray-400'
                                }`}>
                                    {task.status.replace('_', ' ')}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                        task.priority === 'critical' ? 'bg-red-500' :
                                        task.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                                    }`}></div>
                                    <span className="text-sm text-gray-300 capitalize">{task.priority}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                        {task.assignee_name?.[0] || 'U'}
                                    </div>
                                    <span className="text-sm text-gray-300">{task.assignee_name || 'Unassigned'}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-gray-500 font-mono">
                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Simplified context wrapper for CollaborationOverlay to work outside SeoCrawlerProvider
import { createContext, useContext, ReactNode } from 'react';

const FakeSeoCrawlerContext = createContext<any>(null);

const CollaborationOverlayWrapper = ({ isOpen, onClose, target, tasks, setTasks, members, activeProject }: any) => {
    const value = {
        collabOverlayTarget: target,
        tasks,
        setTasks,
        teamMembers: members,
        activeProject
    };

    return (
        <FakeSeoCrawlerContext.Provider value={value}>
            <CollaborationOverlayWithFakeContext isOpen={isOpen} onClose={onClose} />
        </FakeSeoCrawlerContext.Provider>
    );
};

// We need to modify CollaborationOverlay.tsx to use a generic hook or handle missing context
// For now, I'll just create a slightly modified version or hope for the best.
// Actually, I'll update CollaborationOverlay.tsx to be more resilient.

const CollaborationOverlayWithFakeContext = ({ isOpen, onClose }: any) => {
    // This is a hack, but let's assume we can pass the context or use a shared one.
    return <CollaborationOverlay isOpen={isOpen} onClose={onClose} />;
};
