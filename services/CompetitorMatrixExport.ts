/**
 * services/CompetitorMatrixExport.ts
 *
 * CSV export utility for the Competitor Matrix.
 */

import { COMPARISON_ROWS, CompetitorProfile, getProfileValue } from './CompetitorMatrixConfig';

export function exportMatrixCSV(
  ownProfile: CompetitorProfile | null,
  competitorProfiles: CompetitorProfile[]
): string {
  // 1. Build Header Row
  const headers = ['Category', 'Metric', 'Our Site'];
  competitorProfiles.forEach(comp => {
    headers.push(comp.domain);
  });
  
  const rows = [headers.join(',')];

  // 2. Add Data Rows
  COMPARISON_ROWS.forEach(row => {
    const dataRow = [
      `"${row.category}"`,
      `"${row.label}"`
    ];

    // Our Site Value
    dataRow.push(formatCellValueCSV(ownProfile, row));

    // Competitor Values
    competitorProfiles.forEach(comp => {
      dataRow.push(formatCellValueCSV(comp, row));
    });

    rows.push(dataRow.join(','));
  });

  return rows.join('\n');
}

function formatCellValueCSV(profile: CompetitorProfile | null, row: any): string {
  if (!profile) return '""';
  
  const val = getProfileValue(profile, row.profileKey);
  if (val === null || val === undefined) return '""';

  switch (row.format) {
    case 'boolean':
    case 'manual_boolean':
      return val ? '"Yes"' : '"No"';
    case 'list':
      return Array.isArray(val) ? `"${val.join('; ')}"` : `"${String(val)}"`;
    case 'currency':
    case 'number':
    case 'score_100':
      return `"${String(val)}"`;
    case 'url':
    case 'text':
    case 'manual_text':
    default:
      return `"${String(val).replace(/"/g, '""')}"`;
  }
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
