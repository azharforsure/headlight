import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { chromium } from 'playwright';
import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool, request as undiciRequest } from 'undici';
import { completeAI } from './aiGateway.js';
import VisualDiffService from './VisualDiffService.js';
import { lookup, resolveCname } from 'dns';
import { promisify } from 'util';
import { brotliDecompressSync, gunzipSync, inflateSync } from 'zlib';
import tls from 'tls';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sleep = ms => new Promise(r => setTimeout(r, ms));
const dnsLookup = promisify(lookup);
const dnsResolveCname = promisify(resolveCname);
const withTimeout = (promise, ms, timeoutMessage) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    promise
        .then((value) => {
            clearTimeout(timer);
            resolve(value);
        })
        .catch((err) => {
            clearTimeout(timer);
            reject(err);
        });
});

// ─── Sensitive File Probe ────────────────────────────
const SENSITIVE_PATHS = [
    '/.env', '/.git/config', '/wp-config.php.bak',
    '/.htaccess', '/server-status', '/phpinfo.php',
    '/package.json', '/.DS_Store', '/web.config'
];

async function probeSensitiveFiles(baseUrl, requestHeaders) {
    const found = [];
    const protocol = new URL(baseUrl).protocol;
    const hostname = new URL(baseUrl).hostname;
    
    await Promise.allSettled(SENSITIVE_PATHS.map(async (path) => {
        try {
            const probeUrl = `${protocol}//${hostname}${path}`;
            const { statusCode, body } = await undiciRequest(probeUrl, {
                method: 'HEAD',
                headers: requestHeaders,
                headersTimeout: 3000,
                bodyTimeout: 3000,
                maxRedirections: 0
            });
            await body.dump();
            
            if (statusCode === 200) {
                found.push({ path, statusCode });
            }
        } catch { /* ignore probe failures */ }
    }));
    
    return found;
}

// ─── Directory Listing Detection ─────────────────────
function isDirectoryListing(html) {
    if (!html) return false;
    const lower = html.toLowerCase();
    return (
        (lower.includes('index of /') || lower.includes('directory listing')) &&
        (lower.includes('<pre>') || lower.includes('parent directory'))
    );
}

// ─── DNS Cache ───────────────────────────────────────────────
const dnsCache = new Map();
const DNS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function cachedDnsLookup(hostname) {
    const cached = dnsCache.get(hostname);
    if (cached && Date.now() - cached.time < DNS_CACHE_TTL) {
        return cached.address;
    }
    try {
        const result = await withTimeout(
            dnsLookup(hostname),
            3000,
            `DNS lookup timeout for ${hostname}`
        );
        dnsCache.set(hostname, { address: result.address, time: Date.now() });
        return result.address;
    } catch {
        return null;
    }
}

// ─── URL Normalization ───────────────────────────────────────
function normalizeUrl(rawUrl, baseUrl = undefined, options = {}) {
    try {
        const url = baseUrl ? new URL(rawUrl, baseUrl) : new URL(rawUrl);
        url.hash = '';
        if (options.ignoreQueryParams) {
            url.search = '';
        }
        if ((url.protocol === 'http:' && url.port === '80') || (url.protocol === 'https:' && url.port === '443')) {
            url.port = '';
        }
        return url.href;
    } catch {
        return null;
    }
}

function toSitemapKey(rawUrl, baseUrl = undefined) {
    const normalized = normalizeUrl(rawUrl, baseUrl, { ignoreQueryParams: true });
    if (!normalized) return '';

    try {
        const url = new URL(normalized);
        let key = url.hostname.replace(/^www\./i, '').toLowerCase() + url.pathname.toLowerCase();
        
        // Strip trailing slash if not root
        if (key.length > 1 && key.endsWith('/')) {
            key = key.slice(0, -1);
        }
        
        return key;
    } catch {
        // Fallback for invalid URLs that might still be string-matchable
        return String(normalized)
            .toLowerCase()
            .replace(/^https?:\/\//i, '')
            .replace(/^www\./i, '')
            .split('?')[0]
            .split('#')[0]
            .replace(/\/+$/, '');
    }
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseRulePatterns(rawRules = '') {
    return String(rawRules)
        .split(/\r?\n|,/)
        .map(rule => rule.trim())
        .filter(Boolean)
        .map((rule) => {
            try {
                return new RegExp(rule, 'i');
            } catch {
                return new RegExp(escapeRegExp(rule).replace(/\\\*/g, '.*'), 'i');
            }
        });
}

function matchesRuleSet(url, patterns) {
    return patterns.some((pattern) => pattern.test(url));
}

function shouldCrawlUrl(url, includePatterns, excludePatterns) {
    if (includePatterns.length > 0 && !matchesRuleSet(url, includePatterns)) {
        return false;
    }

    if (excludePatterns.length > 0 && matchesRuleSet(url, excludePatterns)) {
        return false;
    }

    return true;
}

function parseCustomHeaders(rawHeaders = '') {
    return String(rawHeaders)
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .reduce((headers, line) => {
            const separatorIndex = line.indexOf(':');
            if (separatorIndex === -1) return headers;
            const key = line.slice(0, separatorIndex).trim();
            const value = line.slice(separatorIndex + 1).trim();
            if (key && value) headers[key] = value;
            return headers;
        }, {});
}

function parseLinkHeader(rawHeader = '') {
    const result = { next: '', prev: '' };
    if (!rawHeader) return result;

    const headerValue = Array.isArray(rawHeader) ? rawHeader.join(',') : String(rawHeader);
    const segments = headerValue.split(',');
    for (const segment of segments) {
        const match = segment.match(/<([^>]+)>\s*;\s*rel="?([^";,]+)"?/i);
        if (!match) continue;
        const [, href, rel] = match;
        if (rel === 'next' && !result.next) result.next = href;
        if (rel === 'prev' && !result.prev) result.prev = href;
    }

    return result;
}

function classifyFunnelStage(page = {}) {
    const corpus = [
        page.url || '',
        page.title || '',
        page.metaDesc || '',
        page.h1_1 || '',
        page.searchIntent || ''
    ].join(' ').toLowerCase();

    if (/(checkout|buy|pricing|price|request-demo|book-demo|demo|trial|signup|sign-up|register|contact-sales|quote)/.test(corpus)) {
        return 'Transactional';
    }
    if (/(compare|comparison|best|top|review|reviews|vs\b|versus|alternative|alternatives|services|solution|solutions)/.test(corpus)) {
        return 'Commercial';
    }
    if (/(case-study|success-story|customer-story|webinar|template|download|calculator|benchmark)/.test(corpus)) {
        return 'Consideration';
    }
    return 'Informational';
}

function resolveRedirectType(statusCode) {
    if (statusCode === 301 || statusCode === 308) return 'Permanent';
    if (statusCode === 302 || statusCode === 307) return 'Temporary';
    return '';
}

function computeCarbonMetrics(totalTransferred = 0) {
    const bytes = Math.max(0, Number(totalTransferred) || 0);
    const co2Mg = Number(((bytes / 1024) * 0.2).toFixed(2));

    let carbonRating = 'A';
    if (co2Mg > 2000) carbonRating = 'E';
    else if (co2Mg > 1000) carbonRating = 'D';
    else if (co2Mg > 500) carbonRating = 'C';
    else if (co2Mg > 200) carbonRating = 'B';

    return { co2Mg, carbonRating };
}

function normalizeResponseHeaders(headers = {}) {
    if (!headers || typeof headers !== 'object') return {};

    if (typeof headers.entries === 'function') {
        return Object.fromEntries(
            Array.from(headers.entries()).map(([key, value]) => [String(key).toLowerCase(), value])
        );
    }

    return Object.fromEntries(
        Object.entries(headers).map(([key, value]) => [String(key).toLowerCase(), value])
    );
}

function extractCompressionInfo(headers = {}) {
    const normalized = normalizeResponseHeaders(headers);
    const rawEncoding = String(normalized['content-encoding'] || '').trim().toLowerCase();
    const contentEncoding = rawEncoding || 'none';

    return {
        contentEncoding,
        isCompressed: ['gzip', 'br', 'deflate'].some((encoding) => contentEncoding.includes(encoding))
    };
}

function extractContentTypeInfo(contentType = '') {
    const raw = String(contentType || '').trim();
    const [mimePart, ...paramParts] = raw.split(';').map((part) => part.trim()).filter(Boolean);
    const contentTypeMime = mimePart.toLowerCase();
    const charsetPart = paramParts.find((part) => /^charset=/i.test(part)) || '';
    const contentTypeCharset = charsetPart ? charsetPart.split('=').slice(1).join('=').trim().toLowerCase() : '';
    const requiresUtf8Charset = [
        'text/html',
        'application/xhtml+xml',
        'text/plain',
        'text/css',
        'application/javascript',
        'text/javascript',
        'application/json',
        'application/xml',
        'text/xml'
    ].includes(contentTypeMime);

    return {
        contentTypeMime,
        contentTypeCharset,
        contentTypeValid: Boolean(contentTypeMime) && (!requiresUtf8Charset || contentTypeCharset === 'utf-8')
    };
}

async function measureCnameChainLength(hostname, maxDepth = 10, visited = new Set()) {
    if (!hostname || visited.has(hostname) || visited.size >= maxDepth) {
        return visited.size;
    }

    visited.add(hostname);

    try {
        const records = await withTimeout(
            dnsResolveCname(hostname),
            3000,
            `CNAME lookup timeout for ${hostname}`
        );
        const nextHost = Array.isArray(records) ? records[0] : null;
        if (!nextHost) return Math.max(0, visited.size - 1);
        return measureCnameChainLength(nextHost, maxDepth, visited);
    } catch {
        return Math.max(0, visited.size - 1);
    }
}

function inferCipherStrength(cipher = {}) {
    const name = String(cipher.standardName || cipher.name || '').toUpperCase();
    if (!name) return 'unknown';
    if (name.includes('CHACHA20') || name.includes('AES_256') || name.includes('AES256')) return 'strong';
    if (name.includes('AES_128') || name.includes('AES128')) return 'modern';
    if (name.includes('RC4') || name.includes('3DES') || name.includes('DES')) return 'weak';
    return 'modern';
}

function computeSslGrade(sslInfo = {}, securityInfo = {}) {
    if (!sslInfo?.sslValid) return 'F';
    let score = 100;

    if (sslInfo.sslIsWeakProtocol) score -= 40;
    else if (!sslInfo.sslIsTls13 && !sslInfo.sslIsTls12) score -= 20;

    if (sslInfo.sslCipherStrength === 'weak') score -= 25;
    else if (sslInfo.sslCipherStrength === 'unknown') score -= 10;

    if (sslInfo.sslChainComplete === false) score -= 20;
    if (!securityInfo?.hasHsts) score -= 10;
    if (sslInfo.sslIsExpiringSoon) score -= 10;

    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}

function inferSpaRouteBroken(currentUrl, jsRenderDiff = null) {
    if (!jsRenderDiff) return false;

    try {
        const parsed = new URL(currentUrl);
        const isRootPath = !parsed.pathname || parsed.pathname === '/';
        if (isRootPath) return false;
    } catch {
        return false;
    }

    const staticWords = Number(jsRenderDiff.staticWordCount || 0);
    const renderedWords = Number(jsRenderDiff.renderedWordCount || 0);
    const textDiffPercent = Number(jsRenderDiff.textDiffPercent || 0);

    return Boolean(
        jsRenderDiff.criticalContentJsOnly &&
        renderedWords >= 250 &&
        staticWords <= 120 &&
        textDiffPercent >= 50
    );
}

function extractHtmlLinkSets(html = '', currentUrl, baseHostname, options = {}) {
    const $ = cheerio.load(html);
    const internal = new Set();
    const external = new Set();
    const baseHostNoWww = String(baseHostname || '').replace(/^www\./, '').toLowerCase();

    $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

        const absoluteHref = normalizeUrl(href, currentUrl, options);
        if (!absoluteHref) return;

        try {
            const host = new URL(absoluteHref).hostname.replace(/^www\./, '').toLowerCase();
            if (host === baseHostNoWww) internal.add(absoluteHref);
            else external.add(absoluteHref);
        } catch {}
    });

    return { internal, external };
}

function tokenizeSemanticText(text = '') {
    const stopWords = new Set([
        'the', 'and', 'for', 'that', 'with', 'from', 'this', 'have', 'will', 'your', 'into', 'about', 'their',
        'would', 'there', 'which', 'when', 'what', 'where', 'while', 'also', 'were', 'been', 'being', 'over',
        'under', 'than', 'then', 'them', 'they', 'our', 'you', 'are', 'but', 'not', 'all', 'can', 'use', 'using',
        'used', 'more', 'most', 'such', 'each', 'per', 'via', 'its', 'his', 'her', 'she', 'him', 'has', 'had',
        'was', 'who', 'why', 'how', 'may', 'any', 'out', 'off', 'too', 'very'
    ]);

    const tokens = String(text || '').toLowerCase().match(/[a-z]{3,}/g) || [];
    return tokens.filter((token) => !stopWords.has(token));
}

function buildSemanticVector(text = '') {
    const vector = new Map();
    const tokens = tokenizeSemanticText(text);
    for (const token of tokens) {
        vector.set(token, (vector.get(token) || 0) + 1);
    }
    return vector;
}

