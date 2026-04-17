import React, { useMemo, useEffect } from 'react';
import { LayoutGrid, Save, Bookmark, ChevronDown } from 'lucide-react';
import MainDataView from '../../MainDataView';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import { WQA_COLUMN_PRESETS, getWqaColumnPreset } from '../../../../services/WqaGridColumns';
import { formatIndustryLabel } from '../wqaUtils';
import ViewHeader from './shared/ViewHeader';

export default function WqaGridView() {
    const ctx = useSeoCrawler() as any;
    const {
        wqaState,
        visibleColumns,
        setVisibleColumns,
        filteredPages,
        saveWqaView,
        savedWqaViews,
        activeWqaViewId,
        applyWqaView,
    } = ctx;

    const currentPresetId = useMemo(() => {
        for (const p of WQA_COLUMN_PRESETS) {
            if (p.columns.length === visibleColumns.length &&
                p.columns.every((c, i) => c === visibleColumns[i])) {
                return p.id;
            }
        }
        return 'custom';
    }, [visibleColumns]);

    const applyPreset = (id: string) => {
        const preset = getWqaColumnPreset(id);
        setVisibleColumns(preset.columns);
    };

    const onSaveCurrent = () => {
        const name = window.prompt('Name this view');
        if (name && name.trim()) saveWqaView?.(name.trim());
    };

    useEffect(() => {
        // Force WQA preset on mount if not already set
        if (visibleColumns?.length < 5 || !visibleColumns.includes('pageValueTier')) {
            applyPreset('default');
        }
    }, []);

    return (
        <div className="flex-1 flex flex-col bg-[#070707] overflow-hidden">
            <MainDataView />
        </div>
    );
}
