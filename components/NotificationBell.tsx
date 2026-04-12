import React, { useState } from 'react';
import { Bell, MessageSquare, CheckSquare, Sparkles, ExternalLink } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { useProject } from '../services/ProjectContext';
import { useNotifications } from '../hooks/useNotifications';
import { useSeoCrawler } from '../contexts/SeoCrawlerContext';

export const NotificationBell = () => {
    const { user } = useAuth();
    const { activeProject } = useProject();
    const crawler = useSeoCrawler();
    
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id, activeProject?.id);

    const handleViewAll = () => {
        if (crawler) {
            crawler.setActiveAuditTab('logs');
            crawler.setShowAuditSidebar(true);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button 
                id="header-notification-bell"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all relative"
            >
                <Bell size={14} />
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
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#151515]">
                            <h3 className="font-bold text-white text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={() => markAllAsRead()}
                                    className="text-[10px] text-brand-red hover:text-white font-bold uppercase transition-colors"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-10 text-center space-y-3">
                                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-700">
                                        <Bell size={18} />
                                    </div>
                                    <p className="text-gray-500 italic text-xs">No notifications yet.</p>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div 
                                        key={n.id}
                                        onClick={() => markAsRead(n.id)}
                                        className={`p-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors relative ${!n.read ? 'bg-brand-red/[0.02]' : ''}`}
                                    >
                                        {!n.read && (
                                            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-brand-red rounded-full shadow-[0_0_8px_rgba(245,54,78,0.5)]" />
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
                                                <p className={`text-xs leading-relaxed ${!n.read ? 'text-white font-bold' : 'text-gray-300'}`}>{n.title}</p>
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

                        <div className="p-3 bg-[#151515] border-t border-white/5 text-center">
                            <button 
                                onClick={handleViewAll}
                                className="w-full py-2 text-[10px] font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all uppercase tracking-widest"
                            >
                                View All Activity
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
