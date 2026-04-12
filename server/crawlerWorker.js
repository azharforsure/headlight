import { parentPort } from 'worker_threads';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        // Server runtime: prefer the system dictionary first for maximal coverage.
        const sysDictPath = '/usr/share/dict/words';
        if (typeof process !== 'undefined' && process.versions?.node && fs.existsSync(sysDictPath)) {
            const raw = fs.readFileSync(sysDictPath, 'utf8');
            const words = raw.split(/\r?\n/).map(normalizeDictionaryWord).filter((w) => w.length >= 2);
            return new Set([...fallback, ...words]);
        }
    } catch {
        // Continue to bundled fallback.
    }

    try {
        // Bundled fallback list (works in Node and packaged worker builds).
        const candidates = [
            path.join(process.cwd(), 'data', 'wordlist.json'),
            path.join(__dirname, '..', 'data', 'wordlist.json')
        ];
        for (const wordlistPath of candidates) {
            if (!fs.existsSync(wordlistPath)) continue;
            const raw = fs.readFileSync(wordlistPath, 'utf8');
            const words = JSON.parse(raw);
            if (Array.isArray(words) && words.length > 0) {
                return new Set([...fallback, ...words.map(normalizeDictionaryWord).filter((w) => w.length >= 2)]);
            }
        }
    } catch (e) {
        console.error('[loadDictionary] Error loading bundled wordlist:', e.message);
    }

    return fallback;
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

const VALID_ARIA_ROLES = new Set([
    'alert', 'application', 'article', 'banner', 'button', 'cell', 'checkbox', 'columnheader', 'combobox',
    'complementary', 'contentinfo', 'definition', 'dialog', 'directory', 'document', 'feed', 'figure', 'form',
    'grid', 'gridcell', 'group', 'heading', 'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
    'marquee', 'math', 'menu', 'menubar', 'menuitem', 'navigation', 'none', 'note', 'option', 'presentation',
    'progressbar', 'radio', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'search', 'separator',
    'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel', 'term', 'textbox',
    'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
]);

const GENERIC_LINK_TEXT_PATTERN = /^(click here|read more|learn more|more|here|link|this|download|submit)$/i;

function collectSchemaNodes(node, bucket = []) {
    if (!node || typeof node !== 'object') return bucket;
    if (Array.isArray(node)) {
        node.forEach((item) => collectSchemaNodes(item, bucket));
        return bucket;
    }

    bucket.push(node);

    if (Array.isArray(node['@graph'])) {
        node['@graph'].forEach((item) => collectSchemaNodes(item, bucket));
    }

    return bucket;
}

function getMissingSchemaRequiredProps(schemaNodes = []) {
    const requiredByType = {
        BreadcrumbList: ['itemListElement'],
        FAQPage: ['mainEntity'],
        Article: ['headline'],
        BlogPosting: ['headline'],
        NewsArticle: ['headline'],
        Organization: ['name'],
        Product: ['name'],
    };

    const missing = new Set();
    for (const node of schemaNodes) {
        const rawTypes = node?.['@type'];
        const types = Array.isArray(rawTypes) ? rawTypes : rawTypes ? [rawTypes] : [];
        for (const type of types) {
            const requiredProps = requiredByType[type];
            if (!requiredProps) continue;
            for (const prop of requiredProps) {
                const value = node?.[prop];
                const isMissing = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
                if (isMissing) {
                    missing.add(`${type}.${prop}`);
                }
            }
        }
    }

    return Array.from(missing);
}

