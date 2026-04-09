import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSharedReport, SharedReport } from '../services/ShareService';
import { getDashboardCrawlSummary, getAuditIssues } from '../services/CrawlerBridgeService';

export const PublicReport: React.FC = () => {
    const { shareToken } = useParams<{ shareToken: string }>();
    const [report, setReport] = useState<SharedReport | null>(null);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (shareToken) {
            loadReport();
        }
    }, [shareToken]);

    async function loadReport() {
        try {
            const reportConfig = await getSharedReport(shareToken!);
            if (!reportConfig) {
                setError('Report not found or has been revoked.');
                setLoading(false);
                return;
            }

            if (reportConfig.expires_at && new Date(reportConfig.expires_at) < new Date()) {
                setError('This report has expired.');
                setLoading(false);
                return;
            }

            setReport(reportConfig);
            
            if (!reportConfig.password_hash) {
                setIsAuthorized(true);
                await loadReportData(reportConfig);
            }
            
            setLoading(false);
        } catch (err) {
            setError('Failed to load report.');
            setLoading(false);
        }
    }

    async function loadReportData(reportConfig: SharedReport) {
        try {
            const summary = await getDashboardCrawlSummary(reportConfig.project_id);
            const issues = await getAuditIssues(reportConfig.project_id, reportConfig.session_id);
            setData({ summary, issues });
        } catch (err) {
            console.error('Failed to load report data:', err);
        }
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (report && password === report.password_hash) {
            setIsAuthorized(true);
            await loadReportData(report);
        } else {
            alert('Incorrect password');
        }
    };

    if (loading) return <div className="h-screen bg-[#080808] flex items-center justify-center text-white">Loading report...</div>;
    if (error) return <div className="h-screen bg-[#080808] flex items-center justify-center text-red-500">{error}</div>;

    if (!isAuthorized) {
        return (
            <div className="h-screen bg-[#080808] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[#111] border border-[#222] rounded-xl p-8">
                    <h1 className="text-xl font-bold text-white mb-2">Password Protected</h1>
                    <p className="text-gray-400 text-sm mb-6">This report is private. Please enter the password to view it.</p>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#080808] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            placeholder="Enter password"
                            autoFocus
                        />
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">
                            View Report
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const { summary, issues } = data || {};

    return (
        <div className="min-h-screen bg-[#080808] text-white">
            {/* Header */}
            <header className="h-16 border-b border-[#222] bg-[#0a0a0a] flex items-center justify-between px-6 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    {report?.white_label && report.custom_logo_url ? (
                        <img src={report.custom_logo_url} alt="Logo" className="h-8" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="font-bold text-lg tracking-tight">Headlight</span>
                        </div>
                    )}
                    <div className="w-px h-6 bg-[#222] mx-2" />
                    <h1 className="text-gray-200 font-medium">{report?.title}</h1>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Generated on {new Date(report?.created_at || '').toLocaleDateString()}</span>
                    {report?.white_label && report.custom_company_name && (
                        <>
                            <div className="w-px h-3 bg-[#222]" />
                            <span>Prepared by {report.custom_company_name}</span>
                        </>
                    )}
                </div>
            </header>

            <main className="max-w-6xl mx-auto py-12 px-6">
                {/* Executive Summary Section */}
                {report?.include_sections.includes('summary') && (
                    <section className="mb-16">
                        <h2 className="text-2xl font-bold mb-8">Executive Summary</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                                <span className="text-sm text-gray-400 block mb-1">Health Score</span>
                                <div className="text-4xl font-bold text-green-500">{summary?.summary?.healthScore || 0}%</div>
                            </div>
                            <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                                <span className="text-sm text-gray-400 block mb-1">Pages Crawled</span>
                                <div className="text-4xl font-bold text-white">{summary?.summary?.totalCrawled || 0}</div>
                            </div>
                            <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                                <span className="text-sm text-gray-400 block mb-1">Critical Issues</span>
                                <div className="text-4xl font-bold text-red-500">{summary?.issueOverview?.critical || 0}</div>
                            </div>
                        </div>
                        
                        {summary?.summary?.narrative && (
                            <div className="mt-8 bg-[#111] border border-[#222] rounded-xl p-8 leading-relaxed text-gray-300">
                                {summary.summary.narrative}
                            </div>
                        )}
                    </section>
                )}

                {/* Issues Section */}
                {report?.include_sections.includes('issues') && (
                    <section className="mb-16">
                        <h2 className="text-2xl font-bold mb-8">Issue Breakdown</h2>
                        <div className="space-y-4">
                            {issues?.map((issue: any) => (
                                <div key={issue.id} className="bg-[#111] border border-[#222] rounded-xl p-6 flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                issue.priority === 'critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                issue.priority === 'high' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                                                'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                            }`}>
                                                {issue.priority}
                                            </span>
                                            <span className="text-xs text-gray-500">{issue.category}</span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-2">{issue.title}</h3>
                                        <p className="text-gray-400 text-sm max-w-2xl">{issue.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-white">{issue.count}</div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wider">Affected</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Recommendations */}
                {report?.include_sections.includes('recommendations') && (
                    <section>
                        <h2 className="text-2xl font-bold mb-8">Action Plan</h2>
                        <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold">Priority Recommendations</h3>
                            </div>
                            
                            <div className="space-y-6">
                                {issues?.slice(0, 3).map((issue: any, i: number) => (
                                    <div key={issue.id} className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#111] border border-[#222] flex items-center justify-center text-sm font-bold">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-white mb-1">Fix {issue.title}</h4>
                                            <p className="text-sm text-gray-400 leading-relaxed">
                                                {issue.aiFix || `Review and resolve the ${issue.count} occurrences of this issue to improve your site's health score.`}
                                            </p>
                                            <div className="flex items-center gap-4 mt-3">
                                                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    Effort: {issue.effort}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                    Impact: +{issue.impact} points
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <footer className="py-20 border-t border-[#222] text-center">
                {!report?.white_label && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="font-bold text-sm tracking-tight">Headlight</span>
                        </div>
                        <p className="text-gray-500 text-xs">Modern SEO Intelligence & Technical Audits</p>
                    </div>
                )}
            </footer>
        </div>
    );
};
