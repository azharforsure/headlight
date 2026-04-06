import React, { useState } from 'react';
import { useProject } from '../../services/ProjectContext';
import { useAuth } from '../../services/AuthContext';
import { Globe, Search, Tag, CheckCircle2, ChevronRight, PlayCircle, Loader2 } from 'lucide-react';
import { IndustryType } from '../../services/app-types';
import { upsertProjectCrawlerIntegration } from '../../services/CrawlerIntegrationsService';
import { storeCrawlerIntegrationSecret } from '../../services/CrawlerSecretVault';
import { addKeywords } from '../../services/DashboardDataService';
import { exchangeGoogleCode, fetchGoogleEmail, openGoogleOAuthPopup } from '../../services/GoogleOAuthHelper';

type Step = 1 | 2 | 3;

export const OnboardingWizard = ({ onComplete }: { onComplete?: () => void }) => {
    const { addProject, refreshProjects } = useProject();
    const { user } = useAuth();
    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Project Details
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [industry, setIndustry] = useState<IndustryType>('ecommerce');
    const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Step 2: Keywords
    const [keywords, setKeywords] = useState<string[]>(['', '', '']);

    // Step 3: Google Search Console
    const [gscUrl, setGscUrl] = useState('');
    const [gscConnected, setGscConnected] = useState(false);

    const handleCreateProject = async () => {
        if (!name.trim() || !url.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const newProject = await addProject(name, url, industry);
            if (newProject) {
                setCreatedProjectId(newProject.id);
                setStep(2);
            } else {
                setError('Failed to create project. Please try again.');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveKeywords = async () => {
        if (!createdProjectId) return;
        setLoading(true);
        const validKeywords = keywords.filter(k => k.trim() !== '');
        if (validKeywords.length > 0) {
            await addKeywords(createdProjectId, validKeywords.map((kw) => kw.trim()));
        }
        setStep(3);
        setLoading(false);
    };

    const handleConnectGSC = async () => {
        if (!gscUrl.trim()) {
            alert('Please enter your GSC Property URL first.');
            return;
        }
        if (!createdProjectId) return;

        try {
            const result = await openGoogleOAuthPopup();
            if (!result) return;

            const tokens = await exchangeGoogleCode(result.code, result.redirectUri);
            if (!tokens?.access_token) return;

            const email = tokens.email || await fetchGoogleEmail(tokens.access_token);
            storeCrawlerIntegrationSecret(createdProjectId, 'google', {
                accessToken: tokens.access_token,
                access_token: tokens.access_token,
                refreshToken: tokens.refresh_token || '',
                refresh_token: tokens.refresh_token || ''
            });

            await upsertProjectCrawlerIntegration(createdProjectId, {
                provider: 'google',
                label: 'Google Search & Analytics',
                status: 'connected',
                authType: 'oauth',
                ownership: 'project',
                connectedAt: Date.now(),
                accountLabel: email || 'Connected Account',
                scopes: ['webmasters.readonly', 'analytics.readonly', 'userinfo.email'],
                credentials: {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token || ''
                },
                selection: {
                    siteUrl: gscUrl
                },
                metadata: {
                    siteUrl: gscUrl,
                    email: email || ''
                },
                sync: {
                    status: 'idle',
                    lastAttemptedAt: Date.now()
                }
            });
            setGscConnected(true);
            setTimeout(() => finishOnboarding(), 1500);
        } catch (error) {
            console.error('Failed to save onboarding integration', error);
        }
    };

    const finishOnboarding = async () => {
        await refreshProjects();
        if (onComplete) onComplete();
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-10 max-w-xl w-full relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                    <div className="h-full bg-brand-red transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
                </div>

                <div className="text-center mb-10 mt-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                        {step === 1 && <Globe className="text-brand-red" size={24} />}
                        {step === 2 && <Search className="text-brand-red" size={24} />}
                        {step === 3 && <PlayCircle className="text-brand-red" size={24} />}
                    </div>
                    <h2 className="text-2xl font-bold font-heading text-white">
                        {step === 1 && "Create Your Project"}
                        {step === 2 && "Add Target Keywords"}
                        {step === 3 && "Connect Search Console"}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">
                        {step === 1 && "Let's set up your first website to track and optimize."}
                        {step === 2 && "What searches do you want to rank for on Google?"}
                        {step === 3 && "Optional: Connect Google to sync real clicks and impressions."}
                    </p>
                </div>

                {step === 1 && (
                    <div className="space-y-5">
                        <div>
                            <label className="text-xs font-bold text-gray-400 block mb-2">Project Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Acme Corp"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-[#151515] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-red/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 block mb-2">Website URL</label>
                            <input
                                type="text"
                                placeholder="https://example.com"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                className="w-full bg-[#151515] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-red/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 block mb-2">Industry</label>
                            <select
                                value={industry}
                                onChange={e => setIndustry(e.target.value as any)}
                                className="w-full bg-[#151515] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-red/50 transition-colors appearance-none"
                            >
                                <option value="ecommerce">E-Commerce</option>
                                <option value="local">Local Service / Home Service</option>
                                <option value="saas">B2B Software (SaaS)</option>
                                <option value="elearning">E-Learning / Publisher</option>
                            </select>
                        </div>
                        {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
                        <button
                            onClick={handleCreateProject}
                            disabled={!name.trim() || !url.trim() || loading}
                            className="w-full bg-brand-red text-white font-bold py-3 rounded-xl hover:bg-brand-redHover transition-colors mt-4 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : "Next Step"}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        {keywords.map((kw, idx) => (
                            <div key={idx} className="relative">
                                <Tag size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder={`Keyword ${idx + 1}`}
                                    value={kw}
                                    onChange={e => {
                                        const newKw = [...keywords];
                                        newKw[idx] = e.target.value;
                                        setKeywords(newKw);
                                    }}
                                    className="w-full bg-[#151515] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-brand-red/50 transition-colors"
                                />
                            </div>
                        ))}
                        <button
                            onClick={() => setKeywords([...keywords, ''])}
                            className="text-xs font-bold text-gray-500 hover:text-white transition-colors"
                        >
                            + Add another keyword
                        </button>

                        <div className="pt-4 flex items-center justify-between">
                            <button onClick={() => setStep(3)} className="text-xs text-gray-500 hover:text-white">Skip for now</button>
                            <button
                                onClick={handleSaveKeywords}
                                disabled={loading}
                                className="bg-white text-black font-bold py-2.5 px-6 rounded-xl hover:bg-gray-200 transition-colors flex justify-center items-center gap-2"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : "Save Keywords"}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <div className="bg-[#151515] p-5 rounded-xl border border-white/5">
                            <label className="text-xs font-bold text-gray-400 block mb-2">GSC Property URL (Exact Match)</label>
                            <input
                                type="text"
                                placeholder="e.g. sc-domain:example.com or https://example.com/"
                                value={gscUrl}
                                onChange={e => setGscUrl(e.target.value)}
                                className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red font-mono mb-4"
                            />

                            {gscConnected ? (
                                <div className="w-full bg-brand-green/10 text-brand-green border border-brand-green/20 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                                    <CheckCircle2 size={16} /> Connected Successfully
                                </div>
                            ) : (
                                <button
                                    onClick={handleConnectGSC}
                                    disabled={!gscUrl.trim() || loading}
                                    className="w-full bg-white text-black font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    Login with Google
                                </button>
                            )}
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                            <button onClick={finishOnboarding} className="text-xs text-gray-500 hover:text-white">Skip for now</button>
                            <button
                                onClick={finishOnboarding}
                                className="bg-brand-red text-white font-bold py-2.5 px-6 rounded-xl hover:bg-brand-redHover transition-colors flex justify-center items-center gap-2"
                            >
                                Finish Setup <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
