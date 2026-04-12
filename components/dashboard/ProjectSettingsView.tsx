import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plug, Trash2, CheckCircle2, CreditCard, ExternalLink } from 'lucide-react';
import { useProject } from '../../services/ProjectContext';
import { useAuth } from '../../services/AuthContext';
import { fetchProjectCrawlerIntegrations, upsertProjectCrawlerIntegration } from '../../services/CrawlerIntegrationsService';
import { openBillingPortal } from '../../services/BillingService';
import { exchangeGoogleCode, openGoogleOAuthPopup } from '../../services/GoogleOAuthHelper';

const GoogleIntegrationCard = ({ project }: { project: any }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'connected'>('idle');
    const [siteUrl, setSiteUrl] = useState(project?.url || '');

    useEffect(() => {
        const loadStatus = async () => {
            if (!project?.id) {
                setStatus('idle');
                return;
            }
            const result = await fetchProjectCrawlerIntegrations(project.id);
            setStatus(result.connections.google ? 'connected' : 'idle');
        };
        loadStatus();
    }, [project]);

    const handleConnect = async () => {
        if (!siteUrl.trim()) {
            alert('Please enter your exact GSC Property URL (e.g., sc-domain:example.com or https://example.com/)');
            return;
        }
        setStatus('loading');
        if (!project?.id) {
            setStatus('idle');
            return;
        }

        try {
            const result = await openGoogleOAuthPopup();
            if (!result) {
                setStatus('idle');
                return;
            }

            // New metadata-only exchange: returns { email, expiryDate }
            const meta = await exchangeGoogleCode(result.code, result.redirectUri);
            if (!meta || !meta.email) {
                setStatus('idle');
                alert('Failed to verify Google account metadata.');
                return;
            }

            // CRITICAL: We no longer store tokens in the client-side vault or credentials object.
            // Server handles it via Turso.

            await upsertProjectCrawlerIntegration(project.id, {
                provider: 'google',
                label: 'Google Search & Analytics',
                status: 'connected',
                authType: 'oauth',
                ownership: 'project',
                connectedAt: Date.now(),
                accountLabel: meta.email,
                scopes: ['webmasters.readonly', 'analytics.readonly', 'userinfo.email'],
                credentials: {}, // Empty - tokens are on server
                selection: {
                    siteUrl
                },
                metadata: {
                    siteUrl,
                    email: meta.email
                },
                sync: {
                    status: 'idle',
                    lastAttemptedAt: Date.now(),
                    expiryDate: meta.expiryDate
                }
            });
            setStatus('connected');
        } catch (error) {
            console.error("Failed to save connection status", error);
            setStatus('idle');
        }
    };

    return (
        <div className="bg-[#151515] rounded-xl border border-white/5 p-4 flex flex-col gap-4 group hover:border-white/20 transition-all">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-gray-400">
                        <Plug size={18} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm">Google Search Console</h4>
                        <p className="text-[10px] text-gray-500">{status === 'connected' ? 'Connected via OAuth' : 'Not Connected'}</p>
                    </div>
                </div>
                {status === 'loading' ? (
                    <span className="text-[10px] text-gray-400">Connecting...</span>
                ) : status === 'connected' ? (
                    <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                        <CheckCircle2 size={12} />
                        <span className="text-[10px] font-bold uppercase">Connected</span>
                    </div>
                ) : (
                    <button onClick={handleConnect} disabled={!siteUrl.trim()} className="px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors text-brand-red border-brand-red/20 hover:bg-brand-red/10 disabled:opacity-50 disabled:cursor-not-allowed">
                        Connect
                    </button>
                )}
            </div>
            {status !== 'connected' && status !== 'loading' && (
                <div className="bg-[#0A0A0A] p-3 rounded-lg border border-white/5">
                    <label className="text-[10px] text-gray-400 block mb-1">GSC Property URL (Exact Match)</label>
                    <input
                        type="text"
                        placeholder="e.g. sc-domain:example.com or https://example.com/"
                        value={siteUrl}
                        onChange={(e) => setSiteUrl(e.target.value)}
                        className="w-full bg-transparent border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
                    />
                </div>
            )}
        </div>
    );
};

