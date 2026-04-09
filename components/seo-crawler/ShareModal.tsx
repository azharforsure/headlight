import React, { useState } from 'react';
import { createSharedReport, SharedReport } from '../../services/ShareService';

interface ShareModalProps {
    projectId: string;
    sessionId: string;
    onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ projectId, sessionId, onClose }) => {
    const [title, setTitle] = useState('Site Audit Report');
    const [password, setPassword] = useState('');
    const [whiteLabel, setWhiteLabel] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(false);
    const [sharedReport, setSharedReport] = useState<SharedReport | null>(null);

    const handleShare = async () => {
        setLoading(true);
        try {
            const report = await createSharedReport(projectId, sessionId, {
                title,
                createdBy: 'User', // In a real app, get from Clerk
                password: password || undefined,
                whiteLabel,
                customCompanyName: companyName || undefined,
            });
            setSharedReport(report);
        } catch (err) {
            alert('Failed to create share link');
        } finally {
            setLoading(false);
        }
    };

    const shareUrl = sharedReport ? `${window.location.origin}/report/${sharedReport.share_token}` : '';

    return (
        <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#111] border border-[#222] rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-[#222] flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Share Report</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {!sharedReport ? (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Report Title</label>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-[#080808] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password Protection (Optional)</label>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#080808] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="Leave empty for public access"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    id="whiteLabel"
                                    checked={whiteLabel}
                                    onChange={(e) => setWhiteLabel(e.target.checked)}
                                    className="w-4 h-4 bg-[#080808] border-[#333] rounded"
                                />
                                <label htmlFor="whiteLabel" className="text-sm text-gray-300 select-none">White-label report (Remove Headlight branding)</label>
                            </div>

                            {whiteLabel && (
                                <div className="animate-in slide-in-from-top-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Company Name</label>
                                    <input 
                                        type="text" 
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="w-full bg-[#080808] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="Your Agency Name"
                                    />
                                </div>
                            )}

                            <button 
                                onClick={handleShare}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                        Create Share Link
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <div className="animate-in fade-in zoom-in-95">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6 flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-sm text-green-500 font-medium">Link generated successfully!</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Share URL</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        readOnly
                                        value={shareUrl}
                                        className="flex-1 bg-[#080808] border border-[#333] rounded-lg px-4 py-2 text-white text-sm focus:outline-none"
                                    />
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(shareUrl);
                                            alert('Copied to clipboard!');
                                        }}
                                        className="p-2 bg-[#222] hover:bg-[#333] rounded-lg text-white transition-colors"
                                        title="Copy Link"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-center">
                                <button 
                                    onClick={() => window.open(shareUrl, '_blank')}
                                    className="text-blue-500 hover:text-blue-400 text-sm font-medium flex items-center gap-1.5"
                                >
                                    Preview Report
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
