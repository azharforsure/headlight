import type { Mode } from '@headlight/types';

export const LEGACY_MODE_MAP: Record<string, Mode> = {
    full: 'fullAudit',
    website_quality: 'wqa',
    technical_seo: 'technical',
    content: 'content',
    on_page_seo: 'wqa',
    off_page: 'linksAuthority',
    local_seo: 'local',
    ecommerce: 'commerce',
    news_editorial: 'content',
    ai_discoverability: 'ai',
    competitor_gap: 'competitors',
    business: 'wqa',
    accessibility: 'wqa',
    security: 'technical',
    uxConversion: 'uxConversion',
    paid: 'paid',
    socialBrand: 'socialBrand',
};

export const MODE_SET: Record<Mode, true> = {
    fullAudit: true,
    wqa: true,
    technical: true,
    content: true,
    linksAuthority: true,
    uxConversion: true,
    paid: true,
    commerce: true,
    socialBrand: true,
    ai: true,
    competitors: true,
    local: true,
};
