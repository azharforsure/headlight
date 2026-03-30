import { normalizeUrl } from './UrlUtils';

export interface GhostCrawlConfig {
    maxConcurrent?: number;
    maxDepth?: number;
    limit?: number;
    userAgent?: string;
    aiCategorization?: boolean;
}

type GhostEvent = 'page' | 'progress' | 'complete' | 'error' | 'log';

export class GhostCrawler {
    private queue: { url: string; depth: number }[] = [];
    private visited = new Set<string>();
    private isStopped = false;
    private activeRequests = 0;
    private crawledCount = 0;
    private discoveredCount = 0;
    private maxDepthSeen = 0;
    private startTime = 0;
    private listeners: Record<string, Function[]> = {};
    private aiWorker: Worker | null = null;
    private aiWorkerReady = false;
    private runLoopActive = false;

    constructor(private config: GhostCrawlConfig) {
        if (config.aiCategorization) {
            this.initAiWorker();
        }
    }

    private initAiWorker() {
        if (typeof window !== 'undefined' && window.Worker) {
            this.aiWorker = new Worker(new URL('../workers/ai-scoring.worker.ts', import.meta.url), { type: 'module' });
            
            this.aiWorker.onmessage = (e) => {
                if (e.data.status === 'ready') {
                    this.emit('log', 'Local AI Content Scoring Model Loaded (WebGPU/WASM)', 'success');
                    this.aiWorkerReady = true;
                } else if (e.data.status === 'progress') {
                    // Optional: show model download progress
                }
            };
            
            this.aiWorker.postMessage({ type: 'init' });
        }
    }

    on(event: GhostEvent, listener: Function) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(listener);
    }

    private emit(event: GhostEvent, ...args: any[]) {
        this.listeners[event]?.forEach(fn => fn(...args));
    }

    getCrawledCount() {
        return this.crawledCount;
    }

    stop() {
        this.isStopped = true;
        this.emit('log', 'Ghost Engine stopped by user.', 'info');
    }

    async start(startUrl: string) {
        if (!startUrl) return;
        this.startTime = Date.now();
        this.queue.push({ url: startUrl, depth: 0 });
        this.discoveredCount = 1;
        this.emit('log', `Ghost Engine starting at ${startUrl}`, 'info');
        this.scheduleRun();
    }

    private scheduleRun() {
        if (this.isStopped || this.runLoopActive) return;
        this.run();
    }

    private async run() {
        this.runLoopActive = true;
        try {
            while (this.queue.length > 0 && !this.isStopped) {
                if (this.activeRequests >= (this.config.maxConcurrent || 5)) {
                    await new Promise(r => setTimeout(r, 100));
                    continue;
                }

                if (this.config.limit && this.crawledCount >= this.config.limit) {
                    this.emit('log', 'Crawl limit reached.', 'info');
                    break;
                }

                const item = this.queue.shift();
                if (!item || this.visited.has(item.url)) continue;

                this.visited.add(item.url);
                this.activeRequests++;
                
                this.crawlPage(item.url, item.depth).finally(() => {
                    this.activeRequests--;
                    this.emitProgress();
                    if (!this.isStopped && this.queue.length > 0) {
                        this.scheduleRun();
                    } else if (this.activeRequests === 0 && this.queue.length === 0) {
                        this.emit('complete');
                    }
                });
            }
        } finally {
            this.runLoopActive = false;
        }
    }

    private async crawlPage(url: string, depth: number) {
        try {
            const bridgeUrl = (import.meta as any).env?.VITE_GHOST_BRIDGE_URL;
            const targetUrl = bridgeUrl ? `${bridgeUrl}?url=${encodeURIComponent(url)}` : url;

            const response = await fetch(targetUrl, {
                mode: 'cors',
                headers: { 'User-Agent': this.config.userAgent || 'Headlight-Ghost/1.0' }
            });

            if (!response.ok) {
                if (!bridgeUrl && response.status === 0) {
                    throw new Error('CORS Blocked. Please enable the Ghost Bridge or use a CORS extension.');
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const html = await response.text();
            let pageData = this.parseHtml(url, html, depth);

            // Trigger AI Scoring asynchronously if worker is ready
            if (this.config.aiCategorization && this.aiWorker && this.aiWorkerReady) {
                const rawText = new DOMParser().parseFromString(html, 'text/html').body?.textContent || '';
                
                // Return a promise that resolves when AI worker responds
                const aiResult = await new Promise((resolve) => {
                    const messageHandler = (e: MessageEvent) => {
                        if (e.data.id === url && e.data.status === 'complete') {
                            this.aiWorker?.removeEventListener('message', messageHandler);
                            resolve(e.data.result);
                        } else if (e.data.id === url && e.data.status === 'error') {
                            this.aiWorker?.removeEventListener('message', messageHandler);
                            resolve(null);
                        }
                    };
                    this.aiWorker!.addEventListener('message', messageHandler);
                    this.aiWorker!.postMessage({ id: url, url, text: rawText, type: 'score' });
                    
                    // Timeout just in case
                    setTimeout(() => {
                        this.aiWorker?.removeEventListener('message', messageHandler);
                        resolve(null);
                    }, 5000);
                });

                if (aiResult) {
                    pageData = { ...pageData, ...aiResult as any };
                }
            }
            
            this.crawledCount++;
            this.maxDepthSeen = Math.max(this.maxDepthSeen, depth);
            this.emit('page', pageData);

            if (this.config.maxDepth === undefined || depth < this.config.maxDepth) {
                this.enqueueLinks(pageData.links, depth + 1);
            }
        } catch (error: any) {
            this.emit('error', error);
            this.emit('log', `Failed ${url}: ${error.message}`, 'error');
        }
    }

    private parseHtml(url: string, html: string, depth: number) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const title = doc.querySelector('title')?.textContent || '';
        const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        
        const links = Array.from(doc.querySelectorAll('a'))
            .map(a => (a as HTMLAnchorElement).getAttribute('href'))
            .filter(Boolean)
            .map(href => normalizeUrl(href!, url))
            .filter(Boolean) as string[];

        return {
            url,
            title,
            metaDesc,
            links,
            depth,
            statusCode: 200,
            loadTime: 0,
            wordCount: html.split(/\s+/).length,
            timestamp: Date.now()
        };
    }

    private enqueueLinks(links: string[], nextDepth: number) {
        links.forEach(link => {
            if (!this.visited.has(link) && !this.queue.some(q => q.url === link)) {
                this.queue.push({ url: link, depth: nextDepth });
                this.discoveredCount++;
            }
        });
    }

    private emitProgress() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        this.emit('progress', {
            queue: this.queue.length,
            crawled: this.crawledCount,
            discovered: this.discoveredCount,
            maxDepthSeen: this.maxDepthSeen,
            rate: elapsed > 0 ? this.crawledCount / elapsed : 0
        });
    }
}
