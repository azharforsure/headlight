import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyViewState({
    title, subtitle, icon, cta,
}: { title: string; subtitle?: string; icon?: React.ReactNode; cta?: React.ReactNode }) {
    return (
        <div className="flex-1 flex items-center justify-center bg-[#070707] min-h-[240px]">
            <div className="max-w-md text-center px-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#111] border border-[#222] mb-3">
                    {icon || <Inbox size={16} className="text-[#666]" />}
                </div>
                <div className="text-[14px] text-white font-semibold mb-1">{title}</div>
                {subtitle && <div className="text-[12px] text-[#666] leading-relaxed">{subtitle}</div>}
                {cta && <div className="mt-4">{cta}</div>}
            </div>
        </div>
    );
}
