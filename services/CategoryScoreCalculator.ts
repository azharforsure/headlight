import { type AuditMode, type IndustryFilter, CHECK_REGISTRY } from './CheckRegistry';
import { type AuditFilterState, getActiveCheckIds } from './CheckFilterEngine';
import { UNIFIED_ISSUE_TAXONOMY, type UnifiedIssue, type UnifiedIssueGroup } from './UnifiedIssueTaxonomy';

export interface DetectedIssueGroup {
  issueId: string;
  checkId: string;
  label: string;
  type: 'error' | 'warning' | 'notice';
  category: string;
  affectedUrls: string[];
  count: number;
}

export interface CategoryScore {
  category: string;
  score: number;        // 0-100
  grade: string;        // A-F
  criticalCount: number;
  warningCount: number;
  noticeCount: number;
  totalAffected: number;
  icon: string;
}

export interface IssueDashboardData {
  overallScore: number;
  overallGrade: string;
  categoryScores: CategoryScore[];
  issueGroups: DetectedIssueGroup[];
  totalCritical: number;
  totalWarning: number;
  totalNotice: number;
  totalPassed: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  crawlability: '🕷️',
  indexability: '📇',
  http: '🌐',
  performance: '⚡',
  security: '🔒',
  links: '🔗',
  content: '📝',
  meta: '🏷️',
  images: '🖼️',
  schema: '📊',
  accessibility: '♿',
  mobile: '📱',
  url_structure: '🔗',
  content_intelligence: '🧠',
  keyword_intelligence: '🔍',
  ai_discoverability: '🤖',
  business_signals: '💼',
  social_media: '📱',
  competitor: '🎯',
  ads_ppc: '📢',
  conversion_ux: '🎯',
  tech_debt: '🏗️',
  ecommerce: '🛒',
  local: '📍',
  news: '📰',
  saas: '💻',
  healthcare: '🏥',
};

/**
 * detectIssues
 * Runs UnifiedIssueTaxonomy conditions against local pages filtered by active audit modes.
 */
export function detectIssues(pages: any[], auditFilter: AuditFilterState): DetectedIssueGroup[] {
    const activeCheckIds = getActiveCheckIds(auditFilter);
    const groups: DetectedIssueGroup[] = [];

    for (const taxonomyGroup of UNIFIED_ISSUE_TAXONOMY) {
        for (const issue of taxonomyGroup.issues) {
            if (!activeCheckIds.has(issue.checkId)) continue;

            const affectedUrls = pages
                .filter(p => {
                    try {
                        return issue.condition(p);
                    } catch (e) {
                        return false;
                    }
                })
                .map(p => p.url);

            if (affectedUrls.length > 0) {
                groups.push({
                    issueId: issue.id,
                    checkId: issue.checkId,
                    label: issue.label,
                    type: issue.type,
                    category: issue.category,
                    affectedUrls,
                    count: affectedUrls.length
                });
            }
        }
    }
    return groups;
}

/**
 * calculateCategoryScores
 * Computes scores and grades per category based on issue severity counts.
 */
export function calculateCategoryScores(issueGroups: DetectedIssueGroup[], totalPages: number): CategoryScore[] {
    const byCategory: Record<string, DetectedIssueGroup[]> = {};
    issueGroups.forEach(ig => {
        if (!byCategory[ig.category]) byCategory[ig.category] = [];
        byCategory[ig.category].push(ig);
    });

    const scores: CategoryScore[] = Object.entries(byCategory).map(([category, groups]) => {
        const criticalCount = groups.filter(g => g.type === 'error').length;
        const warningCount = groups.filter(g => g.type === 'warning').length;
        const noticeCount = groups.filter(g => g.type === 'notice').length;
        
        // Sum unique affected URLs for the entire category
        const totalAffected = new Set(groups.flatMap(g => g.affectedUrls)).size;

        // Scoring logic: start at 100 and deduct for each issue severity
        // 0-100 clamp
        const score = Math.max(0, 100 - (criticalCount * 15 + warningCount * 5 + noticeCount * 1));
        
        let grade = 'F';
        if (score >= 90) grade = 'A';
        else if (score >= 75) grade = 'B';
        else if (score >= 60) grade = 'C';
        else if (score >= 40) grade = 'D';

        return {
            category,
            score,
            grade,
            criticalCount,
            warningCount,
            noticeCount,
            totalAffected,
            icon: CATEGORY_ICONS[category] || '🔍'
        };
    });

    // Return worst scores first
    return scores.sort((a, b) => a.score - b.score);
}

/**
 * buildDashboardData
 * Main orchestrator for client-side issue dashboard data generation.
 */
export function buildDashboardData(pages: any[], auditFilter: AuditFilterState): IssueDashboardData {
    if (!pages || pages.length === 0) {
        return {
            overallScore: 100,
            overallGrade: 'A',
            categoryScores: [],
            issueGroups: [],
            totalCritical: 0,
            totalWarning: 0,
            totalNotice: 0,
            totalPassed: 0
        };
    }

    const issueGroups = detectIssues(pages, auditFilter);
    const categoryScores = calculateCategoryScores(issueGroups, pages.length);

    const totalCritical = issueGroups.filter(ig => ig.type === 'error').length;
    const totalWarning = issueGroups.filter(ig => ig.type === 'warning').length;
    const totalNotice = issueGroups.filter(ig => ig.type === 'notice').length;

    const activeCheckIds = getActiveCheckIds(auditFilter);
    // Rough estimate of passed checks based on active registry subset
    const totalPassed = Math.max(0, activeCheckIds.size - issueGroups.length);

    const overallScore = categoryScores.length > 0 
        ? Math.round(categoryScores.reduce((sum, c) => sum + c.score, 0) / categoryScores.length)
        : 100;

    let overallGrade = 'F';
    if (overallScore >= 90) overallGrade = 'A';
    else if (overallScore >= 75) overallGrade = 'B';
    else if (overallScore >= 60) overallGrade = 'C';
    else if (overallScore >= 40) overallGrade = 'D';

    return {
        overallScore,
        overallGrade,
        categoryScores,
        issueGroups,
        totalCritical,
        totalWarning,
        totalNotice,
        totalPassed
    };
}
