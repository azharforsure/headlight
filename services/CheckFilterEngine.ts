import {
    CHECK_REGISTRY,
    type AuditMode,
    type CheckCategory,
    type CheckDefinition,
    type IndustryFilter
} from './CheckRegistry';

export interface AuditFilterState {
    modes: AuditMode[];
    industry: IndustryFilter;
    customOverrides?: {
        enabled: string[];
        disabled: string[];
    };
}

export const DEFAULT_FILTER_STATE: AuditFilterState = {
    modes: ['full'],
    industry: 'all'
};

const CHECK_CATEGORY_TO_TREE_IDS: Record<CheckCategory, string[]> = {
    http: ['codes'],
    dns_ssl: ['security'],
    crawlability: ['indexability', 'codes', 'links', 'architecture', 'pagination'],
    performance: ['performance'],
    links: ['links'],
    url_structure: ['architecture'],
    security_privacy: ['security'],
    js_rendering: ['performance'],
    resource_optimization: ['performance', 'images'],
    title_meta: ['content'],
    headings_content: ['content'],
    images: ['images'],
    structured_data: ['schema'],
    accessibility: ['mobile'],
    mobile: ['mobile'],
    content_intelligence: ['content', 'ai-insights'],
    keyword_intelligence: ['content', 'ai-insights', 'ai-clusters'],
    issue_intelligence: ['ai-insights'],
    ai_discoverability: ['ai-insights'],
    business_signals: ['ai-insights'],
    social_media: ['content'],
    competitor: ['ai-insights'],
    ads_ppc: ['ai-insights'],
    conversion_ux: ['ai-insights'],
    tech_debt: ['security', 'performance'],
    ecommerce: ['schema', 'content'],
    local: ['international', 'schema'],
    news: ['content', 'schema'],
    saas: ['content', 'ai-insights'],
    healthcare: ['healthcare'],
    finance: ['content', 'ai-insights'],
    education: ['content'],
    citations: ['local']
};

export function getActiveChecks(state: AuditFilterState): CheckDefinition[] {
    const { modes, industry, customOverrides } = state;
    const normalizedModes = modes.length > 0 ? modes : ['full'];
    const isFullMode = normalizedModes.includes('full');

    return CHECK_REGISTRY.filter((check) => {
        if (customOverrides?.disabled?.includes(check.id)) return false;
        if (customOverrides?.enabled?.includes(check.id)) return true;

        const modeMatch = isFullMode || check.auditModes.some((mode) => normalizedModes.includes(mode));
        const isIndustrySpecific = !check.industries.includes('all');
        const industryMatch = check.industries.includes(industry);

        if (isIndustrySpecific) {
            if (industry === 'all') return false;
            return industryMatch;
        }

        if (industry === 'all') {
            return modeMatch;
        }

        return modeMatch || industryMatch;
    });
}

export function getActiveCheckIds(state: AuditFilterState): Set<string> {
    return new Set(getActiveChecks(state).map((check) => check.id));
}

export function getActiveCheckCountByTier(state: AuditFilterState): Record<number, number> {
    const checks = getActiveChecks(state);
    return {
        1: checks.filter((check) => check.tier === 1).length,
        2: checks.filter((check) => check.tier === 2).length,
        3: checks.filter((check) => check.tier === 3).length,
        4: checks.filter((check) => check.tier === 4).length
    };
}

export function getActiveCheckCategories(state: AuditFilterState): Set<CheckCategory> {
    return new Set(getActiveChecks(state).map((check) => check.category));
}

export function getActiveCategoryTreeIds(state: AuditFilterState): Set<string> {
    const ids = new Set<string>(['internal']);
    const categories = getActiveCheckCategories(state);
    categories.forEach((category) => {
        const mapped = CHECK_CATEGORY_TO_TREE_IDS[category];
        if (!mapped) return;
        mapped.forEach((id) => ids.add(id));
    });
    return ids;
}