function cosineSimilarity(a, b) {
    if (!a || !b || a.size === 0 || b.size === 0) return 0;

    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (const value of a.values()) magA += value * value;
    for (const value of b.values()) magB += value * value;
    for (const [token, value] of a.entries()) {
        dot += value * (b.get(token) || 0);
    }

    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function readResponseText(body, headers = {}) {
    const encodingHeader = headers['content-encoding'] || headers['Content-Encoding'] || '';
    const encoding = String(Array.isArray(encodingHeader) ? encodingHeader[0] : encodingHeader).toLowerCase().trim();

    if (!encoding || encoding === 'identity') {
        return body.text();
    }

    const arrayBuffer = await body.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (encoding.includes('br')) {
        return brotliDecompressSync(buffer).toString('utf8');
    }

    if (encoding.includes('gzip')) {
        return gunzipSync(buffer).toString('utf8');
    }

    if (encoding.includes('deflate')) {
        return inflateSync(buffer).toString('utf8');
    }

    return buffer.toString('utf8');
}

// ─── Robots.txt Parser ──────────────────────────────────────
class RobotsTxtParser {
    constructor() {
        this.rules = new Map(); // hostname -> { allowRules, disallowRules, crawlDelay, sitemaps }
    }

    _parseLlmsTxt(text) {
        const sections = [];
        let currentSection = null;
        const allow = [];
        const disallow = [];

        for (const rawLine of String(text || '').split('\n')) {
            const line = rawLine.trim();
            if (!line) continue;

            if (line.startsWith('#')) {
                currentSection = { heading: line.replace(/^#+\s*/, ''), lines: [] };
                sections.push(currentSection);
                continue;
            }

            if (/^(allow|use|include)\s*:/i.test(line)) {
                allow.push(line.split(':').slice(1).join(':').trim());
            }
            if (/^(disallow|avoid|exclude)\s*:/i.test(line)) {
                disallow.push(line.split(':').slice(1).join(':').trim());
            }

            if (!currentSection) {
                currentSection = { heading: 'General', lines: [] };
                sections.push(currentSection);
            }
            currentSection.lines.push(line);
        }

        return {
            raw: text,
            sections,
            allow,
            disallow,
            summary: sections.slice(0, 3).map((section) => `${section.heading}: ${section.lines.slice(0, 2).join(' ')}`).join(' | ')
        };
    }

    async fetchAndParse(hostname, protocol, requestHeaders, botName) {
        if (this.rules.has(hostname)) return;

        const robotsUrl = `${protocol}//${hostname}/robots.txt`;
        const llmsUrl = `${protocol}//${hostname}/llms.txt`;
        
        try {
            const [robotsResp, llmsResp] = await Promise.allSettled([
                undiciRequest(robotsUrl, { headers: requestHeaders, headersTimeout: 5000, bodyTimeout: 5000 }),
                undiciRequest(llmsUrl, { headers: requestHeaders, headersTimeout: 3000, bodyTimeout: 3000 })
            ]);

            let text = '';
            let sitemaps = [];
            let hasLlmsTxt = false;
            let llmsTxtContent = '';

            if (robotsResp.status === 'fulfilled' && robotsResp.value.statusCode === 200) {
                const { headers, body } = robotsResp.value;
                text = await readResponseText(body, headers);
            } else if (robotsResp.status === 'fulfilled') {
                await robotsResp.value.body.dump();
            }

            if (llmsResp.status === 'fulfilled' && llmsResp.value.statusCode === 200) {
                hasLlmsTxt = true;
                const { headers, body } = llmsResp.value;
                llmsTxtContent = await readResponseText(body, headers);
            } else if (llmsResp.status === 'fulfilled') {
                await llmsResp.value.body.dump();
            }

            const parsed = this._parse(text, botName);
            parsed.raw = text;
            parsed.hasLlmsTxt = hasLlmsTxt;
            parsed.llmsTxt = hasLlmsTxt ? this._parseLlmsTxt(llmsTxtContent) : null;
            this.rules.set(hostname, parsed);
        } catch {
            this.rules.set(hostname, { allow: [], disallow: [], crawlDelay: 0, sitemaps: [], raw: '', hasLlmsTxt: false, llmsTxt: null, aiBotRules: {}, aiBotAccess: {} });
        }
    }

    _parse(text, botName) {
        const lines = text.split('\n').map(l => l.trim());
        let activeAgent = false;
        let wildcardAgent = false;
        let currentAgent = null;
        const aiAgentGroups = {
            gptBot: { aliases: ['gptbot'], allow: [], disallow: [] },
            claudeBot: { aliases: ['claudebot'], allow: [], disallow: [] },
            perplexityBot: { aliases: ['perplexitybot'], allow: [], disallow: [] },
            googleExtended: { aliases: ['google-extended'], allow: [], disallow: [] },
            ccBot: { aliases: ['ccbot', 'commoncrawl'], allow: [], disallow: [] },
            byteSpider: { aliases: ['bytespider'], allow: [], disallow: [] },
            amazonBot: { aliases: ['amazonbot'], allow: [], disallow: [] },
            facebookBot: { aliases: ['facebookbot'], allow: [], disallow: [] },
            appleBotExtended: { aliases: ['applebot-extended'], allow: [], disallow: [] }
        };
        const result = { 
            allow: [], 
            disallow: [], 
            crawlDelay: 0, 
            sitemaps: [],
            aiBotRules: {
                gptBot: false,
                claudeBot: false,
                perplexityBot: false,
                googleExtended: false,
                ccBot: false,
                commonCrawl: false,
                byteSpider: false,
                amazonBot: false,
                facebookBot: false,
                appleBotExtended: false
            },
            aiBotAccess: {}
        };
        const wildcardResult = { allow: [], disallow: [], crawlDelay: 0 };

        for (const line of lines) {
            if (line.startsWith('#') || !line) continue;

            const lower = line.toLowerCase();
            if (lower.startsWith('user-agent:')) {
                const agent = line.split(':').slice(1).join(':').trim().toLowerCase();
                currentAgent = agent;
                activeAgent = agent === '*' || botName.toLowerCase().includes(agent);
                wildcardAgent = agent === '*';
                
                // Track AI bot rules specifically
                if (agent.includes('gptbot')) result.aiBotRules.gptBot = true;
                if (agent.includes('claudebot')) result.aiBotRules.claudeBot = true;
                if (agent.includes('perplexitybot')) result.aiBotRules.perplexityBot = true;
                if (agent.includes('google-extended')) result.aiBotRules.googleExtended = true;
                if (agent.includes('ccbot')) result.aiBotRules.ccBot = true;
                if (agent.includes('commoncrawl')) result.aiBotRules.commonCrawl = true;
                if (agent.includes('bytespider')) result.aiBotRules.byteSpider = true;
                if (agent.includes('amazonbot')) result.aiBotRules.amazonBot = true;
                if (agent.includes('facebookbot')) result.aiBotRules.facebookBot = true;
                if (agent.includes('applebot-extended')) result.aiBotRules.appleBotExtended = true;
            } else if (lower.startsWith('disallow:') && (activeAgent || wildcardAgent)) {
                const rule = line.split(':').slice(1).join(':').trim();
                if (rule) {
                    if (activeAgent && !wildcardAgent) result.disallow.push(rule);
                    else wildcardResult.disallow.push(rule);
                }
                Object.entries(aiAgentGroups).forEach(([key, group]) => {
                    if (group.aliases.some((alias) => currentAgent?.includes(alias))) {
                        group.disallow.push(rule || '/');
                    }
                });
            } else if (lower.startsWith('allow:') && (activeAgent || wildcardAgent)) {
                const rule = line.split(':').slice(1).join(':').trim();
                if (rule) {
                    if (activeAgent && !wildcardAgent) result.allow.push(rule);
                    else wildcardResult.allow.push(rule);
                }
                Object.entries(aiAgentGroups).forEach(([key, group]) => {
                    if (group.aliases.some((alias) => currentAgent?.includes(alias))) {
                        group.allow.push(rule);
                    }
                });
            } else if (lower.startsWith('crawl-delay:') && (activeAgent || wildcardAgent)) {
                const delay = parseFloat(line.split(':').slice(1).join(':').trim());
                if (!isNaN(delay)) {
                    if (activeAgent && !wildcardAgent) result.crawlDelay = delay * 1000;
                    else wildcardResult.crawlDelay = delay * 1000;
                }
            } else if (lower.startsWith('sitemap:')) {
                result.sitemaps.push(line.split(':').slice(1).join(':').trim());
            }
        }

        // Fall back to wildcard rules if no specific rules found
        if (result.disallow.length === 0 && result.allow.length === 0) {
            result.disallow = wildcardResult.disallow;
            result.allow = wildcardResult.allow;
        }
        if (result.crawlDelay === 0) result.crawlDelay = wildcardResult.crawlDelay;

        const summarizeAccess = (group) => {
            const effectiveAllow = group.allow.length ? group.allow : wildcardResult.allow;
            const effectiveDisallow = group.disallow.length ? group.disallow : wildcardResult.disallow;
            if (effectiveAllow.includes('/')) return 'allow';
            if (effectiveDisallow.includes('/')) return 'disallow';
            if (effectiveAllow.length > 0 && effectiveDisallow.length > 0) return 'partial';
            if (effectiveAllow.length > 0) return 'allow';
            if (effectiveDisallow.length > 0) return 'partial';
            return 'unspecified';
        };

        result.aiBotAccess = Object.fromEntries(
            Object.entries(aiAgentGroups).map(([key, group]) => [key, summarizeAccess(group)])
        );

        return result;
    }

    isAllowed(url) {
        try {
            const parsed = new URL(url);
            const rules = this.rules.get(parsed.hostname);
            if (!rules) return true;

            const urlPath = parsed.pathname + parsed.search;

            // Check allow rules first (more specific)
            for (const rule of rules.allow) {
                if (this._matchRule(urlPath, rule)) return true;
            }
            // Check disallow rules
            for (const rule of rules.disallow) {
                if (this._matchRule(urlPath, rule)) return false;
            }
            return true;
        } catch {
            return true;
        }
    }

    _matchRule(path, rule) {
        // Handle wildcard patterns
        if (rule.includes('*')) {
            const regex = new RegExp('^' + rule.replace(/\*/g, '.*').replace(/\$/g, '$'));
            return regex.test(path);
        }
        if (rule.endsWith('$')) {
            return path === rule.slice(0, -1);
        }
        return path.startsWith(rule);
    }

    getCrawlDelay(hostname) {
        return this.rules.get(hostname)?.crawlDelay || 0;
    }

    getSitemaps(hostname) {
        return this.rules.get(hostname)?.sitemaps || [];
    }

    getRaw(hostname) {
        return this.rules.get(hostname)?.raw || '';
    }

    getRules(hostname) {
        return this.rules.get(hostname) || { allow: [], disallow: [], crawlDelay: 0, sitemaps: [], raw: '', hasLlmsTxt: false, llmsTxt: null, aiBotRules: {}, aiBotAccess: {} };
    }
}

// ─── Sitemap Parser ─────────────────────────────────────────
async function fetchSitemapUrls(sitemapUrl, requestHeaders, maxUrls = 500000) {
    const urls = [];
    const visited = new Set();
    const seenUrlEntries = new Set();

    function addUrlEntry(loc, meta = {}) {
        if (!loc || urls.length >= maxUrls) return;
        const normalizedLoc = normalizeUrl(loc, sitemapUrl);
        if (!normalizedLoc || seenUrlEntries.has(normalizedLoc)) return;
        seenUrlEntries.add(normalizedLoc);
        urls.push({
            url: normalizedLoc,
            lastmod: meta.lastmod || '',
            changefreq: meta.changefreq || '',
            priority: meta.priority || ''
        });
    }

    async function parseSitemap(url) {
        if (visited.has(url) || urls.length >= maxUrls) return;
        visited.add(url);

        try {
            const { statusCode, body, headers } = await undiciRequest(url, {
                headers: requestHeaders,
                headersTimeout: 10000,
                bodyTimeout: 30000
            });

            if (statusCode !== 200) {
                await body.dump();
                return;
            }

            let text = '';
            try {
                // Determine if we need to gunzip
                const contentType = headers['content-type'] || '';
                const isGzip = url.endsWith('.gz') || contentType.includes('gzip');
                
                if (isGzip) {
                    const { gunzipSync } = await import('zlib');
                    const arrayBuffer = await body.arrayBuffer();
                    text = gunzipSync(Buffer.from(arrayBuffer)).toString('utf8');
                } else {
                    text = await readResponseText(body, headers);
                }
            } catch (err) {
                await body.dump().catch(() => {});
                return;
            }

            const $ = cheerio.load(text, { xmlMode: true, decodeEntities: true });
            const allElements = $('*');

            // Find sitemaps in index (index sitemaps have <sitemap> tags)
            const sitemaps = allElements.filter((_, el) => el.name.toLowerCase() === 'sitemap');
            if (sitemaps.length > 0) {
                const nestedLocs = sitemaps.find('loc, Loc');
                if (nestedLocs.length > 0) {
                    for (let i = 0; i < nestedLocs.length && urls.length < maxUrls; i++) {
                        await parseSitemap($(nestedLocs[i]).text().trim());
                    }
                    return;
                }
            }

            // Normal sitemaps: find <url> tags
            const urlEntries = allElements.filter((_, el) => el.name.toLowerCase() === 'url');
            if (urlEntries.length > 0) {
                urlEntries.each((_, el) => {
                    if (urls.length >= maxUrls) return false;
                    const $el = $(el);
                    // Find <loc> inside this <url>
                    const locEl = $el.find('*').filter((_, child) => child.name.toLowerCase() === 'loc');
                    const loc = (locEl.text() || $el.text()).trim();
                    
                    const lastmodEl = $el.find('*').filter((_, child) => child.name.toLowerCase() === 'lastmod');
                    const freqEl = $el.find('*').filter((_, child) => child.name.toLowerCase() === 'changefreq');
                    const priEl = $el.find('*').filter((_, child) => child.name.toLowerCase() === 'priority');
                    
                    const lastmod = lastmodEl.text().trim();
                    const changefreq = freqEl.text().trim();
                    const priority = priEl.text().trim();
                    addUrlEntry(loc, { lastmod, changefreq, priority });
                });
            }

            // Fallback for XML that doesn't match the narrow sitemap selectors cleanly.
            if (urls.length === 0) {
                const locMatches = [...text.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)]
                    .map((match) => String(match[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim())
                    .filter(Boolean);

                for (const loc of locMatches) {
                    const normalizedLoc = normalizeUrl(loc, url);
                    if (!normalizedLoc) continue;
                    if (/sitemap|\.xml(\?|$)|format=xml/i.test(normalizedLoc)) {
                        await parseSitemap(normalizedLoc);
                    } else {
                        addUrlEntry(normalizedLoc);
                    }
                }
            }
        } catch (err) {
            // silently skip broken sitemaps
        }
    }

    await parseSitemap(sitemapUrl);
    return urls;
}

function compareLastModifiedDates(sitemapLastmod, actualLastModified, toleranceMs = 48 * 60 * 60 * 1000) {
    const sitemapTime = Date.parse(String(sitemapLastmod || ''));
    const actualTime = Date.parse(String(actualLastModified || ''));

    if (!Number.isFinite(sitemapTime) || !Number.isFinite(actualTime)) {
        return null;
    }

    return Math.abs(sitemapTime - actualTime) <= toleranceMs;
}

async function fetchUrlStatusMetadata(targetUrl, requestHeaders) {
    const attempt = async (method) => {
        const response = await undiciRequest(targetUrl, {
            method,
            headers: requestHeaders,
            headersTimeout: 5000,
            bodyTimeout: 5000,
            maxRedirections: 3
        });
        const normalizedHeaders = normalizeResponseHeaders(response.headers);
        await response.body.dump().catch(() => {});
        return {
            statusCode: response.statusCode,
            lastModified: String(normalizedHeaders['last-modified'] || '').trim()
        };
    };

    try {
        const headResult = await attempt('HEAD');
        if (![405, 501].includes(headResult.statusCode)) {
            return headResult;
        }
    } catch {}

    try {
        return await attempt('GET');
    } catch {
        return { statusCode: 0, lastModified: '' };
    }
}

async function validateSitemapEntries(sitemapEntries, requestHeaders, pagePayloads, maxChecks = 200) {
    const normalizedPayloadMap = new Map();
    for (const [url, payload] of pagePayloads.entries()) {
        normalizedPayloadMap.set(normalizeUrl(url), payload);
    }

    const crawledEntries = [];
    const uncrawledEntries = [];
    for (const entry of sitemapEntries) {
        const normalizedEntryUrl = normalizeUrl(entry?.url);
        if (!normalizedEntryUrl) continue;
        const enrichedEntry = { ...entry, url: normalizedEntryUrl };
        if (normalizedPayloadMap.has(normalizedEntryUrl)) crawledEntries.push(enrichedEntry);
        else uncrawledEntries.push(enrichedEntry);
    }

    const validationTargets = [...crawledEntries, ...uncrawledEntries].slice(0, maxChecks);
    const pageUpdates = [];
    let brokenUrls = 0;
    let lastmodMismatchCount = 0;
    let validatedLastmodCount = 0;

    await Promise.all(validationTargets.map(async (entry) => {
        const metadata = await fetchUrlStatusMetadata(entry.url, requestHeaders);
        if (metadata.statusCode >= 400 || metadata.statusCode === 0) {
            brokenUrls += 1;
        }

        const payload = normalizedPayloadMap.get(entry.url);
        const actualLastModified = payload?.lastModified || metadata.lastModified || '';
        const accurate = compareLastModifiedDates(entry.lastmod, actualLastModified);
        if (accurate === null || !payload) return;

        payload.sitemapLastmodAccurate = accurate;
        pageUpdates.push({ url: payload.url, sitemapLastmodAccurate: accurate });
        validatedLastmodCount += 1;
        if (!accurate) {
            lastmodMismatchCount += 1;
        }
    }));

    return {
        brokenUrls,
        lastmodMismatchCount,
        validatedLastmodCount,
        sampleSize: validationTargets.length,
        truncated: sitemapEntries.length > validationTargets.length,
        pageUpdates
    };
}

// ─── Worker Pool with Crash Recovery ────────────────────────
class WorkerPool {
    constructor(workerPath, numThreads, emit = () => {}) {
        this.workerPath = workerPath;
        this.numThreads = numThreads;
        this.emit = emit;
        this.workers = [];
        this.queue = [];
        this.isTerminating = false;
        this.lastStatusLogAt = 0;
        this.init();
    }

    init() {
        for (let i = 0; i < this.numThreads; i++) {
            this._spawnWorker();
        }
    }

    _spawnWorker() {
        if (this.isTerminating) return;
        const worker = new Worker(this.workerPath);
        worker.currentTask = null;

        worker.on('message', (result) => {
            if (!worker.currentTask) return;
            const { resolve } = worker.currentTask;
            resolve(result);
            worker.currentTask = null;
            this.next();
        });

        worker.on('error', (err) => {
            const taskObj = worker.currentTask;
            if (taskObj) {
                taskObj.reject(err);
                worker.currentTask = null;
            }
            this.emit('LOG', { message: `Worker thread CRASHED: ${err.message}`, type: 'error' });
            // Crash recovery: remove and replace
            const idx = this.workers.indexOf(worker);
            if (idx !== -1) {
                this.workers.splice(idx, 1);
                if (!this.isTerminating) this._spawnWorker();
            }
            this.next();
        });

        worker.on('exit', (code) => {
            const taskObj = worker.currentTask;
            if (taskObj) {
                // If it exited while working, it's a failure for that task
                taskObj.reject(new Error(`Worker thread EXITED unexpectedly with code ${code}`));
                worker.currentTask = null;
            }
            
            if (code !== 0) {
                this.emit('LOG', { message: `Worker thread exited abruptly (code ${code}). Replacing thread.`, type: 'error' });
            }
            
            // Always ensure the pool is full
            const idx = this.workers.indexOf(worker);
            if (idx !== -1) {
                this.workers.splice(idx, 1);
                if (!this.isTerminating) this._spawnWorker();
            }
            this.next();
        });

        this.workers.push(worker);
    }

    run(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.next();
        });
    }

    next() {
        const occupied = this.workers.filter(w => !!w.currentTask).length;
        if (this.queue.length > 0 && Date.now() - this.lastStatusLogAt > 5000) {
            this.lastStatusLogAt = Date.now();
            this.emit('LOG', { message: `Worker Pool Status: ${occupied}/${this.workers.length} threads active, ${this.queue.length} tasks in pool queue.`, type: 'info' });
        }
        
        const availableWorker = this.workers.find(w => !w.currentTask);
        if (availableWorker && this.queue.length > 0) {
            const taskObj = this.queue.shift();
            availableWorker.currentTask = taskObj;
            availableWorker.postMessage(taskObj.task);
        }
    }

    terminate() {
        this.isTerminating = true;
        this.workers.forEach(w => w.terminate());
        this.workers = [];
        this.queue = [];
    }
}

let globalWorkerPool = null;

// ─── Per-Domain Rate Limiter ────────────────────────────────
class DomainThrottler {
    constructor() {
        this.lastRequestTime = new Map(); // hostname -> timestamp
    }

    async waitForDomain(hostname, minDelay) {
        if (minDelay <= 0) return;
        const last = this.lastRequestTime.get(hostname) || 0;
        const elapsed = Date.now() - last;
        if (elapsed < minDelay) {
            await sleep(minDelay - elapsed);
        }
        this.lastRequestTime.set(hostname, Date.now());
    }
}

// ─── Connection Pool Manager ────────────────────────────────
// Pools are created per-crawl-instance inside runCrawler to prevent
// cross-session sharing and premature pool closure races.
// getPool and closeAllPools are declared inside runCrawler.

function ensureSet(value) {
    if (value instanceof Set) return value;
    if (Array.isArray(value)) return new Set(value);
    return new Set();
}

function normalizeLinkMap(rawMap = {}) {
    return Object.fromEntries(
        Object.entries(rawMap || {}).map(([url, links]) => [url, ensureSet(links)])
    );
}

// ─── Follow Redirect Chain ──────────────────────────────────
async function followRedirectChain(url, requestHeaders, maxHops = 10, getPool) {
    const chain = [url];
    let currentUrl = url;
    let finalStatusCode = 200;
    let finalHeaders = {};
    let totalTransferred = 0;
    let firstStatusCode = 0;

    for (let i = 0; i < maxHops; i++) {
        try {
            const parsed = new URL(currentUrl);
            const pool = getPool(parsed.origin);
            const { statusCode, headers, body } = await pool.request({
                path: parsed.pathname + parsed.search,
                method: 'HEAD',
                headers: requestHeaders,
                headersTimeout: 8000,
                bodyTimeout: 8000,
            });
            
            // HEAD requests might still return a body in some cases, consume it
            await body.dump();

            finalStatusCode = statusCode;
            if (!firstStatusCode) firstStatusCode = statusCode;
            finalHeaders = headers;
            totalTransferred += parseInt(headers['content-length'] || '0', 10) || 0;

            if (statusCode >= 300 && statusCode < 400 && headers.location) {
                const nextUrl = normalizeUrl(headers.location, currentUrl);
                if (!nextUrl || chain.includes(nextUrl)) {
                    // Redirect loop detected
                    return {
                        chain,
                        finalUrl: currentUrl,
                        statusCode: finalStatusCode,
                        firstStatusCode,
                        isLoop: true,
                        chainLength: Math.max(0, chain.length - 1),
                        headers: finalHeaders,
                        totalTransferred
                    };
                }
                chain.push(nextUrl);
                currentUrl = nextUrl;
            } else {
                break;
            }
        } catch {
            break;
        }
    }

    return {
        chain,
        finalUrl: currentUrl,
        statusCode: finalStatusCode,
        firstStatusCode,
        isLoop: false,
        chainLength: chain.length - 1,
        headers: finalHeaders,
        totalTransferred
    };
}

// ─── Security Header Extraction ─────────────────────────────
function extractSecurityHeaders(headers) {
    const normalized = normalizeResponseHeaders(headers);
    const hsts = String(normalized['strict-transport-security'] || '');
    const xFrame = String(normalized['x-frame-options'] || '');
    const csp = String(normalized['content-security-policy'] || '');
    const xContentType = String(normalized['x-content-type-options'] || '');
    const referrerPolicy = String(normalized['referrer-policy'] || '');
    const permissionsPolicy = String(normalized['permissions-policy'] || normalized['feature-policy'] || '');
    const corsOrigin = String(normalized['access-control-allow-origin'] || '');
    const hstsMaxAgeMatch = hsts.match(/max-age=(\d+)/i);

    return {
        hasHsts: Boolean(hsts),
        hstsMaxAge: hstsMaxAgeMatch ? parseInt(hstsMaxAgeMatch[1], 10) : 0,
        hstsIncludesSubdomains: /includesubdomains/i.test(hsts),
        hstsPreload: /preload/i.test(hsts),
        hstsMissing: !hsts,
        hstsValue: hsts,
        hasXFrameOptions: Boolean(xFrame),
        xFrameOptionsValue: xFrame ? xFrame.toUpperCase() : '',
        xFrameMissing: !xFrame,
        xFrameValue: xFrame,
        hasCsp: Boolean(csp),
        cspHasUnsafeInline: /unsafe-inline/i.test(csp),
        cspHasUnsafeEval: /unsafe-eval/i.test(csp),
        cspPresent: !!csp,
        cspValue: csp,
        hasXContentTypeOptions: xContentType.toLowerCase() === 'nosniff',
        xContentTypeNoSniff: xContentType.toLowerCase() === 'nosniff',
        hasReferrerPolicy: Boolean(referrerPolicy),
        referrerPolicyValue: referrerPolicy,
        hasPermissionsPolicy: Boolean(permissionsPolicy),
        permissionsPolicyValue: permissionsPolicy,
        hasCors: Boolean(corsOrigin),
        corsOrigin,
        corsWildcard: corsOrigin.trim() === '*'
    };
}

function extractCacheHeaders(headers) {
    const normalized = normalizeResponseHeaders(headers);
    const cacheControl = String(normalized['cache-control'] || '');
    const etag = String(normalized['etag'] || '');
    const lastModified = String(normalized['last-modified'] || '');
    const expires = String(normalized['expires'] || '');
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);

    return {
        hasCacheControl: Boolean(cacheControl),
        cacheControlValue: cacheControl,
        cacheMaxAge: maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : null,
        cacheNoStore: /no-store/i.test(cacheControl),
        cacheNoCache: /no-cache/i.test(cacheControl),
        hasEtag: Boolean(etag),
        etagValue: etag,
        hasLastModified: Boolean(lastModified),
        hasExpires: Boolean(expires),
        expiresValue: expires
    };
}

function splitSetCookieHeader(rawValue) {
    if (!rawValue) return [];
    if (Array.isArray(rawValue)) return rawValue.flatMap(splitSetCookieHeader).filter(Boolean);

    return String(rawValue)
        .split(/,(?=\s*[^;=,\s]+=[^;]+)/g)
        .map((value) => value.trim())
        .filter(Boolean);
}

function extractCookieSecurity(headers) {
    const normalized = normalizeResponseHeaders(headers);
    const cookieStrings = splitSetCookieHeader(normalized['set-cookie']);

    const cookieDetails = cookieStrings.map((cookie) => {
        const parts = cookie.split(';').map((part) => part.trim());
        const [namePart] = parts;
        const name = String(namePart || '').split('=')[0]?.trim() || '';
        const lowerParts = parts.map((part) => part.toLowerCase());
        const sameSitePart = lowerParts.find((part) => part.startsWith('samesite='));

        return {
            name,
            hasSecure: lowerParts.includes('secure'),
            hasHttpOnly: lowerParts.includes('httponly'),
            hasSameSite: Boolean(sameSitePart),
            sameSiteValue: sameSitePart ? sameSitePart.split('=')[1] || '' : ''
        };
    });

    return {
        cookieCount: cookieDetails.length,
        insecureCookies: cookieDetails.filter((cookie) => !cookie.hasSecure || !cookie.hasHttpOnly).length,
        cookiesMissingSameSite: cookieDetails.filter((cookie) => !cookie.hasSameSite).length,
        cookieDetails
    };
}

function extractXRobotsTag(headers) {
    const normalized = normalizeResponseHeaders(headers);
    const xRobotsTag = String(normalized['x-robots-tag'] || '');

    return {
        xRobots: xRobotsTag,
        xRobotsNoindex: /noindex/i.test(xRobotsTag),
        xRobotsNofollow: /nofollow/i.test(xRobotsTag),
        xRobotsNoarchive: /noarchive/i.test(xRobotsTag)
    };
}

function checkSslCertificate(hostname) {
    return new Promise((resolve) => {
        let settled = false;
        let socket = null;

        const finish = (result) => {
            if (settled) return;
            settled = true;
            if (socket) {
                try { socket.end(); } catch {}
                try { socket.destroy(); } catch {}
            }
            resolve(result);
        };

        try {
            socket = tls.connect(443, hostname, { servername: hostname, rejectUnauthorized: false }, () => {
                const cert = socket.getPeerCertificate();
                const detailedCert = socket.getPeerCertificate(true);
                const protocol = socket.getProtocol() || '';
                const cipher = socket.getCipher() || {};
                const validTo = cert?.valid_to ? new Date(cert.valid_to) : null;
                const daysUntilExpiry = validTo && !Number.isNaN(validTo.getTime())
                    ? Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : null;
                let sslChainComplete = Boolean(socket.authorized);

                try {
                    let current = detailedCert;
                    let depth = 0;
                    while (current?.issuerCertificate && current.issuerCertificate !== current && depth < 10) {
                        current = current.issuerCertificate;
                        depth += 1;
                    }
                    sslChainComplete = sslChainComplete || depth > 0;
                } catch {}

                finish({
                    sslValid: Boolean(socket.authorized),
                    sslAuthorizationError: socket.authorizationError || '',
                    sslIssuer: cert?.issuer?.O || cert?.issuer?.CN || '',
                    sslProtocol: protocol,
                    sslCipher: cipher.standardName || cipher.name || '',
                    sslCipherStrength: inferCipherStrength(cipher),
                    sslChainComplete,
                    sslExpiryDate: cert?.valid_to || '',
                    sslDaysUntilExpiry: daysUntilExpiry,
                    sslIsExpiringSoon: daysUntilExpiry !== null && daysUntilExpiry < 30,
                    sslIsTls13: protocol === 'TLSv1.3',
                    sslIsTls12: protocol === 'TLSv1.2',
                    sslIsWeakProtocol: ['TLSv1', 'TLSv1.1', 'SSLv3'].includes(protocol)
                });
            });

            socket.setTimeout(5000, () => finish({
                sslValid: false,
                sslAuthorizationError: 'TLS timeout',
                sslIssuer: '',
                sslProtocol: '',
                sslCipher: '',
                sslCipherStrength: 'unknown',
                sslChainComplete: false,
                sslExpiryDate: '',
                sslDaysUntilExpiry: null,
                sslIsExpiringSoon: false,
                sslIsTls13: false,
                sslIsTls12: false,
                sslIsWeakProtocol: false
            }));

            socket.on('error', (error) => finish({
                sslValid: false,
                sslAuthorizationError: error?.message || 'TLS error',
                sslIssuer: '',
                sslProtocol: '',
                sslCipher: '',
                sslCipherStrength: 'unknown',
                sslChainComplete: false,
                sslExpiryDate: '',
                sslDaysUntilExpiry: null,
                sslIsExpiringSoon: false,
                sslIsTls13: false,
                sslIsTls12: false,
                sslIsWeakProtocol: false
            }));
        } catch (error) {
            finish({
                sslValid: false,
                sslAuthorizationError: error?.message || 'TLS setup error',
                sslIssuer: '',
                sslProtocol: '',
                sslExpiryDate: '',
                sslDaysUntilExpiry: null,
                sslIsExpiringSoon: false,
                sslIsTls13: false,
                sslIsTls12: false,
                sslIsWeakProtocol: false
            });
        }
    });
}

// ─── Internal PageRank (Link Equity) ────────────────────────
function calculateInternalPageRank(urls, inlinksMap, outlinksMap, iterations = 10, damping = 0.85) {
    const pr = {};
    const n = urls.length;
    if (n === 0) return {};

    // Initial PR
    urls.forEach(url => pr[url] = 1 / n);

    for (let i = 0; i < iterations; i++) {
        const nextPr = {};
        let sinkRank = 0;

        // Calculate rank from sinks (pages with no outlinks)
        urls.forEach(url => {
            if (!outlinksMap[url] || outlinksMap[url].size === 0) {
                sinkRank += pr[url];
            }
        });

        urls.forEach(url => {
            let rank = (1 - damping) / n;
            rank += damping * (sinkRank / n);

            const inlinks = inlinksMap[url] || new Set();
            for (const inlink of inlinks) {
                const outCount = outlinksMap[inlink]?.size || 0;
                if (outCount > 0) {
                    rank += damping * (pr[inlink] / outCount);
                }
            }
            nextPr[url] = rank;
        });

        Object.assign(pr, nextPr);
    }

    // Normalize to 0-10 scale for easier visualization
    const max = Math.max(...Object.values(pr));
    if (max > 0) {
        urls.forEach(url => pr[url] = Math.round((pr[url] / max) * 10 * 100) / 100);
    }

    return pr;
}

// ─── AI Strategic Analysis ──────────────────────────────────
async function performAIStrategicAnalysis(pagePayloads, gscDataMap, turso) {
  const results = {};
  const urls = Array.from(pagePayloads.keys());
  
  // Batch pages into groups of 20 for AI processing
  const batchSize = 20;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchPrompt = batch.map(url => {
      const p = pagePayloads.get(url);
      const gsc = gscDataMap[url] || {};
      return `URL: ${url}\nTitle: ${p.title}\nH1: ${p.h1s?.[0] || ''}\nWords: ${p.wordCount}\nStatus: ${p.statusCode}\nClicks: ${gsc.clicks || 0}\nImpressions: ${gsc.impressions || 0}`;
    }).join('\n---\n');

    try {
      const response = await completeAI({
        prompt: batchPrompt,
        systemPrompt: 'Classify each URL. Return JSON array: [{url, intent: "Informational"|"Commercial"|"Transactional"|"Navigational", priority: "Critical"|"High"|"Medium"|"Low", confidence: number(0-100), reason: "brief explanation"}]',
        maxTokens: 1024,
        format: 'json'
      }, turso);
      const parsed = JSON.parse(response.text);
      for (const item of parsed) {
        results[item.url] = { intent: item.intent, priority: item.priority, reason: item.reason };
      }
    } catch (err) {
      // Fallback to heuristic if AI fails
      for (const url of batch) {
        results[url] = heuristicClassify(pagePayloads.get(url), gscDataMap[url]);
      }
    }
  }
  return results;
}

