import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, CheckSquare, Sparkles, X, ExternalLink } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { useProject } from '../services/ProjectContext';
import { getActivityFeed, markRead, getUnreadCount } from '../services/ActivityService';
import type { NotificationRecord as Notification } from '../services/app-types';
import { crawlDb } from '../services/CrawlDatabase';

export const NotificationBell = () => {
    const { user } = useAuth();
    const { activeProject } = useProject();
    
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;

        const loadNotifications = async () => {
            try {
                // For simplicity, we fetch all notifications for the user
                const list = await crawlDb.notifications
                    .where('userId').equals(user.id)
                    .reverse()
                    .limit(20)
                    .toArray();
                setNotifications(list);
                
                const count = await getUnreadCount(user.id, activeProject?.id);
                setUnreadCount(count);
            } catch (err) {
                console.error('Failed to load notifications:', err);
            }
        };

        loadNotifications();
        
        // Polling for demo purposes, in real app use WebSockets
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, [user, activeProject?.id]);

    const handleMarkRead = async (id: string) => {
        await markRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all relative"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-brand-red text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[#050505]">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-[#111] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center">
                            <h3 className="font-bold text-white text-sm">Notifications</h3>
                            <button className="text-[10px] text-gray-500 hover:text-white font-bold uppercase">Mark all read</button>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-10 text-center text-gray-500 italic text-xs">
                                    No notifications yet.
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div 
                                        key={n.id}
                                        onClick={() => handleMarkRead(n.id)}
                                        className={`p-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors relative ${!n.read ? 'bg-brand-red/[0.02]' : ''}`}
                                    >
                                        {!n.read && (
                                            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-brand-red rounded-full" />
                                        )}
                                        <div className="flex gap-3">
                                            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                                                n.type === 'mention' ? 'bg-blue-500/10 text-blue-500' :
                                                n.type === 'task_assigned' ? 'bg-green-500/10 text-green-500' :
                                                'bg-brand-red/10 text-brand-red'
                                            }`}>
                                                {n.type === 'mention' ? <MessageSquare size={14} /> :
                                                 n.type === 'task_assigned' ? <CheckSquare size={14} /> :
                                                 <Sparkles size={14} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs ${!n.read ? 'text-white font-bold' : 'text-gray-300'}`}>{n.title}</p>
                                                {n.body && (
                                                    <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{n.body}</p>
                                                )}
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-[9px] text-gray-600 font-mono">
                                                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {n.link_url && (
                                                        <a 
                                                            href={n.link_url} 
                                                            className="text-[9px] font-bold text-brand-red flex items-center gap-1 hover:underline"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            View <ExternalLink size={8} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-3 bg-white/[0.02] border-t border-white/5 text-center">
                            <button className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest">
                                View All Activity
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
