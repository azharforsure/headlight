import React, { useMemo } from 'react';
import { CheckSquare, FileText, User } from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';

function isCompetitiveTask(task: any): boolean {
    const title = String(task?.title || '').toLowerCase();
    const category = String(task?.category || '').toLowerCase();
    return (
        category.includes('comp') ||
        category.includes('competitive') ||
        title.includes('competitor') ||
        title.includes('competitive')
    );
}

export default function CompTasksTab() {
    const { tasks, setShowCollabOverlay, setCollabOverlayTarget } = useSeoCrawler();

    const compTasks = useMemo(() => (tasks || []).filter(isCompetitiveTask), [tasks]);

    return (
        <div className="custom-scrollbar h-full space-y-4 overflow-y-auto p-3">
            <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#888]">Competitive Tasks</h4>
                <span className="font-mono text-[10px] text-[#555]">{compTasks.length} Total</span>
            </div>

            {compTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded border border-dashed border-[#222] bg-[#141414] py-12 text-[#666]">
                    <CheckSquare size={32} className="text-[#222]" />
                    <div className="text-center">
                        <p className="text-[11px]">No competitive tasks yet.</p>
                        <button
                            onClick={() => {
                                setCollabOverlayTarget({
                                    type: 'task',
                                    id: `new-${Math.random().toString(36).slice(2, 10)}`,
                                    title: 'New Competitive Task',
                                });
                                setShowCollabOverlay(true);
                            }}
                            className="mt-3 text-[10px] font-bold uppercase tracking-widest text-brand-red hover:underline"
                        >
                            Create task
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {compTasks.map((task) => (
                        <button
                            key={task.id}
                            onClick={() => {
                                setCollabOverlayTarget({ type: 'task', id: task.id, title: task.title });
                                setShowCollabOverlay(true);
                            }}
                            className="group w-full rounded border border-[#222] bg-[#141414] p-3 text-left transition-all hover:bg-[#1a1a1a]"
                        >
                            <div className="mb-2 flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-[11px] font-bold text-white transition-colors group-hover:text-brand-red">
                                        {task.title}
                                    </div>
                                    <div className="mt-0.5 text-[9px] uppercase text-gray-500">
                                        {task.priority} • {task.status}
                                    </div>
                                </div>
                                {task.assignee_id ? (
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-red/20 text-[8px] font-bold text-brand-red">
                                        {task.assignee_name?.[0] || 'U'}
                                    </div>
                                ) : (
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-gray-600">
                                        <User size={10} />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-[#555]">
                                <div className="flex items-center gap-2">
                                    <span className="rounded border border-white/5 bg-black px-1.5 py-0.5">{task.source}</span>
                                    {task.description ? (
                                        <span className="inline-flex items-center gap-1 text-[#666]">
                                            <FileText size={9} />
                                            Details
                                        </span>
                                    ) : null}
                                </div>
                                <span>{new Date(task.created_at).toLocaleDateString()}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
