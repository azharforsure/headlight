import React, { useState } from 'react';
import { Bookmark, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';

export default function WqaSavedViews() {
	const {
		savedWqaViews,
		saveWqaView,
		renameWqaView,
		deleteWqaView,
		applyWqaView,
		activeWqaViewId,
	} = useSeoCrawler();

	const [creating, setCreating] = useState(false);
	const [draftName, setDraftName] = useState('');
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingName, setEditingName] = useState('');

	const confirmCreate = () => {
		const name = draftName.trim();
		if (!name) return;
		saveWqaView(name);
		setDraftName('');
		setCreating(false);
	};

	const confirmRename = () => {
		if (!editingId) return;
		const name = editingName.trim();
		if (!name) return;
		renameWqaView(editingId, name);
		setEditingId(null);
		setEditingName('');
	};

	return (
		<div className="border-b border-[#1a1a1a] py-2">
			<div className="flex items-center justify-between px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#666]">
				<span className="flex items-center gap-1.5">
					<Bookmark size={11} /> Saved Views
				</span>
				<button
					onClick={() => setCreating(true)}
					className="text-[#555] hover:text-white"
					title="Save current filters as a view"
				>
					<Plus size={12} />
				</button>
			</div>

			{creating && (
				<div className="flex items-center gap-1 px-3 pb-1">
					<input
						autoFocus
						value={draftName}
						onChange={(e) => setDraftName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') confirmCreate();
							if (e.key === 'Escape') setCreating(false);
						}}
						placeholder="View name"
						className="h-6 flex-1 rounded border border-[#222] bg-[#0a0a0a] px-2 text-[11px] text-white outline-none focus:border-[#333]"
					/>
					<button onClick={confirmCreate} className="text-green-400 hover:text-green-300">
						<Check size={12} />
					</button>
					<button onClick={() => setCreating(false)} className="text-[#555] hover:text-white">
						<X size={12} />
					</button>
				</div>
			)}

			<div className="mt-1 space-y-0.5 px-1">
				{savedWqaViews.length === 0 && !creating && (
					<div className="px-3 py-1 text-[10px] text-[#555]">
						Save your current filters to come back to them later.
					</div>
				)}

				{savedWqaViews.map((view) => {
					const active = view.id === activeWqaViewId;
					const isEditing = editingId === view.id;
					return (
						<div
							key={view.id}
							className={`group flex items-center gap-1 rounded px-2 py-1 text-[11px] ${
								active ? 'bg-[#F5364E]/10 text-[#F5364E]' : 'text-[#aaa] hover:bg-[#161616]'
							}`}
						>
							{isEditing ? (
								<>
									<input
										autoFocus
										value={editingName}
										onChange={(e) => setEditingName(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') confirmRename();
											if (e.key === 'Escape') setEditingId(null);
										}}
										className="h-6 flex-1 rounded border border-[#222] bg-[#0a0a0a] px-2 text-[11px] text-white outline-none focus:border-[#333]"
									/>
									<button onClick={confirmRename} className="text-green-400">
										<Check size={11} />
									</button>
									<button onClick={() => setEditingId(null)} className="text-[#555]">
										<X size={11} />
									</button>
								</>
							) : (
								<>
									<button
										onClick={() => applyWqaView(view.id)}
										className="flex-1 truncate text-left"
									>
										{view.name}
									</button>
									<button
										onClick={() => {
											setEditingId(view.id);
											setEditingName(view.name);
										}}
										className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-white"
									>
										<Pencil size={11} />
									</button>
									<button
										onClick={() => deleteWqaView(view.id)}
										className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-red-400"
									>
										<Trash2 size={11} />
									</button>
								</>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
