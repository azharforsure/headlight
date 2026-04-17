import React, { useMemo, useRef, useState, lazy, Suspense } from 'react';
import { ChevronDown, ChevronRight, Folder, FileText as FileIcon, Search as SearchIcon, Box, Square } from 'lucide-react';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import ViewHeader     from './shared/ViewHeader';
import EmptyViewState from './shared/EmptyViewState';

const ForceGraph2D = lazy(() => import('react-force-graph-2d'));
const ForceGraph3D = lazy(() => import('react-force-graph-3d'));

const ACTION_COLOR: Record<string, string> = {
    'Fix Errors':'#ef4444','Protect High-Value Page':'#eab308','Rewrite Title & Description':'#3b82f6',
    'Push to Page One':'#a855f7','Add Internal Links':'#f97316','Fix Technical Issues':'#ef4444',
    'Improve Content':'#3b82f6','Reduce Bounce Rate':'#eab308','Merge or Remove':'#9ca3af','Monitor':'#22c55e',
};

type TreeNode = {
    name: string;
    path: string;
    page?: any;
    children: Map<string, TreeNode>;
    count: number;
    actionCount: number;
};

function buildTree(pages: any[]): TreeNode {
    const root: TreeNode = { name: '/', path: '/', children: new Map(), count: 0, actionCount: 0 };
    for (const page of pages) {
        let pathname = '/';
        try { pathname = new URL(page.url).pathname || '/'; } catch {}
        const segs = pathname.split('/').filter(Boolean);
        let cur = root;
        cur.count += 1;
        if (page.recommendedAction && page.recommendedAction !== 'Monitor') cur.actionCount += 1;
        const accum: string[] = [];
        segs.forEach((seg, idx) => {
            accum.push(seg);
            const segPath = '/' + accum.join('/');
            if (!cur.children.has(seg)) {
                cur.children.set(seg, { name: seg, path: segPath, children: new Map(), count: 0, actionCount: 0 });
            }
            cur = cur.children.get(seg)!;
            cur.count += 1;
            if (page.recommendedAction && page.recommendedAction !== 'Monitor') cur.actionCount += 1;
            if (idx === segs.length - 1) cur.page = page;
        });
        if (segs.length === 0) root.page = page;
    }
    return root;
}

