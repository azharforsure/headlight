import React, { useState, useEffect, useRef } from 'react';
import { X, Send, CheckCircle, Clock, User, MessageSquare, Plus, Trash2, Smile, AlertCircle } from 'lucide-react';
import { useOptionalSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { useAuth } from '../../services/AuthContext';
import { useProject } from '../../services/ProjectContext';
import { getComments, createComment, resolveComment, addReaction } from '../../services/CollaborationService';
import { updateTask, createSubtask, toggleSubtask } from '../../services/TaskService';
import { logActivity } from '../../services/ActivityService';
import type { CrawlComment, CrawlTask, CrawlSubtask, CommentTargetType, TaskStatus, TaskPriority } from '../../services/app-types';
import { crawlDb } from '../../services/CrawlDatabase';

interface CollaborationOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CollaborationOverlay: React.FC<CollaborationOverlayProps> = ({ isOpen, onClose }) => {
    const crawler = useOptionalSeoCrawler();
    const { 
        collabOverlayTarget: contextTarget, 
        teamMembers: contextMembers = [], 
        tasks: contextTasks = [], 
        setTasks: contextSetTasks = () => {} 
    } = crawler || {};

    // Fallback for when used outside SeoCrawlerProvider (e.g. in Tasks page)
    const collabOverlayTarget = contextTarget;
    const teamMembers = contextMembers;
    const tasks = contextTasks;
    const setTasks = contextSetTasks;

    const { activeProject } = useProject();
    const { user, profile } = useAuth();
    
    const [comments, setComments] = useState<CrawlComment[]>([]);
    const [subtasks, setSubtasks] = useState<CrawlSubtask[]>([]);
    const [loading, setLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
    
    const scrollRef = useRef<HTMLDivElement>(null);

    // Associated task if target is a task, or if an issue has an associated task
    const activeTask = tasks.find(t => t.id === collabOverlayTarget?.id) || 
                       tasks.find(t => t.linked_issue_id === collabOverlayTarget?.id);

    useEffect(() => {
        if (!isOpen || !collabOverlayTarget || !activeProject) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const fetchedComments = await getComments(
                    activeProject.id, 
                    collabOverlayTarget.type, 
                    collabOverlayTarget.id
                );
                setComments(fetchedComments);

                if (activeTask) {
                    const fetchedSubtasks = await crawlDb.subtasks
                        .where('taskId').equals(activeTask.id)
                        .sortBy('sortOrder');
                    setSubtasks(fetchedSubtasks);
                } else {
                    setSubtasks([]);
                }
            } catch (err) {
                console.error('Failed to load collaboration data:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isOpen, collabOverlayTarget, activeProject, activeTask]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    if (!isOpen || !collabOverlayTarget) return null;

    const handleSendComment = async () => {
        if (!commentText.trim() || !activeProject || !user) return;

        try {
            const newComment = await createComment(activeProject.id, {
                targetType: collabOverlayTarget.type,
                targetId: collabOverlayTarget.id,
                userId: user.id,
                userName: profile?.full_name || user.email || 'Anonymous',
                userAvatar: profile?.avatar_url,
                text: commentText
            });
            setComments(prev => [...prev, newComment]);
            setCommentText('');
        } catch (err) {
            console.error('Failed to send comment:', err);
        }
    };

    const handleUpdateTaskStatus = async (status: TaskStatus) => {
        if (!activeTask) return;
        try {
            await updateTask(activeTask.id, { status });
            setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, status } : t));
            
            await logActivity(activeProject!.id, {
                actorId: user!.id,
                actorName: profile?.full_name,
                action: 'task_status_changed',
                entityType: 'task',
                entityId: activeTask.id,
                metadata: { status }
            });
        } catch (err) {
            console.error('Failed to update task status:', err);
        }
    };

    const handleAddSubtask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubtaskTitle.trim() || !activeTask) return;

        try {
            const sub = await createSubtask(activeTask.id, newSubtaskTitle);
            setSubtasks(prev => [...prev, sub]);
            setNewSubtaskTitle('');
        } catch (err) {
            console.error('Failed to create subtask:', err);
        }
    };

    const handleToggleSubtask = async (id: string, completed: boolean) => {
        try {
            await toggleSubtask(id, completed);
            setSubtasks(prev => prev.map(s => s.id === id ? { ...s, completed } : s));
        } catch (err) {
            console.error('Failed to toggle subtask:', err);
        }
    };

    const handleDeleteSubtask = async (id: string) => {
        try {
            await crawlDb.subtasks.delete(id);
            if (isCloudSyncEnabled) {
                // We'd need a deleteSubtask in TaskService usually, but for now we'll just remove from UI since it's local first.
                // In a real app we'd sync this.
            }
            setSubtasks(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error('Failed to delete subtask:', err);
        }
    };

    const handleCreateTask = async () => {
        if (!activeProject || !user) return;
        setIsCreatingTask(true);
        try {
            const newTask = await createTask(activeProject.id, {
                title: collabOverlayTarget.title,
                description: newTaskDescription,
                priority: newTaskPriority,
                source: 'manual',
                createdBy: user.id,
                linkedIssueId: collabOverlayTarget.type === 'issue' ? collabOverlayTarget.id : null,
            });
            setTasks(prev => [...prev, newTask]);
        } catch (err) {
            console.error('Failed to create task:', err);
        } finally {
            setIsCreatingTask(false);
        }
    };

    const handleResolveComment = async (commentId: string) => {
        if (!user) return;
        try {
            await resolveComment(commentId, user.id);
            setComments(prev => prev.map(c => c.id === commentId ? { ...c, resolved: true, resolved_by: user.id, resolved_at: new Date().toISOString() } : c));
        } catch (err) {
            console.error('Failed to resolve comment:', err);
        }
    };

    return (
        <div className="fixed inset-y-0 right-0 w-[560px] bg-[#0A0A0A] border-l border-white/10 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-red px-2 py-0.5 bg-brand-red/10 rounded border border-brand-red/20">
                            {collabOverlayTarget.type}
                        </span>
                        {activeTask && (
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                                activeTask.priority === 'critical' ? 'text-red-500 bg-red-500/10 border-red-500/20' :
                                activeTask.priority === 'high' ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' :
                                'text-blue-500 bg-blue-500/10 border-blue-500/20'
                            }`}>
                                {activeTask.priority}
                            </span>
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-white leading-tight">{collabOverlayTarget.title}</h2>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8" ref={scrollRef}>
                {/* Task Controls if applicable */}
                {activeTask ? (
                    <section className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Assignee</label>
                                <div className="flex items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/5">
                                    {activeTask.assignee_avatar ? (
                                        <img src={activeTask.assignee_avatar} className="w-6 h-6 rounded-full" alt="" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-brand-red/20 flex items-center justify-center text-brand-red">
                                            <User size={12} />
                                        </div>
                                    )}
                                    <span className="text-sm text-white">{activeTask.assignee_name || 'Unassigned'}</span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Status</label>
                                <select 
                                    value={activeTask.status}
                                    onChange={(e) => handleUpdateTaskStatus(e.target.value as TaskStatus)}
                                    className="w-full bg-white/5 border border-white/5 rounded-xl p-2 text-sm text-white focus:outline-none focus:border-brand-red/50"
                                >
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="in_review">In Review</option>
                                    <option value="done">Done</option>
                                    <option value="wont_fix">Won't Fix</option>
                                </select>
                            </div>
                        </div>

                        {/* Subtasks */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <CheckCircle size={14} className="text-green-500" /> Subtasks
                                </h3>
                                <span className="text-[10px] text-gray-500">
                                    {subtasks.filter(s => s.completed).length}/{subtasks.length} Done
                                </span>
                            </div>
                            <div className="space-y-2">
                                {subtasks.map(sub => (
                                    <div key={sub.id} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/5 group">
                                        <input 
                                            type="checkbox" 
                                            checked={sub.completed}
                                            onChange={(e) => handleToggleSubtask(sub.id, e.target.checked)}
                                            className="w-4 h-4 rounded border-white/10 bg-black text-brand-red focus:ring-brand-red focus:ring-offset-0"
                                        />
                                        <span className={`text-sm flex-1 ${sub.completed ? 'text-gray-600 line-through' : 'text-gray-300'}`}>
                                            {sub.title}
                                        </span>
                                        <button 
                                            onClick={() => handleDeleteSubtask(sub.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                <form onSubmit={handleAddSubtask} className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Add a subtask..."
                                        value={newSubtaskTitle}
                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                        className="w-full bg-transparent border border-dashed border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/20 pl-10"
                                    />
                                    <Plus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                </form>
                            </div>
                        </div>
                    </section>
                ) : collabOverlayTarget.type === 'task' ? (
                    <section className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-6 space-y-4">
                        <div className="flex flex-col items-center text-center space-y-2 mb-2">
                            <div className="w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red">
                                <CheckCircle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white">No task created yet</h3>
                            <p className="text-xs text-gray-500 max-w-xs">Assign this issue to a team member to track progress and get notifications.</p>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Description (Optional)</label>
                                <textarea 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-red/50 resize-none min-h-[80px]"
                                    placeholder="What needs to be done?"
                                    value={newTaskDescription}
                                    onChange={(e) => setNewTaskDescription(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Priority</label>
                                    <div className="flex gap-2">
                                        {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setNewTaskPriority(p)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                                    newTaskPriority === p 
                                                    ? 'bg-brand-red text-white' 
                                                    : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button 
                                    onClick={handleCreateTask}
                                    disabled={isCreatingTask}
                                    className="px-6 py-2.5 bg-brand-red hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    {isCreatingTask ? 'Creating...' : 'Create Task'}
                                </button>
                            </div>
                        </div>
                    </section>
                ) : null}

                {/* Discussion Thread */}
                <section className="space-y-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare size={14} className="text-blue-500" /> Discussion
                    </h3>
                    
                    <div className="space-y-6">
                        {loading && comments.length === 0 ? (
                            <div className="py-10 text-center">
                                <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-xs text-gray-500 italic">Loading conversation...</p>
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="py-10 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/5">
                                <p className="text-xs text-gray-500">No comments yet. Start the conversation!</p>
                            </div>
                        ) : (
                            comments.map(comment => (
                                <div key={comment.id} className="flex gap-4 group">
                                    {comment.user_avatar ? (
                                        <img src={comment.user_avatar} className="w-8 h-8 rounded-full flex-shrink-0" alt="" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 flex-shrink-0">
                                            <User size={16} />
                                        </div>
                                    )}
                                    <div className="flex-1 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white">{comment.user_name}</span>
                                            <span className="text-[10px] text-gray-500">
                                                {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-300 leading-relaxed bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5">
                                            {comment.text}
                                        </div>
                                        <div className="flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1 text-gray-500 hover:text-white transition-colors">
                                                <Smile size={14} />
                                            </button>
                                            <button className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-tighter">Reply</button>
                                            {!comment.resolved && (
                                                <button 
                                                    onClick={() => handleResolveComment(comment.id)}
                                                    className="text-[10px] font-bold text-gray-500 hover:text-green-500 uppercase tracking-tighter"
                                                >
                                                    Resolve
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-white/10 bg-[#0A0A0A]">
                <div className="relative">
                    <textarea 
                        placeholder="Write a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendComment();
                            }
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/30 focus:ring-1 focus:ring-brand-red/30 transition-all resize-none min-h-[100px]"
                    />
                    <button 
                        onClick={handleSendComment}
                        disabled={!commentText.trim()}
                        className="absolute right-3 bottom-3 p-2 bg-brand-red hover:bg-red-600 disabled:bg-white/5 disabled:text-gray-600 text-white rounded-xl transition-all shadow-lg"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <p className="mt-3 text-[10px] text-gray-600 flex items-center gap-1.5 px-1">
                    <AlertCircle size={10} /> Tip: Use @name to mention a teammate
                </p>
            </div>
        </div>
    );
};
