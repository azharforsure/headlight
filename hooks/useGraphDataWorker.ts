/**
 * useGraphDataWorker.ts
 * 
 * P2 fix: Hook that manages the graphData Web Worker lifecycle.
 * Sends analysisPages to the worker and returns the computed { nodes, links }.
 * Falls back to empty data while the worker is computing.
 */
import { useState, useEffect, useRef } from 'react';

interface GraphData {
    nodes: any[];
    links: any[];
}

const EMPTY_GRAPH: GraphData = { nodes: [], links: [] };

export function useGraphDataWorker(analysisPages: any[]): GraphData {
    const [graphData, setGraphData] = useState<GraphData>(EMPTY_GRAPH);
    const workerRef = useRef<Worker | null>(null);
    const pendingRef = useRef(false);

    // Create worker once
    useEffect(() => {
        try {
            workerRef.current = new Worker(
                new URL('../workers/graphData.worker.ts', import.meta.url),
                { type: 'module' }
            );

            workerRef.current.onmessage = (e: MessageEvent<GraphData>) => {
                setGraphData(e.data);
                pendingRef.current = false;
            };

            workerRef.current.onerror = (err) => {
                console.error('[graphData.worker] Error:', err);
                pendingRef.current = false;
            };
        } catch (err) {
            console.warn('[graphData.worker] Web Worker not supported, falling back to inline computation');
            workerRef.current = null;
        }

        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, []);

    // Post pages to worker whenever they change
    useEffect(() => {
        if (analysisPages.length === 0) {
            setGraphData(EMPTY_GRAPH);
            return;
        }

        if (!workerRef.current) {
            // Fallback: no worker support (SSR, etc.) — keep existing data
            return;
        }

        // Serialize only the fields the worker needs to minimize transfer cost
        const slimPages = analysisPages.map(p => ({
            url: p.url,
            title: p.title || '',
            metaDesc: p.metaDesc || '',
            statusCode: p.statusCode,
            contentType: p.contentType || '',
            inlinks: p.inlinks || 0,
            outlinks: p.outlinks || 0,
            internalPageRank: p.internalPageRank || 0,
            crawlDepth: p.crawlDepth || 0,
            loadTime: p.loadTime || 0,
            nonIndexable: p.nonIndexable || false,
            outlinksList: p.outlinksList || []
        }));

        pendingRef.current = true;
        workerRef.current.postMessage({ analysisPages: slimPages });
    }, [analysisPages]);

    return graphData;
}
