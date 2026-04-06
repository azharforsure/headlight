import { parentPort } from 'worker_threads';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import fs from 'fs';

// ─── Syllable Estimator for Flesch Score ────────────────────
function countSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matched = word.match(/[aeiouy]{1,2}/g);
    return matched ? matched.length : 1;
}

// ─── Pixel Width Approximator (Arial 16px) ──────────────────
function estimatePixelWidth(text) {
    if (!text) return 0;
    let pixels = 0;
    for (let char of text) {
        if (/[A-Z]/.test(char)) pixels += 11;
        else if (/[a-z]/.test(char)) pixels += 8;
        else pixels += 6;
    }
    return Math.round(pixels);
}

function normalizeDictionaryWord(word) {
    return String(word || '')
        .toLowerCase()
        .replace(/^[^a-z]+|[^a-z]+$/g, '');
}

function loadDictionary() {
    const fallback = new Set([
        'about', 'access', 'account', 'action', 'actions', 'add', 'advanced', 'after', 'against', 'all', 'allow',
        'analytics', 'another', 'api', 'application', 'applications', 'article', 'articles', 'asset', 'assets',
        'author', 'available', 'average', 'before', 'best', 'between', 'body', 'browser', 'button', 'cache',
        'canonical', 'category', 'change', 'changes', 'check', 'click', 'content', 'conversion', 'cookie',
        'crawl', 'crawler', 'crawling', 'custom', 'data', 'description', 'design', 'details', 'device',
        'download', 'downloads', 'email', 'engine', 'error', 'errors', 'example', 'external', 'fetch',
        'field', 'fields', 'file', 'files', 'filter', 'follow', 'footer', 'form', 'free', 'from', 'guide',
        'header', 'headers', 'help', 'home', 'image', 'images', 'index', 'internal', 'javascript', 'json',
        'keyword', 'keywords', 'language', 'link', 'links', 'list', 'loading', 'local', 'login', 'meta',
        'metrics', 'mobile', 'network', 'next', 'number', 'page', 'pages', 'performance', 'policy', 'price',
        'privacy', 'profile', 'project', 'redirect', 'render', 'rendering', 'report', 'resource', 'resources',
        'response', 'robots', 'schema', 'score', 'search', 'security', 'server', 'settings', 'signup',
        'site', 'sitemap', 'social', 'source', 'speed', 'status', 'strategy', 'style', 'styles', 'support',
        'system', 'technical', 'text', 'title', 'tools', 'tracking', 'type', 'types', 'update', 'upload',
        'url', 'urls', 'user', 'value', 'values', 'version', 'view', 'warning', 'website', 'word', 'words'
    ]);

    try {
        const raw = fs.readFileSync('/usr/share/dict/words', 'utf8');
        const words = raw
            .split(/\r?\n/)
            .map(normalizeDictionaryWord)
            .filter((word) => word.length >= 2);
        return new Set([...fallback, ...words]);
    } catch {
        return fallback;
    }
}

const DICTIONARY = loadDictionary();
const SPELLING_IGNORE = new Set([
    'api', 'apis', 'seo', 'javascript', 'typescript', 'node', 'nodejs', 'npm', 'json', 'html', 'css', 'svg',
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'woff', 'woff2', 'ttf', 'eot', 'http', 'https', 'www', 'cdn',
    'utf', 'charset', 'viewport', 'hreflang', 'canonical', 'amphtml', 'robots', 'noindex', 'nofollow',
    'schema', 'jsonld', 'og', 'twitter', 'linkedin', 'youtube', 'github', 'wordpress', 'woocommerce'
]);

function maybeBaseForms(word) {
    const forms = [word];
    if (word.endsWith('ies') && word.length > 4) forms.push(`${word.slice(0, -3)}y`);
    if (word.endsWith('es') && word.length > 4) forms.push(word.slice(0, -2));
    if (word.endsWith('s') && word.length > 3) forms.push(word.slice(0, -1));
    if (word.endsWith('ing') && word.length > 5) forms.push(word.slice(0, -3), `${word.slice(0, -3)}e`);
    if (word.endsWith('ed') && word.length > 4) forms.push(word.slice(0, -2), `${word.slice(0, -2)}e`);
    return forms;
}

