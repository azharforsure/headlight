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
        const hasServiceWorker = /navigator\.serviceWorker\.register/i.test(pageSource);
        const hasWebManifest = $('link[rel="manifest"]').length > 0;

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
                insecureForms, mixedContent,
                // Accessibility
                hasMainLandmark, hasNavLandmark, hasHeaderLandmark, hasFooterLandmark,
                hasSkipLink, formsWithoutLabels, viewportNoScale, viewportMaxScale1,
                genericLinkTextCount, invalidAriaCount, tablesWithoutHeaders,
                // Performance / DOM
                domNodeCount, renderBlockingCss, renderBlockingJs,
                preconnectCount, prefetchCount, preloadCount, fontDisplayValues,
                legacyFormatImages, modernFormatImages, imagesWithoutSrcset,
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
                hasRssFeed, hasServiceWorker, hasWebManifest,
                // Custom extraction
                customFields: customFieldResults,
                customRules: customRuleResults
            }
        });
    } catch (err) {
        parentPort.postMessage({ type: 'ERROR', message: err.message });
    }
});
