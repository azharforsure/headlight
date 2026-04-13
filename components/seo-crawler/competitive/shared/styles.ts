// Card styles
export const CARD = 'rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-4';
export const CARD_NESTED = 'rounded-lg border border-[#191919] bg-[#0a0a0c] p-3';
export const CARD_HIGHLIGHT = 'rounded-xl border border-[#F5364E]/20 bg-[#F5364E]/5 p-4';

// Section headers
export const SECTION_HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-[#555]';
export const SECTION_HEADER_WITH_MARGIN = `${SECTION_HEADER} mb-3`;

// Data values
export const VALUE_BIG = 'font-mono text-[18px] font-black text-white';
export const VALUE_MEDIUM = 'font-mono text-[13px] font-bold text-white';
export const VALUE_SMALL = 'font-mono text-[11px] text-[#ccc]';
export const VALUE_LABEL = 'text-[10px] uppercase text-[#555]';
export const VALUE_LABEL_INLINE = 'text-[11px] text-[#666]';

// Deltas
export const DELTA_POSITIVE = 'text-green-400';
export const DELTA_NEGATIVE = 'text-red-400';
export const DELTA_NEUTRAL = 'text-[#555]';

// Sub-tab buttons
export const SUBTAB_ACTIVE = 'bg-[#F5364E]/10 text-[#F5364E]';
export const SUBTAB_INACTIVE = 'text-[#555] hover:bg-[#111] hover:text-[#aaa]';
export const SUBTAB_BASE = 'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all';

// "YOU" badge
export const YOU_BADGE = 'rounded px-1 py-0.5 text-[8px] font-black uppercase bg-[#F5364E]/15 text-[#F5364E]';

// Threat colors
export const THREAT_CRITICAL = 'bg-red-500/10 text-red-400';
export const THREAT_HIGH = 'bg-orange-500/10 text-orange-400';
export const THREAT_MODERATE = 'bg-yellow-500/10 text-yellow-400';
export const THREAT_LOW = 'bg-green-500/10 text-green-400';

export function threatStyle(level: string | null): string {
  switch (level) {
    case 'Critical':
      return THREAT_CRITICAL;
    case 'High':
      return THREAT_HIGH;
    case 'Moderate':
      return THREAT_MODERATE;
    default:
      return THREAT_LOW;
  }
}

export function heatmapCell(score: number): string {
  if (score >= 70) return 'bg-red-500/20 text-red-400';
  if (score >= 50) return 'bg-orange-500/15 text-orange-400';
  if (score >= 30) return 'bg-yellow-500/10 text-yellow-400';
  return 'bg-green-500/10 text-green-400';
}

// Brand color
export const BRAND_RED = '#F5364E';
export const COMP_COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ec4899'];
export function getCompColor(index: number): string {
  return COMP_COLORS[index % COMP_COLORS.length];
}

// Chart legend colors (you first, then competitors)
export function getAllColors(competitorCount: number): string[] {
  return [BRAND_RED, ...COMP_COLORS.slice(0, competitorCount)];
}

// Empty state dashed box
export const EMPTY_STATE_BOX = 'rounded-xl border border-dashed border-[#222] bg-[#0a0a0c] py-10 text-center';
export const EMPTY_STATE_TEXT = 'text-[12px] text-[#555]';
export const EMPTY_STATE_SUBTEXT = 'mt-1 text-[10px] text-[#444]';

// Scrollable container
export const SIDEBAR_SCROLL = 'custom-scrollbar h-full space-y-4 overflow-y-auto p-4';
export const VIEW_SCROLL = 'custom-scrollbar flex-1 overflow-y-auto p-4 space-y-4';
