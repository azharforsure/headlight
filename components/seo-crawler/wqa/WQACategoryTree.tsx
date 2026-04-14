import React, { useMemo, useState, useCallback } from 'react';
import {
    LayoutGrid,
    Star,
    Wrench,
    FileText,
    TrendingUp,
    Server,
    Eye,
    Search,
    ChevronDown,
    ChevronRight,
    Sparkles,
    AlertTriangle,
} from 'lucide-react';
import type { DetectedIndustry } from '../../../services/SiteTypeDetector';

interface CategoryNode {
    id: string;
    label: string;
    icon?: React.ReactNode;
    count: number;
    filter: (page: any) => boolean;
}

interface CategoryGroup {
    id: string;
    label: string;
    icon?: React.ReactNode;
    nodes: CategoryNode[];
    defaultOpen?: boolean;
}

function buildWqaCategories(pages: any[], industry: DetectedIndustry): CategoryGroup[] {
    const html = pages.filter((p) => p.isHtmlPage && p.statusCode >= 200 && p.statusCode < 600);

    const groups: CategoryGroup[] = [
        {
            id: 'all',
            label: 'All Pages',
            icon: <LayoutGrid size={14} />,
            defaultOpen: false,
            nodes: [{ id: 'all:all', label: 'All', count: pages.length, filter: () => true }],
        },
        {
            id: 'page-category',
            label: 'Page Category',
            icon: <LayoutGrid size={14} />,
            defaultOpen: true,
            nodes: buildCountNodes(html, 'pageCategory', [
                ['homepage', 'Homepage'],
                ['product', 'Product'],
                ['category', 'Category / Listing'],
                ['blog_post', 'Blog Post'],
                ['landing_page', 'Landing Page'],
                ['service_page', 'Service Page'],
                ['about_legal', 'About / Legal'],
                ['faq_help', 'FAQ / Help'],
                ['resource', 'Resource'],
                ['login_account', 'Login / Account'],
                ['pagination', 'Pagination'],
                ['media', 'Media (PDF / Image)'],
                ['other', 'Other'],
            ]),
        },
        {
            id: 'page-value',
            label: 'Page Value',
            icon: <Star size={14} />,
            defaultOpen: true,
            nodes: buildCountNodes(html, 'pageValueTier', [
                ['★★★', '★★★ High Value'],
                ['★★', '★★ Medium Value'],
                ['★', '★ Low Value'],
                ['☆', '☆ Zero Value'],
            ]),
        },
        {
            id: 'tech-action',
            label: 'Technical Action',
            icon: <Wrench size={14} />,
            defaultOpen: true,
            nodes: buildCountNodes(html, 'technicalAction', [
                ['Fix Server Errors', 'Fix Server Errors'],
                ['Restore Broken Page', 'Restore Broken Page'],
                ['Remove Dead Page', 'Remove Dead Page'],
                ['Unblock From Index', 'Unblock From Index'],
                ['Fix Redirect Chain', 'Fix Redirect Chain'],
                ['Fix Canonical', 'Fix Canonical'],
                ['Add to Sitemap', 'Add to Sitemap'],
                ['Improve Speed', 'Improve Speed'],
                ['Fix Security', 'Fix Security'],
                ['Add Internal Links', 'Add Internal Links'],
                ['Consolidate Duplicates', 'Consolidate Duplicates'],
                ['Fix Hreflang', 'Fix Hreflang'],
                ['Monitor', 'Monitor'],
            ]),
        },
        {
            id: 'content-action',
            label: 'Content Action',
            icon: <FileText size={14} />,
            defaultOpen: true,
            nodes: buildCountNodes(html, 'contentAction', [
                ['Rewrite Title & Meta', 'Rewrite Title & Meta'],
                ['Recover Declining Content', 'Recover Declining'],
                ['Fix Keyword Mismatch', 'Fix Keyword Mismatch'],
                ['Expand Thin Content', 'Expand Thin Content'],
                ['Update Stale Content', 'Update Stale Content'],
                ['Add Schema', 'Add Schema'],
                ['Improve E-E-A-T', 'Improve E-E-A-T'],
                ['Resolve Cannibalization', 'Resolve Cannibalization'],
                ['Optimize for SERP Features', 'Optimize for SERP'],
                ['Improve Readability', 'Improve Readability'],
                ['Remove or Merge', 'Remove or Merge'],
                ['Fill Content Gap', 'Fill Content Gap'],
                ['No Action', 'No Action Needed'],
            ]),
        },
        {
            id: 'traffic-status',
            label: 'Traffic Status',
            icon: <TrendingUp size={14} />,
            defaultOpen: true,
            nodes: [
                {
                    id: 'traffic:growing',
                    label: 'Growing ↑',
                    count: html.filter((p) => Number(p.sessionsDeltaPct || 0) > 0.15).length,
                    filter: (p: any) => Number(p.sessionsDeltaPct || 0) > 0.15,
                },
                {
                    id: 'traffic:stable',
                    label: 'Stable →',
                    count: html.filter((p) => {
                        const d = Number(p.sessionsDeltaPct || 0);
                        return d >= -0.15 && d <= 0.15 && Number(p.ga4Sessions || 0) > 0;
                    }).length,
                    filter: (p: any) => {
                        const d = Number(p.sessionsDeltaPct || 0);
                        return d >= -0.15 && d <= 0.15 && Number(p.ga4Sessions || 0) > 0;
                    },
                },
                {
                    id: 'traffic:declining',
                    label: 'Declining ↓',
                    count: html.filter((p) => p.isLosingTraffic === true).length,
                    filter: (p: any) => p.isLosingTraffic === true,
                },
                {
                    id: 'traffic:none',
                    label: 'No Traffic',
                    count: html.filter((p) => !Number(p.ga4Sessions || 0) && !Number(p.gscClicks || 0)).length,
                    filter: (p: any) => !Number(p.ga4Sessions || 0) && !Number(p.gscClicks || 0),
                },
            ],
        },
        {
            id: 'status-code',
            label: 'Status Code',
            icon: <Server size={14} />,
            defaultOpen: false,
            nodes: buildCountNodes(pages, 'statusCode', [
                [200, '200 OK'],
                [301, '301 Redirect'],
                [302, '302 Temporary'],
                [404, '404 Not Found'],
                [410, '410 Gone'],
                [500, '500+ Server Error'],
            ], (page, value) => {
                if (value === 500) return Number(page.statusCode || 0) >= 500;
                return Number(page.statusCode || 0) === value;
            }),
        },
        {
            id: 'index-status',
            label: 'Index Status',
            icon: <Eye size={14} />,
            defaultOpen: false,
            nodes: [
                {
                    id: 'index:indexable',
                    label: 'Indexable',
                    count: html.filter((p) => p.indexable !== false && p.statusCode === 200).length,
                    filter: (p: any) => p.indexable !== false && p.statusCode === 200,
                },
                {
                    id: 'index:noindex',
                    label: 'Noindex',
                    count: html.filter((p) => String(p.metaRobots1 || '').toLowerCase().includes('noindex') || p.xRobotsNoindex).length,
                    filter: (p: any) => String(p.metaRobots1 || '').toLowerCase().includes('noindex') || p.xRobotsNoindex === true,
                },
                {
                    id: 'index:canonicalized',
                    label: 'Canonicalized',
                    count: html.filter((p) => p.canonical && String(p.canonical).trim() !== String(p.url).trim()).length,
                    filter: (p: any) => Boolean(p.canonical) && String(p.canonical).trim() !== String(p.url).trim(),
                },
                {
                    id: 'index:blocked',
                    label: 'Blocked',
                    count: pages.filter((p) => p.status === 'Blocked by Robots.txt').length,
                    filter: (p: any) => p.status === 'Blocked by Robots.txt',
                },
            ],
        },
        {
            id: 'content-quality',
            label: 'Content Quality',
            icon: <Sparkles size={14} />,
            defaultOpen: false,
            nodes: [
                {
                    id: 'quality:good',
                    label: 'Good (70-100)',
                    count: html.filter((p) => Number(p.contentQualityScore || 0) >= 70).length,
                    filter: (p: any) => Number(p.contentQualityScore || 0) >= 70,
                },
                {
                    id: 'quality:fair',
                    label: 'Fair (40-69)',
                    count: html.filter((p) => {
                        const s = Number(p.contentQualityScore || 0);
                        return s >= 40 && s < 70;
                    }).length,
                    filter: (p: any) => {
                        const s = Number(p.contentQualityScore || 0);
                        return s >= 40 && s < 70;
                    },
                },
                {
                    id: 'quality:poor',
                    label: 'Poor (0-39)',
                    count: html.filter((p) => {
                        const s = Number(p.contentQualityScore || 0);
                        return s > 0 && s < 40;
                    }).length,
                    filter: (p: any) => {
                        const s = Number(p.contentQualityScore || 0);
                        return s > 0 && s < 40;
                    },
                },
                {
                    id: 'quality:unscored',
                    label: 'Not Scored',
                    count: html.filter((p) => !p.contentQualityScore).length,
                    filter: (p: any) => !p.contentQualityScore,
                },
            ],
        },
    ];

    const industryGroup = buildIndustryGroup(html, industry);
    if (industryGroup) groups.push(industryGroup);

    return groups.filter((g) => g.id === 'all' || g.nodes.some((n) => n.count > 0));
}