parentPort.on('message', (task) => {
    const { html, staticHtml, url, depth, baseHostname, config, robotsRules } = task;

    try {
        const $ = cheerio.load(html);
        const $static = staticHtml ? cheerio.load(staticHtml) : null;

        // ─── JS Rendering Diff (E2) ─────────────────────────
        let jsRenderDiff = null;
        if ($static) {
            const staticText = $static('body').text().trim().replace(/\s+/g, ' ');
            const renderedText = $('body').text().trim().replace(/\s+/g, ' ');
            const staticWords = staticText.split(/\s+/).filter(Boolean);
            const renderedWords = renderedText.split(/\s+/).filter(Boolean);
            
            const staticLinks = new Set();
            $static('a[href]').each((_, el) => {
                const href = $static(el).attr('href');
                if (href) staticLinks.add(href);
            });

            const renderedLinks = new Set();
            $('a[href]').each((_, el) => {
                const href = $(el).attr('href');
                if (href) renderedLinks.add(href);
            });

            const staticImages = $static('img').length;
            const renderedImages = $('img').length;

            const diffLen = Math.abs(renderedText.length - staticText.length);
            const textDiffPercent = Math.round((diffLen / Math.max(staticText.length, 1)) * 100);
            
            const jsOnlyLinks = [...renderedLinks].filter(l => !staticLinks.has(l)).length;
            const jsOnlyImages = Math.max(0, renderedImages - staticImages);
            
            const staticSchema = $static('script[type="application/ld+json"]').length;
            const renderedSchema = $('script[type="application/ld+json"]').length;
            const addedWords = renderedWords.filter((word) => !staticWords.includes(word)).slice(0, 40).join(' ');
            const removedWords = staticWords.filter((word) => !renderedWords.includes(word)).slice(0, 40).join(' ');

            jsRenderDiff = {
                textDiffPercent,
                jsOnlyLinks,
                jsOnlyImages,
                jsOnlySchema: renderedSchema > staticSchema,
                criticalContentJsOnly: staticText.length < 200 && renderedText.length > 500,
                hydrationMismatch: Math.abs(renderedWords.length - staticWords.length) > 150 && staticWords.length > 0,
                staticWordCount: staticWords.length,
                renderedWordCount: renderedWords.length,
                addedTextSample: addedWords,
                removedTextSample: removedWords
            };
        }

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

        // ─── Fragment Link Validation (B1) ─────────────────
        let brokenFragmentLinks = 0;
        const allIds = new Set();
        $('[id]').each((_, el) => {
            const id = $(el).attr('id');
            if (id) allIds.add(String(id));
        });
        $('[name]').each((_, el) => {
            const name = $(el).attr('name');
            if (name) allIds.add(String(name));
        });

        $('a[href^="#"]').each((_, el) => {
            const href = $(el).attr('href') || '';
            const fragment = href.slice(1); // Remove the #
            if (fragment && !allIds.has(fragment)) {
                brokenFragmentLinks++;
            }
        });

        // ─── Image Analysis (Phase 3b) ──────────────────────
        const imageDetails = [];
        let missingAltImages = 0;
        let longAltImages = 0;
        let totalImages = 0;
        let decorativeWithAlt = 0;

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

            // Likely decorative: role="presentation", role="none", 
            // or small size indicators (icon classes, 1x1 pixel, spacer patterns)
            const role = $(el).attr('role');
            const isLikelyDecorative = role === 'presentation' || role === 'none' ||
                /icon|spacer|pixel|blank|transparent|divider/i.test(src) ||
                /icon|spacer|divider|decoration/i.test($(el).attr('class') || '');
            
            if (isLikelyDecorative && alt && alt.trim().length > 0) {
                decorativeWithAlt++;
            }

            imageDetails.push({ src, alt: alt || '', width, height, loading });
        });

        // ─── Structured Data / JSON-LD (Phase 3a) ───────────
        const schemaBlocks = [];
        let schemaErrors = 0;
        let schemaWarnings = 0;
        const schemaTypes = [];
        const schemaNodes = [];

        $('script[type="application/ld+json"]').each((_, el) => {
            const raw = $(el).html();
            if (!raw) return;
            try {
                const parsed = JSON.parse(raw);
                schemaBlocks.push(parsed);
                collectSchemaNodes(parsed, schemaNodes);

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

        const schemaMissingRequired = getMissingSchemaRequiredProps(schemaNodes);
        const hasBreadcrumbSchema = schemaTypes.includes('BreadcrumbList');
        const hasFaqSchema = schemaTypes.includes('FAQPage');
        const hasArticleSchema = schemaTypes.some((type) => ['Article', 'BlogPosting', 'NewsArticle'].includes(type));
        const hasOrgSchema = schemaTypes.includes('Organization');

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
        const twitterImage = $('meta[name="twitter:image"]').attr('content') || '';
        const hasTwitterCard = Boolean(twitterCard);
        const twitterCardType = twitterCard;

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

        const hasCsp = $('meta[http-equiv="Content-Security-Policy"]').length > 0;
        const hasHsts = false; // Cannot be set via meta

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

        const baseHostNoWww = String(baseHostname || '').replace(/^www\./i, '').toLowerCase();
        const parsedUrl = new URL(url);
        const viewportContent = $('meta[name="viewport"]').attr('content') || '';
        const pageSource = html || '';

        // ─── Accessibility Checks ───────────────────────────
        const hasMainLandmark = $('main, [role="main"]').length > 0;
        const hasNavLandmark = $('nav, [role="navigation"]').length > 0;
        const hasHeaderLandmark = $('header, [role="banner"]').length > 0;
        const hasFooterLandmark = $('footer, [role="contentinfo"]').length > 0;
        const hasSkipLink = $('a[href="#main-content"], a[href="#content"], a[href="#main"], a.skip-link, a.skip-nav').length > 0;

        let formsWithoutLabels = 0;
        $('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea').each((_, el) => {
            const id = $(el).attr('id');
            const ariaLabel = $(el).attr('aria-label');
            const ariaLabelledBy = $(el).attr('aria-labelledby');
            const hasExplicitLabel = id ? $(`label[for="${id}"]`).length > 0 : false;

            if (!hasExplicitLabel && !ariaLabel && !ariaLabelledBy) {
                formsWithoutLabels++;
            }
        });

        const viewportNoScale = /user-scalable\s*=\s*no/i.test(viewportContent);
        const viewportMaxScale1 = /maximum-scale\s*=\s*1(\.0)?/i.test(viewportContent);

        let genericLinkTextCount = 0;
        $('a').each((_, el) => {
            const text = $(el).text().trim();
            if (GENERIC_LINK_TEXT_PATTERN.test(text)) {
                genericLinkTextCount++;
            }
        });

        let invalidAriaCount = 0;
        $('[role]').each((_, el) => {
            const role = ($(el).attr('role') || '').trim().toLowerCase();
            if (role && !VALID_ARIA_ROLES.has(role)) {
                invalidAriaCount++;
            }
        });

        let tablesWithoutHeaders = 0;
        $('table').each((_, el) => {
            if ($(el).find('th').length === 0) {
                tablesWithoutHeaders++;
            }
        });

        // ─── DOM & Resource Checks ──────────────────────────
        const domNodeCount = $('*').length;
        let renderBlockingCss = 0;
        $('link[rel="stylesheet"]').each((_, el) => {
            const media = ($(el).attr('media') || '').trim().toLowerCase();
            if (!media || media === 'all' || media === 'screen') {
                renderBlockingCss++;
            }
        });

        const renderBlockingJs = $('head script[src]:not([async]):not([defer]):not([type="module"])').length;
        const preconnectCount = $('link[rel="preconnect"]').length;
        const prefetchCount = $('link[rel="dns-prefetch"]').length;
        const preloadCount = $('link[rel="preload"]').length;

        const fontDisplayValues = [];
        $('style').each((_, el) => {
            const styleText = $(el).html() || '';
            const matches = styleText.match(/font-display\s*:\s*([\w-]+)/gi) || [];
            matches.forEach((match) => {
                const value = match.split(':')[1]?.trim();
                if (value) {
                    fontDisplayValues.push(value);
                }
            });
        });

        let legacyFormatImages = 0;
        let modernFormatImages = 0;
        let imagesWithoutSrcset = 0;
        let imagesWithoutDimensions = 0;
        let imagesWithoutLazy = 0;

        $('img[src]').each((index, el) => {
            const src = ($(el).attr('src') || '').toLowerCase();
            if (/\.(png|jpe?g|gif|bmp)(\?|$)/.test(src)) legacyFormatImages++;
            if (/\.(webp|avif)(\?|$)/.test(src)) modernFormatImages++;
            if (!$(el).attr('srcset')) imagesWithoutSrcset++;
            if (!$(el).attr('width') || !$(el).attr('height')) imagesWithoutDimensions++;
            if (index > 3 && $(el).attr('loading') !== 'lazy') imagesWithoutLazy++;
        });

        const thirdPartyScripts = [];
        let externalScriptsTotal = 0;
        let scriptsWithoutSri = 0;

        $('script[src]').each((_, el) => {
            const src = $(el).attr('src') || '';
            try {
                const scriptHost = new URL(src, url).hostname.replace(/^www\./i, '').toLowerCase();
                if (scriptHost && scriptHost !== baseHostNoWww) {
                    thirdPartyScripts.push(scriptHost);
                    externalScriptsTotal++;
                    if (!$(el).attr('integrity')) {
                        scriptsWithoutSri++;
                    }
                }
            } catch {}
        });

        const uniqueThirdPartyDomains = Array.from(new Set(thirdPartyScripts));
        const thirdPartyScriptCount = thirdPartyScripts.length;

        // ─── HTML Security / Privacy Signals ────────────────
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const exposedEmails = Array.from(new Set(
            (textContent.match(emailPattern) || []).filter((email) => (
                !email.includes('example.com') &&
                !email.includes('@schema.org')
            ))
        ));

        const apiKeyPatterns = [
            /(?:api[_-]?key|apikey|secret[_-]?key|access[_-]?token)\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi,
            /AIza[a-zA-Z0-9_\-]{35}/g,
            /sk-[a-zA-Z0-9]{20,}/g,
            /ghp_[a-zA-Z0-9]{36}/g,
            /AKIA[A-Z0-9]{16}/g,
        ];
        let exposedApiKeys = 0;
        for (const pattern of apiKeyPatterns) {
            exposedApiKeys += (pageSource.match(pattern) || []).length;
        }

        const privacyPageLinked = $('a[href*="privacy"], a[href*="privacy-policy"]').length > 0;
        const termsPageLinked = $('a[href*="terms"], a[href*="terms-of-service"], a[href*="terms-and-conditions"]').length > 0;
        const hasCookieBanner =
            $('[class*="cookie"], [id*="cookie"], [class*="consent"], [id*="consent"], [class*="gdpr"], [id*="gdpr"]').length > 0 ||
            $('script[src*="cookiebot"], script[src*="onetrust"], script[src*="cookieconsent"], script[src*="trustarc"], script[src*="quantcast"]').length > 0;

        // ─── URL Structure Checks ───────────────────────────
        const urlLength = url.length;
        const urlSegments = parsedUrl.pathname.split('/').filter(Boolean);
        const folderDepth = urlSegments.length;
        const hasQueryParams = parsedUrl.search.length > 1;
        const hasUppercase = /[A-Z]/.test(parsedUrl.pathname);
        const hasSpacesEncoded = /%20/i.test(parsedUrl.pathname);
        const hasTrailingSlash = parsedUrl.pathname.length > 1 && parsedUrl.pathname.endsWith('/');
        const hasSessionId = /[?&](sid|session|phpsessid|jsessionid|token)=/i.test(parsedUrl.search);


        // ─── Mobile Checks ──────────────────────────────────
        const hasViewportMeta = $('meta[name="viewport"]').length > 0;
        const viewportWidth = /width\s*=\s*device-width/i.test(viewportContent);

        let smallTapTargets = 0;
        $('a, button, input[type="submit"], input[type="button"]').each((_, el) => {
            const style = $(el).attr('style') || '';
            const widthMatch = style.match(/width\s*:\s*(\d+)px/i);
            const heightMatch = style.match(/height\s*:\s*(\d+)px/i);
            const width = widthMatch ? parseInt(widthMatch[1], 10) : null;
            const height = heightMatch ? parseInt(heightMatch[1], 10) : null;

            if ((width !== null && width < 44) || (height !== null && height < 44)) {
                smallTapTargets++;
            }
        });

        let smallFontCount = 0;
        $('[style*="font-size"]').each((_, el) => {
            const style = $(el).attr('style') || '';
            const sizeMatch = style.match(/font-size\s*:\s*(\d+)(px|pt)/i);
            if (sizeMatch && parseInt(sizeMatch[1], 10) < 12) {
                smallFontCount++;
            }
        });

        // ─── Advanced Content Checks ────────────────────────
        const visibleDateCandidates = [
            $('time[datetime]').attr('datetime') || '',
            $('meta[property="article:published_time"]').attr('content') || '',
            $('meta[property="article:modified_time"]').attr('content') || '',
            $('[class*="date"], [class*="published"], [class*="post-date"]').first().text().trim(),
        ].filter(Boolean);
        const visibleDate = visibleDateCandidates[0] || '';

        const anchorTexts = [];
        $('a[href]').each((_, el) => {
            const href = $(el).attr('href') || '';
            const text = $(el).text().trim();
            if (text && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
                anchorTexts.push(text);
            }
        });
        const genericAnchorCount = anchorTexts.filter((text) => GENERIC_LINK_TEXT_PATTERN.test(text)).length;
        const anchorTextDiversity = new Set(anchorTexts).size;

        const isSoft404 = wordCount < 50 && /(page not found|404|not found|does not exist|no longer available|couldn't find)/i.test(textContent);
        const hasFavicon = $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').length > 0;
        const charsetValue = $('meta[charset]').attr('charset') || '';
        const hasCharset = Boolean(charsetValue) || $('meta[http-equiv="Content-Type"]').length > 0;
        const hasRssFeed = $('link[type="application/rss+xml"], link[type="application/atom+xml"]').length > 0;
        const hasServiceWorker = /navigator\.serviceWorker\.register/i.test(pageSource) || $('script').toArray().some(el => /navigator\.serviceWorker\.register/i.test($(el).html() || ''));
        const manifestLink = $('link[rel="manifest"]').attr('href') || '';
        const hasWebManifest = Boolean(manifestLink);

        // ─── Resource Hints (Detailed) ──────────────────────
        const preconnectHints = [];
        $('link[rel="preconnect"], link[rel="dns-prefetch"]').each((_, el) => {
            const href = $(el).attr('href');
            if (href) preconnectHints.push(href);
        });

        const preloadHints = [];
        $('link[rel="preload"]').each((_, el) => {
            preloadHints.push({
                href: $(el).attr('href') || '',
                as: $(el).attr('as') || '',
                type: $(el).attr('type') || ''
            });
        });

        const hasInlinedCSS = $('style').toArray().some(el => {
            const text = $(el).html() || '';
            return text.length > 500; // Significant inline CSS
        });

        // ─── Video Optimization ──────────────────────────────
        const videos = [];
        let videosWithoutPoster = 0;
        let videosWithoutLazy = 0;
        $('video').each((_, el) => {
            const poster = $(el).attr('poster');
            const preload = $(el).attr('preload');
            const loading = $(el).attr('loading');
            if (!poster) videosWithoutPoster++;
            if (preload !== 'none' && loading !== 'lazy') videosWithoutLazy++;
            videos.push({ poster: poster || '', preload: preload || '', loading: loading || '' });
        });

        // ─── Noscript Fallback ───────────────────────────────
        const noscriptTag = $('noscript');
        const hasNoscript = noscriptTag.length > 0;
        const noscriptContent = noscriptTag.text().trim().length;

        // ─── AI Discoverability (t3-*) ──────────────────────
        const hasLlmsTxt = robotsRules?.hasLlmsTxt || false;
        const aiBotRules = robotsRules?.aiBotRules || {};
        const aiBotAccess = robotsRules?.aiBotAccess || {};
        const llmsTxt = robotsRules?.llmsTxt || null;
        const llmsTxtStatus = hasLlmsTxt ? (llmsTxt?.summary ? 'present_with_guidance' : 'present') : 'missing';
        const aiBotAccessSummary = Object.entries(aiBotAccess)
            .filter(([, value]) => value === 'allow' || value === 'partial')
            .map(([key, value]) => `${key}:${value}`)
            .slice(0, 4)
            .join(', ') || 'unspecified';

        // 1. Passage Indexing Readiness (0-100)
        let passageReadiness = 0;
        const definitionParagraphs = $('p').filter((_, el) => {
            const text = $(el).text().trim();
            return /^[A-Z][A-Za-z0-9\s-]{2,60}\s+(is|refers to|means)\s+/i.test(text);
        }).length;
        const selfContainedAnswers = $('h2, h3').filter((_, el) => {
            const nextP = $(el).next('p').text().trim();
            return nextP.length > 150 && nextP.length < 500;
        }).length;
        if (headingHierarchy.length >= 3) passageReadiness += 30;
        if (wordCount > 500) passageReadiness += 20;
        if ($('p').length >= 5) passageReadiness += 20;
        if (selfContainedAnswers > 0) passageReadiness += 30;
        if (definitionParagraphs > 0) passageReadiness += 10;
        passageReadiness = Math.min(100, passageReadiness);
        const hasPassageStructure = passageReadiness >= 70;

        // 2. Featured Snippet Patterns
        const hasListAfterHeading = $('h2 + ul, h2 + ol, h3 + ul, h3 + ol').length > 0;
        const hasDefinitionPattern = /^(what is|who is|definition of|refer to)\s/i.test(textContent.trim().substring(0, 100));
        const hasComparisonTable = $('table').filter((_, el) => {
            const headers = $(el).find('th').text().toLowerCase();
            return headers.includes('vs') || headers.includes('compare') || headers.includes('difference');
        }).length > 0;
        const hasFeaturedSnippetPatterns = (
          $('ol li, ul li').length >= 3 ||  
          $('table').length > 0 ||          
          /^(what|how|why|when|where|who)\s/i.test(h1s[0] || '') ||
          hasListAfterHeading ||
          hasDefinitionPattern ||
          hasComparisonTable
        );

        // 3. Answer Box / PAA (People Also Ask)
        const questionHeadings = $('h2, h3').filter((_, el) => 
          /^(what|how|why|when|where|who|can|does|is)\s.*\?$/i.test($(el).text().trim())
        );
        const hasQuestionFormat = questionHeadings.length > 0;
        const answerBoxReady = questionHeadings.filter((_, el) => {
            const answer = $(el).next('p').text().trim();
            return answer.length >= 40 && answer.length <= 320;
        }).length > 0;

        // 4. Voice Search Readiness (0-100)
        let voiceSearchScore = 0;
        const avgSentenceLength = wordCount / (sentenceCount || 1);
        const conversationalPronouns = (textContent.match(/\b(you|your|we|our|I|my)\b/gi) || []).length;
        if (flesch > 70) voiceSearchScore += 30;
        if (avgSentenceLength < 20) voiceSearchScore += 30;
        if (hasQuestionFormat) voiceSearchScore += 20;
        if (schemaTypes.includes('SpeakableSpecification')) voiceSearchScore += 20;
        if (conversationalPronouns >= 5) voiceSearchScore += 10;
        voiceSearchScore = Math.min(100, voiceSearchScore);

        // 5. Speakable Schema
        const hasSpeakableSchema = schemaTypes.includes('SpeakableSpecification');

        // 6. GEO Score (Generative Engine Optimization) - Base
        let geoScore = (passageReadiness + voiceSearchScore) / 2;
        if (hasLlmsTxt) geoScore += 10;
        if (['allow', 'partial'].includes(aiBotAccess.gptBot) || ['allow', 'partial'].includes(aiBotAccess.claudeBot)) geoScore += 10;
        if (answerBoxReady) geoScore += 10;
        geoScore = Math.min(100, Math.round(geoScore));

        // ─── Business Signals (t4-*) ────────────────────────
        const hasPricingPage = /\/(pricing|plans|packages|cost|rates)(\/|$)/i.test(url);
        const phonePattern = /(\+?1?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g;
        const phoneNumbers = Array.from(new Set(textContent.match(phonePattern) || [])).slice(0, 5);
        const addressPattern = /\d+\s+[\w\s]{5,}(?:street|st|avenue|ave|road|rd|blvd|drive|dr|lane|ln|way|court|ct|circle|cir|trail|trl|parkway|pkwy)[\s,]+[\w\s]+,?\s*[A-Z]{2}\s*\d{5}/gi;
        const hasPostalAddress = addressPattern.test(textContent);
        
        const hasExitIntent = /exit-intent|ouibounce|bioep|exitIntent/i.test(html);
        const hasStickyBar = /position\s*:\s*fixed/i.test(html) && /top\s*:\s*0/i.test(html);
        const hasEmbeddedMap = $('iframe[src*="google.com/maps"], iframe[src*="mapbox.com"], iframe[src*="apple.com/maps"], .map-container, #map').length > 0;
        
        const accessibilityStatementLinked = $('a[href*="accessibility"], a[href*="a11y-statement"]').length > 0;

        const libraries = [];
        if (/jquery/i.test(html)) libraries.push('jQuery');
        if (/react/i.test(html)) libraries.push('React');
        if (/vue/i.test(html)) libraries.push('Vue');
        if (/angular/i.test(html)) libraries.push('Angular');
        if (/next\.js/i.test(html)) libraries.push('Next.js');
        if (html.includes('wp-content')) libraries.push('WordPress');
        if (html.includes('shopify')) libraries.push('Shopify');
        if (/drift|intercom|crisp|zendesk/i.test(html)) libraries.push('Live Chat');
        const detectedLibraries = Array.from(new Set(libraries));

        const hasTrustBadges = $('[class*="trust"], [class*="badge"], [class*="certification"], [alt*="secure"], [alt*="certified"]').length > 0;
        const hasTestimonials = $('[class*="testimonial"], [class*="review"], [class*="quote"]').length > 0;
        const hasCaseStudies = $('a[href*="case-stud"], a[href*="success-stor"]').length > 0;
        const hasCustomerLogos = $('[class*="logo-wall"], [class*="client-logo"], [class*="trusted-by"]').length > 0;

        const ctaButtons = $('a[class*="cta"], a[class*="btn"], button[class*="cta"], [class*="call-to-action"]');
        const ctaTexts = ctaButtons.map((_, el) => $(el).text().trim()).get().filter(Boolean);

        const socialLinks = {
          facebook: $('a[href*="facebook.com"], a[href*="fb.com"]').length > 0,
          instagram: $('a[href*="instagram.com"]').length > 0,
          twitter: $('a[href*="twitter.com"], a[href*="x.com"]').length > 0,
          linkedin: $('a[href*="linkedin.com"]').length > 0,
          youtube: $('a[href*="youtube.com"]').length > 0,
          tiktok: $('a[href*="tiktok.com"]').length > 0,
        };

        const adPlatforms = {
          googleAds: $('script[src*="googleads"], script[src*="adservices.google"]').length > 0,
          metaPixel: $('script[src*="facebook.net/en_US/fbevents"], script[src*="connect.facebook.net"]').length > 0,
          gtm: $('script[src*="googletagmanager.com"]').length > 0,
          hotjar: $('script[src*="hotjar.com"]').length > 0,
          clarity: $('script[src*="clarity.ms"]').length > 0,
        };

        const forms = $('form');
        const hasFormsWithAutocomplete = forms.find('input[autocomplete]').length > 0;

        // ─── Industry Specific (t4-*) ───────────────────────
        const industry = config?.industry || 'all';
        const industrySignals = {};

        if (industry === 'ecommerce' || industry === 'all') {
          industrySignals.hasProductSchema = schemaTypes.includes('Product');
          industrySignals.hasReviewSchema = schemaTypes.includes('Review') || schemaTypes.includes('AggregateRating');
          industrySignals.priceVisible = $('[class*="price"], [itemprop="price"], [data-price]').length > 0;
          industrySignals.hasBreadcrumbUI = $('[class*="breadcrumb"], nav[aria-label*="breadcrumb"], .breadcrumbs').length > 0;
          industrySignals.hasFacetedNav = $('[class*="filter"], [class*="facet"], [class*="refinement"]').length > 0;
        }

        if (industry === 'local_business' || industry === 'all') {
          industrySignals.hasLocalBusinessSchema = schemaTypes.some(t => ['LocalBusiness', 'Restaurant', 'Store', 'MedicalBusiness'].includes(t));
          industrySignals.hasMap = hasEmbeddedMap;
          industrySignals.hasOpeningHours = JSON.stringify(schemaBlocks).includes('openingHours');
        }

        if (industry === 'news_media' || industry === 'blog_content' || industry === 'all') {
          industrySignals.hasArticleSchema = schemaTypes.some(t => ['NewsArticle', 'Article', 'BlogPosting'].includes(t));
          industrySignals.hasAuthorByline = $('[class*="author"], [rel="author"], [itemprop="author"]').length > 0;
          industrySignals.hasNewsletterForm = $('form[action*="subscribe"], [class*="newsletter"]').length > 0;
        }

        if (industry === 'saas' || industry === 'all') {
          industrySignals.hasPricingTable = $('[class*="pricing"], [class*="plans"], [class*="tier"]').length > 0;
          industrySignals.hasDocsLink = $('a[href*="/docs"], a[href*="/documentation"], a[href*="/help"]').length > 0;
          industrySignals.hasStatusPage = $('a[href*="status."], a[href*="/status"]').length > 0;
        }

        if (industry === 'healthcare' || industry === 'all') {
          industrySignals.hasMedicalAuthor = /\b(MD|DO|NP|PA|RN|PhD)\b/.test(textContent);
          industrySignals.hasMedicalDisclaimer = /not (a substitute|intended).*(medical|professional) (advice|diagnosis|treatment)/i.test(textContent);
        }

        // ─── Custom Extraction (Phase 7) ────────────────────
        const customFieldResults = {};
        if (Array.isArray(config?.customFieldExtractors)) {
            for (const field of config.customFieldExtractors) {
                if (!field.name || !field.cssSelector) continue;
                
                const $el = $(field.cssSelector);
                if ($el.length === 0) {
                    customFieldResults[field.name] = null;
                    continue;
                }

                let value = '';
                if (field.extractType === 'text') {
                    value = $el.first().text().trim();
                } else if (field.extractType === 'html') {
                    value = $el.first().html() || '';
                } else if (field.extractType === 'attribute' && field.attributeName) {
                    value = $el.first().attr(field.attributeName) || '';
                }

                if (field.regex && value) {
                    try {
                        const match = value.match(new RegExp(field.regex));
                        value = match ? (match[1] || match[0]) : '';
                    } catch {}
                }

                customFieldResults[field.name] = value;
            }
        }

        const customRuleResults = [];
        if (Array.isArray(config?.customExtractionRules)) {
            for (const rule of config.customExtractionRules) {
                try {
                    const globToRegex = (glob) => new RegExp('^' + String(glob || '*').replace(/\*/g, '.*') + '$');
                    const pathname = new URL(url).pathname;
                    const isMatch = rule.pages === '*' || globToRegex(rule.pages).test(pathname);
                    
                    if (!isMatch) continue;

                    const $el = $(rule.selector);
                    let passed = true;

                    if (rule.condition === 'exists') passed = $el.length > 0;
                    else if (rule.condition === 'missing') passed = $el.length === 0;
                    else if (rule.condition === 'empty') passed = $el.length > 0 && $el.text().trim() === '';
                    else if (rule.condition === 'not_empty') passed = $el.length > 0 && $el.text().trim() !== '';

                    if (!passed) {
                        customRuleResults.push({
                            name: rule.name,
                            severity: rule.severity,
                            message: `Custom rule "${rule.name}" failed.`
                        });
                    }
                } catch {}
            }
        }

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
                links, resources, brokenFragmentLinks,
                textContent: textContent.substring(0, 5000),
                // Images
                imageDetails, missingAltImages, longAltImages, totalImages, decorativeWithAlt,
                images: imageDetails.map(i => i.src),
                // Structured Data
                schema: schemaBlocks.length > 0 ? schemaBlocks : null,
                schemaTypes,
                schemaMissingRequired,
                hasBreadcrumbSchema,
                hasFaqSchema,
                hasArticleSchema,
                hasOrgSchema,
                schemaErrors,
                schemaWarnings,
                // Hreflang
                hreflang: hreflangTags.length > 0 ? hreflangTags : null,
                hreflangNoSelf,
                hreflangInvalid,
                selfContainedAnswers,
                legacyFormatImages,
                modernFormatImages,
                domNodeCount,
                hasCsp,
                hasHsts,
                // Social
                ogTitle, ogDescription, ogImage, ogType,
                hasTwitterCard, twitterCardType, twitterCard, twitterTitle, twitterImage,
                // Security
                insecureForms, mixedContent,
                // Accessibility
                hasMainLandmark, hasNavLandmark, hasHeaderLandmark, hasFooterLandmark,
                hasSkipLink, formsWithoutLabels, viewportNoScale, viewportMaxScale1,
                genericLinkTextCount, invalidAriaCount, tablesWithoutHeaders,
                // Performance / DOM
                renderBlockingCss, renderBlockingJs,
                preconnectCount, prefetchCount, preloadCount, fontDisplayValues,
                imagesWithoutSrcset,
                imagesWithoutDimensions, imagesWithoutLazy,
                thirdPartyScriptCount, uniqueThirdPartyDomains,
                // HTML security / privacy
                externalScriptsTotal, scriptsWithoutSri,
                exposedApiKeys, exposedEmails: exposedEmails.slice(0, 10),
                privacyPageLinked, termsPageLinked, hasCookieBanner,
                // URL structure
                urlLength, folderDepth, hasQueryParams, hasUppercase,
                hasSpacesEncoded, hasTrailingSlash, hasSessionId,
                // Mobile
                hasViewportMeta, viewportWidth, smallTapTargets, smallFontCount,
                // Advanced content
                visibleDate, genericAnchorCount, anchorTextDiversity,
                isSoft404, hasFavicon, hasCharset, charsetValue,
                hasRssFeed, hasServiceWorker, hasWebManifest, manifestLink,
                preconnectHints, preloadHints, hasInlinedCSS,
                videos, videosWithoutPoster, videosWithoutLazy,
                hasNoscript, noscriptContent,
                // Custom extraction
                customFields: customFieldResults,
                customRules: customRuleResults,
                // AI Discoverability
                answerBoxReady, definitionParagraphs, hasQuestionFormat, hasPassageStructure, hasFeaturedSnippetPatterns, hasSpeakableSchema,
                passageReadiness, voiceSearchScore, geoScore, hasLlmsTxt, llmsTxtStatus, aiBotRules, aiBotAccess, aiBotAccessSummary, llmsTxt,
                // JS Diff
                jsRenderDiff,
                // Business Signals
                hasPricingPage, hasTrustBadges, hasTestimonials, hasCaseStudies, hasCustomerLogos,
                ctaTexts, socialLinks, adPlatforms, hasFormsWithAutocomplete,
                // Industry Specific
                industry, industrySignals,
                // New Tier 4 extraction
                phoneNumbers, hasPostalAddress, hasExitIntent, hasStickyBar, hasEmbeddedMap,
                detectedLibraries, accessibilityStatementLinked
            }
        });
    } catch (err) {
        parentPort.postMessage({ type: 'ERROR', message: err.message });
    }
});