function analyzeTextQuality(text) {
    const rawTokens = String(text || '').match(/[A-Za-z][A-Za-z'’-]*/g) || [];
    const normalizedTokens = rawTokens
        .map(normalizeDictionaryWord)
        .filter((token) => token.length >= 2);

    const misspelled = new Set();
    for (const rawToken of rawTokens) {
        if (rawToken.length < 4) continue;
        if (/^[A-Z][a-z]+$/.test(rawToken)) continue;
        if (/[A-Z]{2,}/.test(rawToken)) continue;

        const token = normalizeDictionaryWord(rawToken);
        if (!token || token.length < 4) continue;
        if (SPELLING_IGNORE.has(token)) continue;
        if (maybeBaseForms(token).some((form) => DICTIONARY.has(form))) continue;

        misspelled.add(token);
    }

    let grammarErrors = 0;
    for (let i = 1; i < normalizedTokens.length; i++) {
        if (normalizedTokens[i] && normalizedTokens[i] === normalizedTokens[i - 1]) {
            grammarErrors++;
        }
    }

    const sentenceStarts = String(text || '')
        .split(/[.!?]+\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean);

    for (const sentence of sentenceStarts) {
        const firstLetter = sentence.match(/[A-Za-z]/)?.[0];
        if (firstLetter && firstLetter === firstLetter.toLowerCase()) {
            grammarErrors++;
        }
    }

    grammarErrors += (String(text || '').match(/\s{2,}/g) || []).length;
    grammarErrors += (String(text || '').match(/[!?.,;:]{3,}/g) || []).length;

    return {
        spellingErrors: misspelled.size,
        grammarErrors
    };
}

// ─── Valid ISO language codes (subset for validation) ────────
const VALID_LANG_CODES = new Set([
    'aa','ab','af','ak','am','an','ar','as','av','ay','az','ba','be','bg','bh','bi','bm','bn','bo','br',
    'bs','ca','ce','ch','co','cr','cs','cu','cv','cy','da','de','dv','dz','ee','el','en','eo','es','et',
    'eu','fa','ff','fi','fj','fo','fr','fy','ga','gd','gl','gn','gu','gv','ha','he','hi','ho','hr','ht',
    'hu','hy','hz','ia','id','ie','ig','ii','ik','io','is','it','iu','ja','jv','ka','kg','ki','kj','kk',
    'kl','km','kn','ko','kr','ks','ku','kv','kw','ky','la','lb','lg','li','ln','lo','lt','lu','lv','mg',
    'mh','mi','mk','ml','mn','mo','mr','ms','mt','my','na','nb','nd','ne','ng','nl','nn','no','nr','nv',
    'ny','oc','oj','om','or','os','pa','pi','pl','ps','pt','qu','rm','rn','ro','ru','rw','sa','sc','sd',
    'se','sg','si','sk','sl','sm','sn','so','sq','sr','ss','st','su','sv','sw','ta','te','tg','th','ti',
    'tk','tl','tn','to','tr','ts','tt','tw','ty','ug','uk','ur','uz','ve','vi','vo','wa','wo','xh','yi',
    'yo','za','zh','zu','x-default'
]);

parentPort.on('message', (task) => {
    const { html, url, depth, baseHostname, config } = task;

    try {
        const $ = cheerio.load(html);

        // ─── Basic Meta Tags ────────────────────────────────
        const titleTags = $('title');
        const metaDescTags = $('meta[name="description"]');
        const title = titleTags.first().text() || '';
        const metaDesc = metaDescTags.attr('content') || '';
        const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
        const metaRobotsTags = $('meta[name="robots"]').map((_, el) => $(el).attr('content') || '').get().filter(Boolean);
        const robots = metaRobotsTags[0] || '';
        const lang = $('html').attr('lang') || '';

        // ─── Headings (ALL levels, not just h1/h2) ──────────
        const h1s = $('h1').map((_, el) => $(el).text().trim()).get();
        const h2s = $('h2').map((_, el) => $(el).text().trim()).get();

        // Full heading hierarchy for order validation
        const headingHierarchy = [];
        $('h1, h2, h3, h4, h5, h6').each((_, el) => {
            const tag = el.tagName || el.name;
            const level = parseInt(tag.charAt(1));
            headingHierarchy.push({ level, text: $(el).text().trim().substring(0, 100) });
        });

        // Check heading order (e.g., h1 → h3 without h2 is wrong)
        let incorrectHeadingOrder = false;
        for (let i = 1; i < headingHierarchy.length; i++) {
            const prev = headingHierarchy[i - 1].level;
            const curr = headingHierarchy[i].level;
            // Jumping more than 1 level down is bad (h1 → h3, h2 → h4, etc.)
            if (curr > prev + 1) {
                incorrectHeadingOrder = true;
                break;
            }
        }

        // ─── Canonical & Technical Tags ─────────────────────
        const canonicalTags = $('link[rel="canonical"]');
        const canonical = canonicalTags.first().attr('href') || '';
        const multipleCanonical = canonicalTags.length > 1;

        const metaRefresh = $('meta[http-equiv="refresh"]').attr('content') || '';
        const relNext = $('link[rel="next"]').attr('href') || '';
        const relPrev = $('link[rel="prev"]').attr('href') || '';
        const amphtml = $('link[rel="amphtml"]').attr('href') || '';
        const mobileAlt = $('link[media*="max-width: 640px"]').attr('href') || '';

        // ─── Text Analysis ──────────────────────────────────
        const cleanBody = $('body').clone();
        cleanBody.find('script, style, noscript, iframe, svg').remove();
        const textContent = cleanBody.text().replace(/\s+/g, ' ').trim();
        const words = textContent.split(' ').filter(w => w.length > 0);
        const wordCount = words.length;
        const sentenceCount = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
        const avgWordsPerSentence = wordCount / sentenceCount;
        const totalSyllables = words.reduce((acc, word) => acc + countSyllables(word), 0);
        const flesch = wordCount > 0
            ? 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (totalSyllables / wordCount)
            : 0;
        const readability = flesch > 80 ? 'Easy' : flesch > 60 ? 'Standard' : 'Difficult';
        const textRatio = html.length > 0 ? ((textContent.length / html.length) * 100).toFixed(2) : 0;
        const contentHash = crypto.createHash('md5').update(textContent).digest('hex');

        // ─── Lorem Ipsum Detection ──────────────────────────
        const containsLoremIpsum = /lorem\s+ipsum/i.test(textContent);

        // ─── Extract Links ──────────────────────────────────
        const links = [];
        $('a').each((_, el) => {
            const href = $(el).attr('href');
            if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
            links.push(href);
        });

        // ─── Image Analysis (Phase 3b) ──────────────────────
        const imageDetails = [];
        let missingAltImages = 0;
        let longAltImages = 0;
        let totalImages = 0;

        $('img').each((_, el) => {
            const src = $(el).attr('src');
            if (!src || src.startsWith('data:')) return;
            totalImages++;

            const alt = $(el).attr('alt');
            const width = $(el).attr('width') || '';
            const height = $(el).attr('height') || '';
            const loading = $(el).attr('loading') || '';

            if (alt === undefined || alt === null) {
                missingAltImages++;
            } else if (alt.length > 100) {
                longAltImages++;
            }

            imageDetails.push({ src, alt: alt || '', width, height, loading });
        });

        // ─── Structured Data / JSON-LD (Phase 3a) ───────────
        const schemaBlocks = [];
        let schemaErrors = 0;
        let schemaWarnings = 0;
        const schemaTypes = [];

        $('script[type="application/ld+json"]').each((_, el) => {
            const raw = $(el).html();
            if (!raw) return;
            try {
                const parsed = JSON.parse(raw);
                schemaBlocks.push(parsed);

                // Extract @type
                const extractTypes = (obj) => {
                    if (!obj || typeof obj !== 'object') return;
                    if (obj['@type']) {
                        const types = Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']];
                        types.forEach(t => {
                            if (!schemaTypes.includes(t)) schemaTypes.push(t);
                        });
                    }
                    // Check for required fields
                    if (obj['@type'] && !obj['name'] && !obj['headline']) {
                        schemaWarnings++;
                    }
                    if (Array.isArray(obj['@graph'])) {
                        obj['@graph'].forEach(extractTypes);
                    }
                };
                extractTypes(parsed);
            } catch {
                schemaErrors++;
            }
        });

        // Also check for Microdata
        $('[itemtype]').each((_, el) => {
            const itemtype = $(el).attr('itemtype') || '';
            const typeName = itemtype.split('/').pop();
            if (typeName && !schemaTypes.includes(typeName)) {
                schemaTypes.push(typeName);
            }
        });

        // ─── Hreflang Extraction (Phase 3d) ─────────────────
        const hreflangTags = [];
        let hreflangNoSelf = true;
        let hreflangInvalid = false;

        $('link[rel="alternate"][hreflang]').each((_, el) => {
            const hreflang = $(el).attr('hreflang') || '';
            const href = $(el).attr('href') || '';
            hreflangTags.push({ lang: hreflang, href });

            // Check self-referencing
            if (href === url || href === canonical) {
                hreflangNoSelf = false;
            }

            // Validate language code
            const langCode = hreflang.split('-')[0].toLowerCase();
            if (!VALID_LANG_CODES.has(langCode) && langCode !== 'x') {
                hreflangInvalid = true;
            }
        });

        // If no hreflang tags at all, don't flag noSelf
        if (hreflangTags.length === 0) {
            hreflangNoSelf = false;
        }

        // ─── Open Graph & Twitter Cards (Phase 3e) ──────────
        const ogTitle = $('meta[property="og:title"]').attr('content') || '';
        const ogDescription = $('meta[property="og:description"]').attr('content') || '';
        const ogImage = $('meta[property="og:image"]').attr('content') || '';
        const ogType = $('meta[property="og:type"]').attr('content') || '';
        const twitterCard = $('meta[name="twitter:card"]').attr('content') || '';
        const twitterTitle = $('meta[name="twitter:title"]').attr('content') || '';

        // ─── Form Security Detection (Phase 3g) ─────────────
        let insecureForms = false;
        const isHttpsPage = url.startsWith('https://');

        $('form').each((_, el) => {
            const action = $(el).attr('action') || '';
            if (isHttpsPage && action.startsWith('http://')) {
                insecureForms = true;
            }
        });

        // ─── Mixed Content Detection (Phase 2e) ─────────────
        let mixedContent = false;
        if (isHttpsPage) {
            const checkMixed = (selector, attr) => {
                $(selector).each((_, el) => {
                    const val = $(el).attr(attr) || '';
                    if (val.startsWith('http://') && !val.startsWith('http://localhost')) {
                        mixedContent = true;
                        return false; // break
                    }
                });
            };
            checkMixed('img[src]', 'src');
            checkMixed('script[src]', 'src');
            checkMixed('link[href]', 'href');
            checkMixed('iframe[src]', 'src');
            checkMixed('video[src]', 'src');
            checkMixed('audio[src]', 'src');
        }

        // ─── Advanced Quality Signals (Phase 4) ─────────────
        const isThinContent = wordCount > 0 && wordCount < 300;
        
        // Simple keyword stuffing detection (if one non-stopword dominates > 10% of text)
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 'of', 'for', 'with', 'on', 'at', 'by', 'from', 'in', 'out', 'this', 'that']);
        const wordFreq = {};
        let maxFreq = 0;
        let mostFrequentWord = '';
        
        words.forEach(w => {
            const lowW = w.toLowerCase().replace(/[^a-z]/g, '');
            if (lowW.length > 3 && !stopWords.has(lowW)) {
                wordFreq[lowW] = (wordFreq[lowW] || 0) + 1;
                if (wordFreq[lowW] > maxFreq) {
                    maxFreq = wordFreq[lowW];
                    mostFrequentWord = lowW;
                }
            }
        });
        
        const keywordStuffingLevel = wordCount > 50 ? (maxFreq / wordCount) : 0;
        const hasKeywordStuffing = keywordStuffingLevel > 0.08; // > 8% density for a single word is very high
        const { spellingErrors, grammarErrors } = analyzeTextQuality(textContent);

        // ─── Extract Resources (CSS/JS) ─────────────────────
        const resources = [];
        $('script[src], link[rel="stylesheet"]').each((_, el) => {
            const src = $(el).attr('src') || $(el).attr('href');
            if (src && !src.startsWith('data:')) resources.push(src);
        });

        // ─── Pixel width for title & meta desc ──────────────
        const titlePixelWidth = estimatePixelWidth(title);
        const metaDescPixelWidth = estimatePixelWidth(metaDesc);

        // ─── Send results back ──────────────────────────────
        parentPort.postMessage({
            type: 'SUCCESS',
            data: {
                // Core meta
                title, metaDesc, metaKeywords, robots, lang,
                metaKeywordsLength: metaKeywords.length,
                robotsTags: metaRobotsTags,
                multipleTitles: titleTags.length > 1,
                multipleMetaDescs: metaDescTags.length > 1,
                titlePixelWidth, metaDescPixelWidth,
                // Quality Signals
                wordCount, sentenceCount, avgWordsPerSentence, flesch, readability, textRatio, contentHash,
                containsLoremIpsum, isThinContent, hasKeywordStuffing, mostFrequentWord, spellingErrors, grammarErrors,
                // Headings
                h1s, h2s, headingHierarchy, incorrectHeadingOrder,
                // Technical
                canonical, multipleCanonical, metaRefresh, relNext, relPrev, amphtml, mobileAlt,
                // Links & resources
                links, resources,
                textContent: textContent.substring(0, 5000),
                // Images
                imageDetails, missingAltImages, longAltImages, totalImages,
                images: imageDetails.map(i => i.src),
                // Structured Data
                schema: schemaBlocks.length > 0 ? schemaBlocks : null,
                schemaTypes,
                schemaErrors,
                schemaWarnings,
                // Hreflang
                hreflang: hreflangTags.length > 0 ? hreflangTags : null,
                hreflangNoSelf,
                hreflangInvalid,
                // Social
                ogTitle, ogDescription, ogImage, ogType,
                twitterCard, twitterTitle,
                // Security
                insecureForms, mixedContent
            }
        });
    } catch (err) {
        parentPort.postMessage({ type: 'ERROR', message: err.message });
    }
});