function buildCountNodes(
    pages: any[],
    field: string,
    entries: Array<[any, string]>,
    customMatcher?: (page: any, value: any) => boolean
): CategoryNode[] {
    return entries
        .map(([value, label]) => {
            const matcher = customMatcher
                ? (p: any) => customMatcher(p, value)
                : (p: any) => String(p[field] || '') === String(value);
            return {
                id: `${field}:${String(value)}`,
                label,
                count: pages.filter(matcher).length,
                filter: matcher,
            };
        })
        .filter((n) => n.count > 0);
}

function buildIndustryGroup(pages: any[], industry: DetectedIndustry): CategoryGroup | null {
    const nodes: CategoryNode[] = [];

    if (industry === 'ecommerce') {
        nodes.push(
            countNode(pages, 'Missing Product Schema', (p) => p.pageCategory === 'product' && !(p.schemaTypes || []).includes('Product')),
            countNode(pages, 'Missing Review Schema', (p) => p.pageCategory === 'product' && !(p.schemaTypes || []).includes('Review')),
            countNode(pages, 'Out-of-stock Indexed', (p) => p.industrySignals?.outOfStock && p.indexable !== false),
            countNode(pages, 'No Breadcrumbs', (p) => p.pageCategory === 'product' && !(p.schemaTypes || []).includes('BreadcrumbList')),
        );
    }

    if (industry === 'news' || industry === 'blog') {
        nodes.push(
            countNode(pages, 'Missing Article Schema', (p) => p.pageCategory === 'blog_post' && !p.hasArticleSchema),
            countNode(pages, 'No Author', (p) => p.pageCategory === 'blog_post' && !p.industrySignals?.hasAuthorAttribution),
            countNode(pages, 'No Publish Date', (p) => p.pageCategory === 'blog_post' && !p.visibleDate),
            countNode(pages, 'Stale Articles (>6mo)', (p) => {
                if (p.pageCategory !== 'blog_post' || !p.visibleDate) return false;
                return (Date.now() - new Date(p.visibleDate).getTime()) > 180 * 24 * 60 * 60 * 1000;
            }),
        );
    }

    if (industry === 'local') {
        nodes.push(
            countNode(pages, 'No Local Schema', (p) => p.crawlDepth === 0 && !p.industrySignals?.hasLocalBusinessSchema),
            countNode(pages, 'NAP Missing', (p) => p.isHtmlPage && !p.industrySignals?.hasNapOnPage && p.crawlDepth <= 1),
            countNode(pages, 'No Map Embed', (p) => p.crawlDepth === 0 && !p.hasEmbeddedMap),
        );
    }

    if (industry === 'saas') {
        nodes.push(
            countNode(pages, 'No Pricing Page', (p) => p.crawlDepth === 0 && !p.hasPricingPage),
            countNode(pages, 'No Docs Section', (p) => p.crawlDepth === 0 && !pages.some((pp) => String(pp.url || '').toLowerCase().includes('/doc'))),
        );
    }

    if (industry === 'healthcare') {
        nodes.push(
            countNode(pages, 'No Medical Author', (p) => p.pageCategory === 'blog_post' && !p.industrySignals?.hasMedicalAuthor),
            countNode(pages, 'No Medical Disclaimer', (p) => p.pageCategory === 'blog_post' && !p.industrySignals?.hasMedicalDisclaimer),
        );
    }

    if (industry === 'finance') {
        nodes.push(
            countNode(pages, 'No Financial Disclaimer', (p) => p.pageCategory === 'blog_post' && !p.industrySignals?.hasFinancialDisclaimer),
        );
    }

    const filtered = nodes.filter((n) => n.count > 0);
    if (filtered.length === 0) return null;

    const industryLabels: Partial<Record<DetectedIndustry, string>> = {
        ecommerce: 'E-commerce Issues',
        news: 'News / Magazine Issues',
        blog: 'Blog Issues',
        local: 'Local Business Issues',
        saas: 'SaaS Issues',
        healthcare: 'Healthcare Issues',
        finance: 'Finance Issues',
        education: 'Education Issues',
    };

    return {
        id: 'industry-issues',
        label: industryLabels[industry] || 'Industry Issues',
        icon: <AlertTriangle size={14} />,
        defaultOpen: true,
        nodes: filtered,
    };
}