function TreeRow({
    node, depth, search, selectedUrl, onSelect,
}: {
    node: TreeNode;
    depth: number;
    search: string;
    selectedUrl?: string;
    onSelect: (page: any) => void;
}) {
    const [open, setOpen] = useState(depth < 1);
    const hasKids = node.children.size > 0;
    const isLeaf  = !!node.page && !hasKids;
    const actionRatio = node.count > 0 ? node.actionCount / node.count : 0;
    const heatColor =
        actionRatio > 0.5 ? 'bg-red-500/15'
      : actionRatio > 0.2 ? 'bg-orange-500/10'
      : actionRatio > 0   ? 'bg-yellow-500/5'
                          : 'bg-transparent';
    const selected = selectedUrl && node.page?.url === selectedUrl;
    const matches = !search || node.name.toLowerCase().includes(search.toLowerCase());

    if (search && !matches) {
        // show only if any descendant matches — recurse and prune
        const renderedChildren = [...node.children.values()]
            .map((c) => <TreeRow key={c.path} node={c} depth={depth + 1} search={search} selectedUrl={selectedUrl} onSelect={onSelect} />)
            .filter(Boolean);
        if (renderedChildren.length === 0) return null;
        return <div>{renderedChildren}</div>;
    }

    return (
        <div>
            <div
                onClick={() => { if (hasKids) setOpen(!open); if (node.page) onSelect(node.page); }}
                className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer ${heatColor} ${selected ? 'bg-[#F5364E]/15 ring-1 ring-[#F5364E]/40' : 'hover:bg-[#111]'}`}
                style={{ paddingLeft: 8 + depth * 10 }}
            >
                {hasKids
                    ? (open ? <ChevronDown size={10} className="text-[#666]" /> : <ChevronRight size={10} className="text-[#666]" />)
                    : <span className="w-[10px]" />}
                {isLeaf ? <FileIcon size={10} className="text-[#666]" /> : <Folder size={10} className="text-[#888]" />}
                <span className={`text-[11px] truncate flex-1 ${isLeaf ? 'text-[#ccc]' : 'text-white'}`}>{node.name}</span>
                <span className="text-[9px] font-mono text-[#666]">{node.count}</span>
                {node.actionCount > 0 && (
                    <span className="text-[9px] font-mono text-red-400">{node.actionCount}⚠</span>
                )}
            </div>
            {open && hasKids && (
                <div>
                    {[...node.children.values()]
                        .sort((a, b) => b.count - a.count)
                        .map((c) => (
                            <TreeRow
                                key={c.path}
                                node={c}
                                depth={depth + 1}
                                search={search}
                                selectedUrl={selectedUrl}
                                onSelect={onSelect}
                            />
                        ))}
                </div>
            )}
        </div>
    );
}

export default function WqaStructureView() {
    const ctx = useSeoCrawler() as any;
    const { filteredWqaPagesExport = [], graphData, setSelectedPage, selectedPage } = ctx;
    const fg2dRef = useRef<any>(null);
    const fg3dRef = useRef<any>(null);

    const [mode3D, setMode3D] = useState(false);
    const [search, setSearch] = useState('');

    const tree = useMemo(() => buildTree(filteredWqaPagesExport), [filteredWqaPagesExport]);

    const coloredNodes = useMemo(() => {
        const index = new Map(filteredWqaPagesExport.map((p: any) => [p.url, p]));
        return (graphData?.nodes || []).map((n: any) => {
            const page: any = index.get(n.fullUrl || n.id);
            const action = page?.recommendedAction || 'Monitor';
            return {
                ...n,
                color: ACTION_COLOR[action] || '#666',
                action,
                val: Math.max(1, Math.log2((n.inlinks || 0) + 2)),
            };
        });
    }, [graphData, filteredWqaPagesExport]);

    const handleNodeClick = (n: any) => {
        const page = filteredWqaPagesExport.find((p: any) => p.url === (n.fullUrl || n.id));
        if (page) setSelectedPage(page);
    };

    if (filteredWqaPagesExport.length === 0) {
        return <EmptyViewState title="Nothing to visualize yet" subtitle="Run a crawl to see the site tree and link graph." />;
    }

    return (
        <div className="flex-1 flex flex-col bg-[#070707] overflow-hidden">
            <div className="h-[40px] px-4 border-b border-[#111] bg-[#080808] flex items-center justify-between shrink-0">
                <span className="text-[11px] text-[#555] uppercase tracking-widest font-bold">Structure</span>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <SearchIcon size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#555]" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter paths"
                            className="h-[24px] pl-7 pr-2 w-[140px] text-[10px] bg-[#0a0a0a] border border-[#1e1e1e] rounded text-[#ddd] placeholder-[#555] focus:outline-none focus:border-[#F5364E]"
                        />
                    </div>
                    <div className="flex items-center bg-[#0a0a0a] border border-[#1e1e1e] rounded p-0.5">
                        <button
                            onClick={() => setMode3D(false)}
                            className={`h-[20px] px-1.5 text-[9px] rounded flex items-center gap-1 ${!mode3D ? 'bg-[#1a1a1a] text-white' : 'text-[#555] hover:text-[#ccc]'}`}
                        >
                            <Square size={8} /> 2D
                        </button>
                        <button
                            onClick={() => setMode3D(true)}
                            className={`h-[20px] px-1.5 text-[9px] rounded flex items-center gap-1 ${mode3D ? 'bg-[#1a1a1a] text-white' : 'text-[#555] hover:text-[#ccc]'}`}
                        >
                            <Box size={8} /> 3D
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden min-h-0">
                <aside className="w-[320px] shrink-0 border-r border-[#1a1a1a] flex flex-col bg-[#080808]">
                    <div className="h-[30px] px-3 flex items-center border-b border-[#1a1a1a] shrink-0">
                        <span className="text-[9px] text-[#666] uppercase tracking-widest font-bold">URL tree</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
                        <TreeRow
                            node={tree}
                            depth={0}
                            search={search}
                            selectedUrl={selectedPage?.url}
                            onSelect={setSelectedPage}
                        />
                    </div>
                </aside>

                <div className="flex-1 relative min-h-0">
                    <div className="absolute top-3 left-3 z-10 bg-[#0a0a0a]/90 backdrop-blur border border-[#1e1e1e] rounded-lg px-3 py-2 text-[10px] max-w-[240px]">
                        <div className="text-[#666] uppercase tracking-widest mb-1.5">Action legend</div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                            {Object.entries(ACTION_COLOR).map(([a, c]) => (
                                <div key={a} className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c }} />
                                    <span className="text-[#aaa] truncate">{a}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Suspense fallback={<div className="h-full flex items-center justify-center text-[#444] text-[11px]">Loading graph…</div>}>
                        {mode3D ? (
                            <ForceGraph3D
                                ref={fg3dRef}
                                graphData={{ nodes: coloredNodes, links: graphData?.links || [] }}
                                backgroundColor="#070707"
                                nodeLabel={(n: any) => `${n.title || n.name || n.id}\n${n.fullUrl || n.id}\nAction: ${n.action}`}
                                nodeColor={(n: any) => n.color}
                                nodeVal={(n: any) => n.val}
                                linkColor={() => 'rgba(255,255,255,0.08)'}
                                linkWidth={0.6}
                                onNodeClick={handleNodeClick}
                            />
                        ) : (
                            <ForceGraph2D
                                ref={fg2dRef}
                                graphData={{ nodes: coloredNodes, links: graphData?.links || [] }}
                                backgroundColor="#070707"
                                nodeLabel={(n: any) => `${n.title || n.name || n.id}\n${n.fullUrl || n.id}\nAction: ${n.action}`}
                                nodeColor={(n: any) => n.color}
                                nodeVal={(n: any) => n.val}
                                linkColor={() => 'rgba(255,255,255,0.10)'}
                                linkWidth={0.6}
                                cooldownTicks={100}
                                onNodeClick={handleNodeClick}
                            />
                        )}
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