// Keep heuristic as fallback
function heuristicClassify(payload, gscData) {
  const title = (payload?.title || '').toLowerCase();
  let intent = 'Informational';
  if (/buy|price|order|checkout/.test(title)) intent = 'Transactional';
  else if (/how to|guide|what is/.test(title)) intent = 'Informational';
  else if (/vs|best|review/.test(title)) intent = 'Commercial';
  let priority = 'Medium';
  if (payload?.statusCode >= 400) priority = 'Critical';
  else if (gscData?.impressions > 1000 && gscData?.ctr < 0.01) priority = 'High';
  else if (payload?.wordCount < 300) priority = 'High';
  return { intent, priority, reason: 'Heuristic fallback classification.' };
}

function computeLinkEquity(page, internalPageRank) {
    const prScore = (internalPageRank[page.url] || 0) / 10; // 0-1
    const backlinkScore = Math.min(1, Number(page.referringDomains || 0) / 50); // 0-1
    const qualityScore = Number(page.contentQualityScore || 50) / 100; // 0-1
    const equity = (prScore * 0.4 + backlinkScore * 0.4 + qualityScore * 0.2) * 10;
    return Number(equity.toFixed(1));
}

// ─── AI Recommendations ─────────────────────────────────────
async function enrichWithAIRecommendations(pages, topN = 50, turso) {
    // Sort by priority: errors first, then high-impression low-CTR, then thin content
    const candidates = pages
        .filter(p => p.isHtmlPage && p.statusCode === 200)
        .sort((a, b) => (b.gscImpressions || 0) - (a.gscImpressions || 0))
        .slice(0, topN);

    for (const page of candidates) {
        const issues = [];
        if (!page.metaDesc) issues.push('missing meta description');
        if (!page.h1s?.length) issues.push('missing H1');
        if (page.wordCount < 300) issues.push('thin content');
        if (page.lcp > 2500) issues.push('slow LCP');
        if (page.missingAltImages > 0) issues.push(`${page.missingAltImages} images without alt`);

        if (issues.length === 0) {
            page.recommendedAction = 'Maintain';
            page.recommendedActionReason = 'Page is healthy with no critical issues.';
            continue;
        }

        const aiResponse = await completeAI({
            prompt: `SEO page: ${page.url}\nTitle: ${page.title}\nIssues: ${issues.join(', ')}\nTraffic: ${page.gscClicks || 0} clicks/mo\n\nWrite 1 sentence: what to fix first and why. Be specific.`,
            systemPrompt: 'You are an SEO consultant. Be concise and actionable.',
            maxTokens: 80
        }, turso);

        page.recommendedAction = issues.length >= 3 ? 'Rewrite' : issues.length >= 1 ? 'Optimize' : 'Maintain';
        page.recommendedActionReason = aiResponse?.text || `Fix: ${issues.join(', ')}`;
    }
}

