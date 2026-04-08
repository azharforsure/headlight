import React from 'react';
import { DataRow, formatNumber, SectionHeader, StatusBadge } from './shared';

export default function SchemaTab({ page }: { page: any }) {
    const schemaBlocks = Array.isArray(page?.schema) ? page.schema : [];
    const schemaTypes = Array.isArray(page?.schemaTypes) ? page.schemaTypes : [];
    const hasSchema = schemaBlocks.length > 0 || schemaTypes.length > 0;

    return (
        <div>
            <div className="flex items-center gap-3 mb-4">
                <StatusBadge status={hasSchema ? 'pass' : 'warn'} label={hasSchema ? `${schemaTypes.length || schemaBlocks.length} schema item(s)` : 'No schema detected'} />
                {Number(page?.schemaErrors || 0) > 0 && (
                    <StatusBadge status="fail" label={`${formatNumber(page?.schemaErrors)} error(s)`} />
                )}
                {Number(page?.schemaWarnings || 0) > 0 && (
                    <StatusBadge status="warn" label={`${formatNumber(page?.schemaWarnings)} warning(s)`} />
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-8">
                <div>
                    <SectionHeader title="Schema Summary" />
                    <DataRow label="Schema Present" value={hasSchema ? 'Yes' : 'No'} status={hasSchema ? 'pass' : 'warn'} />
                    <DataRow label="Schema Types" value={schemaTypes.length ? schemaTypes.join(', ') : '—'} />
                    <DataRow label="Errors" value={formatNumber(page?.schemaErrors)} status={Number(page?.schemaErrors || 0) > 0 ? 'fail' : 'pass'} />
                    <DataRow label="Warnings" value={formatNumber(page?.schemaWarnings)} status={Number(page?.schemaWarnings || 0) > 0 ? 'warn' : 'pass'} />
                    <DataRow label="Validation" value={Number(page?.schemaErrors || 0) > 0 ? 'Failed' : Number(page?.schemaWarnings || 0) > 0 ? 'Warnings' : hasSchema ? 'Passed' : 'Not available'} status={Number(page?.schemaErrors || 0) > 0 ? 'fail' : Number(page?.schemaWarnings || 0) > 0 ? 'warn' : 'pass'} />
                </div>

                <div>
                    <SectionHeader title="Detected Types" />
                    {schemaTypes.length === 0 ? (
                        <div className="text-[12px] text-[#666] bg-[#0a0a0a] border border-[#222] rounded p-3">
                            No schema types found.
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {schemaTypes.map((type: string) => (
                                <span key={type} className="px-2 py-1 bg-indigo-500/10 text-indigo-300 rounded text-[11px] font-mono border border-indigo-500/20">
                                    {type}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6">
                <SectionHeader title="Schema Blocks" />
                {schemaBlocks.length === 0 ? (
                    <div className="text-[12px] text-[#666] bg-[#0a0a0a] border border-[#222] rounded p-4">
                        No JSON-LD/Microdata blocks captured for this page.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {schemaBlocks.map((block: any, index: number) => (
                            <details key={`schema-${index}`} className="bg-[#0a0a0a] border border-[#222] rounded overflow-hidden">
                                <summary className="px-3 py-2 text-[11px] text-[#bbb] cursor-pointer hover:text-white">
                                    Block {index + 1}: {block?.['@type'] || block?.type || 'Unknown type'}
                                </summary>
                                <pre className="px-3 pb-3 text-[11px] font-mono text-[#cfcfcf] overflow-x-auto custom-scrollbar">
                                    {JSON.stringify(block, null, 2)}
                                </pre>
                            </details>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
