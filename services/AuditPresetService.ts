import { isCloudSyncEnabled, turso } from './turso';
import type { AuditMode, IndustryFilter } from './CheckRegistry';

export interface CustomAuditPreset {
    id: string;
    name: string;
    modes: AuditMode[];
    industry: IndustryFilter;
    enabledCheckOverrides: string[];
    disabledCheckOverrides: string[];
    columnPreset: string[];
    createdAt: number;
}

const STORAGE_KEY = 'headlight:audit-presets';

const canUseLocalStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage);

export function getLocalPresets(): CustomAuditPreset[] {
    if (!canUseLocalStorage()) return [];

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveLocalPreset(preset: CustomAuditPreset): CustomAuditPreset[] {
    const presets = getLocalPresets();
    const index = presets.findIndex((item) => item.id === preset.id);

    if (index >= 0) {
        presets[index] = preset;
    } else {
        presets.push(preset);
    }

    if (canUseLocalStorage()) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    }

    return presets;
}

export function deleteLocalPreset(id: string): CustomAuditPreset[] {
    const next = getLocalPresets().filter((preset) => preset.id !== id);
    if (canUseLocalStorage()) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    return next;
}

export async function syncPresetsToCloud(projectId: string, presets: CustomAuditPreset[]): Promise<void> {
    if (!isCloudSyncEnabled || !projectId) return;

    await turso().execute({
        sql: `INSERT OR REPLACE INTO crawl_audit_presets (project_id, presets_json, updated_at)
              VALUES (?, ?, CURRENT_TIMESTAMP)`,
        args: [projectId, JSON.stringify(presets)]
    });
}

export async function fetchPresetsFromCloud(projectId: string): Promise<CustomAuditPreset[]> {
    if (!isCloudSyncEnabled || !projectId) return [];

    try {
        const result = await turso().execute({
            sql: 'SELECT presets_json FROM crawl_audit_presets WHERE project_id = ?',
            args: [projectId]
        });

        if (!result.rows.length) return [];
        const raw = String(result.rows[0].presets_json || '[]');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}
