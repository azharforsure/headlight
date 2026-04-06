import type { CsvUploadMeta } from './CrawlerIntegrationsService';

// ─── Smart CSV line parser (handles quoted commas) ──
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === ',' || char === '\t' || char === ';') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// ─── Detect delimiter ───────────────────────────────
function detectDelimiter(firstLine: string): string {
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  if (tabCount > commaCount && tabCount > semiCount) return '\t';
  if (semiCount > commaCount) return ';';
  return ',';
}

// ─── Column alias maps ──────────────────────────────

const BACKLINK_COLUMN_MAP: Record<string, string[]> = {
  url: ['url', 'target url', 'target', 'page url', 'page', 'source url'],
  referringDomains: [
    'referring domains', 'ref domains', 'rd', 'domains',
    'ref. domains', 'referring domain',
  ],
  backlinks: [
    'backlinks', 'total backlinks', 'links', 'external backlinks',
    'dofollow', 'dofollow backlinks', 'total links',
  ],
  urlRating: [
    'url rating', 'ur', 'domain authority', 'da', 'authority score',
    'page authority', 'pa', 'trust flow', 'tf', 'citation flow',
    'domain rating', 'dr', 'authority',
  ],
};

const KEYWORD_COLUMN_MAP: Record<string, string[]> = {
  url: ['url', 'page url', 'target url', 'landing page', 'current url'],
  keyword: [
    'keyword', 'query', 'search query', 'term', 'phrase',
    'top queries', 'search term',
  ],
  volume: [
    'volume', 'search volume', 'monthly searches',
    'avg. monthly searches', 'avg monthly searches', 'search vol',
  ],
  position: [
    'position', 'rank', 'ranking', 'pos', 'current position',
    'avg. position', 'average position',
  ],
  traffic: [
    'traffic', 'estimated traffic', 'organic traffic', 'clicks',
    'traffic (monthly)', 'est. traffic',
  ],
};

const SITEMAP_URL_PATTERN = /<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/gi;

const CONTENT_INVENTORY_COLUMN_MAP: Record<string, string[]> = {
  url: ['url', 'page url', 'page'],
  owner: ['owner', 'content owner', 'author', 'assigned to', 'responsible'],
  targetKeyword: [
    'target keyword', 'primary keyword', 'main keyword', 'focus keyword',
  ],
  contentType: [
    'content type', 'type', 'page type', 'template', 'format',
  ],
  publishDate: [
    'publish date', 'published', 'date published', 'created',
    'publish_date', 'date',
  ],
  updateDate: [
    'last updated', 'updated', 'modified', 'last modified',
    'update date', 'updated_at',
  ],
  status: ['status', 'content status', 'state'],
  notes: ['notes', 'comments', 'description'],
};

