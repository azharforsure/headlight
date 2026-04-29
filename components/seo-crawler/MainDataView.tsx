import React, { useState, useEffect, lazy, Suspense, useMemo, useRef, ReactNode } from 'react';
import { 
    List, Map as MapIcon, ChevronDown, ChevronUp, AlignLeft, Search, Download, CheckCircle2,
    Focus, EyeOff, X, AlertCircle, Sparkles, Expand, Shrink,
    MessageSquare, CheckSquare, BarChart3
} from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { ALL_COLUMNS, formatBytes } from './constants';
import InspectorShell from './inspector/InspectorShell';
import FullDetailDrawer from './inspector/FullDetailDrawer';
import ChartsView from './ChartsView';
import { WqaInspectorShell } from './wqa/inspector';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import MobilePageCard from './MobilePageCard';
import MobilePageDetail from './MobilePageDetail';
import { TableVirtuoso } from 'react-virtuoso';
import ColumnHeaderContextMenu from './ColumnHeaderContextMenu';
import BulkActionsBar from './BulkActionsBar';
import { SkeletonTable } from './Skeletons';
import { computeWqaActionGroups, computeWqaSiteStats } from '../../services/right-sidebar/wqa';
import { getEffectiveIndustry, getEffectiveLanguage } from '../../services/WebsiteQualityModeTypes';
import TierBadge from './wqa/views/shared/TierBadge';
const WqaFilterSidebar = lazy(() => import('./wqa/WqaFilterSidebar'));


const ForceGraph3D = lazy(() => import('react-force-graph-3d'));