const BillingSection = () => {
    const { profile, user, getToken } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const openPortal = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                throw new Error('Your session is missing a valid Clerk token. Please sign in again.');
            }
            const result = await openBillingPortal({
                stripeCustomerId: profile?.stripe_customer_id,
                user,
                token
            });
            window.location.href = result.url;
        } catch (err: any) {
            alert(err?.message || 'Could not open billing portal. Make sure Stripe is configured.');
        }
        setIsLoading(false);
    };

    const status = profile?.subscription_status || 'free';
    const statusColor = status === 'active' ? 'text-green-500 bg-green-500/10 border-green-500/20' :
        status === 'trialing' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
            'text-gray-400 bg-white/5 border-white/10';

    return (
        <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <CreditCard size={18} className="text-brand-red" /> Billing & Subscription
            </h3>
            <div className="flex items-center justify-between p-4 bg-[#151515] rounded-xl border border-white/5">
                <div>
                    <span className="text-sm font-bold text-white block mb-1">Current Plan</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${statusColor}`}>
                        {status === 'active' ? 'Active' : status === 'trialing' ? 'Trial' : 'Free'}
                    </span>
                </div>
                {profile?.stripe_customer_id ? (
                    <button
                        onClick={openPortal}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        <ExternalLink size={12} />
                        {isLoading ? 'Opening...' : 'Manage Billing'}
                    </button>
                ) : (
                    <a
                        href="/pricing"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-red rounded-lg hover:bg-brand-redHover transition-colors"
                    >
                        Upgrade Plan
                    </a>
                )}
            </div>
        </div>
    );
};

export const ProjectSettingsView = () => {
    const { activeProject, updateProject, deleteProject } = useProject();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (activeProject) {
            setName(activeProject.name);
            setUrl(activeProject.url);
        }
    }, [activeProject]);

    if (!activeProject) {
        return <div className="p-10 text-center text-gray-500">Please select or add a project first.</div>;
    }

    const handleSave = async () => {
        setIsSaving(true);
        await updateProject(activeProject.id, { name, url });
        setIsSaving(false);
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this project? This cannot be undone.")) {
            setIsDeleting(true);
            try {
                await deleteProject(activeProject.id);
                navigate('/dashboard');
            } catch (err: any) {
                alert(err?.message || "Failed to delete project. Please check your connection and try again.");
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-2xl font-bold font-heading text-white mb-2">Project Settings</h2>
                    <p className="text-gray-400 text-sm">Configuration for <span className="text-white font-bold">{activeProject.name}</span></p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => { setName(activeProject.name); setUrl(activeProject.url); }}
                        className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white border border-white/10 rounded-lg transition-colors"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 text-xs font-bold text-black bg-white rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">

                    {/* General Config */}
                    <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-6">
                        <h3 className="text-lg font-bold text-white mb-6">General Configuration</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Project Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-brand-red/50 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Domain URL</label>
                                <input
                                    type="text"
                                    value={url}
                                    onChange={e => setUrl(e.target.value)}
                                    className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-brand-red/50 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Sitemap URL</label>
                                <input type="text" defaultValue={`${url}/sitemap.xml`} className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-brand-red/50 focus:outline-none" disabled />
                            </div>
                        </div>
                    </div>

                    {/* Integrations (Moved from Main Nav) */}
                    <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-6">
                        <h3 className="text-lg font-bold text-white mb-6">Integrations & Connections</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <GoogleIntegrationCard project={activeProject} />
                            {['Google Analytics 4', 'WordPress', 'Slack'].map((tool, i) => (
                                <div key={i} className="bg-[#151515] rounded-xl border border-white/5 p-4 flex items-center justify-between group hover:border-white/20 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-gray-400">
                                            <Plug size={18} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm">{tool}</h4>
                                            <p className="text-[10px] text-gray-500">Not Connected</p>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors text-gray-400 border-white/10 hover:text-white">
                                        Connect
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Billing Management */}
                    <BillingSection />

                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Crawler Settings</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                <span className="text-sm text-gray-300">Crawl Frequency</span>
                                <span className="text-xs font-bold text-white bg-black px-2 py-1 rounded border border-white/10">Weekly</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                <span className="text-sm text-gray-300">User Agent</span>
                                <span className="text-xs font-bold text-white bg-black px-2 py-1 rounded border border-white/10">Googlebot</span>
                            </div>
                            <div className="flex items-center gap-3 mt-4">
                                <input type="checkbox" checked readOnly className="rounded bg-black border-white/10 text-brand-red focus:ring-0" />
                                <span className="text-xs text-gray-400">Respect robots.txt</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" checked readOnly className="rounded bg-black border-white/10 text-brand-red focus:ring-0" />
                                <span className="text-xs text-gray-400">Crawl subdomains</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-900/10 rounded-2xl border border-red-500/20 p-6">
                        <h3 className="text-sm font-bold text-red-500 mb-2 uppercase tracking-wide flex items-center gap-2"><Trash2 size={14} /> Danger Zone</h3>
                        <p className="text-xs text-gray-400 mb-4">Deleting a project cannot be undone. All ranking history will be lost.</p>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold rounded-lg border border-red-500/20 transition-colors disabled:opacity-50"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Project'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
