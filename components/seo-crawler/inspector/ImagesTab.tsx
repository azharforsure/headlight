import React from 'react';
import { formatNumber, MetricCard, SectionHeader, StatusBadge } from './shared';

type ImageDetail = {
    src?: string;
    alt?: string;
    width?: string | number;
    height?: string | number;
    loading?: string;
    srcset?: string;
};

export default function ImagesTab({ page }: { page: any }) {
    const imageDetails: ImageDetail[] = Array.isArray(page?.imageDetails) ? page.imageDetails : [];

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <MetricCard label="Total Images" value={formatNumber(page?.totalImages)} />
                <MetricCard
                    label="Missing Alt"
                    value={formatNumber(page?.missingAltImages)}
                    color={Number(page?.missingAltImages || 0) > 0 ? 'text-red-400' : 'text-green-400'}
                />
                <MetricCard
                    label="Long Alt (>100)"
                    value={formatNumber(page?.longAltImages)}
                    color={Number(page?.longAltImages || 0) > 0 ? 'text-orange-400' : 'text-green-400'}
                />
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
                <StatusBadge status={Number(page?.imagesWithoutSrcset || 0) > 0 ? 'warn' : 'pass'} label={`No srcset: ${formatNumber(page?.imagesWithoutSrcset)}`} />
                <StatusBadge status={Number(page?.imagesWithoutLazy || 0) > 0 ? 'warn' : 'pass'} label={`No lazy: ${formatNumber(page?.imagesWithoutLazy)}`} />
                <StatusBadge status={Number(page?.imagesWithoutDimensions || 0) > 0 ? 'warn' : 'pass'} label={`No dimensions: ${formatNumber(page?.imagesWithoutDimensions)}`} />
                <StatusBadge status={Number(page?.legacyFormatImages || 0) > 0 ? 'warn' : 'info'} label={`Legacy formats: ${formatNumber(page?.legacyFormatImages)}`} />
                <StatusBadge status={Number(page?.modernFormatImages || 0) > 0 ? 'pass' : 'warn'} label={`Modern formats: ${formatNumber(page?.modernFormatImages)}`} />
            </div>

            <SectionHeader title="Image Inventory" />
            {imageDetails.length > 0 ? (
                <div className="bg-[#0a0a0a] border border-[#222] rounded overflow-hidden">
                    <div className="max-h-[340px] overflow-auto custom-scrollbar">
                        <table className="w-full text-[11px] font-mono">
                            <thead className="sticky top-0 bg-[#111] border-b border-[#222]">
                                <tr>
                                    <th className="text-left px-3 py-2 text-[#555]">Source</th>
                                    <th className="text-left px-3 py-2 text-[#555]">Alt Text</th>
                                    <th className="text-left px-3 py-2 text-[#555]">Dimensions</th>
                                    <th className="text-left px-3 py-2 text-[#555]">Loading</th>
                                    <th className="text-left px-3 py-2 text-[#555]">Srcset</th>
                                </tr>
                            </thead>
                            <tbody>
                                {imageDetails.map((image, index) => (
                                    <tr key={`image-${index}`} className="border-b border-[#1a1a1a] hover:bg-[#111]">
                                        <td className="px-3 py-1.5 text-blue-400 break-all max-w-[320px]">{image?.src || '—'}</td>
                                        <td className={`px-3 py-1.5 max-w-[260px] break-all ${!image?.alt ? 'text-red-400 italic' : 'text-[#ccc]'}`}>
                                            {image?.alt || 'MISSING'}
                                        </td>
                                        <td className="px-3 py-1.5 text-[#888]">
                                            {image?.width && image?.height ? `${image.width}×${image.height}` : '—'}
                                        </td>
                                        <td className="px-3 py-1.5 text-[#888]">{image?.loading || '—'}</td>
                                        <td className="px-3 py-1.5 text-[#888]">{image?.srcset ? 'Yes' : 'No'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-[#0a0a0a] border border-[#222] rounded p-4 text-[12px] text-[#666] text-center">
                    No image details were captured for this page.
                </div>
            )}
        </div>
    );
}
