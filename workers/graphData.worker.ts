/**
 * graphData.worker.ts
 * 
 * P2 fix: Heavy graph layout computation offloaded from the main thread.
 * Receives serialized analysisPages, produces { nodes, links } for the 3D force graph.
 */

interface GraphNode {
    id: string;
    name: string;
    val: number;
    group: number;
    status: number;
    fullUrl: string;
    inlinks: number;
    outlinks: number;
    internalPageRank: number;
    crawlDepth: number;
    dirPath: string;
    title: string;
    sectionKey: string;
    templateKey: string;
    issueCount: number;
    x: number;
    y: number;
    z: number;
}

interface GraphLink {
    source: string;
    target: string;
    isStructural: boolean;
    isCrossLink: boolean;
    sameSection: boolean;
}

function computeGraphData(analysisPages: any[]): { nodes: GraphNode[]; links: GraphLink[] } {
    if (analysisPages.length === 0) return { nodes: [], links: [] };

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const addedNodes = new Set<string>();
    const addedLinks = new Set<string>();
    const validPageUrls = new Set<string>(analysisPages.map(page => page.url));
    const pageByUrl = new Map<string, any>(analysisPages.map(page => [page.url, page]));
    const rootUrl = analysisPages[0]?.url;
    const sectionBuckets = new Map<string, string[]>();

    analysisPages.forEach(page => {
        let nodeName = page.url;
        let dirPath = '/';
        let sectionKey = 'Homepage';
        let templateKey = 'root';

        try {
            const parsedUrl = new URL(page.url);
            const segments = parsedUrl.pathname.split('/').filter(Boolean);
            nodeName = parsedUrl.pathname === '/' ? (parsedUrl.hostname || page.url) : (parsedUrl.pathname || page.url);
            dirPath = segments.length > 0 ? `/${segments.slice(0, 1).join('/')}` : '/';
            sectionKey = segments[0]
                ? segments[0].replace(/[-_]+/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())
                : 'Homepage';
            templateKey = segments.slice(0, 2).join('/') || 'root';
        } catch {
            nodeName = page.url;
        }

        if (!addedNodes.has(page.url)) {
            if (!sectionBuckets.has(sectionKey)) sectionBuckets.set(sectionKey, []);
            sectionBuckets.get(sectionKey)?.push(page.url);

            let group = 1;
            if (page.contentType?.includes('image')) group = 2;
            else if (page.contentType?.includes('javascript')) group = 3;
            else if (page.contentType?.includes('css')) group = 4;

            const issueCount = [
                page.statusCode >= 400,
                !page.title,
                !page.metaDesc,
                page.nonIndexable,
                page.loadTime > 3000
            ].filter(Boolean).length;

            nodes.push({
                id: page.url,
                name: nodeName,
                val: page.url === rootUrl ? 22 : Math.min(14, 4 + (page.inlinks || 0)),
                group: page.statusCode >= 400 ? 5 : group,
                status: page.statusCode,
                fullUrl: page.url,
                inlinks: Number(page.inlinks || 0),
                outlinks: Number(page.outlinks || 0),
                internalPageRank: Number(page.internalPageRank || 0),
                crawlDepth: Number(page.crawlDepth || 0),
                dirPath,
                title: page.title || nodeName,
                sectionKey,
                templateKey,
                issueCount,
                x: 0,
                y: 0,
                z: 0
            });
            addedNodes.add(page.url);
        }
    });

    // Section layout
    const orderedSections = Array.from(sectionBuckets.keys()).sort((a, b) => {
        if (a === 'Homepage') return -1;
        if (b === 'Homepage') return 1;
        return a.localeCompare(b);
    });
    const sectionCenters = new Map<string, { y: number; z: number }>();
    const sectionSpacing = 240;
    orderedSections.forEach((section, index) => {
        const centeredIndex = index - ((orderedSections.length - 1) / 2);
        const curveOffset = Math.sin(index * 0.9) * 180;
        sectionCenters.set(section, {
            y: centeredIndex * sectionSpacing,
            z: curveOffset
        });
    });

    // Sort nodes within each section/depth bucket
    const nodeOrderBySectionDepth = new Map<string, GraphNode[]>();
    nodes.forEach((node) => {
        const key = `${node.sectionKey}::${node.crawlDepth}`;
        if (!nodeOrderBySectionDepth.has(key)) nodeOrderBySectionDepth.set(key, []);
        nodeOrderBySectionDepth.get(key)?.push(node);
    });
    nodeOrderBySectionDepth.forEach((bucket) => {
        bucket.sort((a, b) => {
            const scoreA = (a.internalPageRank * 10) + (a.inlinks * 2) - (a.issueCount * 4);
            const scoreB = (b.internalPageRank * 10) + (b.inlinks * 2) - (b.issueCount * 4);
            if (scoreA !== scoreB) return scoreB - scoreA;
            return String(a.name).localeCompare(String(b.name));
        });
    });

    // Position nodes
    nodes.forEach((node) => {
        const bucketKey = `${node.sectionKey}::${node.crawlDepth}`;
        const bucket = nodeOrderBySectionDepth.get(bucketKey) || [node];
        const bucketIndex = Math.max(0, bucket.findIndex((entry) => entry.id === node.id));
        const center = sectionCenters.get(node.sectionKey) || { y: 0, z: 0 };
        const siblingOffset = bucketIndex - ((bucket.length - 1) / 2);

        node.x = 120 + (node.crawlDepth * 240);
        node.y = center.y + (siblingOffset * 92);
        node.z = center.z + (siblingOffset * 70) + (((bucketIndex % 3) - 1) * 60);
    });

    // Build node lookup for link sameSection check
    const nodeByUrl = new Map<string, GraphNode>(nodes.map(n => [n.id, n]));

    // Build links
    analysisPages.forEach(page => {
        if (!page.outlinksList || !Array.isArray(page.outlinksList)) return;

        page.outlinksList.forEach((targetUrl: string) => {
            if (!validPageUrls.has(targetUrl)) return;

            const linkKey = `${page.url}::${targetUrl}`;
            if (addedLinks.has(linkKey)) return;

            addedLinks.add(linkKey);

            const targetPage = pageByUrl.get(targetUrl);
            const sourceDepth = Number(page.crawlDepth || 0);
            const targetDepth = Number(targetPage?.crawlDepth || 0);
            const isStructural = Boolean(targetPage) && (
                targetDepth === sourceDepth + 1 ||
                (targetDepth === sourceDepth && targetPage?.url.startsWith(page.url.replace(/\/$/, '')))
            );

            const sourceNode = nodeByUrl.get(page.url);
            const targetNode = nodeByUrl.get(targetUrl);

            links.push({
                source: page.url,
                target: targetUrl,
                isStructural,
                isCrossLink: !isStructural,
                sameSection: Boolean(sourceNode && targetNode && sourceNode.sectionKey === targetNode.sectionKey)
            });
        });
    });

    return { nodes, links };
}

// Worker message handler
self.onmessage = function(e: MessageEvent) {
    const { analysisPages } = e.data;
    const result = computeGraphData(analysisPages);
    self.postMessage(result);
};
