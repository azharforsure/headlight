import React from 'react';
import { SEO_ISSUES_TAXONOMY } from '../constants';

export const EMPTY_VALUE = '—';

export const normalizeValue = (value: any) => {
    if (value === null || value === undefined || value === '') return EMPTY_VALUE;
    return value;
};

export const formatPercent = (value: any, multiplier = 1) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return EMPTY_VALUE;
    return `${(Number(value) * multiplier).toFixed(2)}%`;
};

export const formatNumber = (value: any, options?: Intl.NumberFormatOptions) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return EMPTY_VALUE;
    return Number(value).toLocaleString(undefined, options);
};

export const formatDuration = (ms: any) => {
    if (ms === null || ms === undefined || Number.isNaN(Number(ms))) return EMPTY_VALUE;
    return `${Math.round(Number(ms))}ms`;
};

export const formatBytes = (bytes: any) => {
    if (bytes === null || bytes === undefined || Number.isNaN(Number(bytes))) return EMPTY_VALUE;
    const value = Number(bytes);
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(2)} MB`;
    return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export const getSafeHostname = (url: string | undefined | null) => {
    if (!url) return 'example.com';
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
};

export const DataRow = ({ label, value, status, mono = false }: {
    label: string;
    value: React.ReactNode;
    status?: 'pass' | 'warn' | 'fail' | 'info';
    mono?: boolean;
}) => {
    const tone = status === 'pass'
        ? 'text-green-400'
        : status === 'warn'
            ? 'text-orange-400'
            : status === 'fail'
                ? 'text-red-400'
                : status === 'info'
                    ? 'text-blue-400'
                    : 'text-white';

    return (
        <div className="grid grid-cols-[140px_1fr] gap-x-3 text-[12px] py-1">
            <span className="text-[#555] truncate">{label}</span>
            <span className={`${mono ? 'font-mono' : ''} ${tone} break-all`}>{normalizeValue(value)}</span>
        </div>
    );
};

export const SectionHeader = ({ title, color }: { title: string; color?: string }) => (
    <h4 className={`text-[11px] font-black uppercase tracking-widest border-b border-[#222] pb-1 mb-3 ${color || 'text-[#444]'}`}>
        {title}
    </h4>
);

export const StatusBadge = ({ status, label }: {
    status: 'pass' | 'warn' | 'fail' | 'info';
    label: string;
}) => {
    const styles = {
        pass: 'bg-green-500/15 text-green-400 border-green-500/25',
        warn: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
        fail: 'bg-red-500/15 text-red-400 border-red-500/25',
        info: 'bg-blue-500/15 text-blue-400 border-blue-500/25'
    };

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[status]}`}>
            {label}
        </span>
    );
};

export const MetricCard = ({ label, value, sub, color }: {
    label: string;
    value: React.ReactNode;
    sub?: string;
    color?: string;
}) => (
    <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
        <div className="text-[10px] text-[#666] uppercase tracking-widest">{label}</div>
        <div className={`text-[20px] font-black mt-1 ${color || 'text-white'}`}>{normalizeValue(value)}</div>
        {sub && <div className="text-[10px] text-[#777] mt-1">{sub}</div>}
    </div>
);

export const TruncatedUrl = ({ url }: { url: string }) => (
    <span title={url} className="text-blue-400 truncate text-[11px] font-mono block max-w-[400px]">
        {url}
    </span>
);

export const getPageIssues = (page: any) => {
    const issues: { label: string; type: 'error' | 'warning' | 'notice' }[] = [];
    for (const group of SEO_ISSUES_TAXONOMY) {
        for (const issue of group.issues) {
            try {
                if (issue.condition(page)) {
                    issues.push({
                        label: issue.label,
                        type: issue.type as 'error' | 'warning' | 'notice'
                    });
                }
            } catch {
                // Ignore malformed issue evaluators for this row
            }
        }
    }
    return issues.slice(0, 18);
};

export const IssuesList = ({ issues }: {
    issues: { label: string; type: 'error' | 'warning' | 'notice' }[];
}) => {
    if (issues.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-3 border-b border-[#222]">
            <span className="text-[10px] text-[#555] uppercase tracking-widest font-bold mr-1">Issues:</span>
            {issues.map((issue, index) => (
                <StatusBadge
                    key={`${issue.label}-${index}`}
                    status={issue.type === 'error' ? 'fail' : issue.type === 'warning' ? 'warn' : 'info'}
                    label={issue.label}
                />
            ))}
        </div>
    );
};
