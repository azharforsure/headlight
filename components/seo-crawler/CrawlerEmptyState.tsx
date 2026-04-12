import React, { useState } from 'react';
import { 
    ArrowRight,
    Building2,
    Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { useProject } from '../../services/ProjectContext';
import { INDUSTRY_FILTERS } from '../../services/AuditModeConfig';

const extractDomain = (url: string) => {
    try {
        const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
        return hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
};

export default function CrawlerEmptyState() {
    const navigate = useNavigate();
    const { urlInput, setUrlInput } = useSeoCrawler();
    const { addProject } = useProject();

    const [projectName, setProjectName] = useState('');
    const [url, setUrl] = useState(urlInput || '');
    const [mode, setMode] = useState<'spider' | 'list'>('spider');
    const [industry, setIndustry] = useState('all');
    const [loading, setLoading] = useState(false);

    const handleUrlChange = (value: string) => {
        const domain = extractDomain(value);
        setUrl(value);
        if (!projectName || projectName === extractDomain(url)) {
            setProjectName(domain);
        }
    };

    const onCreate = async () => {
        if (!url.trim()) return;
        setLoading(true);

        try {
            const newProject = await addProject(projectName || extractDomain(url), url, industry as any);
            if (newProject) {
                // Navigate to the project-specific crawler route with setup param
                navigate(`/project/${newProject.id}/crawler?setup=true`);
            }
        } catch (error) {
            console.error('Failed to create project:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-[#111] border border-[#2c2c2f] rounded-xl shadow-2xl overflow-hidden transition-all duration-500 ease-in-out">
                <div className="p-8 space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-white tracking-tight">Project</h2>
                        <p className="text-xs text-[#666]">Enter the target to begin.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#555]">Name</label>
                            <input 
                                value={projectName}
                                onChange={e => setProjectName(e.target.value)}
                                placeholder="Auto-generated if left blank"
                                className="w-full h-10 px-4 bg-[#0a0a0a] border border-[#222] rounded-lg text-sm text-white focus:outline-none focus:border-[#F5364E] transition-colors"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#555]">Mode</label>
                            <div className="grid grid-cols-2 gap-2 bg-[#0a0a0a] p-1 rounded-lg border border-[#222]">
                                <button 
                                    onClick={() => setMode('spider')}
                                    className={`py-1.5 text-xs font-bold rounded transition-all ${mode === 'spider' ? 'bg-[#1a1a1a] text-white shadow-lg' : 'text-[#444] hover:text-[#666]'}`}
                                >
                                    Whole Website
                                </button>
                                <button 
                                    onClick={() => setMode('list')}
                                    className={`py-1.5 text-xs font-bold rounded transition-all ${mode === 'list' ? 'bg-[#1a1a1a] text-white shadow-lg' : 'text-[#444] hover:text-[#666]'}`}
                                >
                                    URL List
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#555]">
                                {mode === 'spider' ? 'Domain / URL' : 'Target URL'}
                            </label>
                            <input 
                                value={url}
                                onChange={e => handleUrlChange(e.target.value)}
                                placeholder="https://example.com"
                                className="w-full h-10 px-4 bg-[#0a0a0a] border border-[#222] rounded-lg text-sm text-white focus:outline-none focus:border-[#F5364E] transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#555]">Industry</label>
                            <select 
                                value={industry}
                                onChange={e => setIndustry(e.target.value)}
                                className="w-full h-10 px-3 bg-[#0a0a0a] border border-[#222] rounded-lg text-sm text-white focus:outline-none appearance-none cursor-pointer"
                            >
                                {INDUSTRY_FILTERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button 
                            onClick={onCreate}
                            disabled={loading || !url.trim()}
                            className="w-full h-10 bg-white hover:bg-[#eee] disabled:opacity-30 disabled:cursor-not-allowed text-black text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            {loading ? 'Creating...' : 'Create Project'}
                            {!loading && <ArrowRight size={14} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
