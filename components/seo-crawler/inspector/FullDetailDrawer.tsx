import React from 'react';
import { X } from 'lucide-react';
import GeneralTab from './GeneralTab';
import SeoTab from './SeoTab';
import ContentTab from './ContentTab';
import LinksTab from './LinksTab';
import SchemaTab from './SchemaTab';
import PerformanceTab from './PerformanceTab';
import ImagesTab from './ImagesTab';
import SocialTab from './SocialTab';
import GscTab from './GscTab';
import Ga4Tab from './Ga4Tab';
import AiTab from './AiTab';

const TABS: Array<{ id: string; label: string; Component: React.FC<{ page: any }> }> = [
    { id: 'general', label: 'General', Component: GeneralTab },
    { id: 'seo', label: 'SEO', Component: SeoTab },
    { id: 'content', label: 'Content', Component: ContentTab },
    { id: 'links', label: 'Links', Component: LinksTab },
    { id: 'schema', label: 'Schema', Component: SchemaTab },
    { id: 'performance', label: 'Performance', Component: PerformanceTab },
    { id: 'images', label: 'Images', Component: ImagesTab },
    { id: 'social', label: 'Social', Component: SocialTab },
    { id: 'gsc', label: 'GSC', Component: GscTab },
    { id: 'ga4', label: 'GA4', Component: Ga4Tab },
    { id: 'ai', label: 'AI', Component: AiTab }
];

export default function FullDetailDrawer({
    page,
    open,
    onClose
}: {
    page: any | null;
    open: boolean;
    onClose: () => void;
}) {
    if (!open || !page) return null;

    return (
        <div className="fixed inset-0 z-[80] flex justify-end">
            <div className="absolute inset-0 bg-black/55" onClick={onClose} />
            <aside className="relative h-full w-full max-w-[560px] bg-[#0d0d0d] border-l border-[#2a2a2a] shadow-2xl flex flex-col">
                <div className="h-[52px] border-b border-[#222] px-4 flex items-center justify-between shrink-0 bg-[#111]">
                    <div className="min-w-0">
                        <div className="text-[11px] text-[#F5364E] uppercase tracking-widest font-bold">Full Page Inspector</div>
                        <div className="text-[11px] text-blue-400 font-mono truncate">{page.url}</div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#888] hover:text-white p-1.5 rounded hover:bg-[#222] transition-colors"
                        title="Close drawer"
                    >
                        <X size={15} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-8">
                    {TABS.map(({ id, label, Component }) => (
                        <section key={id} id={`drawer-${id}`} className="border border-[#222] rounded-lg bg-[#111] overflow-hidden">
                            <div className="px-3 py-2 border-b border-[#222] text-[11px] font-black uppercase tracking-widest text-[#bbb] bg-[#141414]">
                                {label}
                            </div>
                            <div className="p-3">
                                <Component page={page} />
                            </div>
                        </section>
                    ))}
                </div>
            </aside>
        </div>
    );
}
