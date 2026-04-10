import React, { ChangeEvent, useMemo, useState } from 'react';
import { Download, ExternalLink, Loader2, X } from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { useCrawlerUI } from '../../contexts/CrawlerUIContext';
import { useOptionalProject } from '../../services/ProjectContext';
import { getCrawlerIntegrationSecret, getCrawlerSecretScope } from '../../services/CrawlerSecretVault';
import { refreshWithLock } from '../../services/TokenRefreshLock';
import { refreshGoogleToken } from '../../services/GoogleOAuthHelper';
import {
    downloadBlob,
    exportCSV,
    exportExcel,
    exportJSON,
    exportPDF,
    exportToGoogleSheets,
    type ExportFormat,
    type ExportScope
} from '../../services/ExportService';
import { getPageIssues } from './IssueTaxonomy';

interface ExportDialogProps {
    onClose: () => void;
}

const formatLabels: Record<ExportFormat, string> = {
    csv: 'CSV',
    json: 'JSON',
    pdf: 'PDF Report',
    'google-sheets': 'Google Sheets',
    excel: 'Excel (.xlsx)'
};

export default function ExportDialog({ onClose }: ExportDialogProps) {
    const projectContext = useOptionalProject();
    const activeProject = projectContext?.activeProject || null;
    const {
        pages,
        filteredPages,
        stats,
        healthScore,
        auditInsights,
        strategicOpportunities,
        diffResult,
        urlInput,
        integrationConnections,
        addLog
    } = useSeoCrawler();

    const {
        visibleColumns,
        selectedRows,
    } = useCrawlerUI();

    const [format, setFormat] = useState<ExportFormat>('csv');
    const [scope, setScope] = useState<ExportScope>('all');
    const [isExporting, setIsExporting] = useState(false);
    const [columnOptions, setColumnOptions] = useState({
        includeVisibleColumns: true,
        includeAiAnalysis: true,
        includeIntegrations: true,
        includeRawHtml: false
    });
    const [pdfOptions, setPdfOptions] = useState({
        executiveSummary: true,
        issueBreakdownCharts: true,
        pageLevelDetails: true,
        recommendations: true,
        comparisonWithPreviousCrawl: true,
        whiteLabel: false,
        companyLogo: null as string | null
    });
    const [sheetUrl, setSheetUrl] = useState<string | null>(null);

    const selectedUrls = useMemo(() => Array.from(selectedRows), [selectedRows]);
    const counts = {
        all: pages.length,
        filtered: filteredPages.length,
        issues: filteredPages.filter((page) => getPageIssues(page).length > 0).length,
        selected: selectedUrls.length
    };

    const exportOptions = {
        crawlUrl: urlInput || pages[0]?.url,
        selectedUrls,
        visibleColumns: columnOptions.includeVisibleColumns ? visibleColumns : undefined,
        columnOptions,
        pdfOptions,
        stats,
        healthScore,
        auditInsights,
        strategicOpportunities,
        diffResult,
        issueResolver: getPageIssues
    };

    const resolveGoogleAccessToken = async () => {
        const googleConnection = integrationConnections.google;
        const googleEmail = googleConnection?.accountLabel;
        if (!googleEmail) {
            throw new Error('Google connection not found.');
        }

        const secretScope = getCrawlerSecretScope(activeProject?.id || null);
        const secrets = getCrawlerIntegrationSecret(secretScope, 'google');
        const directToken = secrets?.access_token;
        if (directToken) return directToken;

        const refreshed = await refreshWithLock(googleEmail, refreshGoogleToken);
        if (!refreshed) {
            throw new Error('Unable to refresh Google access token.');
        }
        return refreshed;
    };

    const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error || new Error('Failed to read logo file.'));
            reader.readAsDataURL(file);
        });

        setPdfOptions((previous) => ({ ...previous, companyLogo: dataUrl }));
    };

    const handleExportClick = async () => {
        try {
            setIsExporting(true);
            setSheetUrl(null);

            if (format === 'csv') {
                downloadBlob(exportCSV(scope === 'filtered' ? filteredPages : pages, scope, exportOptions), `headlight_export_${Date.now()}.csv`);
            } else if (format === 'json') {
                downloadBlob(exportJSON(scope === 'filtered' ? filteredPages : pages, scope, exportOptions), `headlight_export_${Date.now()}.json`);
            } else if (format === 'excel') {
                const blob = await exportExcel(scope === 'filtered' ? filteredPages : pages, scope, exportOptions);
                downloadBlob(blob, `headlight_export_${Date.now()}.xlsx`);
            } else if (format === 'pdf') {
                const blob = await exportPDF(scope === 'filtered' ? filteredPages : pages, scope, exportOptions);
                downloadBlob(blob, `headlight_report_${Date.now()}.pdf`);
            } else if (format === 'google-sheets') {
                const accessToken = await resolveGoogleAccessToken();
                const url = await exportToGoogleSheets(scope === 'filtered' ? filteredPages : pages, scope, accessToken, exportOptions);
                setSheetUrl(url);
                window.open(url, '_blank', 'noopener,noreferrer');
            }

            addLog(`Export complete (${formatLabels[format]}).`, 'success', { source: 'system' });
        } catch (error) {
            addLog((error as Error).message || 'Export failed.', 'error', { source: 'system' });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
            <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} />
            <div className="relative w-full max-w-[520px] rounded-3xl border border-[#232329] bg-[#111] shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
                <div className="flex items-center justify-between border-b border-[#202025] px-5 py-4">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#666]">Export</div>
                        <h2 className="mt-1 text-[20px] font-black text-white">Export crawl data</h2>
                    </div>
                    <button onClick={onClose} className="rounded-lg border border-[#2e2e34] p-2 text-[#888] hover:text-white">
                        <X size={16} />
                    </button>
                </div>

                <div className="max-h-[80vh] space-y-5 overflow-y-auto px-5 py-5">
                    <section>
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#666]">Format</div>
                        <div className="space-y-2">
                            {(Object.keys(formatLabels) as ExportFormat[]).map((option) => (
                                <label key={option} className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#242428] bg-[#101013] px-4 py-3">
                                    <div>
                                        <div className="text-[12px] font-semibold text-white">{formatLabels[option]}</div>
                                        <div className="text-[11px] text-[#777]">
                                            {option === 'csv' && 'Spreadsheet-friendly table export'}
                                            {option === 'json' && 'Structured dataset for development workflows'}
                                            {option === 'pdf' && 'Visual report with summary and recommendations'}
                                            {option === 'google-sheets' && 'Publish directly into a live spreadsheet'}
                                            {option === 'excel' && 'Workbook export for analysts'}
                                        </div>
                                    </div>
                                    <input type="radio" name="format" checked={format === option} onChange={() => setFormat(option)} className="h-4 w-4 accent-[#F5364E]" />
                                </label>
                            ))}
                        </div>
                    </section>

                    <section>
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#666]">Scope</div>
                        <div className="space-y-2">
                            {[
                                { id: 'all', label: 'All pages', count: counts.all },
                                { id: 'filtered', label: 'Current filtered view', count: counts.filtered },
                                { id: 'issues', label: 'Issues only', count: counts.issues },
                                { id: 'selected', label: 'Custom selection', count: counts.selected }
                            ].map((option) => (
                                <label key={option.id} className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#242428] bg-[#101013] px-4 py-3">
                                    <div className="text-[12px] font-semibold text-white">{option.label} <span className="text-[#666]">({option.count})</span></div>
                                    <input type="radio" name="scope" checked={scope === option.id} onChange={() => setScope(option.id as ExportScope)} className="h-4 w-4 accent-[#F5364E]" />
                                </label>
                            ))}
                        </div>
                    </section>

                    <section>
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#666]">Columns</div>
                        <div className="space-y-2 rounded-2xl border border-[#242428] bg-[#101013] p-4">
                            {[
                                { key: 'includeVisibleColumns', label: 'Include all visible columns' },
                                { key: 'includeAiAnalysis', label: 'Include AI analysis' },
                                { key: 'includeIntegrations', label: 'Include GSC / GA4 / authority data' },
                                { key: 'includeRawHtml', label: 'Include raw HTML fields' }
                            ].map((option) => (
                                <label key={option.key} className="flex items-center justify-between text-[12px] text-white">
                                    <span>{option.label}</span>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(columnOptions[option.key as keyof typeof columnOptions])}
                                        onChange={(event) => setColumnOptions((previous) => ({ ...previous, [option.key]: event.target.checked }))}
                                        className="h-4 w-4 accent-[#F5364E]"
                                    />
                                </label>
                            ))}
                        </div>
                    </section>

                    {format === 'pdf' && (
                        <section>
                            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#666]">PDF options</div>
                            <div className="space-y-2 rounded-2xl border border-[#242428] bg-[#101013] p-4">
                                {[
                                    { key: 'executiveSummary', label: 'Executive summary' },
                                    { key: 'issueBreakdownCharts', label: 'Issue breakdown charts' },
                                    { key: 'pageLevelDetails', label: 'Page-level details' },
                                    { key: 'recommendations', label: 'Recommendations' },
                                    { key: 'comparisonWithPreviousCrawl', label: 'Comparison with previous crawl' },
                                    { key: 'whiteLabel', label: 'White-label branding' }
                                ].map((option) => (
                                    <label key={option.key} className="flex items-center justify-between text-[12px] text-white">
                                        <span>{option.label}</span>
                                        <input
                                            type="checkbox"
                                            checked={Boolean(pdfOptions[option.key as keyof typeof pdfOptions])}
                                            onChange={(event) => setPdfOptions((previous) => ({ ...previous, [option.key]: event.target.checked }))}
                                            className="h-4 w-4 accent-[#F5364E]"
                                        />
                                    </label>
                                ))}
                                <label className="mt-3 flex items-center justify-between rounded-xl border border-[#232329] bg-[#0d0d10] px-3 py-2 text-[12px] text-white">
                                    <span>Company logo</span>
                                    <input type="file" accept="image/*" onChange={(event) => { void handleLogoUpload(event); }} className="max-w-[180px] text-[11px] text-[#888]" />
                                </label>
                            </div>
                        </section>
                    )}

                    {sheetUrl && (
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[12px] text-emerald-200">
                            Google Sheet created.
                            <a href={sheetUrl} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 underline">
                                Open sheet
                                <ExternalLink size={12} />
                            </a>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-[#202025] px-5 py-4">
                    <button onClick={onClose} className="rounded-xl border border-[#2e2e34] px-4 py-3 text-[12px] font-semibold text-[#ccc] hover:border-[#444] hover:text-white">
                        Cancel
                    </button>
                    <button
                        onClick={() => { void handleExportClick(); }}
                        disabled={isExporting}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#ff5b70] to-[#d62839] px-4 py-3 text-[12px] font-bold text-white disabled:opacity-60"
                    >
                        {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        Export
                    </button>
                </div>
            </div>
        </div>
    );
}
