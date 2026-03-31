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
    private baseHostname = '';
    private abortController: AbortController | null = null;

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
        // Abort all in-flight fetch requests immediately
        if (this.abortController) {
            this.abortController.abort();
        }
        this.emit('log', 'Ghost Engine stopped by user.', 'info');
    }

    async start(startUrl: string) {
        if (!startUrl) return;
        this.startTime = Date.now();
        this.abortController = new AbortController();

        // Extract base hostname for same-domain filtering
        try {
            const parsedUrl = new URL(startUrl.startsWith('http') ? startUrl : `https://${startUrl}`);
            this.baseHostname = parsedUrl.hostname.replace(/^www\./, '');
        } catch {
            this.baseHostname = '';
        }

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
                    // Check isStopped BEFORE rescheduling — this is the key fix
                    if (this.isStopped) {
                        if (this.activeRequests === 0) {
                            this.emit('complete');
                        }
                        return;
                    }
                    if (this.queue.length > 0) {
                        this.scheduleRun();
                    } else if (this.activeRequests === 0) {
                        this.emit('complete');
                    }
                });
            }
        } finally {
            this.runLoopActive = false;
        }
    }

    private async crawlPage(url: string, depth: number) {
        // Early exit if stopped
        if (this.isStopped) return;

        try {
            const bridgeUrl = (import.meta as any).env?.VITE_GHOST_BRIDGE_URL;
            const targetUrl = bridgeUrl ? `${bridgeUrl}?url=${encodeURIComponent(url)}` : url;

            // Skip non-HTML resources to save Worker requests
            const lowerUrl = url.toLowerCase();
            const skipExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3', '.pdf', '.zip', '.map'];
            if (skipExtensions.some(ext => lowerUrl.endsWith(ext) || lowerUrl.includes(ext + '?'))) {
                // Still record it as a discovered resource, but don't fetch through the proxy
                this.crawledCount++;
                this.emit('page', {
                    url,
                    title: '',
                    metaDesc: '',
                    links: [],
                    depth,
                    statusCode: 200,
                    loadTime: 0,
                    wordCount: 0,
                    contentType: lowerUrl.match(/\.(css|js)/) ? 'text/css' : 'image',
                    timestamp: Date.now(),
                    skipped: true
                });
                return;
            }

            const response = await fetch(targetUrl, {
                mode: 'cors',
                headers: { 'User-Agent': this.config.userAgent || 'Headlight-Ghost/1.0' },
                signal: this.abortController?.signal
            });

            if (this.isStopped) return;

            if (!response.ok) {
                if (!bridgeUrl && response.status === 0) {
                    throw new Error('CORS Blocked. Please enable the Ghost Bridge or use a CORS extension.');
                }
                // Report the error page but don't throw
                this.crawledCount++;
                this.maxDepthSeen = Math.max(this.maxDepthSeen, depth);
                this.emit('page', {
                    url,
                    title: '',
                    metaDesc: '',
                    links: [],
                    depth,
                    statusCode: response.status,
                    loadTime: 0,
                    wordCount: 0,
                    contentType: response.headers.get('content-type') || '',
                    timestamp: Date.now()
                });
                return;
            }

            // Check content-type — only parse HTML
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('html') && !contentType.includes('text')) {
                this.crawledCount++;
                this.maxDepthSeen = Math.max(this.maxDepthSeen, depth);
                this.emit('page', {
                    url,
                    title: '',
                    metaDesc: '',
                    links: [],
                    depth,
                    statusCode: response.status,
                    loadTime: 0,
                    wordCount: 0,
                    contentType,
                    timestamp: Date.now()
                });
                return;
            }

            const html = await response.text();
            if (this.isStopped) return;

            let pageData = this.parseHtml(url, html, depth);

            // Trigger AI Scoring asynchronously if worker is ready
            if (this.config.aiCategorization && this.aiWorker && this.aiWorkerReady) {
                const rawText = new DOMParser().parseFromString(html, 'text/html').body?.textContent || '';
                
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
            // Don't emit errors for intentional aborts
            if (error.name === 'AbortError' || this.isStopped) return;
            this.emit('error', error);
            this.emit('log', `Failed ${url}: ${error.message}`, 'error');
        }
    }

    private parseHtml(url: string, html: string, depth: number) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const title = doc.querySelector('title')?.textContent || '';
        const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const h1 = doc.querySelector('h1')?.textContent || '';
        const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
        const robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '';

        // Separate internal and external links
        const allLinks = Array.from(doc.querySelectorAll('a'))
            .map(a => (a as HTMLAnchorElement).getAttribute('href'))
            .filter(Boolean)
            .map(href => normalizeUrl(href!, url))
            .filter(Boolean) as string[];

        const internalLinks: string[] = [];
        const externalLinks: string[] = [];

        for (const link of allLinks) {
            if (this.isInternalUrl(link)) {
                internalLinks.push(link);
            } else {
                externalLinks.push(link);
            }
        }

        // Count images
        const images = doc.querySelectorAll('img');
        const imagesWithoutAlt = Array.from(images).filter(img => !img.getAttribute('alt')?.trim()).length;

        return {
            url,
            title,
            metaDesc,
            h1_1: h1,
            canonical,
            metaRobots: robots,
            links: internalLinks,  // Only internal links for crawling
            externalLinks,         // Track external links separately
            internalOutlinks: internalLinks.length,
            externalOutlinks: externalLinks.length,
            depth,
            statusCode: 200,
            loadTime: 0,
            wordCount: html.split(/\s+/).length,
            contentType: 'text/html',
            imageCount: images.length,
            imagesWithoutAlt,
            indexable: !robots.includes('noindex'),
            timestamp: Date.now()
        };
    }

    /**
     * Check if a URL belongs to the same domain as the start URL.
     */
    private isInternalUrl(url: string): boolean {
        if (!this.baseHostname) return true;
        try {
            const targetHost = new URL(url).hostname.replace(/^www\./, '');
            return targetHost === this.baseHostname;
        } catch {
            return false;
        }
    }

    private enqueueLinks(links: string[], nextDepth: number) {
        for (const link of links) {
            // Only enqueue internal URLs that haven't been visited or queued
            if (!this.isInternalUrl(link)) continue;
            if (this.visited.has(link)) continue;
            if (this.queue.some(q => q.url === link)) continue;

            this.queue.push({ url: link, depth: nextDepth });
            this.discoveredCount++;
        }
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
