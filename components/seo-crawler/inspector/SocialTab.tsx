import React from 'react';
import { DataRow, SectionHeader, StatusBadge } from './shared';

const pick = (obj: any, ...keys: string[]) => {
    for (const key of keys) {
        const value = obj?.[key];
        if (value !== null && value !== undefined && value !== '') return value;
    }
    return null;
};

export default function SocialTab({ page }: { page: any }) {
    const ogTitle = pick(page, 'ogTitle', 'openGraphTitle');
    const ogDescription = pick(page, 'ogDescription', 'openGraphDescription');
    const ogImage = pick(page, 'ogImage', 'openGraphImage');
    const ogType = pick(page, 'ogType', 'openGraphType');
    const twitterCard = pick(page, 'twitterCard');
    const twitterTitle = pick(page, 'twitterTitle');
    const twitterDescription = pick(page, 'twitterDescription');
    const twitterImage = pick(page, 'twitterImage');

    const missing = [
        !ogTitle ? 'Missing OG Title' : null,
        !ogDescription ? 'Missing OG Description' : null,
        !ogImage ? 'Missing OG Image' : null,
        !twitterCard ? 'Missing Twitter Card' : null
    ].filter(Boolean) as string[];

    return (
        <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
                {missing.length === 0 ? (
                    <StatusBadge status="pass" label="All major social tags found" />
                ) : (
                    missing.map((item) => <StatusBadge key={item} status="warn" label={item} />)
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-8">
                <div>
                    <SectionHeader title="Open Graph" />
                    <DataRow label="og:title" value={ogTitle} />
                    <DataRow label="og:description" value={ogDescription} />
                    <DataRow label="og:image" value={ogImage} />
                    <DataRow label="og:type" value={ogType} />
                    <DataRow label="og:url" value={pick(page, 'ogUrl', 'openGraphUrl', 'url')} />
                </div>

                <div>
                    <SectionHeader title="Twitter Cards" />
                    <DataRow label="twitter:card" value={twitterCard} />
                    <DataRow label="twitter:title" value={twitterTitle} />
                    <DataRow label="twitter:description" value={twitterDescription} />
                    <DataRow label="twitter:image" value={twitterImage} />
                    <DataRow label="twitter:site" value={pick(page, 'twitterSite')} />
                </div>
            </div>

            {ogImage && (
                <div className="mt-6">
                    <SectionHeader title="OG Image Preview" />
                    <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
                        <img src={ogImage} alt="Open Graph preview" className="max-h-[280px] w-auto rounded border border-[#333]" />
                    </div>
                </div>
            )}
        </div>
    );
}