const ACTION_COLORS: Record<string, { text: string; bg: string; border: string }> = {
    'Fix Errors': { text: '#FCA5A5', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' },
    'Protect High-Value Page': { text: '#FCD34D', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
    'Rewrite Title & Description': { text: '#93C5FD', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)' },
    'Push to Page One': { text: '#C4B5FD', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)' },
    'Add Internal Links': { text: '#FDBA74', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)' },
    'Fix Technical Issues': { text: '#FCA5A5', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' },
    'Improve Content': { text: '#93C5FD', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)' },
    'Reduce Bounce Rate': { text: '#FCD34D', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
    'Merge or Remove': { text: '#D1D5DB', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.35)' },
    'Monitor': { text: '#86EFAC', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)' }
};

const getSafePathname = (url: string) => {
    try {
        return new URL(url).pathname || url;
    } catch {
        return url;
    }
};



export default function AuditPane() {
    const { isMobile, isTablet } = useBreakpoint();
    const [tagInput, setTagInput] = useState('');
    const [resizingCol, setResizingCol] = useState<{ key: string; startX: number; startWidth: number } | null>(null);
    const [mapMode, setMapMode] = useState<'2d' | '3d'>('2d');
    const [hoveredMapNode, setHoveredMapNode] = useState<any | null>(null);
    const [mapScope, setMapScope] = useState<'all' | 'issues' | 'deep' | 'important' | 'focus'>('all');
    const [isMapWorkspaceOpen, setIsMapWorkspaceOpen] = useState(false);
    const [collapsedMapNodeIds, setCollapsedMapNodeIds] = useState<Set<string>>(new Set());
    const [nodePositionOverrides, setNodePositionOverrides] = useState<Record<string, { x: number; y: number }>>({});
    const [dragState, setDragState] = useState<null | (
        { type: 'pan'; startX: number; startY: number; scrollLeft: number; scrollTop: number } |
        { type: 'node'; nodeId: string; startX: number; startY: number; originX: number; originY: number }
    )>(null);
    const architectureCanvasRef = useRef<HTMLDivElement | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showFullDetailDrawer, setShowFullDetailDrawer] = useState(false);
    const [headerContextMenu, setHeaderContextMenu] = useState<{x: number, y: number, col: any} | null>(null);
    
    const {
        stats, activeMacro, setActiveMacro,
        showColumnPicker, setShowColumnPicker,
        visibleColumns, setVisibleColumns,
        viewMode, setViewMode,
        searchQuery, setSearchQuery,
        crawlRuntime,
        pages, filteredPages, isCrawling,
        graphContainerRef, graphDimensions, fgRef, graphData,
        selectedRows, setSelectedRows,
        columns, handleSort, sortConfig,
        selectedPage, setSelectedPage,
        ignoredUrls, setIgnoredUrls, urlTags, setUrlTags,
        columnWidths, setColumnWidths,
        detailsHeight,
        gridScrollOffset, setGridScrollOffset,
        handleExportRawDB,
        handleNodeClick,
        showTrialLimitAlert, setShowTrialLimitAlert,
        runSelectedEnrichment,
        integrationConnections,
        setShowCollabOverlay, setCollabOverlayTarget,
        wqaState, setWqaState,
        runAIAnalysis,
        aiNarrative,
        filteredWqaPagesExport, wqaFilter, setWqaFilter,
        isWqaMode,
        wqaSidebarTab, setWqaSidebarTab,
        foundationMetricsMap, foundationHydrated, crawlerFoundationEnabled
    } = useSeoCrawler();

    const isCompactLayout = isMobile || isTablet;
    const displayColumns = useMemo(
        () => (isTablet ? columns.slice(0, Math.min(columns.length, 5)) : columns),
        [columns, isTablet]
    );

    useEffect(() => {
        if (!selectedPage) {
            setShowFullDetailDrawer(false);
        }
    }, [selectedPage]);

    const [SpriteText, setSpriteText] = useState<any>(null);
    const [THREE, setTHREE] = useState<any>(null);
    const graphWidth = Math.max(640, graphDimensions.width || graphContainerRef.current?.clientWidth || 0);
    const graphHeight = Math.max(420, graphDimensions.height || graphContainerRef.current?.clientHeight || 0);
    const workspaceGraphWidth = typeof window !== 'undefined' ? Math.max(960, window.innerWidth - 48) : graphWidth;
    const workspaceGraphHeight = typeof window !== 'undefined' ? Math.max(640, window.innerHeight - 48) : graphHeight;
    const mapSummary = useMemo(() => {
        const hiddenNodeCount = pages.length > 2000
            ? graphData.nodes.filter((node: any) => !(node.internalPageRank > 10 || node.crawlDepth < 3)).length
            : 0;
        const sections = new Set(graphData.nodes.map((node: any) => node.sectionKey || 'Other'));
        const maxDepth = graphData.nodes.reduce((max: number, node: any) => Math.max(max, Number(node.crawlDepth || 0)), 0);

        return {
            nodeCount: graphData.nodes.length,
            linkCount: graphData.links.length,
            hiddenNodeCount,
            sectionCount: sections.size,
            maxDepth
        };
    }, [graphData, pages.length]);
    const mapPerformanceProfile = useMemo(() => {
        const nodeCount = graphData.nodes.length;
        const linkCount = graphData.links.length;
        const showLabels = nodeCount <= 1200;
        const showDirectionalParticles = linkCount <= 250;
        const nodeResolution = nodeCount > 1500 ? 10 : nodeCount > 700 ? 16 : 24;
        const linkWidth = nodeCount > 1200 ? 0.2 : nodeCount > 500 ? 0.35 : 0.5;
        const nodeRelSize = nodeCount > 1500 ? 2 : nodeCount > 700 ? 3 : 4;
        const useDagLayout = nodeCount > 0 && nodeCount <= 4000;
        const dagLevelDistance = nodeCount > 1200 ? 60 : nodeCount > 500 ? 85 : 110;

        return {
            nodeCount,
            showLabels,
            showDirectionalParticles,
            nodeResolution,
            linkWidth,
            nodeRelSize,
            useDagLayout,
            dagLevelDistance
        };
    }, [graphData]);
    const rootMapNodeId = useMemo(() => {
        return graphData.nodes.find((node: any) => node.crawlDepth === 0)?.id || graphData.nodes[0]?.id || null;
    }, [graphData]);
    const architectureProfile = useMemo(() => {
        const nodeCount = graphData.nodes.length;
        return {
            useCompactCards: nodeCount > 180 || graphWidth < 1180,
            showAmbientLinks: nodeCount <= 120
        };
    }, [graphData, graphWidth]);

    const effectiveIndustry = useMemo(
        () => (wqaState.industryOverride ?? wqaState.detectedIndustry),
        [wqaState.industryOverride, wqaState.detectedIndustry]
    );
    const wqaStats = useMemo(
        () => wqaState.siteStats || (pages.length ? computeWqaSiteStats(pages, effectiveIndustry) : null),
        [wqaState.siteStats, pages, effectiveIndustry]
    );
    const wqaActionGroups = useMemo(
        () => (wqaState.actionGroups.length ? wqaState.actionGroups : computeWqaActionGroups(pages)),
        [wqaState.actionGroups, pages]
    );

    const getNodeColor = (node: any) => {
        if (node.status >= 400) return '#ff2d55'; // Error Red
        if (node.status >= 300) return '#ff9500'; // Redirect Orange
        
        // Heatmap: Prioritize traffic signals
        if (node.gscClicks > 50) return '#00fff2'; // High Traffic Cyan
        if (node.gscImpressions > 1000) return '#007aff'; // High Visibility Blue
        
        if (node.searchIntent === 'Transactional') return '#5856d6';
        if (node.searchIntent === 'Commercial') return '#007aff';
        if (node.internalPageRank > 8) return '#ffcc00';
        return '#34c759'; // Balanced Green
    };
    const selectedMapNodeId = selectedPage?.url || null;
    const activeMapNode = hoveredMapNode || (selectedMapNodeId ? graphData.nodes.find((node: any) => node.id === selectedMapNodeId) : null) || null;
    const activeMapNodeId = activeMapNode?.id || null;
    const mapGraphData = useMemo(() => {
        if (mapScope === 'all' || graphData.nodes.length === 0) return graphData;

        const selectedNodeId = selectedMapNodeId;
        const neighborIds = new Set<string>();
        if (selectedNodeId) {
            neighborIds.add(selectedNodeId);
            graphData.links.forEach((link: any) => {
                const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
                const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
                if (sourceId === selectedNodeId && targetId) neighborIds.add(targetId);
                if (targetId === selectedNodeId && sourceId) neighborIds.add(sourceId);
            });
        }

        const allowedNodeIds = new Set(
            graphData.nodes
                .filter((node: any) => {
                    if (mapScope === 'issues') return node.status >= 300 || node.id === rootMapNodeId;
                    if (mapScope === 'deep') return node.crawlDepth >= 3 || node.id === rootMapNodeId;
                    if (mapScope === 'important') return node.id === rootMapNodeId || node.inlinks >= 5 || node.internalPageRank >= 10;
                    if (mapScope === 'focus') return neighborIds.has(node.id);
                    return true;
                })
                .map((node: any) => node.id)
        );

        if (mapScope === 'focus' && !selectedNodeId) {
            return graphData;
        }

        return {
            nodes: graphData.nodes.filter((node: any) => allowedNodeIds.has(node.id)),
            links: graphData.links.filter((link: any) => {
                const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
                const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
                return allowedNodeIds.has(sourceId) && allowedNodeIds.has(targetId);
            })
        };
    }, [graphData, mapScope, rootMapNodeId, selectedMapNodeId]);
    const mapIntelligence = useMemo(() => {
        const sectionCounts = new Map<string, number>();
        mapGraphData.nodes.forEach((node: any) => {
            const key = node.sectionKey || 'Other';
            sectionCounts.set(key, (sectionCounts.get(key) || 0) + 1);
        });

        const dominantSection = Array.from(sectionCounts.entries()).sort((a, b) => b[1] - a[1])[0];
        const structuralShare = mapGraphData.links.length
            ? Math.round((mapGraphData.links.filter((link: any) => link.isStructural).length / mapGraphData.links.length) * 100)
            : 0;

        return {
            dominantSection: dominantSection?.[0] || 'Homepage',
            structuralShare,
            sections: sectionCounts
        };
    }, [mapGraphData]);
    const architectureChildrenByNode = useMemo(() => {
        const children = new Map<string, string[]>();
        (mapGraphData.links || []).forEach((link: any) => {
            const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
            const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
            const sourceNode = mapGraphData.nodes.find((node: any) => node.id === sourceId);
            const targetNode = mapGraphData.nodes.find((node: any) => node.id === targetId);
            if (!sourceId || !targetId || !sourceNode || !targetNode) return;
            if (Number(targetNode.crawlDepth || 0) !== Number(sourceNode.crawlDepth || 0) + 1) return;
            if (!children.has(sourceId)) children.set(sourceId, []);
            children.get(sourceId)?.push(targetId);
        });
        return children;
    }, [mapGraphData]);
    const hiddenNodeIds = useMemo(() => {
        const hidden = new Set<string>();
        const walk = (nodeId: string) => {
            const children = architectureChildrenByNode.get(nodeId) || [];
            children.forEach((childId) => {
                if (hidden.has(childId)) return;
                hidden.add(childId);
                walk(childId);
            });
        };
        collapsedMapNodeIds.forEach(walk);
        return hidden;
    }, [architectureChildrenByNode, collapsedMapNodeIds]);
    const architectureLayout = useMemo(() => {
        const nodes = (mapGraphData.nodes || []).filter((node: any) => !hiddenNodeIds.has(node.id));
        const links = (mapGraphData.links || []).filter((link: any) => {
            const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
            const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
            return !hiddenNodeIds.has(sourceId) && !hiddenNodeIds.has(targetId);
        });
        if (nodes.length === 0) {
            return {
                width: Math.max(graphWidth, 960),
                height: Math.max(graphHeight, 520),
                lanes: [],
                sectionGuides: [],
                nodes: [],
                links: []
            };
        }

        const maxVisibleDepth = 5;
        const laneKeys = Array.from(new Set(nodes.map((node: any) => Math.min(Number(node.crawlDepth || 0), maxVisibleDepth))))
            .map(Number)
            .sort((a, b) => a - b) as number[];
        const sidePadding = graphWidth < 1100 ? 20 : 28;
        const topPadding = 86;
        const bottomPadding = 20;
        const cardWidth = architectureProfile.useCompactCards ? 180 : 212;
        const cardHeight = architectureProfile.useCompactCards ? 56 : 64;
        const minConnectorClearance = architectureProfile.useCompactCards ? 54 : 64;
        const minLaneSpacing = cardWidth + minConnectorClearance;
        const maxLaneSpacing = minLaneSpacing + (architectureProfile.useCompactCards ? 76 : 90);
        const totalInnerWidth = Math.max(cardWidth, graphWidth - (sidePadding * 2));
        const computedLaneSpacing = laneKeys.length > 1
            ? Math.max(minLaneSpacing, Math.min(maxLaneSpacing, (totalInnerWidth - cardWidth) / (laneKeys.length - 1)))
            : 0;
        const laneGap = laneKeys.length > 1 ? computedLaneSpacing : 0;
        const contentWidth = laneKeys.length > 1
            ? cardWidth + ((laneKeys.length - 1) * laneGap)
            : cardWidth;
        const extraHorizontalOffset = Math.max(0, (graphWidth - (sidePadding * 2) - contentWidth) / 2);
        const width = Math.max(graphWidth, sidePadding * 2 + contentWidth);
        const laneWidth = cardWidth + 20;

        const laneBuckets = new Map<number, Map<string, any[]>>();
        laneKeys.forEach((lane) => laneBuckets.set(lane, new Map()));
        nodes.forEach((node: any) => {
            const depth = Math.min(Number(node.crawlDepth || 0), maxVisibleDepth);
            const sectionKey = node.sectionKey || 'Other';
            const lane = laneBuckets.get(depth);
            if (!lane) return;
            if (!lane.has(sectionKey)) lane.set(sectionKey, []);
            lane.get(sectionKey)?.push(node);
        });

        laneBuckets.forEach((sections) => {
            sections.forEach((laneNodes) => {
                laneNodes.sort((a, b) => {
                const scoreA = (Number(a.linkEquity || 0) * 10) + (Number(a.gscClicks || 0) * 1.5);
                const scoreB = (Number(b.linkEquity || 0) * 10) + (Number(b.gscClicks || 0) * 1.5);
                if (scoreA !== scoreB) return scoreB - scoreA;
                return String(a.name || a.id).localeCompare(String(b.name || b.id));
                });
            });
        });

        const laneStride = cardHeight + (architectureProfile.useCompactCards ? 10 : 12);
        const sectionGap = architectureProfile.useCompactCards ? 12 : 14;
        const sectionHeaderHeight = 24;
        const laneHeights = laneKeys.map((laneKey) => {
            const sections = laneBuckets.get(laneKey);
            if (!sections) return topPadding + bottomPadding + 40;
            return Array.from(sections.values()).reduce((total, laneNodes) => {
                return total + sectionHeaderHeight + (laneNodes.length * laneStride) + sectionGap;
            }, topPadding + bottomPadding);
        });
        const height = Math.max(graphHeight, Math.max(...laneHeights, 0) + 40);
        const positionedNodes: any[] = [];
        const sectionGuides: any[] = [];

        laneKeys.forEach((depth) => {
            const laneIndex = laneKeys.indexOf(depth);
            const laneX = laneKeys.length === 1
                ? Math.max(sidePadding, (graphWidth - cardWidth) / 2)
                : sidePadding + extraHorizontalOffset + (laneIndex * laneGap);
            const sections = laneBuckets.get(depth) || new Map<string, any[]>();
            let cursorY = topPadding;

            Array.from(sections.entries())
                .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
                .forEach(([sectionKey, laneNodes]) => {
                    const sectionTop = cursorY;
                    sectionGuides.push({
                        depth,
                        sectionKey,
                        x: laneX - 6,
                        y: sectionTop - 4,
                        width: cardWidth + 12,
                        height: sectionHeaderHeight + (laneNodes.length * laneStride)
                    });

                    cursorY += sectionHeaderHeight;
                    laneNodes.forEach((node: any, nodeIndex: number) => {
                        const override = nodePositionOverrides[node.id];
                        positionedNodes.push({
                            ...node,
                            laneDepth: depth,
                            x: override?.x ?? laneX,
                            y: override?.y ?? (cursorY + (nodeIndex * laneStride)),
                            cardWidth,
                            cardHeight
                        });
                    });

                    cursorY += (laneNodes.length * laneStride) + sectionGap;
                });
        });

        const positionedNodeMap = new Map(positionedNodes.map((node: any) => [node.id, node]));
        const positionedLinks = links
            .map((link: any) => {
                const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
                const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
                const source = positionedNodeMap.get(sourceId);
                const target = positionedNodeMap.get(targetId);
                if (!source || !target) return null;
                return { source, target, sourceId, targetId, isCrossLink: Boolean(link.isCrossLink), isStructural: Boolean(link.isStructural) };
            })
            .filter(Boolean);

        return {
            width,
            height,
            lanes: laneKeys.map((laneDepth, laneIndex) => ({
                id: laneDepth,
                x: laneKeys.length === 1
                    ? Math.max(sidePadding, (graphWidth - cardWidth) / 2)
                    : sidePadding + extraHorizontalOffset + (laneIndex * laneGap),
                width: laneWidth,
                label: laneDepth === maxVisibleDepth ? `Depth ${maxVisibleDepth}+` : `Depth ${laneDepth}`
            })),
            sectionGuides,
            nodes: positionedNodes,
            links: positionedLinks
        };
    }, [mapGraphData, hiddenNodeIds, graphWidth, graphHeight, architectureProfile.useCompactCards, nodePositionOverrides]);
    const focusedNeighborhoodIds = useMemo(() => {
        const ids = new Set<string>();
        if (!activeMapNodeId) return ids;
        ids.add(activeMapNodeId);
        (mapGraphData.links || []).forEach((link: any) => {
            const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
            const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
            if (sourceId === activeMapNodeId && targetId) ids.add(targetId);
            if (targetId === activeMapNodeId && sourceId) ids.add(sourceId);
        });
        return ids;
    }, [activeMapNodeId, mapGraphData]);
    const visibleArchitectureLinks = useMemo(() => {
        const links = architectureLayout.links || [];
        if (activeMapNodeId) {
            return links.filter((link: any) => {
                const laneDelta = Math.abs((link.target?.laneDepth ?? 0) - (link.source?.laneDepth ?? 0));
                return link.sourceId === activeMapNodeId || link.targetId === activeMapNodeId || laneDelta === 1;
            });
        }

        const treeLinks = links.filter((link: any) => {
            const laneDelta = Math.abs((link.target?.laneDepth ?? 0) - (link.source?.laneDepth ?? 0));
            return link.isStructural || laneDelta === 1;
        });
        const treeLinkSet = new Set(treeLinks.map((link: any, index: number) => `${link.sourceId}->${link.targetId}:${index}`));
        const crossLinks = links.filter((link: any, index: number) => !treeLinkSet.has(`${link.sourceId}->${link.targetId}:${index}`));

        const treeBudget = architectureProfile.showAmbientLinks ? 520 : 300;
        const crossBudget = architectureProfile.showAmbientLinks ? 90 : 40;

        return [...treeLinks.slice(0, treeBudget), ...crossLinks.slice(0, crossBudget)];
    }, [architectureLayout, activeMapNodeId, architectureProfile.showAmbientLinks]);
    useEffect(() => {
        if (!dragState) return;

        const handlePointerMove = (e: MouseEvent) => {
            if (dragState.type === 'pan') {
                const canvas = architectureCanvasRef.current;
                if (!canvas) return;
                canvas.scrollLeft = dragState.scrollLeft - (e.clientX - dragState.startX);
                canvas.scrollTop = dragState.scrollTop - (e.clientY - dragState.startY);
                return;
            }

            const nextX = dragState.originX + (e.clientX - dragState.startX);
            const nextY = dragState.originY + (e.clientY - dragState.startY);
            setNodePositionOverrides((prev) => ({
                ...prev,
                [dragState.nodeId]: { x: nextX, y: nextY }
            }));
        };

        const handlePointerUp = () => setDragState(null);

        window.addEventListener('mousemove', handlePointerMove);
        window.addEventListener('mouseup', handlePointerUp);
        return () => {
            window.removeEventListener('mousemove', handlePointerMove);
            window.removeEventListener('mouseup', handlePointerUp);
        };
    }, [dragState]);
    useEffect(() => {
        if (typeof window !== 'undefined' && viewMode === 'map' && mapMode === '3d') {
            if (!SpriteText && mapPerformanceProfile.showLabels) {
                import('three-spritetext').then((mod) => setSpriteText(() => mod.default));
            }
            if (!THREE) {
                import('three').then((mod) => setTHREE(mod));
            }
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingCol) return;
            const currentResizing = resizingCol;
            const deltaX = e.clientX - currentResizing.startX;
            const newWidth = Math.max(50, currentResizing.startWidth + deltaX);
            setColumnWidths(prev => ({ ...prev, [currentResizing.key]: newWidth }));
        };

        const handleMouseUp = () => {
            setResizingCol(null);
        };

        if (resizingCol) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingCol, setColumnWidths, viewMode, mapMode, SpriteText, mapPerformanceProfile.showLabels]);

    const centerMapNodeId = selectedMapNodeId || rootMapNodeId;
    useEffect(() => {
        if (viewMode !== 'map') return;
        if (mapMode === '2d') {
            const canvas = architectureCanvasRef.current;
            if (!canvas) return;

            const timeoutId = window.setTimeout(() => {
                const targetNode = (centerMapNodeId && architectureLayout.nodes.find((node: any) => node.id === centerMapNodeId))
                    || architectureLayout.nodes.find((node: any) => node.id === rootMapNodeId)
                    || architectureLayout.nodes[0];
                if (!targetNode) return;

                const left = Math.max(0, targetNode.x - 120);
                const top = Math.max(0, targetNode.y - 120);
                canvas.scrollTo({ left, top, behavior: 'smooth' });
            }, 180);

            return () => window.clearTimeout(timeoutId);
        }

        const graphInstance = fgRef.current;
        if (!graphInstance) return;

        const scene = graphInstance.scene();
        if (scene && THREE && !scene.userData.hasStars) {
            const starGeometry = new THREE.BufferGeometry();
            const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, transparent: true, opacity: 0.5 });
            const starVertices = [];
            for (let i = 0; i < 3000; i++) {
                const x = (Math.random() - 0.5) * 4000;
                const y = (Math.random() - 0.5) * 4000;
                const z = (Math.random() - 0.5) * 4000;
                starVertices.push(x, y, z);
            }
            starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
            const stars = new THREE.Points(starGeometry, starMaterial);
            scene.add(stars);
            scene.userData.hasStars = true;
        }

        const timeoutId = window.setTimeout(() => {
            try {
                if (typeof graphInstance.zoomToFit === 'function') {
                    graphInstance.zoomToFit(500, 60);
                }
                const rootNode = mapGraphData.nodes.find((node: any) => node.id === centerMapNodeId)
                    || mapGraphData.nodes.find((node: any) => node.id === rootMapNodeId)
                    || mapGraphData.nodes[0];
                if (rootNode && typeof graphInstance.cameraPosition === 'function') {
                    graphInstance.cameraPosition(
                        {
                            x: rootNode.x + 420,
                            y: rootNode.y + 180,
                            z: rootNode.z + 760
                        },
                        rootNode,
                        1100
                    );
                }
            } catch {}
        }, 180);

        return () => window.clearTimeout(timeoutId);
    }, [viewMode, mapMode, mapScope, mapGraphData, fgRef, architectureLayout, centerMapNodeId, rootMapNodeId, THREE]);

    const renderMapView = (workspace = false) => {
        const viewportWidth = workspace ? workspaceGraphWidth : graphWidth;
        const viewportHeight = workspace ? workspaceGraphHeight : graphHeight;

        return (
            <div className={workspace ? "fixed inset-3 z-50 overflow-hidden rounded-[28px] border border-[#2a2a2a] bg-[#090909] shadow-[0_30px_100px_rgba(0,0,0,0.55)] flex flex-col" : "absolute inset-0 bg-[#0d0d0d] overflow-hidden flex flex-col"}>
                {workspace && (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,54,78,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_20%)] pointer-events-none" />
                )}
                <div className="relative flex-1 overflow-hidden">
                    {pages.length > 0 ? (
                        <Suspense fallback={<div className="text-[#666] text-[12px]">Loading map engine...</div>}>
                            {mapMode === '2d' ? (
                                <div className="w-full h-full" />
                            ) : (
                                <ForceGraph3D
                                    ref={fgRef}
                                    width={viewportWidth}
                                    height={viewportHeight}
                                    graphData={mapGraphData}
                                    dagMode={undefined}
                                    nodeLabel={(node: any) => `
                                        <div style="background: rgba(10,10,10,0.95); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 14px; color: #e5e5e5; font-family: Inter, system-ui; font-size: 11px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); min-width: 220px;">
                                            <div style="font-weight: 800; color: #ffffff; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${node.title || node.name}</div>
                                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                                <div style="display: flex; flex-direction: column; gap: 2px;"><span style="color: #666; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em;">Status</span><span style="color: ${node.status >= 400 ? '#ff3b30' : '#34c759'}; font-weight: 700;">${node.status || '-'}</span></div>
                                                <div style="display: flex; flex-direction: column; gap: 2px;"><span style="color: #666; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em;">Depth</span><span style="color: #eee; font-weight: 700;">${node.crawlDepth ?? '-'}</span></div>
                                                <div style="display: flex; flex-direction: column; gap: 2px;"><span style="color: #666; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em;">Authority</span><span style="color: #ffcc00; font-weight: 700;">${Math.round((node.internalPageRank || 0) * 10) / 10}</span></div>
                                                <div style="display: flex; flex-direction: column; gap: 2px;"><span style="color: #666; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em;">Clicks (GSC)</span><span style="color: #00fff2; font-weight: 700;">${node.gscClicks || 0}</span></div>
                                            </div>
                                            <div style="margin-top: 10px; font-size: 9px; color: #a7a7a7;">Section: ${node.sectionKey || 'Homepage'}${node.issueCount ? ` • ${node.issueCount} issue${node.issueCount === 1 ? '' : 's'}` : ''}</div>
                                            <div style="margin-top: 10px; font-size: 9px; color: #444; word-break: break-all; opacity: 0.6;">${node.fullUrl}</div>
                                        </div>
                                    `}
                                    nodeVal={(node: any) => node.val}
                                    nodeColor={getNodeColor}
                                    nodeResolution={mapPerformanceProfile.nodeResolution}
                                    nodeOpacity={1}
                                    nodeRelSize={mapPerformanceProfile.nodeRelSize}
                                    linkCurvature={0.08}
                                    linkVisibility={(link: any) => {
                                        if (!activeMapNodeId) return link.isStructural;
                                        const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
                                        const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
                                        return sourceId === activeMapNodeId || targetId === activeMapNodeId || link.isStructural;
                                    }}
                                    linkColor={(link: any) => {
                                        const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
                                        const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
                                        const isFocused = !!activeMapNodeId && (sourceId === activeMapNodeId || targetId === activeMapNodeId);
                                        if (link.isCrossLink) return isFocused ? 'rgba(0,122,255,0.4)' : 'rgba(255,255,255,0.02)';
                                        return isFocused ? 'rgba(245,54,78,0.5)' : 'rgba(255,255,255,0.06)';
                                    }}
                                    linkWidth={(link: any) => {
                                        const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
                                        const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
                                        const isFocused = !!activeMapNodeId && (sourceId === activeMapNodeId || targetId === activeMapNodeId);
                                        return isFocused ? 1.8 : mapPerformanceProfile.linkWidth;
                                    }}
                                    linkOpacity={activeMapNodeId ? 0.05 : 0.15}
                                    linkDirectionalParticles={(link: any) => mapPerformanceProfile.showDirectionalParticles && (link.isStructural || activeMapNodeId === (typeof link.source === 'string' ? link.source : link.source?.id)) ? 2 : 0}
                                    linkDirectionalParticleSpeed={0.004}
                                    linkDirectionalParticleWidth={2}
                                    linkDirectionalParticleColor={(link: any) => {
                                        const isFocused = !!activeMapNodeId && ((typeof link.source === 'string' ? link.source : link.source?.id) === activeMapNodeId || (typeof link.target === 'string' ? link.target : link.target?.id) === activeMapNodeId);
                                        return isFocused ? '#007aff' : '#F5364E';
                                    }}
                                    onNodeClick={(node: any) => {
                                        handleNodeClick(node);
                                        const distance = 250;
                                        const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
                                        fgRef.current?.cameraPosition(
                                            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                                            node,
                                            1500
                                        );
                                    }}
                                    onNodeHover={(node: any) => setHoveredMapNode(node || null)}
                                    backgroundColor="#030303"
                                    showNavInfo={false}
                                    enableNodeDrag={false}
                                    cooldownTicks={120}
                                    cooldownTime={2500}
                                    nodeThreeObject={(node: any) => {
                                        if (!THREE) return undefined;
                                        const group = new THREE.Group();
                                        const isSelected = activeMapNodeId === node.id;
                                        const sphereSize = Math.max(3.2, (node.val || 4) * 0.7);
                                        const color = getNodeColor(node);
                                        const pillarGeometry = new THREE.CylinderGeometry(sphereSize * 0.72, sphereSize * 0.72, sphereSize * 2.8, 18);
                                        const pillarMaterial = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: isSelected ? 1.15 : 0.28, shininess: 80, transparent: true, opacity: 0.95 });
                                        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
                                        group.add(pillar);
                                        const capGeometry = new THREE.SphereGeometry(sphereSize * 0.92, 20, 20);
                                        const cap = new THREE.Mesh(capGeometry, pillarMaterial.clone());
                                        cap.position.y = sphereSize * 1.25;
                                        group.add(cap);
                                        const glowGeo = new THREE.TorusGeometry(sphereSize * 1.4, 0.35, 12, 48);
                                        const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: isSelected ? 0.38 : 0.12 });
                                        const glowRing = new THREE.Mesh(glowGeo, glowMat);
                                        glowRing.rotation.x = Math.PI / 2;
                                        glowRing.position.y = -sphereSize * 0.1;
                                        group.add(glowRing);
                                        if (SpriteText && (node.id === rootMapNodeId || isSelected || (node.inlinks || 0) > 15)) {
                                            const sprite = new SpriteText(node.title || node.name);
                                            sprite.color = isSelected ? '#ffffff' : color;
                                            sprite.textHeight = isSelected ? 7 : 4.2;
                                            sprite.fontFace = 'Inter, system-ui, sans-serif';
                                            sprite.fontWeight = 'bold';
                                            sprite.backgroundColor = 'rgba(0,0,0,0.8)';
                                            sprite.padding = [4, 2];
                                            sprite.borderRadius = 4;
                                            sprite.position.y = sphereSize * 2.5;
                                            group.add(sprite);
                                        }
                                        return group;
                                    }}
                                    nodeThreeObjectExtend={false}
                                />
                            )}
                        </Suspense>
                    ) : (
                        <div className="text-[#666] text-[12px]">Building map...</div>
                    )}
                    {mapMode === '2d' && (
                        <div ref={architectureCanvasRef} className="absolute inset-0 overflow-auto custom-scrollbar" style={{ cursor: dragState?.type === 'pan' ? 'grabbing' : 'grab' }}>
                            <svg width={architectureLayout.width} height={architectureLayout.height} className="block" onMouseDown={(e) => {
                                const target = e.target as Element | null;
                                if (target?.closest('[data-map-node-interactive="true"]')) return;
                                const canvas = architectureCanvasRef.current;
                                if (!canvas) return;
                                setDragState({ type: 'pan', startX: e.clientX, startY: e.clientY, scrollLeft: canvas.scrollLeft, scrollTop: canvas.scrollTop });
                            }}>
                                <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5"/></pattern></defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />
                                {architectureLayout.lanes.map((lane: any) => (
                                    <g key={lane.id}><g transform={`translate(${lane.x}, 60)`}><text fill="#8a8a8a" fontSize="9" fontWeight="900" letterSpacing="2.2">{lane.label.toUpperCase()}</text><rect y={10} width={28} height={1.5} fill="#F5364E" opacity={0.28} rx={0.75} /></g></g>
                                ))}
                                {architectureLayout.sectionGuides.map((section: any) => (
                                    <g key={`${section.depth}-${section.sectionKey}`}><text x={section.x + 4} y={section.y + 12} fill="#636363" fontSize="7.5" fontWeight="800" letterSpacing="1.1">{String(section.sectionKey).toUpperCase()}</text></g>
                                ))}
                                {visibleArchitectureLinks.map((link: any, index: number) => {
                                    const isFocused = !!activeMapNodeId && (link.sourceId === activeMapNodeId || link.targetId === activeMapNodeId);
                                    const laneDelta = Math.abs((link.target?.laneDepth ?? 0) - (link.source?.laneDepth ?? 0));
                                    const isTreeLink = link.isStructural || laneDelta === 1;
                                    const startX = link.source.x + link.source.cardWidth;
                                    const startY = link.source.y + (link.source.cardHeight / 2);
                                    const endX = link.target.x;
                                    const endY = link.target.y + (link.target.cardHeight / 2);
                                    const deltaX = endX - startX;
                                    const controlOffset = deltaX > 0 ? Math.max(28, Math.min(140, deltaX * 0.42)) : 36;
                                    const c1x = startX + controlOffset;
                                    const c2x = endX - controlOffset;
                                    return <path key={`${link.sourceId}-${link.targetId}-${index}`} d={`M ${startX} ${startY} C ${c1x} ${startY}, ${c2x} ${endY}, ${endX} ${endY}`} fill="none" stroke={isFocused ? 'rgba(245,54,78,0.42)' : isTreeLink ? 'rgba(232,236,245,0.30)' : 'rgba(116,156,255,0.18)'} strokeWidth={isFocused ? 2 : isTreeLink ? 1.5 : 1} strokeDasharray={isTreeLink ? "none" : "3 5"} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-200" />;
                                })}
                                {architectureLayout.nodes.map((node: any) => {
                                    const isRoot = node.id === rootMapNodeId;
                                    const isSelected = node.id === selectedPage?.url;
                                    const isHovered = node.id === hoveredMapNode?.id;
                                    const isNearby = activeMapNodeId ? focusedNeighborhoodIds.has(node.id) : false;
                                    const muted = activeMapNodeId ? !isNearby : false;
                                    const displayName = String(node.name || 'home').split('/').pop()?.slice(0, 24) || 'HOME';
                                    const priorityRaw = String(node.strategicPriority || '').toLowerCase();
                                    const inferredPriority = node.issueCount > 0 || node.status >= 400 ? 'H' : node.inlinks >= 5 || node.internalPageRank >= 10 ? 'M' : 'L';
                                    const priorityBadge = priorityRaw.startsWith('c') ? 'C' : priorityRaw.startsWith('h') ? 'H' : priorityRaw.startsWith('m') ? 'M' : priorityRaw.startsWith('l') ? 'L' : inferredPriority;
                                    const intentBadge = node.searchIntent === 'Transactional' ? 'T' : node.searchIntent === 'Commercial' ? 'C' : node.searchIntent === 'Informational' ? 'I' : 'N';
                                    const priorityTone = priorityBadge === 'C' ? 'rgba(245,54,78,0.14)' : priorityBadge === 'H' ? 'rgba(255,149,0,0.14)' : priorityBadge === 'M' ? 'rgba(0,122,255,0.14)' : 'rgba(255,255,255,0.08)';
                                    const childCount = architectureChildrenByNode.get(node.id)?.length || 0;
                                    const isCollapsed = collapsedMapNodeIds.has(node.id);
                                    const statusColor = node.status >= 500 ? '#ff3b30' : node.status >= 400 ? '#ff9500' : '#c8c8c8';
                                    return (
                                        <g key={node.id} transform={`translate(${node.x}, ${node.y})`} opacity={muted ? 0.3 : 1} onMouseEnter={() => setHoveredMapNode(node)} onMouseLeave={() => setHoveredMapNode(null)} style={{ cursor: 'pointer' }} className="transition-all duration-200">
                                            <rect width={node.cardWidth} height={node.cardHeight} rx={12} fill={isSelected ? 'rgba(20,20,20,0.99)' : isHovered ? 'rgba(17,17,17,0.98)' : 'rgba(13,13,13,0.96)'} stroke="transparent" strokeWidth={0} />
                                            <rect x={0} y={0} width={3} height={node.cardHeight} rx={2} fill={statusColor} />
                                            <text x={14} y={23} fill="#f1f1f1" fontSize="10" fontWeight="700" style={{ letterSpacing: '-0.01em' }}>{displayName}</text>
                                            <text x={14} y={37} fill="#6f6f6f" fontSize="7" fontWeight="700" letterSpacing="0.7">{`${node.status || '-'} • ${node.inlinks || 0} inlinks${isRoot ? ' • root' : ''}`}</text>
                                            <g transform={`translate(14, ${node.cardHeight - 16})`}><rect width="22" height="10" rx="5" fill="rgba(255,255,255,0.07)" /><text x="11" y="7" textAnchor="middle" fill="#9a9a9a" fontSize="6.4" fontWeight="800">{`D${node.crawlDepth ?? 0}`}</text></g>
                                            <g transform={`translate(40, ${node.cardHeight - 16})`}><rect width="22" height="10" rx="5" fill={priorityTone} /><text x="11" y="7" textAnchor="middle" fill="#bcbcbc" fontSize="6.4" fontWeight="800">{`P${priorityBadge}`}</text></g>
                                            <g transform={`translate(66, ${node.cardHeight - 16})`}><rect width="22" height="10" rx="5" fill="rgba(88,86,214,0.14)" /><text x="11" y="7" textAnchor="middle" fill="#a9a3d9" fontSize="6.4" fontWeight="800">{`I${intentBadge}`}</text></g>
                                            {node.issueCount > 0 && <g transform={`translate(${node.cardWidth - 54}, 11)`}><rect width="40" height="12" rx="6" fill="rgba(245,54,78,0.08)" /><text x="20" y="8" textAnchor="middle" fill="#da7a88" fontSize="6.5" fontWeight="800">{`${node.issueCount} ISSUE`}</text></g>}
                                            {node.val > 8 && <g transform={`translate(${node.cardWidth - 18}, ${node.cardHeight - 16})`}><circle r="7" fill="rgba(214,178,75,0.08)" /><text y="2.5" textAnchor="middle" fill="#b99641" fontSize="6.5" fontWeight="900">A</text></g>}
                                            {childCount > 0 && <g transform={`translate(${node.cardWidth - 18}, 18)`} data-map-node-interactive="true" onClick={(e) => { e.stopPropagation(); setCollapsedMapNodeIds((prev) => { const next = new Set(prev); if (next.has(node.id)) next.delete(node.id); else next.add(node.id); return next; }); }} style={{ cursor: 'pointer' }}><circle r="9" fill="rgba(9,9,9,0.96)" stroke="rgba(255,255,255,0.12)" /><line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#bdbdbd" strokeWidth="1.2" strokeLinecap="round" />{isCollapsed && <line x1="0" y1="-3.5" x2="0" y2="3.5" stroke="#bdbdbd" strokeWidth="1.2" strokeLinecap="round" />}</g>}
                                            <rect x={0} y={0} width={node.cardWidth} height={node.cardHeight} rx={12} fill="transparent" data-map-node-interactive="true" onMouseDown={(e) => { e.stopPropagation(); setDragState({ type: 'node', nodeId: node.id, startX: e.clientX, startY: e.clientY, originX: node.x, originY: node.y }); }} style={{ cursor: 'move' }} />
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    )}
                    <div className="absolute bottom-4 left-4 max-w-[360px] bg-[#101010]/90 border border-[#252525] rounded-2xl px-3 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur pointer-events-auto">
                        {activeMapNode ? (
                            <div className="space-y-2">
                                <div className="min-w-0">
                                    <div className="text-[11px] font-semibold text-white truncate">{activeMapNode.fullUrl || activeMapNode.name}</div>
                                    <div className="text-[10px] text-[#666] mt-1">{`Depth ${activeMapNode.crawlDepth ?? 0} • ${activeMapNode.inlinks ?? 0} inlinks • ${activeMapNode.status || '-'}`}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => { if (!selectedMapNodeId && activeMapNode) { const found = pages.find((page: any) => page.url === activeMapNode.id); if (found) setSelectedPage(found); } setMapScope('focus'); }} className="px-2.5 py-1.5 rounded-lg bg-[#171717] border border-[#2a2a2a] text-[#d0d0d0] text-[10px] font-medium hover:text-white hover:border-[#3a3a3a] transition-colors">Focus</button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-[10px] text-[#6a6a6a] leading-relaxed">Hover a page to inspect it. Drag the surface to pan and use +/- to fold branches.</div>
                        )}
                    </div>
                    <div className="absolute top-4 right-4 bottom-4 flex flex-col items-end justify-between pointer-events-none">
                        <div className="pointer-events-auto flex flex-col gap-3 items-end">
                            <div className="flex flex-col gap-1.5 bg-[#101010]/94 border border-[#232323] rounded-2xl p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.24)] backdrop-blur">
                                <button onClick={() => setMapMode('2d')} className={`px-3 py-2 text-[11px] rounded-xl transition-colors text-left min-w-[132px] ${mapMode === '2d' ? 'bg-[#F5364E] text-white' : 'text-[#8a8a8a] hover:text-white hover:bg-[#151515]'}`}>Architecture</button>
                                <button onClick={() => setMapMode('3d')} className={`px-3 py-2 text-[11px] rounded-xl transition-colors text-left min-w-[132px] ${mapMode === '3d' ? 'bg-[#F5364E] text-white' : 'text-[#8a8a8a] hover:text-white hover:bg-[#151515]'}`}>3D View</button>
                                <button onClick={() => setIsMapWorkspaceOpen((prev) => !prev)} className="px-3 py-2 text-[11px] rounded-xl transition-colors text-left min-w-[132px] text-[#8a8a8a] hover:text-white hover:bg-[#151515] flex items-center gap-2">
                                    {workspace ? <Shrink size={12} /> : <Expand size={12} />}
                                    {workspace ? 'Close Workspace' : 'Open Workspace'}
                                </button>
                            </div>
                            <div className="flex flex-col gap-1 bg-[#101010]/94 border border-[#232323] rounded-2xl p-2 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur">
                                {[{ id: 'all', label: 'All' }, { id: 'issues', label: 'Issues' }, { id: 'deep', label: 'Deep' }, { id: 'important', label: 'Important' }, { id: 'focus', label: 'Focus' }].map((option) => (
                                    <button key={option.id} onClick={() => setMapScope(option.id as any)} className={`px-3 py-2 rounded-xl text-[10px] text-left transition-colors min-w-[132px] ${mapScope === option.id ? 'bg-[#171717] text-white' : 'text-[#757575] hover:text-white hover:bg-[#141414]'}`}>{option.label}</button>
                                ))}
                            </div>
                            <button onClick={() => { if (mapMode === '2d') { architectureCanvasRef.current?.scrollTo({ left: 0, top: 0, behavior: 'smooth' }); return; } try { fgRef.current?.zoomToFit?.(500, 60); } catch {} }} className="pointer-events-auto w-[48px] h-[48px] flex items-center justify-center rounded-2xl bg-[#101010]/94 border border-[#232323] text-[#777] hover:text-white hover:bg-[#151515] shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur transition-colors" title="Fit graph to view"><Focus size={14} /></button>
                        </div>
                        <div className="pointer-events-auto inline-flex items-center gap-3 bg-[#101010]/88 border border-[#232323] rounded-2xl px-3 py-2 text-[10px] text-[#8a8a8a] shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur">
                            <span className="font-mono text-[#d0d0d0]">{mapGraphData.nodes.length} nodes</span>
                            <span className="font-mono text-[#7a7a7a]">{mapSummary.sectionCount} sections</span>
                            <span className="font-mono text-[#7a7a7a]">depth {mapSummary.maxDepth}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderGrid = (data: any[]) => (
        <TableVirtuoso
            style={{ height: '100%', width: '100%' }}
            data={data}
            overscan={40}
            components={{
                Table: (props) => <table {...props} className="w-max border-collapse text-left text-[12px] whitespace-nowrap table-fixed" />,
                TableHead: React.forwardRef((props, ref) => (
                    <thead {...props} ref={ref} className="sticky top-0 bg-[#0d0d0d]/95 backdrop-blur-md z-[60] shadow-[0_1px_0_#333]" />
                )),
                TableRow: (props) => {
                    const index = props['data-index'];
                    const page = data[index];
                    const isSelected = selectedPage?.url === page?.url;
                    return (
                        <tr 
                            {...props} 
                            onClick={() => {
                                setSelectedPage(page);
                                setShowFullDetailDrawer(false);
                            }}
                            onDoubleClick={() => {
                                setSelectedPage(page);
                                setShowFullDetailDrawer(true);
                            }}
                            className={`cursor-default transition-none border-b border-[#1a1a1a] ${isSelected ? 'bg-[#1e2333] border-[#3a4466]' : 'hover:bg-[#141414]'}`}
                        />
                    );
                },
                TableBody: React.forwardRef((props, ref) => <tbody {...props} ref={ref} className="bg-[#0d0d0d] font-sans tracking-tight text-[12px] text-[#ccc]" />)
            }}
            fixedHeaderContent={() => (
                <tr className="text-[#999] font-medium text-[11px]">
                    <th className="py-2 px-1.5 w-[30px] border-r border-b border-[#222] sticky left-0 bg-[#111] z-[70]">
                        <input
                            type="checkbox"
                            checked={selectedRows.size > 0 && selectedRows.size === data.length}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedRows(new Set(data.map(p => p.url)));
                                } else {
                                    setSelectedRows(new Set());
                                }
                            }}
                            className="w-3 h-3 accent-[#F5364E] cursor-pointer"
                        />
                    </th>
                    <th className="py-2 px-2 w-[40px] border-r border-b border-[#222] sticky left-[30px] bg-[#111] z-[70] font-mono text-center">#</th>
                    {displayColumns.map((col, idx) => {
                        const width = columnWidths[col.key] || col.width;
                        return (
                            <th 
                                key={idx} 
                                className={`py-2 px-3 border-r border-b border-[#222] truncate hover:text-white group transition-colors relative ${col.key === 'url' ? 'sticky left-[70px] bg-[#111] z-[70] shadow-[1px_0_0_#222] hover:bg-[#1a1a1a]' : 'bg-[#111]'}`} 
                                style={{ width, minWidth: width, maxWidth: width }}
                                title={(col as any).tooltip || col.label}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    setHeaderContextMenu({ x: e.clientX, y: e.clientY, col });
                                }}
                            >
                                <div className="flex items-center justify-between pointer-events-none">
                                    <div 
                                        className="flex-1 truncate cursor-pointer pointer-events-auto"
                                        onClick={() => handleSort(col.key)}
                                    >
                                        {col.label}
                                    </div>
                                    <div className="flex items-center shrink-0 pointer-events-auto cursor-pointer" onClick={() => handleSort(col.key)}>
                                        {sortConfig?.key === col.key ? (
                                            sortConfig.direction === 'asc' ? <ChevronUp size={10} className="text-[#F5364E]" /> : <ChevronDown size={10} className="text-[#F5364E]" />
                                        ) : (
                                            <ChevronDown size={10} className="text-[#333] opacity-0 group-hover:opacity-100" />
                                        )}
                                    </div>
                                </div>

                                <div 
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setResizingCol({ key: col.key, startX: e.clientX, startWidth: parseInt(String(width)) });
                                    }}
                                    className={`absolute top-0 right-0 bottom-0 w-1 cursor-col-resize z-40 transition-colors hover:bg-[#F5364E] ${resizingCol?.key === col.key ? 'bg-[#F5364E]' : ''}`}
                                ></div>
                            </th>
                        );
                    })}
                </tr>
            )}
            itemContent={(index, page) => {
                const isSelected = selectedPage?.url === page.url;
                return (
                    <>
                        <td className={`py-1.5 px-1.5 text-center border-r border-[#222] sticky left-0 z-10 ${isSelected ? 'bg-[#1e2333]' : 'bg-[#111]'}`}>
                            <input
                                type="checkbox"
                                checked={selectedRows.has(page.url)}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    const next = new Set(selectedRows);
                                    if (e.target.checked) next.add(page.url);
                                    else next.delete(page.url);
                                    setSelectedRows(next);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-3 h-3 accent-[#F5364E] cursor-pointer"
                            />
                        </td>
                        <td className={`py-1.5 px-2 text-center text-[#666] border-r border-[#222] sticky left-[30px] z-10 font-mono text-[11px] ${isSelected ? 'bg-[#1e2333]' : 'bg-[#111]'}`}>{index + 1}</td>
                        {displayColumns.map((col, idx) => {
                            const useFoundation = crawlerFoundationEnabled && foundationHydrated;
                            const fMetrics = useFoundation ? foundationMetricsMap.get(page.url) : null;
                            let rawVal = (fMetrics && fMetrics[col.key] !== undefined) ? fMetrics[col.key] : (page as any)[col.key];
                            let displayElement: React.ReactNode = rawVal;
                            let cellClass = '';
                            
                            if (col.key === 'indexable') { 
                                displayElement = rawVal ? 'Indexable' : 'Non-Indexable';
                                cellClass = rawVal ? 'text-green-400' : 'text-red-400';
                            } else if (col.key === 'statusCode' || col.key === 'status') { 
                                const code = (page as any).statusCode;
                                const isBad = code >= 400; const isRedirect = code >= 300 && code < 400;
                                displayElement = rawVal || '-';
                                cellClass = `font-mono font-medium ${isBad ? 'text-red-400' : isRedirect ? 'text-orange-400' : 'text-green-400'}`;
                            } else if (col.key === 'url' || col.key === 'canonical' || col.key === 'redirectUrl') { 
                                cellClass = 'text-blue-400 cursor-pointer overflow-hidden text-ellipsis'; 
                            } else if (col.key.toLowerCase().includes('size') || col.key.toLowerCase().includes('bytes') || col.key === 'co2Mg') {
                                displayElement = formatBytes(rawVal);
                                cellClass = 'font-mono text-[11px] text-[#999] text-right pr-4';
                            } else if ([
                                'page_category_confidence', 'nap_match_with_homepage', 'nap_has_distinct_address',
                                'titleLength', 'titlePixelWidth', 'metaDescLength', 'metaDescPixelWidth', 'h1_1Length', 'h1_2Length', 'h2_1Length', 'h2_2Length', 'wordCount', 'readability', 'loadTime', 'dnsResolutionTime', 'cnameChainLength', 'inlinks', 'outlinks', 'folderDepth', 'crawlDepth', 'linkScore', 'fcp', 'lcp', 'cls', 'inp', 'httpRequestCount', 'totalJsBytes', 'totalCssBytes', 'unusedJsPercent', 'unusedCssPercent', 'internalPageRank', 'semanticSimilarityScore', 'semanticRelevanceScore', 'missingAltImages', 'longAltImages', 'totalImages', 'oversizedImages', 'brokenImages', 'schemaErrors', 'schemaWarnings', 'opportunityScore', 'businessValueScore', 'authorityScore', 'trafficQuality', 'engagementRisk', 'insightConfidence', 'dataCoverage', 'techHealthScore', 'contentQualityScore', 'searchVisibilityScore', 'engagementScore', 'authorityComputedScore', 'businessComputedScore', 'redirectChainLength', 'domNodeCount', 'renderBlockingCss', 'renderBlockingJs', 'thirdPartyScriptCount', 'preconnectCount', 'prefetchCount', 'preloadCount', 'legacyFormatImages', 'modernFormatImages', 'imagesWithoutSrcset', 'imagesWithoutLazy', 'imagesWithoutDimensions', 'hstsMaxAge', 'sslDaysUntilExpiry', 'cookieCount', 'insecureCookies', 'cookiesMissingSameSite', 'scriptsWithoutSri', 'exposedApiKeys', 'formsWithoutLabels', 'genericLinkTextCount', 'invalidAriaCount', 'tablesWithoutHeaders', 'cacheMaxAge', 'smallTapTargets', 'smallFontCount', 'minFontSize', 'sitemapBrokenUrls', 'sitemapLastmodMismatchCount', 'sitemapValidationSampleSize', 'urlLength', 'anchorTextDiversity'
                            ].includes(col.key)) {
                                displayElement = (rawVal === null || rawVal === undefined) ? '-' : rawVal;
                                cellClass = 'font-mono text-[11px] text-[#999] text-right pr-4';

                                if (col.key === 'titleLength' && typeof rawVal === 'number') {
                                    const pct = Math.min(100, (rawVal / 60) * 100);
                                    const color = rawVal > 60 ? 'bg-red-500' : rawVal < 30 ? 'bg-orange-500' : 'bg-green-500';
                                    displayElement = (
                                        <div className="flex items-center justify-end gap-2 group/cell">
                                            <div className="w-12 h-1 bg-[#222] rounded-full overflow-hidden opacity-30 group-hover/cell:opacity-100 transition-opacity"><div className={`h-full ${color}`} style={{width: `${pct}%`}}></div></div>
                                            <span>{rawVal}</span>
                                        </div>
                                    );
                                }
                                if (col.key === 'loadTime' && typeof rawVal === 'number') {
                                    const color = rawVal > 1000 ? 'text-red-400' : rawVal > 500 ? 'text-orange-400' : 'text-green-400';
                                    cellClass = `font-mono text-[11px] text-right pr-4 ${color}`;
                                }
                            } else if (col.key === 'commentCount' || col.key === 'taskCount') {
                                const count = Number(rawVal) || 0;
                                const Icon = col.key === 'commentCount' ? MessageSquare : CheckSquare;
                                displayElement = count > 0 ? (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCollabOverlayTarget({ 
                                                type: col.key === 'commentCount' ? 'page' : 'task', 
                                                id: (page as any).url, 
                                                title: `Page: ${getSafePathname((page as any).url)}` 
                                            });
                                            setShowCollabOverlay(true);
                                        }}
                                        className="flex items-center justify-center gap-1.5 px-2 py-0.5 rounded bg-brand-red/10 text-brand-red border border-brand-red/20 hover:bg-brand-red hover:text-white transition-all mx-auto"
                                    >
                                        <Icon size={10} />
                                        <span className="font-bold font-mono text-[10px]">{count}</span>
                                    </button>
                                ) : (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCollabOverlayTarget({ 
                                                type: col.key === 'commentCount' ? 'page' : 'task', 
                                                id: (page as any).url, 
                                                title: `Page: ${getSafePathname((page as any).url)}` 
                                            });
                                            setShowCollabOverlay(true);
                                        }}
                                        className="flex items-center justify-center p-1 text-[#333] hover:text-[#666] transition-colors mx-auto"
                                    >
                                        <Icon size={10} />
                                    </button>
                                );
                                cellClass = 'text-center';
                            } else if (col.key === 'topicCluster' || col.key === 'funnelStage') {
                                displayElement = rawVal ? <span className="bg-[#222] text-[#ccc] px-2 py-0.5 rounded-full text-[10px]">{rawVal}</span> : '-';
                                cellClass = 'text-center';
                            } else if (col.key === 'internalPageRank' || col.key === 'linkEquity') {
                                const score = col.key === 'linkEquity' ? (Number(rawVal) || 0) * 10 : (Number(rawVal) || 0);
                                const color = score > 70 ? 'text-blue-400' : score > 30 ? 'text-indigo-400' : 'text-[#666]';
                                displayElement = (
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="w-8 h-1 bg-[#222] rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{width: `${score}%`}}></div></div>
                                        <span className={`font-bold ${color}`}>{col.key === 'linkEquity' ? (rawVal ?? 0) : score.toFixed(1)}</span>
                                    </div>
                                );
                                cellClass = 'text-right pr-4';
                            } else if (col.key.startsWith('gsc') && typeof rawVal === 'number') {
                                cellClass = 'font-mono text-[11px] text-right pr-4 text-white font-bold';
                                if (col.key === 'gscCtr') displayElement = `${(rawVal * 100).toFixed(1)}%`;
                                else if (col.key === 'gscPosition') displayElement = rawVal.toFixed(1);
                                else displayElement = rawVal.toLocaleString();
                            } else if ((col.key === 'mainKwPosition' || col.key === 'bestKwPosition') && typeof rawVal === 'number') {
                                cellClass = 'font-mono text-[11px] text-right pr-4 text-white font-bold';
                                displayElement = rawVal.toFixed(1);
                            } else if ((col.key === 'mainKwVolume' || col.key === 'bestKwVolume') && typeof rawVal === 'number') {
                                const sourceKey = col.key === 'mainKwVolume' ? 'mainKwVolumeSource' : 'bestKwVolumeSource';
                                const source = (page as any)[sourceKey];
                                cellClass = 'font-mono text-[11px] text-right pr-4 text-white font-bold';
                                displayElement = (
                                    <div className="flex items-center justify-end gap-1.5">
                                        {source === 'gsc' && (
                                            <span 
                                                className="text-[8px] px-1 rounded bg-blue-500/10 text-blue-400/80 border border-blue-500/20 font-bold tracking-tight"
                                                title="Estimated from GSC Impressions"
                                            >
                                                EST
                                            </span>
                                        )}
                                        <span>{rawVal.toLocaleString()}</span>
                                    </div>
                                );
                            } else if ((col.key === 'mainKeyword' || col.key === 'bestKeyword') && rawVal) {
                                const sourceKey = col.key === 'mainKeyword' ? 'mainKeywordSource' : 'bestKeywordSource';
                                const source = (page as any)[sourceKey];
                                displayElement = (
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {source && (
                                            <span 
                                                className={`text-[8px] px-1 rounded font-bold tracking-tight shrink-0 ${
                                                    source === 'gsc' 
                                                        ? 'bg-blue-500/10 text-blue-400/80 border border-blue-500/20' 
                                                        : 'bg-purple-500/10 text-purple-400/80 border border-purple-500/20'
                                                }`}
                                                title={`Source: ${source}`}
                                            >
                                                {source === 'gsc' ? 'GSC' : source === 'upload' || source === 'manual' ? 'USR' : source.toUpperCase()}
                                            </span>
                                        )}
                                        <span className="truncate">{rawVal}</span>
                                    </div>
                                );
                            } else if (col.key.startsWith('ga4') && typeof rawVal === 'number') {
                                cellClass = 'font-mono text-[11px] text-right pr-4 text-white font-bold';
                                if (col.key === 'ga4BounceRate') displayElement = `${(rawVal * 100).toFixed(1)}%`;
                                else if (col.key === 'ga4ConversionRate') displayElement = `${(rawVal * 100).toFixed(1)}%`;
                                else if (col.key === 'ga4AvgSessionDuration' || col.key === 'ga4EngagementTimePerPage') displayElement = rawVal.toFixed(1);
                                else displayElement = rawVal.toLocaleString();
                            } else if (col.key === 'searchIntent') {
                                const intentColor = rawVal === 'Transactional' ? 'text-purple-400 bg-purple-400/10' : rawVal === 'Commercial' ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 bg-gray-400/10';
                                displayElement = <span className={`px-2 py-0.5 rounded-full text-[10px] ${intentColor}`}>{rawVal || 'Info'}</span>;
                                cellClass = 'text-center';
                            } else if (col.key === 'recommendedAction') {
                                const actionStyle = ACTION_COLORS[String(rawVal)] || ACTION_COLORS.Monitor;
                                let tooltip = (page as any).recommendedActionReason || '';
                                if ((page as any).recommendedActionFactors) {
                                    try {
                                        const factors = Array.isArray((page as any).recommendedActionFactors)
                                            ? (page as any).recommendedActionFactors
                                            : JSON.parse((page as any).recommendedActionFactors);
                                        if (Array.isArray(factors) && factors.length > 0) {
                                            tooltip = tooltip
                                                ? `${tooltip}\nFactors: ${factors.join(', ')}`
                                                : `Factors: ${factors.join(', ')}`;
                                        }
                                    } catch {}
                                }
                                displayElement = rawVal ? (
                                    <span
                                        className="px-2 py-0.5 rounded-full text-[10px] border"
                                        title={tooltip || undefined}
                                        style={{
                                            color: actionStyle.text,
                                            backgroundColor: actionStyle.bg,
                                            borderColor: actionStyle.border
                                        }}
                                    >
                                        {rawVal}
                                    </span>
                                ) : '-';
                                cellClass = 'text-center';
                            } else if (col.key === 'strategicPriority') {
                                const isHighPri = rawVal === 'High' || rawVal === 'Critical';
                                displayElement = <span className={`${isHighPri ? 'text-red-400 font-bold' : 'text-[#666]'}`}>{rawVal || 'Low'}</span>;
                                cellClass = 'text-center';
                            } else if (col.key === 'healthScore') {
                                const score = Number(rawVal) || 0;
                                const color = score > 80 ? 'text-green-400' : score > 50 ? 'text-orange-400' : 'text-red-400';
                                displayElement = <span className={`font-black ${color}`}>{score === 0 ? '-' : score}</span>;
                                cellClass = 'text-center';
                            } else if (col.key === 'pageValueTier' && rawVal) {
                                displayElement = <TierBadge tier={String(rawVal)} />;
                            } else if (typeof rawVal === 'boolean') { 
                                displayElement = rawVal ? 'Yes' : 'No'; 
                            } else if (!rawVal && rawVal !== 0) { 
                                displayElement = ''; cellClass = 'text-[#444]'; 
                            }

                            return (
                                <td key={idx} className={`py-1.5 px-3 truncate border-r border-[#222] ${cellClass} ${col.key === 'url' ? 'sticky left-[70px] z-10 shadow-[1px_0_0_#222] ' + (isSelected ? 'bg-[#1e2333]' : 'bg-[#111]') : ''}`} style={{width: columnWidths[col.key] || col.width, minWidth: columnWidths[col.key] || col.width, maxWidth: columnWidths[col.key] || col.width}}>
                                    {displayElement}
                                </td>
                            );
                        })}
                    </>
                );
            }}
        />
    );

    return (
        <main className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#0a0a0a] relative">

            <div className="flex-1 min-h-0 bg-[#0a0a0a] relative overflow-hidden" ref={graphContainerRef}>
                {pages.length === 0 && !isCrawling ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-[#0a0a0a]">
                         <div className="relative mb-8 group">
                             <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl animate-pulse scale-150 transition-opacity opacity-50"></div>
                             <svg width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 text-white/20 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:text-white/40 transition-all duration-700">
                                 <circle cx="9" cy="16" r="5" fill="currentColor" className="animate-pulse" style={{ animationDuration: '3s' }} />
                                 <path d="M17 11H27" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-0 animate-[fadeIn_0.6s_ease-out_forwards_0.2s]" />
                                 <path d="M17 16H31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-0 animate-[fadeIn_0.6s_ease-out_forwards_0.4s]" />
                                 <path d="M17 21H27" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-0 animate-[fadeIn_0.6s_ease-out_forwards_0.6s]" />
                             </svg>
                         </div>
                         <h2 className="text-[14px] font-medium text-[#555] mb-1 tracking-tight">No data to display</h2>
                         <p className="text-[12px] text-[#333]">Enter a web address at the top and click Start Scan.</p>

                         <style dangerouslySetInnerHTML={{ __html: `
                             @keyframes fadeIn {
                                 from { opacity: 0; transform: translateX(-4px); }
                                 to { opacity: 1; transform: translateX(0); }
                             }
                         `}} />
                     </div>
                 ) : viewMode === 'map' ? (
                    renderMapView(false)
                 ) : viewMode === 'charts' ? (
                      <ChartsView />
                 ) : isCrawling && filteredPages.length === 0 ? (
                    <div className="p-4">
                        <SkeletonTable rows={12} />
                    </div>
                ) : isMobile ? (
                    <div className="mobile-card-list">
                        {filteredPages.map((page, index) => (
                            <MobilePageCard
                                key={page.url}
                                page={page}
                                index={index}
                                onOpen={(nextPage) => setSelectedPage(nextPage)}
                            />
                        ))}
                    </div>
                ) : (
                    renderGrid(filteredPages)
                )}
            </div>

            {selectedRows.size > 0 && (
                <BulkActionsBar
                    selectedCount={selectedRows.size}
                    onAssign={() => {
                        const next = new Set(ignoredUrls);
                        selectedRows.forEach((url) => next.add(url));
                        setIgnoredUrls(next);
                        setSelectedRows(new Set());
                    }}
                    onExport={() => {
                        const selected = pages.filter((p) => selectedRows.has(p.url));
                        const csvRows = [ALL_COLUMNS.map((c) => c.label).join(',')];
                        selected.forEach((p) => {
                            csvRows.push(ALL_COLUMNS.map((c) => `"${(p[c.key] || '').toString().replace(/"/g, '""')}"`).join(','));
                        });
                        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `headlight_selected_${selectedRows.size}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                    onAIAnalyze={() => {
                        runSelectedEnrichment(Array.from(selectedRows));
                        setSelectedRows(new Set());
                    }}
                    onCreateTask={() => {
                        const firstUrl = Array.from(selectedRows)[0];
                        if (!firstUrl) return;
                        setCollabOverlayTarget({
                            type: 'task',
                            id: firstUrl,
                            title: `Selected pages (${selectedRows.size})`
                        });
                        setShowCollabOverlay(true);
                    }}
                    onClear={() => setSelectedRows(new Set())}
                />
            )}

            {showTrialLimitAlert && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-[#111] border border-orange-500/30 rounded-lg shadow-[0_0_30px_rgba(249,115,22,0.15)] p-4 flex items-center gap-4 min-w-[400px]">
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                            <AlertCircle className="text-orange-500" size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[13px] font-bold text-white mb-0.5">Trial Limit Reached</h4>
                            <p className="text-[11px] text-[#888]">You've reached the 100-page limit for this scan.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setShowTrialLimitAlert(false)}
                                className="px-3 py-1.5 text-[11px] text-[#666] hover:text-white transition-colors"
                            >
                                Dismiss
                            </button>
                            <button 
                                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold rounded flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
                            >
                                <Sparkles size={12} />
                                Upgrade
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isMapWorkspaceOpen && renderMapView(true)}

            {!isCompactLayout && (
                isWqaMode ? (
                    selectedPage ? (
                        <WqaInspectorShell />
                    ) : null
                ) : (
                    <InspectorShell />
                )
            )}
            {!isCompactLayout && (
                <FullDetailDrawer
                    page={selectedPage}
                    open={showFullDetailDrawer}
                    onClose={() => setShowFullDetailDrawer(false)}
                />
            )}
            {isCompactLayout && selectedPage && (
                <MobilePageDetail
                    page={selectedPage}
                    onClose={() => setSelectedPage(null)}
                />
            )}
            {headerContextMenu && (
                <ColumnHeaderContextMenu
                    x={headerContextMenu.x}
                    y={headerContextMenu.y}
                    columnKey={headerContextMenu.col.key}
                    columnLabel={headerContextMenu.col.label}
                    onClose={() => setHeaderContextMenu(null)}
                    onSortAsc={(key) => handleSort(key)}
                    onSortDesc={(key) => handleSort(key)}
                    onHideColumn={(key) => setVisibleColumns(visibleColumns.filter(c => c !== key))}
                    onPinLeft={() => {}}
                    onPinRight={() => {}}
                    onResizeToFit={(key) => {
                        const sampleValues = filteredPages.slice(0, 100).map((page) => String(page?.[key] ?? ''));
                        const maxLength = Math.max(headerContextMenu.col.label.length, ...sampleValues.map((value) => value.length));
                        const computedWidth = Math.min(520, Math.max(80, (maxLength * 7) + 32));
                        setColumnWidths((prev) => ({ ...prev, [key]: computedWidth }));
                    }}
                />
            )}
        </main>
    );
}

