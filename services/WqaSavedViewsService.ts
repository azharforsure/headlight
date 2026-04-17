import type { WqaFilterState } from './WqaFilterEngine';
import { isCloudSyncEnabled, turso } from './turso';

export interface WqaSavedView {
	id: string;
	name: string;
	filter: WqaFilterState;
	visibleColumns?: string[];
	createdAt: number;
}

const STORAGE_KEY = 'headlight:wqa-saved-views';

const canUseLocalStorage = () =>
	typeof window !== 'undefined' && Boolean(window.localStorage);

export function getLocalWqaViews(): WqaSavedView[] {
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

export function saveLocalWqaView(view: WqaSavedView): WqaSavedView[] {
	const views = getLocalWqaViews();
	const index = views.findIndex((v) => v.id === view.id);
	if (index >= 0) views[index] = view;
	else views.push(view);
	if (canUseLocalStorage()) {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
	}
	return views;
}

export function deleteLocalWqaView(id: string): WqaSavedView[] {
	const next = getLocalWqaViews().filter((v) => v.id !== id);
	if (canUseLocalStorage()) {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	}
	return next;
}

export async function syncWqaViewsToCloud(
	projectId: string,
	views: WqaSavedView[],
): Promise<void> {
	if (!isCloudSyncEnabled || !projectId) return;
	await turso().execute({
		sql: `INSERT OR REPLACE INTO crawl_wqa_views (project_id, views_json, updated_at)
		      VALUES (?, ?, CURRENT_TIMESTAMP)`,
		args: [projectId, JSON.stringify(views)],
	});
}

export async function fetchWqaViewsFromCloud(
	projectId: string,
): Promise<WqaSavedView[]> {
	if (!isCloudSyncEnabled || !projectId) return [];
	try {
		const result = await turso().execute({
			sql: 'SELECT views_json FROM crawl_wqa_views WHERE project_id = ?',
			args: [projectId],
		});
		if (!result.rows.length) return [];
		const raw = String(result.rows[0].views_json || '[]');
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