function countNode(pages: any[], label: string, filter: (p: any) => boolean): CategoryNode {
    return {
        id: `industry:${label.toLowerCase().replace(/\s+/g, '-')}`,
        label,
        count: pages.filter(filter).length,
        filter,
    };
}

interface WQACategoryTreeProps {
    pages: any[];
    industry: DetectedIndustry;
    activeFilter: { groupId: string; nodeId: string } | null;
    onFilterChange: (groupId: string, nodeId: string, filter: (page: any) => boolean) => void;
    onClearFilter: () => void;
}

export default function WQACategoryTree({
    pages,
    industry,
    activeFilter,
    onFilterChange,
    onClearFilter,
}: WQACategoryTreeProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['page-category', 'page-value', 'tech-action', 'content-action', 'traffic-status']));

    const categories = useMemo(() => buildWqaCategories(pages, industry), [pages, industry]);

    const toggleGroup = useCallback((groupId: string) => {
        setOpenGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    }, []);

    const handleNodeClick = useCallback((groupId: string, node: CategoryNode) => {
        if (activeFilter?.groupId === groupId && activeFilter?.nodeId === node.id) {
            onClearFilter();
        } else {
            onFilterChange(groupId, node.id, node.filter);
        }
    }, [activeFilter, onFilterChange, onClearFilter]);

    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categories;
        const q = searchQuery.toLowerCase();
        return categories
            .map((group) => ({
                ...group,
                nodes: group.nodes.filter((n) => n.label.toLowerCase().includes(q)),
            }))
            .filter((g) => g.nodes.length > 0);
    }, [categories, searchQuery]);

    return (
        <div className="h-full flex flex-col bg-[#111] text-[12px] select-none">
            <div className="px-2 py-2 border-b border-[#1a1a1a] shrink-0 space-y-2">
                <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] text-[#555] uppercase tracking-widest font-bold">Categories</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-[#F5364E]">WQA</span>
                </div>
                <div className="relative">
                    <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#444]" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0a0a0a]/50 border border-[#222] rounded pl-6 pr-2 py-1 text-[11px] text-[#e0e0e0] placeholder-[#444] focus:border-[#F5364E]/50 focus:outline-none transition-colors"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar py-1 px-1">
                {filteredCategories.map((group) => {
                    if (group.id === 'all') {
                        const node = group.nodes[0];
                        const isActive = activeFilter === null;
                        return (
                            <button
                                key={group.id}
                                onClick={onClearFilter}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] rounded-sm transition-colors mb-0.5 ${
                                    isActive ? 'bg-[#F5364E]/10 text-[#F5364E] font-medium' : 'text-[#888] hover:text-[#ccc] hover:bg-[#1a1a1a]'
                                }`}
                            >
                                <span className="flex items-center gap-2 min-w-0">
                                    {group.icon}
                                    <span className="truncate">{node.label}</span>
                                </span>
                                <span className="text-[10px] text-[#555] font-mono shrink-0">{node.count.toLocaleString()}</span>
                            </button>
                        );
                    }

                    const isOpen = openGroups.has(group.id);

                    return (
                        <div key={group.id} className="mb-0.5">
                            <button
                                onClick={() => toggleGroup(group.id)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] font-semibold rounded-sm transition-colors ${isOpen ? 'text-[#eee]' : 'text-[#aaa] hover:bg-[#1a1a1a]'}`}
                            >
                                <span className="flex items-center gap-2 min-w-0">
                                    <span className="text-[#666] shrink-0">{group.icon}</span>
                                    <span className="truncate">{group.label}</span>
                                </span>
                                <span className="flex items-center gap-1.5 shrink-0 text-[#666]">
                                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </span>
                            </button>

                            {isOpen && (
                                <div className="ml-[18px] pl-3 my-1 space-y-0.5 border-l border-[#222]">
                                    {group.nodes.map((node) => {
                                        const isActive = activeFilter?.nodeId === node.id;
                                        return (
                                            <button
                                                key={node.id}
                                                onClick={() => handleNodeClick(group.id, node)}
                                                className={`w-full text-left px-2.5 py-1 text-[11px] rounded-sm transition-all flex items-center justify-between gap-1 ${
                                                    isActive
                                                        ? 'bg-[#F5364E]/10 text-[#F5364E] font-medium'
                                                        : 'text-[#888] hover:text-[#ccc] hover:bg-[#1a1a1a]'
                                                }`}
                                            >
                                                <span className="truncate">{node.label}</span>
                                                <span className={`text-[10px] font-mono ml-2 shrink-0 ${isActive ? 'text-[#F5364E]' : 'text-[#555]'}`}>
                                                    {node.count.toLocaleString()}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
