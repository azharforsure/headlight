import { turso, isCloudSyncEnabled } from './turso';
import { CrawlerConfig } from './CrawlerConfigTypes';

export async function saveProjectConfig(projectId: string, config: CrawlerConfig): Promise<void> {
  if (!isCloudSyncEnabled) return;
  
  try {
    const client = turso();
    await client.execute({
      sql: `INSERT OR REPLACE INTO crawler_configs (id, config_json, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
      args: [projectId, JSON.stringify(config)]
    });
  } catch (error) {
    console.error('[CrawlerConfigService] Failed to save config:', error);
  }
}

export async function loadProjectConfig(projectId: string): Promise<CrawlerConfig | null> {
  if (!isCloudSyncEnabled) return null;

  try {
    const client = turso();
    const result = await client.execute({
      sql: `SELECT config_json FROM crawler_configs WHERE id = ?`,
      args: [projectId]
    });

    if (result.rows.length === 0) return null;
    
    const configJson = String(result.rows[0].config_json);
    return JSON.parse(configJson) as CrawlerConfig;
  } catch (error) {
    console.error('[CrawlerConfigService] Failed to load config:', error);
    return null;
  }
}

export function exportConfig(config: CrawlerConfig): void {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `headlight-config-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importConfig(file: File): Promise<CrawlerConfig | null> {
  try {
    const text = await file.text();
    return JSON.parse(text) as CrawlerConfig;
  } catch (error) {
    console.error('[CrawlerConfigService] Failed to import config:', error);
    return null;
  }
}
