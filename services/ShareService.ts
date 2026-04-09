import { turso } from './turso';
import { v4 as uuidv4 } from 'uuid';

export interface SharedReport {
  id: string;
  project_id: string;
  session_id: string;
  share_token: string;
  title: string;
  created_by: string;
  expires_at: string | null;
  is_active: boolean;
  white_label: boolean;
  custom_logo_url: string | null;
  custom_company_name: string | null;
  include_sections: string[];
  password_hash: string | null;
  view_count: number;
  created_at: string;
}

export function generateShareToken(): string {
  // Simple random token
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function createSharedReport(
  projectId: string,
  sessionId: string,
  options: {
    title: string;
    createdBy: string;
    expiresInDays?: number;
    password?: string;
    whiteLabel?: boolean;
    customLogo?: string;
    customCompanyName?: string;
    sections?: string[];
  }
): Promise<SharedReport> {
  const client = turso();
  const id = uuidv4();
  const shareToken = generateShareToken();
  const expiresAt = options.expiresInDays 
    ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;
    
  const report: SharedReport = {
    id,
    project_id: projectId,
    session_id: sessionId,
    share_token: shareToken,
    title: options.title,
    created_by: options.createdBy,
    expires_at: expiresAt,
    is_active: true,
    white_label: options.whiteLabel || false,
    custom_logo_url: options.customLogo || null,
    custom_company_name: options.customCompanyName || null,
    include_sections: options.sections || ['summary', 'issues', 'performance', 'content', 'recommendations'],
    password_hash: options.password || null, // In a real app, hash this
    view_count: 0,
    created_at: new Date().toISOString()
  };
  
  await client.execute({
    sql: `INSERT INTO shared_reports (
            id, project_id, session_id, share_token, title, created_by, 
            expires_at, is_active, white_label, custom_logo_url, 
            custom_company_name, include_sections_json, password_hash
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      report.id, report.project_id, report.session_id, report.share_token, report.title, report.created_by,
      report.expires_at, report.is_active ? 1 : 0, report.white_label ? 1 : 0, report.custom_logo_url,
      report.custom_company_name, JSON.stringify(report.include_sections), report.password_hash
    ]
  });
  
  return report;
}

export async function getSharedReport(shareToken: string): Promise<SharedReport | null> {
  const client = turso();
  const result = await client.execute({
    sql: `SELECT * FROM shared_reports WHERE share_token = ?`,
    args: [shareToken]
  });
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    session_id: String(row.session_id),
    share_token: String(row.share_token),
    title: String(row.title),
    created_by: String(row.created_by),
    expires_at: row.expires_at ? String(row.expires_at) : null,
    is_active: Boolean(row.is_active),
    white_label: Boolean(row.white_label),
    custom_logo_url: row.custom_logo_url ? String(row.custom_logo_url) : null,
    custom_company_name: row.custom_company_name ? String(row.custom_company_name) : null,
    include_sections: JSON.parse(String(row.include_sections_json || '[]')),
    password_hash: row.password_hash ? String(row.password_hash) : null,
    view_count: Number(row.view_count),
    created_at: String(row.created_at)
  };
}

export async function revokeSharedReport(reportId: string): Promise<void> {
  const client = turso();
  await client.execute({
    sql: `UPDATE shared_reports SET is_active = 0 WHERE id = ?`,
    args: [reportId]
  });
}