// ─── AI GEO Analysis (E1) ──────────────────────────────────
async function performAIGEOAnalysis(pages, topN = 30, turso) {
    const candidates = pages
        .filter(p => p.isHtmlPage && p.statusCode === 200)
        .sort((a, b) => (b.gscImpressions || 0) - (a.gscImpressions || 0))
        .slice(0, topN);

    for (const page of candidates) {
        try {
            const aiResponse = await completeAI({
                systemPrompt: 'You are an AI Search Optimization (GEO) expert. Return JSON only.',
                prompt: `Evaluate this page for GEO. URL: ${page.url}\nTitle: ${page.title}\nContent: ${page.textContent?.substring(0, 2000)}\n\nReturn JSON: {"citationWorthiness": number 0-100, "extractionReady": number 0-100, "entityCoverage": number 0-100, "freshnessSignal": number 0-100, "aiOverviewFit": number 0-100, "overallGeoScore": number 0-100, "reasoning": string, "suggestions": [string]}`,
                format: 'json',
                maxTokens: 300
            });

            if (aiResponse?.text) {
                const data = JSON.parse(aiResponse.text);
                page.citationWorthiness = data.citationWorthiness;
                page.extractionReady = data.extractionReady;
                page.entityCoverage = data.entityCoverage;
                page.freshnessSignal = data.freshnessSignal;
                page.aiOverviewFit = data.aiOverviewFit;
                page.geoScore = data.overallGeoScore;
                page.geoReasoning = data.reasoning;
                page.geoSuggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
            }
        } catch (e) {
            console.warn(`[AI:GEOError] ${e.message} for ${page.url}`);
        }
    }
}
// ════════════════════════════════════════════════════════════
//  MAIN CRAWLER
// ════════════════════════════════════════════════════════════
export function runCrawler(config, rawOnEvent, initialState = null) {
    let isStopped = false;

    // Ultimate guard: once stopped, no events except 'CRAWL_STOPPED' or 'PAUSED' are emitted.
    // Also skip manually aborted task common error messages.
    const onEvent = (type, payload) => {
        if (isStopped && type !== 'CRAWL_STOPPED' && type !== 'PAUSED' && type !== 'PROGRESS') return;
        if (type === 'ERROR' && (
            (payload?.message || '').includes('Crawler stopped') ||
            (payload?.message || '').includes('aborted') ||
            (payload?.message || '').includes('terminated')
        )) return;
        rawOnEvent(type, payload);
    };

    let stopPromise = null;
    let activeWorkers = 0;
    let browser = null;
    let browserClosed = false;
    const activeUrls = new Map();
    const activeTasks = new Map();
    const retryCounts = new Map();

    const {
        startUrls = [],
        mode = 'spider',
        strategy = 'full',
        previousRunData = {},
        limit = 0,
        maxDepth = null,
        threads = 10,
        crawlSpeed = 'normal',
        userAgent = 'Mozilla/5.0 (compatible; HeadlightSEOCrawler/2.1)',
        respectRobots = true,
        ignoreQueryParams = false,
        includeRules = '',
        excludeRules = '',
        allowedDomains = '',
        customHeaders = '',
        customCookies = '',
        authUser = '',
        authPass = '',
        authType = 'none',
        authBearerToken = '',
        fetchWebVitals = false,
        viewportWidth = 1920,
        viewportHeight = 1080,
        crawlResources = false,
        requestTimeout = 30000,
        retryOnFail = true,
        retryCount = 2,
        rateLimit = false,
        rateLimitDelay = 500,
        followRedirects = true,
        maxRedirectHops = 5,
        cookieConsent = 'auto-accept',
        aiTasks = {},
        customExtractionRules = [],
        customFieldExtractors = []
    } = config;

    const urlNormalizationOptions = { ignoreQueryParams };
    const includePatterns = parseRulePatterns(includeRules);
    const excludePatterns = parseRulePatterns(excludeRules);
    const customHeaderMap = parseCustomHeaders(customHeaders);
    const requestHeaders = {
        'User-Agent': userAgent,
        ...customHeaderMap
    };

    if (customCookies?.trim()) {
        requestHeaders.Cookie = customCookies.trim();
    }

    if (authType === 'basic' && authUser && authPass) {
        requestHeaders.Authorization = `Basic ${Buffer.from(`${authUser}:${authPass}`).toString('base64')}`;
    } else if (authType === 'bearer' && authBearerToken) {
        requestHeaders.Authorization = `Bearer ${authBearerToken}`;
    } else if (authUser && authPass) {
        requestHeaders.Authorization = `Basic ${Buffer.from(`${authUser}:${authPass}`).toString('base64')}`;
    }

    // JS rendering gets 6 concurrent tabs, static crawl gets up to 200
    const concurrency = Math.max(1, Math.min(config.jsRendering ? 6 : 200, Number(threads) || 10));

    const workerThreadCount = Math.max(2, Math.ceil(concurrency / 2));
    const rebuildWorkerPool = () => {
        if (globalWorkerPool) globalWorkerPool.terminate();
        globalWorkerPool = new WorkerPool(
            path.join(__dirname, 'crawlerWorker.js'),
            workerThreadCount,
            onEvent
        );
    };

    // Initialize or Reuse Worker Pool
    if (!globalWorkerPool || globalWorkerPool.numThreads !== workerThreadCount) {
        rebuildWorkerPool();
    }

    // ─── Per-Crawl Connection Pools ─────────────────────────────────
    // Scoped per-instance to prevent cross-session pool sharing and closure races.
    const crawlConnectionPools = new Map();
    const getPool = (origin) => {
        if (!crawlConnectionPools.has(origin)) {
            crawlConnectionPools.set(origin, new Pool(origin, {
                connections: 100,
                pipelining: 1,   // HTTP/1.1 pipelining disabled — most servers don't support it reliably
                keepAliveTimeout: 60000,
                keepAliveMaxTimeout: 120000,
            }));
        }
        return crawlConnectionPools.get(origin);
    };
    const closeAllPools = () => {
        for (const [, pool] of crawlConnectionPools) {
            pool.close().catch(() => {});
        }
        crawlConnectionPools.clear();
    };

    const delayBySpeed = { slow: 1000, normal: 200, fast: 0, turbo: 0 };
    let baseRequestDelay = delayBySpeed[crawlSpeed] ?? delayBySpeed.normal;
    let adaptiveDelay = 0;

    const getRequestDelay = () => Math.max(0, baseRequestDelay + adaptiveDelay);

    const robotsParser = new RobotsTxtParser();
    const domainThrottler = new DomainThrottler();

    const visited = ensureSet(initialState?.visited);
    const queued = ensureSet(initialState?.queued);
    const queue = Array.isArray(initialState?.queue) ? [...initialState.queue] : [];
    let queueCursor = Number.isInteger(initialState?.queueCursor) ? initialState.queueCursor : 0;
    const inlinksMap = normalizeLinkMap(initialState?.inlinksMap);
    const jsInlinksMap = normalizeLinkMap(initialState?.jsInlinksMap);
    const outlinksMap = normalizeLinkMap(initialState?.outlinksMap);
    const pagePayloads = new Map();
    const failedUrls = new Map();
    const dnsTimings = new Map();
    const dnsCnameChains = new Map();
    const sslResults = new Map();

    let urlsCrawled = initialState?.urlsCrawled || 0;
    let maxDepthSeen = initialState?.maxDepthSeen || 0;
    const crawlStartedAt = initialState?.crawlStartedAt || Date.now();
    let lastProgressEmitAt = 0;
    let sitemapData = {}; // normalized url -> { url, lastmod, changefreq, priority }
    let localRootSensitiveFiles = []; // populated by the sensitive file probe inside processQueue

    const firstUrl = normalizeUrl(startUrls[0], undefined, urlNormalizationOptions);
    if (!firstUrl) {
        onEvent('ERROR', { message: 'Invalid starting URL' });
        return { stop: () => { isStopped = true; } };
    }

    let baseHostname = new URL(firstUrl).hostname;
    const baseProtocol = new URL(firstUrl).protocol;
    
    let lastCrawledAt = Date.now();
    let stagnationWarningSent = false;
    let sampledEnqueueLogCount = 0;
    let sampledLinkAnalysisLogCount = 0;

    const getPendingQueueLength = () => Math.max(0, queue.length - queueCursor);
    const compactQueue = () => {
        if (queueCursor === 0) return;
        if (queueCursor < 1000 && queueCursor < queue.length / 2) return;
        queue.splice(0, queueCursor);
        queueCursor = 0;
    };
    const shouldEmitSampledLog = (count, sampleRate = 250) => count <= 10 || count % sampleRate === 0;
    const recordUrlFailure = (targetUrl, message) => {
        if (!targetUrl) return;
        const normalizedMessage = String(message || 'Unknown crawl failure');
        failedUrls.set(targetUrl, normalizedMessage);
        onEvent('LOG', {
            message: `Failed ${targetUrl}: ${normalizedMessage}`,
            type: 'error'
        });
    };

    const isInternalUrl = (targetUrl) => {
        try {
            const targetHost = new URL(targetUrl).hostname.replace('www.', '');
            return targetHost === baseHostname.replace('www.', '');
        } catch {
            return false;
        }
    };

    const calculateDerivedLinkSignals = (pagePayload) => {
        if (!pagePayload?.url) {
            return {
                brokenInternalLinks: 0,
                brokenExternalLinks: 0,
                redirectsIn: 0,
                insecureLinks: 0,
                hreflangBroken: false
            };
        }

        let brokenInternalLinks = 0;
        let brokenExternalLinks = 0;
        let redirectsIn = 0;
        let insecureLinks = 0;

        for (const targetUrl of outlinksMap[pagePayload.url] || []) {
            if (typeof targetUrl !== 'string') continue;

            if (pagePayload.url.startsWith('https://') && targetUrl.startsWith('http://')) {
                insecureLinks++;
            }

            const targetPayload = pagePayloads.get(targetUrl);
            if (!targetPayload) continue;

            if (isInternalUrl(targetUrl)) {
                if (targetPayload.statusCode >= 400) brokenInternalLinks++;
                else if (targetPayload.statusCode >= 300 && targetPayload.statusCode < 400) redirectsIn++;
            } else if (targetPayload.statusCode >= 400) {
                brokenExternalLinks++;
            }
        }

        let hreflangBroken = false;
        if (Array.isArray(pagePayload.hreflang)) {
            for (const tag of pagePayload.hreflang) {
                const resolvedHref = normalizeUrl(tag?.href, pagePayload.url, urlNormalizationOptions);
                if (!resolvedHref) continue;
                const hreflangTarget = pagePayloads.get(resolvedHref);
                if (hreflangTarget && hreflangTarget.statusCode >= 400) {
                    hreflangBroken = true;
                    break;
                }
            }
        }

        return {
            brokenInternalLinks,
            brokenExternalLinks,
            redirectsIn,
            insecureLinks,
            hreflangBroken
        };
    };

    const emitDerivedSignalUpdate = (targetUrl) => {
        const pagePayload = pagePayloads.get(targetUrl);
        if (!pagePayload) return;

        const derivedSignals = calculateDerivedLinkSignals(pagePayload);
        Object.assign(pagePayload, derivedSignals);

        onEvent('UPDATE_PAGE', {
            url: targetUrl,
            ...derivedSignals
        });
    };

    const emitInlinkUpdate = (targetUrl) => {
        onEvent('UPDATE_PAGE', {
            url: targetUrl,
            inlinks: inlinksMap[targetUrl]?.size || 0,
            uniqueInlinks: inlinksMap[targetUrl]?.size || 0,
            inlinksList: Array.from(inlinksMap[targetUrl] || [])
        });
    };

    const registerJsInlink = (targetUrl, sourceUrl) => {
        if (!targetUrl || !sourceUrl) return;
        if (!jsInlinksMap[targetUrl]) jsInlinksMap[targetUrl] = new Set();
        jsInlinksMap[targetUrl].add(sourceUrl);
    };

    const emitProgress = (stage = 'crawling', force = false) => {
        const now = Date.now();
        if (!force && now - lastProgressEmitAt < 800) return;
        lastProgressEmitAt = now;

        const elapsedSeconds = Math.max(1, (now - crawlStartedAt) / 1000);
        const rate = urlsCrawled / elapsedSeconds;

        onEvent('CRAWL_PROGRESS', {
            stage,
            queueLength: getPendingQueueLength(),
            activeWorkers,
            discovered: visited.size + queued.size,
            crawled: urlsCrawled,
            maxDepthSeen,
            concurrency,
            mode,
            rate: Number(rate.toFixed(2)),
            workerUtilization: concurrency > 0 ? Math.round((activeWorkers / concurrency) * 100) : 0
        });
    };

    const ensureDnsMeasured = async (hostname) => {
        if (!hostname || dnsTimings.has(hostname)) {
            return dnsTimings.get(hostname) || 0;
        }

        const startedAt = Date.now();
        await Promise.allSettled([
            cachedDnsLookup(hostname),
            (async () => {
                const chainLength = await measureCnameChainLength(hostname);
                dnsCnameChains.set(hostname, chainLength);
            })()
        ]);
        const duration = Math.max(0, Date.now() - startedAt);
        dnsTimings.set(hostname, duration);
        return duration;
    };

    const ensureSslChecked = async (hostname, protocol) => {
        if (!hostname || protocol !== 'https:') return null;

        const cached = sslResults.get(hostname);
        if (cached) {
            return typeof cached.then === 'function' ? cached : Promise.resolve(cached);
        }

        const pending = checkSslCertificate(hostname)
            .catch(() => ({
                sslValid: false,
                sslAuthorizationError: 'TLS check failed',
                sslIssuer: '',
                sslProtocol: '',
                sslExpiryDate: '',
                sslDaysUntilExpiry: null,
                sslIsExpiringSoon: false,
                sslIsTls13: false,
                sslIsTls12: false,
                sslIsWeakProtocol: false,
                sslCipher: '',
                sslCipherStrength: 'unknown',
                sslChainComplete: false
            }))
            .then((result) => {
                sslResults.set(hostname, result);
                return result;
            });

        sslResults.set(hostname, pending);
        return pending;
    };

    const registerInlink = (targetUrl, sourceUrl) => {
        if (!sourceUrl) return;
        if (!inlinksMap[targetUrl]) inlinksMap[targetUrl] = new Set();
        const beforeSize = inlinksMap[targetUrl].size;
        inlinksMap[targetUrl].add(sourceUrl);
        if (visited.has(targetUrl) && inlinksMap[targetUrl].size > beforeSize) {
            emitInlinkUpdate(targetUrl);
        }
    };

    const enqueueUrl = (rawUrl, depth, sourceUrl) => {
        const normalizedUrl = normalizeUrl(rawUrl, undefined, urlNormalizationOptions);
        if (!normalizedUrl) return false;

        if (!shouldCrawlUrl(normalizedUrl, includePatterns, excludePatterns)) {
            if (shouldEmitSampledLog(visited.size + queued.size, 500)) {
                onEvent('LOG', { message: `Rule-filtered: ${normalizedUrl}`, type: 'info' });
            }
            return false;
        }

        if (limit > 0 && (visited.size + queued.size) >= limit) {
            onEvent('LOG', { message: `Limit reached (${limit}). Skipping enqueue: ${normalizedUrl}`, type: 'info' });
            return false;
        }

        if (sourceUrl) {
            registerInlink(normalizedUrl, sourceUrl);
        }

        if (visited.has(normalizedUrl) || queued.has(normalizedUrl)) {
            return false;
        }

        // Check robots.txt
        if (respectRobots && !robotsParser.isAllowed(normalizedUrl)) {
            const blockedPayload = {
                url: normalizedUrl,
                statusCode: 0,
                status: 'Blocked by Robots.txt',
                indexable: false,
                indexabilityStatus: 'Blocked',
                crawlDepth: depth,
                loadTime: 0,
                blockedByRobots: true
            };
            pagePayloads.set(normalizedUrl, blockedPayload);
            onEvent('PAGE_CRAWLED', blockedPayload);
            return false;
        }

        queued.add(normalizedUrl);
        queue.push({ url: normalizedUrl, depth, sourceUrl });
        sampledEnqueueLogCount += 1;
        if (shouldEmitSampledLog(sampledEnqueueLogCount)) {
            onEvent('LOG', { message: `Enqueued: ${normalizedUrl} (Depth: ${depth})`, type: 'info' });
        }
        if (depth > maxDepthSeen) maxDepthSeen = depth;
        return true;
    };

    if (!initialState) {
        startUrls.forEach((startUrl) => enqueueUrl(startUrl, 0, null));
    }

    const closeBrowser = async () => {
        if (!browser || browserClosed) return;
        browserClosed = true;
        const currentBrowser = browser;
        browser = null;
        await currentBrowser.close().catch(() => {});
    };

    // ─── Process a single URL ────────────────────────────────
    async function processUrl({ url: currentUrl, depth, sourceUrl }) {
        if (limit > 0 && urlsCrawled >= limit) return;
        if (visited.has(currentUrl)) {
            registerInlink(currentUrl, sourceUrl);
            return;
        }

        visited.add(currentUrl);
        if (depth > maxDepthSeen) maxDepthSeen = depth;
        registerInlink(currentUrl, sourceUrl);

        if (!outlinksMap[currentUrl]) outlinksMap[currentUrl] = new Set();

        onEvent('FETCHING', { url: currentUrl, queueLength: getPendingQueueLength() });

        try {
            const startTime = Date.now();
            const parsed = new URL(currentUrl);
            const requestController = new AbortController();
            const totalTimeout = setTimeout(() => {
                requestController.abort(new Error(`URL processing timeout for ${currentUrl}`));
            }, Number(requestTimeout) || (config.jsRendering ? 25000 : 20000));
            activeTasks.set(currentUrl, {
                startedAt: Date.now(),
                abort: (reason = `Active URL aborted: ${currentUrl}`) => {
                    try {
                        requestController.abort(new Error(reason));
                    } catch {}
                }
            });

            try {
                // Pre-warm DNS cache
                await ensureDnsMeasured(parsed.hostname);
                const sslPromise = ensureSslChecked(parsed.hostname, parsed.protocol);

                // Per-domain rate limiting
                const robotsDelay = robotsParser.getCrawlDelay(parsed.hostname);
                await domainThrottler.waitForDomain(parsed.hostname, Math.max(getRequestDelay(), robotsDelay));

                let html = '';
                let statusCode = 200;
                let contentType = '';
                let sizeBytes = 0;
                let lastModified = '';
                let etag = '';
                let cookies = 'No';
                let redirectUrl = '';
                let redirectChain = [];
                let redirectChainLength = 0;
                let isRedirectLoop = false;
                let redirectType = '';
                let resHeaders = {};
                let httpVersion = 'HTTP/1.1';
                let httpRelNext = '';
                let httpRelPrev = '';
                let transferredBytes = 0;
                let totalTransferred = 0;
                let staticHtml = '';
                let webVitals = { fcp: null, lcp: null, cls: null, inp: null };
                let screenshotBase64 = null;
                let visualChangeDetected = false;
                let visualDiffUrl = null;
                let visualDiffPercent = 0;
                let isDirListing = false;
                let exposedSensitiveFiles = [];

                let pagePayloadAttributes = {};
                if (strategy === 'incremental' && previousRunData[currentUrl]) {
                    const prev = previousRunData[currentUrl];
                    try {
                        const pool = getPool(parsed.origin);
                        const { statusCode: hCode, headers: hHeaders, body: hBody } = await pool.request({
                            path: parsed.pathname + parsed.search,
                            method: 'HEAD',
                            headers: requestHeaders,
                            headersTimeout: 5000,
                            bodyTimeout: 5000,
                            signal: requestController.signal
                        });
                        await hBody.dump();
                        
                        const headHeaders = normalizeResponseHeaders(hHeaders);
                        const curLastMod = headHeaders['last-modified'] || '';
                        const curEtag = headHeaders['etag'] || '';
                        
                        if (hCode === 200 &&
                            ((curLastMod && curLastMod === prev.lastModified) ||
                             (curEtag && curEtag === prev.etag))) {

                            onEvent('LOG', { message: `Incremental: Skipping unchanged URL ${currentUrl}`, type: 'info' });
                            urlsCrawled++;
                            emitProgress('crawling', true);
                            return; // Truly skip — content unchanged since last crawl
                        }
                    } catch (err) {
                        // If HEAD fails, proceed with normal GET
                    }
                }

                if (config.jsRendering && browser) {
                    // JS Rendering path (Playwright)
                    const page = await browser.newPage({
                        viewport: {
                            width: Number(viewportWidth) || 1920,
                            height: Number(viewportHeight) || 1080
                        },
                        extraHTTPHeaders: requestHeaders
                    });
                    try {
                        if (fetchWebVitals) {
                            await page.addInitScript(() => {
                                window.__headlightVitals = { fcp: null, lcp: null, cls: 0, inp: null };

                                try {
                                    new PerformanceObserver((entryList) => {
                                        const entries = entryList.getEntries();
                                        const firstEntry = entries[0];
                                        if (firstEntry && !window.__headlightVitals.fcp) {
                                            window.__headlightVitals.fcp = Math.round(firstEntry.startTime);
                                        }
                                    }).observe({ type: 'paint', buffered: true });
                                } catch {}

                                try {
                                    new PerformanceObserver((entryList) => {
                                        const entries = entryList.getEntries();
                                        const lastEntry = entries[entries.length - 1];
                                        if (lastEntry) {
                                            window.__headlightVitals.lcp = Math.round(lastEntry.startTime);
                                        }
                                    }).observe({ type: 'largest-contentful-paint', buffered: true });
                                } catch {}

                                try {
                                    new PerformanceObserver((entryList) => {
                                        for (const entry of entryList.getEntries()) {
                                            if (!entry.hadRecentInput) {
                                                window.__headlightVitals.cls += entry.value || 0;
                                            }
                                        }
                                    }).observe({ type: 'layout-shift', buffered: true });
                                } catch {}

                                try {
                                    new PerformanceObserver((entryList) => {
                                        for (const entry of entryList.getEntries()) {
                                            const interactionId = entry.interactionId || 0;
                                            if (!interactionId) continue;
                                            const duration = Math.round(entry.duration || 0);
                                            if (!window.__headlightVitals.inp || duration > window.__headlightVitals.inp) {
                                                window.__headlightVitals.inp = duration;
                                            }
                                        }
                                    }).observe({ type: 'event', buffered: true, durationThreshold: 40 });
                                } catch {}
                            });
                        }

                        // B4 — JS Error Tracking
                        const jsConsoleErrors = [];
                        page.on('pageerror', (err) => jsConsoleErrors.push(err.message));
                        page.on('console', (msg) => {
                            if (msg.type() === 'error') jsConsoleErrors.push(msg.text());
                        });

                        const networkTracking = {
                            httpRequestCount: 0,
                            totalJsBytes: 0,
                            totalCssBytes: 0,
                            oversizedImages: 0,
                            brokenImages: 0
                        };
                        const responseTrackingTasks = [];
                        page.on('response', (response) => {
                            responseTrackingTasks.push((async () => {
                                networkTracking.httpRequestCount += 1;
                                const request = response.request();
                                const resourceType = request.resourceType();
                                const headers = normalizeResponseHeaders(response.headers());
                                const contentTypeHeader = String(headers['content-type'] || '').toLowerCase();
                                let resourceBytes = parseInt(headers['content-length'] || '0', 10) || 0;

                                if (!resourceBytes && ['script', 'stylesheet', 'image'].includes(resourceType) && response.ok()) {
                                    try {
                                        resourceBytes = (await response.body()).length;
                                    } catch {
                                        resourceBytes = 0;
                                    }
                                }

                                const isJsResource = resourceType === 'script' || contentTypeHeader.includes('javascript') || contentTypeHeader.includes('ecmascript');
                                const isCssResource = resourceType === 'stylesheet' || contentTypeHeader.includes('text/css');
                                const isImageResource = resourceType === 'image' || contentTypeHeader.startsWith('image/');

                                if (isJsResource) networkTracking.totalJsBytes += resourceBytes;
                                if (isCssResource) networkTracking.totalCssBytes += resourceBytes;
                                if (isImageResource) {
                                    if (response.status() >= 400) networkTracking.brokenImages += 1;
                                    if (resourceBytes > 200 * 1024) networkTracking.oversizedImages += 1;
                                }
                            })());
                        });

                        // B8 — CSS/JS Coverage
                        if (config.fetchCoverage) {
                            await Promise.all([
                                page.coverage.startJSCoverage(),
                                page.coverage.startCSSCoverage()
                            ]);
                        }

                        const response = await page.goto(currentUrl, { waitUntil: 'networkidle', timeout: 15000 });
                        statusCode = response?.status() || 200;

                        const headers = response?.headers() || {};
                        resHeaders = headers;
                        contentType = headers['content-type'] || 'text/html';
                        sizeBytes = parseInt(headers['content-length'] || '0', 10);
                        lastModified = headers['last-modified'] || '';
                        etag = headers['etag'] || '';
                        transferredBytes = sizeBytes;
                        const linkHeader = headers.link || headers.Link || '';
                        const parsedLinkHeader = parseLinkHeader(linkHeader);
                        httpRelNext = parsedLinkHeader.next || '';
                        httpRelPrev = parsedLinkHeader.prev || '';
                        const pageCookies = await page.context().cookies(currentUrl);
                        cookies = pageCookies.length > 0 ? 'Yes' : 'No';
                        if (response?.request().redirectedFrom() || (response?.url() && response.url() !== currentUrl)) {
                            redirectUrl = response.url();
                        }
                        html = await page.content();
                        if (!transferredBytes && html) {
                            transferredBytes = Buffer.byteLength(html, 'utf8');
                        }
                        totalTransferred = transferredBytes;

                        // Capture screenshot for Visual Regression (E3)

                        if (config.captureScreenshots) {
                            try {
                                await page.setViewportSize({
                                    width: Number(config.screenshotViewportWidth) || Number(viewportWidth) || 1280,
                                    height: Number(config.screenshotViewportHeight) || Number(viewportHeight) || 720
                                });
                                const buffer = await page.screenshot({ 
                                    type: 'jpeg', 
                                    quality: 60,
                                    scale: 'css'
                                });
                                screenshotBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;

                                // Visual Regression (E3) — Pixel-by-pixel comparison
                                if (previousRunData[currentUrl]?.screenshotUrl) {
                                    const prevScreenshotUri = previousRunData[currentUrl].screenshotUrl;
                                    try {
                                        const prevBuffer = Buffer.from(prevScreenshotUri.split(',')[1], 'base64');
                                        const diffResult = await VisualDiffService.compare(buffer, prevBuffer);
                                        
                                        if (diffResult && diffResult.diffPercentage > 0.05) {
                                            visualChangeDetected = true;
                                            visualDiffPercent = Number(diffResult.diffPercentage.toFixed(2));
                                            if (diffResult.diffBuffer) {
                                                visualDiffUrl = `data:image/png;base64,${diffResult.diffBuffer.toString('base64')}`;
                                            }
                                        }
                                    } catch (err) {
                                        console.warn(`Visual comparison failed for ${currentUrl}:`, err.message);
                                    }
                                }
                            } catch (e) {
                                onEvent('LOG', { message: `Screenshot failed for ${currentUrl}: ${e.message}`, type: 'warning' });
                            }
                        }

                        if (redirectUrl && redirectUrl !== currentUrl) {
                            const chainResult = await followRedirectChain(currentUrl, requestHeaders, maxRedirectHops, getPool);
                            redirectChain = chainResult.chain;
                            redirectChainLength = chainResult.chainLength;
                            isRedirectLoop = chainResult.isLoop;
                            redirectType = resolveRedirectType(chainResult.firstStatusCode || statusCode);
                            totalTransferred = chainResult.totalTransferred || transferredBytes;
                            redirectUrl = chainResult.finalUrl || redirectUrl;
                        }

                        if (config.jsRenderingComparison) {
                            try {
                                const staticRes = await fetch(currentUrl, {
                                    headers: requestHeaders,
                                    redirect: 'follow',
                                    signal: requestController.signal
                                });
                                const staticType = staticRes.headers.get('content-type') || '';
                                if (staticType.includes('text/html') || staticType.includes('application/xhtml')) {
                                    staticHtml = await withTimeout(
                                        staticRes.text(),
                                        12000,
                                        `Static HTML snapshot timeout for ${currentUrl}`
                                    );
                                }
                            } catch {}
                        }

                        if (fetchWebVitals) {
                            await page.waitForTimeout(750).catch(() => {});
                            const clientData = await page.evaluate(() => {
                                // B5 — Color Contrast (Basic Check)
                                let contrastIssues = 0;
                                try {
                                    const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a');
                                    elements.forEach(el => {
                                        const style = window.getComputedStyle(el);
                                        if (style.display === 'none' || style.visibility === 'hidden') return;
                                        // Simple heuristic: if color and background are too close
                                        // (This is a placeholder for a real WCAG contrast algorithm)
                                    });
                                } catch {}

                                // B6 — Focus Indicators
                                let focusIssues = 0;
                                try {
                                    const interactive = document.querySelectorAll('a, button, input, select, textarea');
                                    interactive.forEach(el => {
                                        const style = window.getComputedStyle(el);
                                        if (style.outlineStyle === 'none' && style.boxShadow === 'none') {
                                            focusIssues++;
                                        }
                                    });
                                } catch {}

                                // B7 — Horizontal Scroll
                                const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;

                                let smallTapTargets = 0;
                                try {
                                    const tapTargets = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
                                    tapTargets.forEach((el) => {
                                        const rect = el.getBoundingClientRect();
                                        if (rect.width > 0 && rect.height > 0 && (rect.width < 48 || rect.height < 48)) {
                                            smallTapTargets++;
                                        }
                                    });
                                } catch {}

                                let smallFontCount = 0;
                                let minFontSize = null;
                                try {
                                    const textElements = document.querySelectorAll('p, li, a, button, span, input, label');
                                    textElements.forEach((el) => {
                                        const size = parseFloat(window.getComputedStyle(el).fontSize || '0');
                                        if (!Number.isFinite(size) || size <= 0) return;
                                        if (minFontSize === null || size < minFontSize) minFontSize = size;
                                        if (size < 12) smallFontCount++;
                                    });
                                } catch {}

                                return {
                                    fcp: window.__headlightVitals?.fcp ?? null,
                                    lcp: window.__headlightVitals?.lcp ?? null,
                                    cls: window.__headlightVitals?.cls ?? null,
                                    inp: window.__headlightVitals?.inp ?? null,
                                    contrastIssues,
                                    focusIssues,
                                    hasHorizontalScroll,
                                    smallTapTargets,
                                    smallFontCount,
                                    minFontSize
                                };
                            }).catch(() => ({ fcp: null, lcp: null, cls: null, inp: null, contrastIssues: 0, focusIssues: 0, hasHorizontalScroll: false, smallTapTargets: 0, smallFontCount: 0, minFontSize: null }));
                            
                            webVitals = { fcp: clientData.fcp, lcp: clientData.lcp, cls: clientData.cls, inp: clientData.inp };
                            pagePayloadAttributes = { 
                                contrastIssues: clientData.contrastIssues, 
                                focusIssues: clientData.focusIssues, 
                                hasHorizontalScroll: clientData.hasHorizontalScroll,
                                smallTapTargets: clientData.smallTapTargets,
                                smallFontCount: clientData.smallFontCount,
                                minFontSize: clientData.minFontSize,
                                jsConsoleErrors: jsConsoleErrors.slice(0, 5) 
                            };
                        }

                        // B8 — Calculate Coverage
                        if (config.fetchCoverage) {
                            const [jsCoverage, cssCoverage] = await Promise.all([
                                page.coverage.stopJSCoverage(),
                                page.coverage.stopCSSCoverage()
                            ]);
                            
                            let totalJsBytes = 0;
                            let usedJsBytes = 0;
                            for (const entry of jsCoverage) {
                                totalJsBytes += entry.text.length;
                                for (const range of entry.ranges) {
                                    usedJsBytes += range.end - range.start;
                                }
                            }

                            let totalCssBytes = 0;
                            let usedCssBytes = 0;
                            for (const entry of cssCoverage) {
                                totalCssBytes += entry.text.length;
                                for (const range of entry.ranges) {
                                    usedCssBytes += range.end - range.start;
                                }
                            }

                            pagePayloadAttributes.unusedJsPercent = totalJsBytes > 0 ? Math.round((1 - usedJsBytes / totalJsBytes) * 100) : 0;
                            pagePayloadAttributes.unusedCssPercent = totalCssBytes > 0 ? Math.round((1 - usedCssBytes / totalCssBytes) * 100) : 0;
                        }

                        if (responseTrackingTasks.length > 0) {
                            await Promise.allSettled(responseTrackingTasks);
                        }

                        pagePayloadAttributes.httpRequestCount = networkTracking.httpRequestCount;
                        pagePayloadAttributes.totalJsBytes = networkTracking.totalJsBytes;
                        pagePayloadAttributes.totalCssBytes = networkTracking.totalCssBytes;
                        pagePayloadAttributes.oversizedImages = networkTracking.oversizedImages;
                        pagePayloadAttributes.brokenImages = networkTracking.brokenImages;
                    } catch {
                        statusCode = 0;
                    } finally {
                        await page.close();
                    }
                } else {
                    // Fast path: undici connection pool
                    const pool = getPool(parsed.origin);
                    let bodyToCleanup = null;
                    try {
                        const { statusCode: code, headers, body } = await pool.request({
                            path: parsed.pathname + parsed.search,
                            method: 'GET',
                            headers: {
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                                'Accept-Encoding': 'br, gzip, deflate',
                                'Accept-Language': 'en-US,en;q=0.5',
                                'Connection': 'keep-alive',
                                ...requestHeaders
                            },
                            headersTimeout: 10000,
                            bodyTimeout: 15000,
                            signal: requestController.signal
                        });
                        bodyToCleanup = body;

                        statusCode = code;
                        resHeaders = headers;
                        contentType = headers['content-type'] || '';
                        sizeBytes = parseInt(headers['content-length'] || '0', 10);
                        transferredBytes = sizeBytes;
                        lastModified = headers['last-modified'] || '';
                        etag = headers['etag'] || '';
                        cookies = headers['set-cookie'] ? 'Yes' : 'No';
                        const parsedLinkHeader = parseLinkHeader(headers.link || headers.Link || '');
                        httpRelNext = parsedLinkHeader.next || '';
                        httpRelPrev = parsedLinkHeader.prev || '';

                        // Track redirects via header
                        if (statusCode >= 300 && statusCode < 400 && headers.location) {
                            redirectUrl = normalizeUrl(headers.location, currentUrl) || headers.location;
                            const chainResult = await followRedirectChain(currentUrl, requestHeaders, maxRedirectHops, getPool);
                            redirectChain = chainResult.chain;
                            redirectChainLength = chainResult.chainLength;
                            isRedirectLoop = chainResult.isLoop;
                            redirectType = resolveRedirectType(chainResult.firstStatusCode || statusCode);
                            totalTransferred = chainResult.totalTransferred || transferredBytes;
                            redirectUrl = chainResult.finalUrl || redirectUrl;
                        }

                        // Detect HTTP version
                        httpVersion = headers[':status'] ? 'HTTP/2' : 'HTTP/1.1';

                        if (contentType.includes('text/html') || contentType.includes('application/xhtml')) {
                            html = await withTimeout(
                                readResponseText(body, headers),
                                12000,
                                `Response body timeout for ${currentUrl}`
                            );
                            if (!transferredBytes && html) {
                                transferredBytes = Buffer.byteLength(html, 'utf8');
                            }
                            bodyToCleanup = null; // Mark as consumed
                        } else {
                            // Consume body to free connection
                            await body.dump();
                            bodyToCleanup = null; // Mark as consumed
                        }
                        if (!totalTransferred) {
                            totalTransferred = transferredBytes;
                        }
                    } catch (err) {
                        if (bodyToCleanup) {
                            // If we failed after getting response but before consuming body
                            try { await bodyToCleanup.dump(); } catch { try { bodyToCleanup.destroy(); } catch {} }
                            bodyToCleanup = null;
                        }
                        
                        // Fallback to native fetch if undici pool fails
                        try {
                            const res = await fetch(currentUrl, {
                                headers: requestHeaders,
                                redirect: 'follow',
                                signal: requestController.signal
                            });
                            statusCode = res.status;
                            resHeaders = Object.fromEntries(res.headers.entries());
                            contentType = res.headers.get('content-type') || '';
                            sizeBytes = parseInt(res.headers.get('content-length') || '0', 10);
                            transferredBytes = sizeBytes;
                            lastModified = res.headers.get('last-modified') || '';
                            etag = res.headers.get('etag') || '';
                            cookies = res.headers.get('set-cookie') ? 'Yes' : 'No';
                            const parsedLinkHeader = parseLinkHeader(res.headers.get('link') || '');
                            httpRelNext = parsedLinkHeader.next || '';
                            httpRelPrev = parsedLinkHeader.prev || '';
                            if (res.redirected) {
                                redirectUrl = res.url;
                                const chainResult = await followRedirectChain(currentUrl, requestHeaders, maxRedirectHops, getPool);
                                redirectChain = chainResult.chain;
                                redirectChainLength = chainResult.chainLength;
                                isRedirectLoop = chainResult.isLoop;
                                redirectType = resolveRedirectType(chainResult.firstStatusCode || statusCode);
                                totalTransferred = chainResult.totalTransferred || transferredBytes;
                                redirectUrl = chainResult.finalUrl || redirectUrl;
                            }
                            if (contentType.includes('text/html')) {
                                html = await withTimeout(
                                    res.text(),
                                    12000,
                                    `Fetch body timeout for ${currentUrl}`
                                );
                                if (!transferredBytes && html) {
                                    transferredBytes = Buffer.byteLength(html, 'utf8');
                                }
                            }
                            if (!totalTransferred) {
                                totalTransferred = transferredBytes;
                            }
                        } catch (fetchErr) {
                            statusCode = 0;
                            onEvent('ERROR', { url: currentUrl, message: fetchErr.message || 'Request failed' });
                        }
                    } finally {
                        if (bodyToCleanup) {
                            try { await bodyToCleanup.dump(); } catch { try { bodyToCleanup.destroy(); } catch {} }
                        }
                    }
                }

                const loadTime = Date.now() - startTime;
                
                // Adaptive Throttling Adjustment (I8)
                if (loadTime > 1500) {
                    adaptiveDelay = Math.min(5000, adaptiveDelay + 100); // Add 100ms penalty
                } else if (loadTime < 500 && adaptiveDelay > 0) {
                    adaptiveDelay = Math.max(0, adaptiveDelay - 50); // Remove 50ms penalty
                }

                const rawHeaders = normalizeResponseHeaders(resHeaders);

                // Extract security headers
                const securityInfo = extractSecurityHeaders(rawHeaders);
                const cacheInfo = extractCacheHeaders(rawHeaders);
                const cookieInfo = extractCookieSecurity(rawHeaders);
                const xRobotsInfo = extractXRobotsTag(rawHeaders);
                const compressionInfo = extractCompressionInfo(rawHeaders);
                const contentTypeInfo = extractContentTypeInfo(contentType);
                const sslInfo = await sslPromise || {};
                const enhancedSslInfo = {
                    ...sslInfo,
                    sslGrade: computeSslGrade(sslInfo, securityInfo)
                };
                const effectiveTransferredBytes = transferredBytes || sizeBytes || (html ? Buffer.byteLength(html, 'utf8') : 0);
                const effectiveTotalTransferred = totalTransferred || effectiveTransferredBytes;
                const carbonMetrics = computeCarbonMetrics(effectiveTotalTransferred);

                if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
                    urlsCrawled++;
                    const nonHtmlPayload = {
                        url: currentUrl,
                        statusCode,
                        loadTime,
                        contentType,
                        sizeBytes,
                        lastModified,
                        crawlDepth: depth,
                        inlinks: inlinksMap[currentUrl]?.size || 0,
                        cookies,
                        redirectUrl,
                        finalUrl: redirectUrl || currentUrl,
                        redirectChain,
                        redirectChainLength,
                        isRedirectLoop,
                        redirectType,
                        responseHeaders: rawHeaders,
                        httpRelNext,
                        httpRelPrev,
                        httpVersion,
                        transferredBytes: effectiveTransferredBytes,
                        totalTransferred: effectiveTotalTransferred,
                        etag,
                        ttfb: loadTime,
                        redirectLoop: isRedirectLoop,
                        ...carbonMetrics,
                        ...compressionInfo,
                        ...contentTypeInfo,
                        uniqueJsInlinks: jsInlinksMap[currentUrl]?.size || 0,
                        uniqueJsOutlinks: 0,
                        uniqueExternalJsOutlinks: 0,
                        closestSemanticAddress: '',
                        semanticSimilarityScore: 0,
                        nearDuplicateMatch: '',
                        noNearDuplicates: 0,
                        funnelStage: '',
                        spellingErrors: 0,
                        grammarErrors: 0,
                        ...securityInfo,
                        ...cacheInfo,
                        ...cookieInfo,
                        ...xRobotsInfo,
                        dnsResolutionTime: dnsTimings.get(parsed.hostname) || 0,
                        cnameChainLength: dnsCnameChains.get(parsed.hostname) || 0,
                        ...enhancedSslInfo,
                        // Sitemap data if available
                        sitemapLastmod: sitemapData[toSitemapKey(currentUrl)]?.lastmod || '',
                        sitemapPriority: sitemapData[toSitemapKey(currentUrl)]?.priority || '',
                        inSitemap: !!sitemapData[toSitemapKey(currentUrl)]
                    };
                    pagePayloads.set(currentUrl, nonHtmlPayload);
                    onEvent('PAGE_CRAWLED', nonHtmlPayload);
                    for (const source of inlinksMap[currentUrl] || []) {
                        emitDerivedSignalUpdate(source);
                    }
                    emitProgress('crawling', true);
                    return;
                }

                // ─── Send HTML to worker for parsing ─────────────
                try {
                    isDirListing = isDirectoryListing(html);
                    const msg = await withTimeout(
                        globalWorkerPool.run({ 
                            html, 
                            staticHtml,
                            url: currentUrl, 
                            depth, 
                            baseHostname, 
                            config,
                            robotsRules: robotsParser.getRules(parsed.hostname)
                        }),
                        10000,
                        `Parser worker timeout for ${currentUrl}`
                    );

                    if (msg.type === 'SUCCESS') {
                        const data = msg.data;
                        const actualSizeBytes = sizeBytes || Buffer.byteLength(html, 'utf8');

                        const payload = {
                            url: currentUrl,
                            contentType,
                            statusCode,
                            status: statusCode === 200 ? 'OK' : statusCode >= 400 ? 'Client Error' : statusCode >= 300 ? 'Redirect' : 'Unknown',
                            isDirectoryListing: isDirListing,
                            exposedSensitiveFiles: depth === 0 ? localRootSensitiveFiles : [],
                            screenshotUrl: screenshotBase64,
                            visualChangeDetected,
                            visualDiffUrl,
                            visualDiffPercent,
                            // GEO & Advanced Signals (Phase E)
                            definitionParagraphs: data.definitionParagraphs,
                            hasQuestionFormat: data.hasQuestionFormat,
                            hasPassageStructure: data.hasPassageStructure,
                            selfContainedAnswers: data.selfContainedAnswers,
                            hasSpeakableSchema: data.hasSpeakableSchema,
                            hasFeaturedSnippetPatterns: data.hasFeaturedSnippetPatterns,
                            // Tier 4 Signals
                            phoneNumbers: data.phoneNumbers,
                            hasPostalAddress: data.hasPostalAddress,
                            hasExitIntent: data.hasExitIntent,
                            hasStickyBar: data.hasStickyBar,
                            hasEmbeddedMap: data.hasEmbeddedMap,
                            detectedLibraries: data.detectedLibraries,
                            accessibilityStatementLinked: data.accessibilityStatementLinked,
                            industry: data.industry,
                            industrySignals: data.industrySignals,
                            ...data,
                            ...pagePayloadAttributes,
                            // Override or supplement worker data if needed
                            indexable: data.robots.toLowerCase().includes('noindex') || xRobotsInfo.xRobotsNoindex ? false : true,
                            indexabilityStatus: data.canonical && data.canonical !== currentUrl ? 'Canonicalized' : (statusCode >= 300 ? 'Non-200' : 'Indexable'),
                            title: data.title,
                            titleLength: data.title.length,
                            titlePixelWidth: data.titlePixelWidth,
                            metaDesc: data.metaDesc,
                            metaDescLength: data.metaDesc.length,
                            metaDescPixelWidth: data.metaDescPixelWidth,
                            metaKeywords: data.metaKeywords,
                            metaKeywordsLength: data.metaKeywordsLength,
                            metaRobots1: data.robots,
                            metaRobots2: data.robotsTags?.[1] || '',
                            ...xRobotsInfo,
                            multipleTitles: data.multipleTitles,
                            multipleMetaDescs: data.multipleMetaDescs,
                            h1_1: data.h1s[0] || '',
                            h1_1Length: (data.h1s[0] || '').length,
                            h1_2: data.h1s[1] || undefined,
                            h1_2Length: (data.h1s[1] || '').length,
                            h2_1: data.h2s[0] || '',
                            h2_1Length: (data.h2s[0] || '').length,
                            h2_2: data.h2s[1] || '',
                            h2_2Length: (data.h2s[1] || '').length,
                            sizeBytes: actualSizeBytes,
                            wordCount: data.wordCount,
                            sentenceCount: data.sentenceCount,
                            avgWordsPerSentence: data.avgWordsPerSentence,
                            fleschScore: data.flesch.toFixed(1),
                            readability: data.readability,
                            textRatio: data.textRatio,
                            crawlDepth: depth,
                            inlinks: inlinksMap[currentUrl]?.size || 0,
                            inlinksList: Array.from(inlinksMap[currentUrl] || []),
                        outlinks: data.links.length,
                        outlinksList: data.links,
                        uniqueOutlinks: 0,
                        externalOutlinks: 0,
                        uniqueExternalOutlinks: 0,
                        images: data.images,
                            hash: data.contentHash,
                            textContent: data.textContent,
                            loadTime,
                            ttfb: loadTime,
                            fcp: webVitals.fcp,
                            lcp: webVitals.lcp,
                            cls: webVitals.cls !== null && webVitals.cls !== undefined ? Number(Number(webVitals.cls).toFixed(3)) : null,
                            inp: webVitals.inp,
                            lastModified,
                            etag,
                            redirectUrl,
                            finalUrl: redirectUrl || currentUrl,
                            redirectChain,
                            redirectChainLength,
                            isRedirectLoop,
                            redirectType,
                            responseHeaders: rawHeaders,
                            language: data.lang,
                            crawlTimestamp: new Date().toISOString(),
                            cookies,
                            isHtmlPage: Boolean(contentType.includes('text/html') || contentType.includes('application/xhtml')),
                            canonical: data.canonical,
                            multipleCanonical: data.multipleCanonical,
                            metaRefresh: data.metaRefresh,
                            httpRelNext,
                            httpRelPrev,
                            relNextTag: data.relNext,
                            relPrevTag: data.relPrev,
                            amphtml: data.amphtml,
                            mobileAlt: data.mobileAlt,
                            httpVersion,
                            transferredBytes: effectiveTransferredBytes,
                            totalTransferred: effectiveTotalTransferred,
                            contentEncoding: compressionInfo.contentEncoding,
                            contentTypeMime: contentTypeInfo.contentTypeMime,
                            contentTypeCharset: contentTypeInfo.contentTypeCharset,
                            contentTypeValid: contentTypeInfo.contentTypeValid,
                            redirectLoop: isRedirectLoop,
                            ...carbonMetrics,
                            // ─── New fields from Phase 3 ───
                            // Structured Data
                            schema: data.schema,
                            schemaTypes: data.schemaTypes,
                            schemaMissingRequired: data.schemaMissingRequired,
                            hasBreadcrumbSchema: data.hasBreadcrumbSchema,
                            hasFaqSchema: data.hasFaqSchema,
                            hasArticleSchema: data.hasArticleSchema,
                            hasOrgSchema: data.hasOrgSchema,
                            schemaErrors: data.schemaErrors,
                            schemaWarnings: data.schemaWarnings,
                            // Image analysis
                            missingAltImages: data.missingAltImages,
                            longAltImages: data.longAltImages,
                            totalImages: data.totalImages,
                            imageDetails: data.imageDetails,
                            // Heading hierarchy
                            headingHierarchy: data.headingHierarchy,
                            incorrectHeadingOrder: data.incorrectHeadingOrder,
                            multipleH1s: data.h1s.length > 1,
                            // Hreflang
                            hreflang: data.hreflang,
                            hreflangNoSelf: data.hreflangNoSelf,
                            hreflangInvalid: data.hreflangInvalid,
                            hreflangErrors: data.hreflangNoSelf || data.hreflangInvalid,
                            // Open Graph
                            ogTitle: data.ogTitle,
                            ogDescription: data.ogDescription,
                            ogImage: data.ogImage,
                            ogType: data.ogType,
                            hasTwitterCard: data.hasTwitterCard,
                            twitterCardType: data.twitterCardType,
                            twitterCard: data.twitterCard,
                            twitterTitle: data.twitterTitle,
                            twitterImage: data.twitterImage,
                            // ─── New fields from Phase C ───
                            hasPassageStructure: data.hasPassageStructure,
                            hasFeaturedSnippetPatterns: data.hasFeaturedSnippetPatterns,
                            hasSpeakableSchema: data.hasSpeakableSchema,
                            hasQuestionFormat: data.hasQuestionFormat,
                            hasPricingPage: data.hasPricingPage,
                            hasTrustBadges: data.hasTrustBadges,
                            hasTestimonials: data.hasTestimonials,
                            hasCaseStudies: data.hasCaseStudies,
                            hasCustomerLogos: data.hasCustomerLogos,
                            ctaTexts: data.ctaTexts,
                            socialLinks: data.socialLinks,
                            adPlatforms: data.adPlatforms,
                            hasFormsWithAutocomplete: data.hasFormsWithAutocomplete,
                            industry: data.industry,
                            industrySignals: data.industrySignals,
                            // Robots-based AI signals
                            hasLlmsTxt: robotsParser.rules.get(parsed.hostname)?.hasLlmsTxt || false,
                            aiBotRules: robotsParser.rules.get(parsed.hostname)?.aiBotRules || {},
                            // Forms / Security
                            insecureForms: data.insecureForms,
                            mixedContent: data.mixedContent,
                            // Content quality
                            containsLoremIpsum: data.containsLoremIpsum,
                            isThinContent: data.isThinContent,
                            hasKeywordStuffing: data.hasKeywordStuffing,
                            mostFrequentWord: data.mostFrequentWord,
                            spellingErrors: data.spellingErrors,
                            grammarErrors: data.grammarErrors,
                            folderDepth: data.folderDepth ?? Math.max(0, parsed.pathname.split('/').filter(Boolean).length),
                            uniqueJsInlinks: jsInlinksMap[currentUrl]?.size || 0,
                            uniqueJsOutlinks: 0,
                            uniqueExternalJsOutlinks: 0,
                            closestSemanticAddress: '',
                            semanticSimilarityScore: 0,
                            nearDuplicateMatch: '',
                            noNearDuplicates: 0,
                            funnelStage: '',
                            linkScore: 0,
                            // Security headers
                            ...securityInfo,
                            ...cacheInfo,
                            ...cookieInfo,
                            dnsResolutionTime: dnsTimings.get(parsed.hostname) || 0,
                            cnameChainLength: dnsCnameChains.get(parsed.hostname) || 0,
                            ...enhancedSslInfo,
                            // Accessibility / advanced DOM checks
                            hasMainLandmark: data.hasMainLandmark,
                            hasNavLandmark: data.hasNavLandmark,
                            hasHeaderLandmark: data.hasHeaderLandmark,
                            hasFooterLandmark: data.hasFooterLandmark,
                            hasSkipLink: data.hasSkipLink,
                            formsWithoutLabels: data.formsWithoutLabels,
                            viewportNoScale: data.viewportNoScale,
                            viewportMaxScale1: data.viewportMaxScale1,
                            genericLinkTextCount: data.genericLinkTextCount,
                            invalidAriaCount: data.invalidAriaCount,
                            tablesWithoutHeaders: data.tablesWithoutHeaders,
                            domNodeCount: data.domNodeCount,
                            renderBlockingCss: data.renderBlockingCss,
                            renderBlockingJs: data.renderBlockingJs,
                            preconnectCount: data.preconnectCount,
                            prefetchCount: data.prefetchCount,
                            preloadCount: data.preloadCount,
                            fontDisplayValues: data.fontDisplayValues,
                            legacyFormatImages: data.legacyFormatImages,
                            modernFormatImages: data.modernFormatImages,
                            imagesWithoutSrcset: data.imagesWithoutSrcset,
                            imagesWithoutDimensions: data.imagesWithoutDimensions,
                            imagesWithoutLazy: data.imagesWithoutLazy,
                            thirdPartyScriptCount: data.thirdPartyScriptCount,
                            uniqueThirdPartyDomains: data.uniqueThirdPartyDomains,
                            externalScriptsTotal: data.externalScriptsTotal,
                            scriptsWithoutSri: data.scriptsWithoutSri,
                            exposedApiKeys: data.exposedApiKeys,
                            exposedEmails: data.exposedEmails,
                            privacyPageLinked: data.privacyPageLinked,
                            termsPageLinked: data.termsPageLinked,
                            hasCookieBanner: data.hasCookieBanner,
                            urlLength: data.urlLength,
                            hasQueryParams: data.hasQueryParams,
                            hasUppercase: data.hasUppercase,
                            hasSpacesEncoded: data.hasSpacesEncoded,
                            hasTrailingSlash: data.hasTrailingSlash,
                            hasSessionId: data.hasSessionId,
                            hasViewportMeta: data.hasViewportMeta,
                            viewportWidth: data.viewportWidth,
                            smallTapTargets: pagePayloadAttributes.smallTapTargets ?? data.smallTapTargets,
                            smallFontCount: pagePayloadAttributes.smallFontCount ?? data.smallFontCount,
                            minFontSize: pagePayloadAttributes.minFontSize ?? null,
                            hydrationMismatch: Boolean(data.jsRenderDiff?.hydrationMismatch || (data.jsRenderDiff?.textDiffPercent > 20)),
                            spaRouteBroken: inferSpaRouteBroken(currentUrl, data.jsRenderDiff),
                            visibleDate: data.visibleDate,
                            genericAnchorCount: data.genericAnchorCount,
                            anchorTextDiversity: data.anchorTextDiversity,
                            isSoft404: data.isSoft404,
                            hasFavicon: data.hasFavicon,
                            hasCharset: data.hasCharset,
                            charsetValue: data.charsetValue,
                            hasRssFeed: data.hasRssFeed,
                            hasServiceWorker: data.hasServiceWorker,
                            hasWebManifest: data.hasWebManifest,
                            // Sitemap info
                            sitemapLastmod: sitemapData[toSitemapKey(currentUrl)]?.lastmod || '',
                            sitemapPriority: sitemapData[toSitemapKey(currentUrl)]?.priority || '',
                            inSitemap: !!sitemapData[toSitemapKey(currentUrl)]
                        };

                        // Handle initial redirect hostname transition (e.g. non-www to www)
                        if (urlsCrawled === 0 && redirectUrl) {
                            try {
                                const newHostname = new URL(redirectUrl).hostname;
                                const oldHostname = baseHostname;
                                if (newHostname !== oldHostname && newHostname.includes(oldHostname.replace('www.', ''))) {
                                    onEvent('LOG', { message: `Domain Redirect: ${oldHostname} -> ${newHostname}. Adopting new base hostname.`, type: 'info' });
                                    baseHostname = newHostname;
                                }
                            } catch (e) {
                                onEvent('LOG', { message: `Error parsing redirect URL: ${redirectUrl}`, type: 'error' });
                            }
                        }

                        // Enqueue discovered links
                        let internalCount = 0;
                        let externalCount = 0;
                        const uniqueOutlinks = new Set();
                        const uniqueExternalOutlinks = new Set();
                        const renderedInternalOutlinks = new Set();
                        const renderedExternalOutlinks = new Set();
                        
                        data.links.forEach((href) => {
                            const absoluteHref = normalizeUrl(href, currentUrl, urlNormalizationOptions);
                            if (absoluteHref) {
                                try {
                                    uniqueOutlinks.add(absoluteHref);
                                    const linkObj = new URL(absoluteHref);
                                    const linkHost = linkObj.hostname;
                                    const baseHostNoWww = baseHostname.replace('www.', '');
                                    const linkHostNoWww = linkHost.replace('www.', '');
                                    
                                    const isInternal = linkHostNoWww === baseHostNoWww;

                                    if (isInternal) {
                                        internalCount++;
                                        renderedInternalOutlinks.add(absoluteHref);
                                        if (mode === 'spider' && (maxDepth === null || depth < maxDepth)) {
                                            enqueueUrl(absoluteHref, depth + 1, currentUrl);
                                        } else {
                                            registerInlink(absoluteHref, currentUrl);
                                        }
                                    } else {
                                        externalCount++;
                                        renderedExternalOutlinks.add(absoluteHref);
                                        uniqueExternalOutlinks.add(absoluteHref);
                                        registerInlink(absoluteHref, currentUrl);
                                    }
                                } catch (e) {}
                            }
                        });

                        if (config.jsRendering) {
                            const staticLinkSets = extractHtmlLinkSets(
                                staticHtml,
                                currentUrl,
                                baseHostname,
                                urlNormalizationOptions
                            );
                            const jsInternalOutlinks = new Set(
                                [...renderedInternalOutlinks].filter((href) => !staticLinkSets.internal.has(href))
                            );
                            const jsExternalOutlinks = new Set(
                                [...renderedExternalOutlinks].filter((href) => !staticLinkSets.external.has(href))
                            );

                            payload.uniqueJsOutlinks = jsInternalOutlinks.size;
                            payload.uniqueExternalJsOutlinks = jsExternalOutlinks.size;
                            for (const targetUrl of jsInternalOutlinks) {
                                registerJsInlink(targetUrl, currentUrl);
                            }
                            payload.uniqueJsInlinks = jsInlinksMap[currentUrl]?.size || 0;
                        }

                        // Enqueue resources (Images, CSS, JS) if enabled
                        if (crawlResources && mode === 'spider' && (maxDepth === null || depth < maxDepth)) {
                            const resourcesToEnqueue = [
                                ...(data.images || []),
                                ...(data.resources || [])
                            ];
                            
                            resourcesToEnqueue.forEach((src) => {
                                const absoluteSrc = normalizeUrl(src, currentUrl, urlNormalizationOptions);
                                if (absoluteSrc) {
                                    try {
                                        const srcObj = new URL(absoluteSrc);
                                        const srcHost = srcObj.hostname.toLowerCase();
                                        const baseHost = baseHostname.toLowerCase();
                                        
                                        // Match domain or subdomain
                                        if (srcHost === baseHost || srcHost.endsWith('.' + baseHost) || baseHost.endsWith('.' + srcHost)) {
                                            enqueueUrl(absoluteSrc, depth + 1, currentUrl);
                                        }
                                    } catch (e) {
                                        console.error(`[Crawler] Error enqueuing resource ${src}:`, e.message);
                                    }
                                }
                            });
                        }

                        payload.outlinksList = Array.from(uniqueOutlinks);
                        payload.uniqueOutlinks = uniqueOutlinks.size;
                        payload.externalOutlinks = externalCount;
                        payload.uniqueExternalOutlinks = uniqueExternalOutlinks.size;
                        payload.linkScore = Number((((payload.inlinks || 0) * 1.5) + internalCount - (payload.crawlDepth || 0)).toFixed(2));
                        outlinksMap[currentUrl] = uniqueOutlinks;
                        
                        sampledLinkAnalysisLogCount += 1;
                        if (shouldEmitSampledLog(sampledLinkAnalysisLogCount)) {
                            onEvent('LOG', { message: `Link Analysis [${currentUrl}]: ${internalCount} internal, ${externalCount} external found.`, type: 'info' });
                        }

                        const derivedSignals = calculateDerivedLinkSignals(payload);
                        Object.assign(payload, derivedSignals);
                        pagePayloads.set(currentUrl, payload);

                        urlsCrawled++;
                        if (!isStopped) {
                            onEvent('PAGE_CRAWLED', payload);
                        }
                        for (const source of inlinksMap[currentUrl] || []) {
                            emitDerivedSignalUpdate(source);
                        }
                        if (!isStopped) {
                            emitProgress('crawling', true);
                        }
                    } else if (msg.type === 'ERROR') {
                        if (!isStopped && msg.message !== 'Crawler stopped') {
                            recordUrlFailure(currentUrl, msg.message);
                            onEvent('ERROR', { url: currentUrl, message: msg.message });
                        }
                    }
                } catch (err) {
                    if (String(err?.message || '').includes('Parser worker timeout')) {
                        onEvent('LOG', { message: `Parser timeout detected. Rebuilding worker pool and continuing crawl.`, type: 'error' });
                        rebuildWorkerPool();
                    }
                    if (!isStopped && err.message !== 'Crawler stopped') {
                        recordUrlFailure(currentUrl, err.message);
                        onEvent('ERROR', { url: currentUrl, message: err.message });
                    }
                }
            } finally {
                clearTimeout(totalTimeout);
                activeTasks.delete(currentUrl);
            }
        } catch (err) {
            const message = err?.message || 'Request failed';
            const isAbortLike = (
                err?.name === 'AbortError' ||
                message.includes('timeout') ||
                message.includes('aborted') ||
                message.includes('terminated')
            );

            if (isAbortLike && !isStopped) {
                const retries = retryCounts.get(currentUrl) || 0;
                if (retries < 1 && !queued.has(currentUrl)) {
                    retryCounts.set(currentUrl, retries + 1);
                    visited.delete(currentUrl);
                    queued.add(currentUrl);
                    queue.push({ url: currentUrl, depth, sourceUrl });
                    onEvent('LOG', {
                        message: `Retrying stalled URL: ${currentUrl}`,
                        type: 'info'
                    });
                    emitProgress('crawling', true);
                    return;
                }
            }

            if (!isStopped && err.message !== 'Crawler stopped') {
                recordUrlFailure(currentUrl, err.message);
                onEvent('ERROR', { url: currentUrl, message: err.message });
            }
        }
    }

    // ─── Main Queue Processor ────────────────────────────────
    async function processQueue() {
        // Phase 2a: Fetch and parse robots.txt before starting
        // We ALWAYS fetch robots.txt to discover sitemap URLs, even if we don't respect the disallow rules.
        compactQueue();
        onEvent('FETCHING', { url: `${baseProtocol}//${baseHostname}/robots.txt`, queueLength: getPendingQueueLength() });
        await robotsParser.fetchAndParse(baseHostname, baseProtocol, requestHeaders, userAgent);

        // Always emit robots.txt data for UI — regardless of respectRobots setting
        onEvent('ROBOTS_TXT', {
            hostname: baseHostname,
            raw: robotsParser.getRaw(baseHostname),
            sitemaps: robotsParser.getSitemaps(baseHostname),
            crawlDelay: robotsParser.getCrawlDelay(baseHostname),
            hasLlmsTxt: robotsParser.rules.get(baseHostname)?.hasLlmsTxt || false,
            aiBotRules: robotsParser.rules.get(baseHostname)?.aiBotRules || {},
            aiBotAccess: robotsParser.rules.get(baseHostname)?.aiBotAccess || {},
            llmsTxt: robotsParser.rules.get(baseHostname)?.llmsTxt || null
        });

        // Phase 2b: Sensitive File Probe
        onEvent('LOG', { message: 'Probing for exposed sensitive files (.env, .git, etc)...', type: 'info' });
        try {
            const sensitiveFilesFound = await probeSensitiveFiles(`${baseProtocol}//${baseHostname}`, requestHeaders);
            if (sensitiveFilesFound.length > 0) {
                onEvent('LOG', { 
                    message: `⚠ Found ${sensitiveFilesFound.length} exposed sensitive files: ${sensitiveFilesFound.map(f => f.path).join(', ')}`,
                    type: 'warning' 
                });
                // We'll attach this to the root page later
                localRootSensitiveFiles = sensitiveFilesFound;
            }
        } catch (err) {
            console.warn(`[SensitiveProbe] Error: ${err.message}`);
        }

        // Phase 2c: Load sitemap coverage for the domain for all crawl modes.
        // In sitemap mode we also seed the crawl queue from it.
        {
            const sitemapUrls = robotsParser.getSitemaps(baseHostname);
            const targetSitemaps = sitemapUrls.length > 0
                ? sitemapUrls
                : [
                    `${baseProtocol}//${baseHostname}/sitemap.xml`,
                    `${baseProtocol}//${baseHostname}/sitemap_index.xml`,
                    `${baseProtocol}//${baseHostname}/sitemap1.xml`,
                    `${baseProtocol}//${baseHostname}/sitemap.php`,
                    `${baseProtocol}//${baseHostname}/sitemap.txt`
                ];

            // Concurrent sitemap parsing with aggregate timeout
            onEvent('LOG', { message: `Sitemap discovery: ${targetSitemaps.length} sources found. Starting parse...`, type: 'info' });
            onEvent('FETCHING', { url: 'Parsing sitemap(s)...', queueLength: 0 });

            await Promise.all(targetSitemaps.map(async (smUrl) => {
                try {
                    onEvent('LOG', { message: `Fetching sitemap: ${smUrl}`, type: 'info' });
                    // 15 seconds max for a single sitemap
                    const entries = await withTimeout(
                        fetchSitemapUrls(smUrl, requestHeaders, limit || 500000),
                        15000,
                        `Timeout parsing sitemap ${smUrl}`
                    );
                    
                    if (entries.length > 0) {
                        onEvent('LOG', { message: `Success: Extracted ${entries.length} URLs from ${smUrl}`, type: 'success' });
                    } else {
                        onEvent('LOG', { message: `Warning: No URLs found in sitemap ${smUrl}`, type: 'warning' });
                    }

                    for (const entry of entries) {
                        const sitemapKey = toSitemapKey(entry.url);
                        if (!sitemapKey) continue;
                        if (!sitemapData[sitemapKey]) {
                            sitemapData[sitemapKey] = entry;
                        }
                        if (mode === 'sitemap') {
                            enqueueUrl(entry.url, 0, null);
                        }
                    }
                } catch (smErr) {
                    onEvent('LOG', { message: `Sitemap parse failed (${smUrl}): ${smErr.message}`, type: 'error' });
                }
            }));

            const totalSitemapUrls = Object.keys(sitemapData).length;
            onEvent('SITEMAP_PARSED', {
                totalUrls: totalSitemapUrls,
                sitemapSources: targetSitemaps,
                coverageParsed: true
            });

            // Back-fill inSitemap for pages already crawled before sitemap parsing finished
            let backfillCount = 0;
            for (const [url, payload] of pagePayloads.entries()) {
                const sitemapKey = toSitemapKey(url);
                if (sitemapData[sitemapKey] && !payload.inSitemap) {
                    payload.inSitemap = true;
                    onEvent('UPDATE_PAGE', payload);
                    backfillCount++;
                }
            }
            if (backfillCount > 0) {
                onEvent('LOG', { message: `Back-filled sitemap status for ${backfillCount} already-crawled pages.`, type: 'info' });
            }
        }

        // Launch browser if JS rendering
        if (config.jsRendering) {
            try {
                browser = await chromium.launch({ 
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
            } catch (err) {
                onEvent('LOG', { message: `Playwright launch error: ${err.message}`, type: 'error' });
                onEvent('ERROR', { message: 'Failed to launch browser for JS Rendering. Falling back to standard mode.' });
                config.jsRendering = false;
            }
        }

        emitProgress('crawling', true);
        const progressInterval = setInterval(() => {
            if (!isStopped) emitProgress('crawling');
        }, 800);

        let hasFinished = false;
        // Main worker loop
        const worker = async () => {
            while (!isStopped) {
                if (limit > 0 && urlsCrawled >= limit) return;

                const nextItem = queueCursor < queue.length ? queue[queueCursor++] : null;
                if (!nextItem) {
                    if (activeWorkers === 0) {
                        if (!hasFinished) {
                            hasFinished = true;
                            onEvent('LOG', { message: `Queue empty and no active workers. Finishing scan.`, type: 'success' });
                        }
                        return;
                    }
                    await sleep(15);
                    continue;
                }

                queued.delete(nextItem.url);
                compactQueue();
                activeWorkers++;
                activeUrls.set(nextItem.url, Date.now());
                try {
                    lastCrawledAt = Date.now();
                    stagnationWarningSent = false;
                    await processUrl(nextItem);
                } finally {
                    activeUrls.delete(nextItem.url);
                    activeWorkers--;
                }
            }
        };

        // Stagnation monitor: check every 5 seconds if we've made progress
        const stagnationInterval = setInterval(() => {
            if (isStopped) {
                clearInterval(stagnationInterval);
                return;
            }
            
            const idleTime = Date.now() - lastCrawledAt;
            if (idleTime > 15000 && activeWorkers > 0 && !stagnationWarningSent) {
                const stuckUrls = Array.from(activeUrls.keys()).slice(0, 5);
                const urlSuffix = stuckUrls.length > 0 ? ` Active URLs: ${stuckUrls.join(', ')}` : '';
                onEvent('LOG', { message: `Stagnation detected: No progress for 15s. ${activeWorkers} threads busy.${urlSuffix}`, type: 'info' });
                stagnationWarningSent = true;
                for (const [url, task] of activeTasks) {
                    if (Date.now() - task.startedAt > 15000) {
                        onEvent('LOG', { message: `Aborting stuck URL: ${url}`, type: 'error' });
                        task.abort(`Stagnation recovery abort for ${url}`);
                    }
                }
                // Attempt to "kick" the pool in case current tasks are stuck or workers died silently
                globalWorkerPool.next();
            }
        }, 5000);

        await Promise.all(Array.from({ length: concurrency }, () => worker()));
        clearInterval(stagnationInterval);
        clearInterval(progressInterval);

        if (isStopped) {
            await closeBrowser();
            await sleep(100); // Give Playwright a moment to fully release resources
            closeAllPools();
            emitProgress('paused', true);
            return;
        }

        await closeBrowser();
        await sleep(100);
        closeAllPools();

        // ─── Post-Crawl Strategic Analysis ──────────────────────
        onEvent('LOG', { message: 'Starting Strategic SEO Analysis & Data Integration...', type: 'info' });
        
        const pageUrls = Array.from(visited);
        const gscDataMap = {}; // Legacy map, kept empty as enrichment moved to client


        // 2. Perform Internal PageRank calculation (Link Equity)
        onEvent('LOG', { message: 'Calculating Internal Link Equity (PageRank)...', type: 'info' });
        const internalPageRank = calculateInternalPageRank(pageUrls, inlinksMap, outlinksMap);

        // 2b. Compute semantic similarity and near-duplicate relationships
        const semanticPages = pageUrls
            .map((url) => {
                const payload = pagePayloads.get(url);
                if (!payload || !String(payload.contentType || '').includes('text/html')) return null;
                const semanticText = [
                    payload.title || '',
                    payload.metaDesc || '',
                    payload.h1_1 || '',
                    payload.textContent || ''
                ].join(' ');
                return {
                    url,
                    vector: buildSemanticVector(semanticText)
                };
            })
            .filter(Boolean);

        const semanticAnalysis = Object.fromEntries(
            semanticPages.map((page) => [page.url, {
                closestSemanticAddress: '',
                semanticSimilarityScore: 0,
                nearDuplicateMatch: '',
                noNearDuplicates: 0
            }])
        );
        const nearDuplicateThreshold = 0.85;

        for (let i = 0; i < semanticPages.length; i++) {
            for (let j = i + 1; j < semanticPages.length; j++) {
                const left = semanticPages[i];
                const right = semanticPages[j];
                const similarity = cosineSimilarity(left.vector, right.vector);

                if (similarity > ((semanticAnalysis[left.url]?.semanticSimilarityScore || 0) / 100)) {
                    semanticAnalysis[left.url].closestSemanticAddress = right.url;
                    semanticAnalysis[left.url].semanticSimilarityScore = Number((similarity * 100).toFixed(1));
                }
                if (similarity > ((semanticAnalysis[right.url]?.semanticSimilarityScore || 0) / 100)) {
                    semanticAnalysis[right.url].closestSemanticAddress = left.url;
                    semanticAnalysis[right.url].semanticSimilarityScore = Number((similarity * 100).toFixed(1));
                }

                if (similarity >= nearDuplicateThreshold) {
                    semanticAnalysis[left.url].noNearDuplicates += 1;
                    semanticAnalysis[right.url].noNearDuplicates += 1;

                    if (
                        !semanticAnalysis[left.url].nearDuplicateMatch ||
                        similarity >= ((semanticAnalysis[left.url].semanticSimilarityScore || 0) / 100)
                    ) {
                        semanticAnalysis[left.url].nearDuplicateMatch = right.url;
                    }
                    if (
                        !semanticAnalysis[right.url].nearDuplicateMatch ||
                        similarity >= ((semanticAnalysis[right.url].semanticSimilarityScore || 0) / 100)
                    ) {
                        semanticAnalysis[right.url].nearDuplicateMatch = left.url;
                    }
                }
            }
        }

        // 3. Batch process Search Intent & Content Analysis using Gemini
        onEvent('LOG', { message: 'Analyzing Search Intent & Strategic Insights with AI...', type: 'info' });
        const strategicInsights = await performAIStrategicAnalysis(pagePayloads, gscDataMap, config.turso);

        // Update all pages with new strategic data
        for (const url of pageUrls) {
            const payload = pagePayloads.get(url);
            if (!payload) continue;

            const update = {
                url,
                linkEquity: computeLinkEquity(payload, internalPageRank),
                uniqueJsInlinks: jsInlinksMap[url]?.size || 0,
                ...(semanticAnalysis[url] || {}),
                searchIntent: strategicInsights[url]?.intent || 'Unknown',
                strategicPriority: strategicInsights[url]?.priority || 'Medium'
            };
            update.funnelStage = classifyFunnelStage({ ...payload, ...update });

            Object.assign(payload, update);
            onEvent('UPDATE_PAGE', update);
        }

        if (Object.keys(sitemapData).length > 0) {
            onEvent('LOG', { message: 'Validating sitemap URLs and lastmod freshness...', type: 'info' });
            const sitemapValidation = await validateSitemapEntries(
                Object.values(sitemapData),
                requestHeaders,
                pagePayloads,
                200
            );

            for (const update of sitemapValidation.pageUpdates) {
                onEvent('UPDATE_PAGE', update);
            }

            const rootPayload =
                Array.from(pagePayloads.values()).find((page) => Number(page?.crawlDepth) === 0) ||
                pagePayloads.get(firstUrl) ||
                null;

            if (rootPayload) {
                Object.assign(rootPayload, {
                    sitemapBrokenUrls: sitemapValidation.brokenUrls,
                    sitemapLastmodMismatchCount: sitemapValidation.lastmodMismatchCount,
                    sitemapValidationSampleSize: sitemapValidation.sampleSize,
                    sitemapValidationTruncated: sitemapValidation.truncated
                });

                onEvent('UPDATE_PAGE', {
                    url: rootPayload.url,
                    sitemapBrokenUrls: sitemapValidation.brokenUrls,
                    sitemapLastmodMismatchCount: sitemapValidation.lastmodMismatchCount,
                    sitemapValidationSampleSize: sitemapValidation.sampleSize,
                    sitemapValidationTruncated: sitemapValidation.truncated
                });
            }
        }

        // 4. Enrich top pages with AI-powered recommendations
        onEvent('LOG', { message: 'Generating strategic SEO recommendations with AI...', type: 'info' });
        const allFinalPages = Array.from(pagePayloads.values());
        await enrichWithAIRecommendations(allFinalPages, 30, config.turso);

        // 5. GEO Enrichment (E1)
        onEvent('LOG', { message: 'Performing GEO Analysis for AI Search Engines...', type: 'info' });
        await performAIGEOAnalysis(allFinalPages, 30, config.turso);
        
        // Push the enriched data back to the client
        for (const page of allFinalPages) {
            if (page.recommendedAction || page.geoScore !== undefined) {
                onEvent('UPDATE_PAGE', {
                    url: page.url,
                    recommendedAction: page.recommendedAction,
                    recommendedActionReason: page.recommendedActionReason,
                    geoScore: page.geoScore,
                    citationWorthiness: page.citationWorthiness,
                    extractionReady: page.extractionReady,
                    aiOverviewFit: page.aiOverviewFit,
                    geoReasoning: page.geoReasoning
                });
            }
        }

        onEvent('CRAWL_FINISHED', {
            totalPages: visited.size,
            successfulPages: urlsCrawled,
            payloadPages: pagePayloads.size,
            failedPages: failedUrls.size,
            failedUrlSamples: Array.from(failedUrls.entries()).slice(0, 10).map(([url, message]) => ({ url, message })),
            sitemapCoverage: Object.keys(sitemapData).length > 0 ? {
                inSitemap: [...visited].filter(u => sitemapData[toSitemapKey(u)]).length,
                notInSitemap: [...visited].filter(u => !sitemapData[toSitemapKey(u)]).length,
                sitemapOnly: Object.keys(sitemapData).filter(u => ![...visited].some(v => toSitemapKey(v) === u)).length,
                totalSitemapUrls: Object.keys(sitemapData).length
            } : null,
            robotsTxt: robotsParser.getRaw(baseHostname),
            strategicSummary: {
                orphanedPages: pageUrls.filter(u => (inlinksMap[u]?.size || 0) === 0).length,
                linkHoarders: pageUrls.filter(u => (outlinksMap[u]?.size || 0) === 0).length,
                topEquityPages: pageUrls.sort((a,b) => (internalPageRank[b]||0) - (internalPageRank[a]||0)).slice(0, 5)
            }
        });
    }

    processQueue().catch((err) => {
        onEvent('ERROR', { message: err.message || 'Crawler failed unexpectedly.' });
    });

    return {
        stop: async () => {
            if (stopPromise) return stopPromise;
            stopPromise = (async () => {
                isStopped = true;
                for (const [, task] of activeTasks) {
                    task.abort('Crawler stopped');
                }
                
                // Emit stop signal immediately so the UI is responsive
                emitProgress('paused', true);
                onEvent('CRAWL_STOPPED', {
                    message: 'Crawl paused manually.',
                    state: {
                        visited: Array.from(visited),
                        queued: Array.from(queued),
                        queue: queue.slice(queueCursor),
                        queueCursor: 0,
                        inlinksMap: Object.fromEntries(Object.entries(inlinksMap).map(([url, links]) => [url, Array.from(links || [])])),
                        jsInlinksMap: Object.fromEntries(Object.entries(jsInlinksMap).map(([url, links]) => [url, Array.from(links || [])])),
                        outlinksMap: Object.fromEntries(Object.entries(outlinksMap).map(([url, links]) => [url, Array.from(links || [])])),
                        urlsCrawled,
                        maxDepthSeen,
                        crawlStartedAt
                    }
                });

                // Cleanup in the background
                await closeBrowser();
                closeAllPools();
                compactQueue();
            })();
            return stopPromise;
        }
    };
}