// ─── Generic column matcher ─────────────────────────
function matchColumns(
  headers: string[],
  columnMap: Record<string, string[]>
): { colIndex: Record<string, number>; matched: string[]; unmatched: string[] } {
  const colIndex: Record<string, number> = {};
  const matched: string[] = [];
  const unmatched: string[] = [];

  headers.forEach((h, i) => {
    const normalized = h.toLowerCase().trim().replace(/['"]/g, '');
    let found = false;
    for (const [field, aliases] of Object.entries(columnMap)) {
      if (aliases.includes(normalized) && !(field in colIndex)) {
        colIndex[field] = i;
        matched.push(h);
        found = true;
        break;
      }
    }
    if (!found) unmatched.push(h);
  });

  return { colIndex, matched, unmatched };
}

// ─── Parse generic CSV text into lines ──────────────
function parseLines(csvText: string): { headers: string[]; rows: string[][] } {
  const lines = csvText.trim().split('\n').filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(lines[0]);
  const useSmartParse = csvText.includes('"');

  const headers = useSmartParse
    ? parseCsvLine(lines[0])
    : lines[0].split(delimiter).map((h) => h.replace(/"/g, '').trim());

  const rows = lines.slice(1).map((line) =>
    useSmartParse
      ? parseCsvLine(line)
      : line.split(delimiter).map((c) => c.replace(/"/g, '').trim())
  );

  return { headers, rows };
}

// ─── Backlink CSV ───────────────────────────────────
export interface BacklinkRow {
  url: string;
  referringDomains: number;
  backlinks: number;
  urlRating: number;
}

export function parseBacklinkCsv(csvText: string): {
  data: BacklinkRow[];
  meta: CsvUploadMeta;
} {
  const { headers, rows } = parseLines(csvText);
  const { colIndex, matched, unmatched } = matchColumns(headers, BACKLINK_COLUMN_MAP);

  if (!('url' in colIndex)) {
    throw new Error(
      'Could not find a URL column. Expected one of: ' +
        BACKLINK_COLUMN_MAP.url.join(', ')
    );
  }

  const data = rows
    .map((cols) => ({
      url: cols[colIndex.url] || '',
      referringDomains: Number(cols[colIndex.referringDomains] || 0),
      backlinks: Number(cols[colIndex.backlinks] || 0),
      urlRating: Number(cols[colIndex.urlRating] || 0),
    }))
    .filter((r) => r.url && (r.url.startsWith('http') || r.url.startsWith('https')));

  return {
    data,
    meta: {
      fileName: '',
      uploadedAt: Date.now(),
      rowCount: data.length,
      matchedColumns: matched,
      unmatchedColumns: unmatched,
    },
  };
}

// ─── Keyword CSV ────────────────────────────────────
export interface KeywordRow {
  url: string;
  keyword: string;
  volume: number;
  position: number;
  traffic: number;
}

export function parseKeywordCsv(csvText: string): {
  data: KeywordRow[];
  meta: CsvUploadMeta;
} {
  const { headers, rows } = parseLines(csvText);
  const { colIndex, matched, unmatched } = matchColumns(headers, KEYWORD_COLUMN_MAP);

  if (!('url' in colIndex)) {
    throw new Error(
      'Could not find a URL column. Expected one of: ' +
        KEYWORD_COLUMN_MAP.url.join(', ')
    );
  }
  if (!('keyword' in colIndex)) {
    throw new Error(
      'Could not find a Keyword column. Expected one of: ' +
        KEYWORD_COLUMN_MAP.keyword.join(', ')
    );
  }

  const data = rows
    .map((cols) => ({
      url: cols[colIndex.url] || '',
      keyword: cols[colIndex.keyword] || '',
      volume: Number(cols[colIndex.volume] || 0),
      position: Number(cols[colIndex.position] || 0),
      traffic: Number(cols[colIndex.traffic] || 0),
    }))
    .filter((r) => r.url && r.keyword);

  return {
    data,
    meta: {
      fileName: '',
      uploadedAt: Date.now(),
      rowCount: data.length,
      matchedColumns: matched,
      unmatchedColumns: unmatched,
    },
  };
}

// ─── Sitemap / URL List ─────────────────────────────
export function parseSitemapOrUrlList(text: string): {
  urls: string[];
  meta: CsvUploadMeta;
} {
  let urls: string[] = [];

  // Try XML sitemap first
  const xmlMatches = [...text.matchAll(SITEMAP_URL_PATTERN)];
  if (xmlMatches.length > 0) {
    urls = xmlMatches.map((m) => m[1].trim());
  } else {
    // Plain text URL list (one per line)
    urls = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('http') || l.startsWith('https'));
  }

  return {
    urls,
    meta: {
      fileName: '',
      uploadedAt: Date.now(),
      rowCount: urls.length,
      matchedColumns: ['url'],
      unmatchedColumns: [],
    },
  };
}

// ─── Content Inventory CSV ──────────────────────────
export interface ContentInventoryRow {
  url: string;
  owner?: string;
  targetKeyword?: string;
  contentType?: string;
  publishDate?: string;
  updateDate?: string;
  status?: string;
  notes?: string;
}

export function parseContentInventoryCsv(csvText: string): {
  data: ContentInventoryRow[];
  meta: CsvUploadMeta;
} {
  const { headers, rows } = parseLines(csvText);
  const { colIndex, matched, unmatched } = matchColumns(
    headers,
    CONTENT_INVENTORY_COLUMN_MAP
  );

  if (!('url' in colIndex)) {
    throw new Error(
      'Could not find a URL column. Expected one of: ' +
        CONTENT_INVENTORY_COLUMN_MAP.url.join(', ')
    );
  }

  const data = rows
    .map((cols) => ({
      url: cols[colIndex.url] || '',
      owner: cols[colIndex.owner] || undefined,
      targetKeyword: cols[colIndex.targetKeyword] || undefined,
      contentType: cols[colIndex.contentType] || undefined,
      publishDate: cols[colIndex.publishDate] || undefined,
      updateDate: cols[colIndex.updateDate] || undefined,
      status: cols[colIndex.status] || undefined,
      notes: cols[colIndex.notes] || undefined,
    }))
    .filter((r) => r.url);

  return {
    data,
    meta: {
      fileName: '',
      uploadedAt: Date.now(),
      rowCount: data.length,
      matchedColumns: matched,
      unmatchedColumns: unmatched,
    },
  };
}
