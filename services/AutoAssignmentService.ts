/**
 * AutoAssignmentService.ts
 * 
 * Rules engine to convert crawler issues into tasks automatically.
 */

import { turso, initializeDatabase, isCloudSyncEnabled } from './turso';
import { crawlDb } from './CrawlDatabase';
import { createTask, getTasks } from './TaskService';
import { getCategoryOwners } from './TeamService';
import type { AssignmentRule, TriggerType, AssignmentStrategy } from './app-types';

let schemaReady: Promise<void> | null = null;

const ensureSchema = async () => {
    if (!schemaReady) {
        schemaReady = initializeDatabase().catch((error) => {
            schemaReady = null;
            throw error;
        });
    }
    await schemaReady;
};

/**
 * Fetch rules for a project
 */
export async function getRules(projectId: string): Promise<AssignmentRule[]> {
    if (isCloudSyncEnabled) {
        try {
            await ensureSchema();
            const result = await turso().execute({
                sql: `SELECT * FROM assignment_rules WHERE project_id = ?`,
                args: [projectId]
            });
            const rules = result.rows.map(mapRowToRule);
            
            await crawlDb.rules.where('projectId').equals(projectId).delete();
            await crawlDb.rules.bulkPut(rules);
            
            return rules;
        } catch (error) {
            console.error('[AutoAssignmentService] Failed to fetch rules from cloud:', error);
        }
    }
    return crawlDb.rules.where('projectId').equals(projectId).toArray();
}

/**
 * Create a new rule
 */
export async function createRule(
    projectId: string,
    data: Omit<AssignmentRule, 'id' | 'project_id' | 'created_at'>
): Promise<AssignmentRule> {
    const rule: AssignmentRule = {
        id: crypto.randomUUID(),
        project_id: projectId,
        ...data,
        created_at: new Date().toISOString()
    };

    await crawlDb.rules.put(rule);

    if (isCloudSyncEnabled) {
        try {
            await ensureSchema();
            await turso().execute({
                sql: `INSERT INTO assignment_rules (id, project_id, rule_name, trigger_type, trigger_condition_json, action_type, assignee_id, assignee_strategy, priority_override, enabled, created_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    rule.id, rule.project_id, rule.rule_name, rule.trigger_type,
                    rule.trigger_condition_json, rule.action_type, rule.assignee_id,
                    rule.assignee_strategy, rule.priority_override, 
                    rule.enabled ? 1 : 0, rule.created_at
                ]
            });
        } catch (error) {
            console.error('[AutoAssignmentService] Failed to sync rule to cloud:', error);
        }
    }

    return rule;
}

/**
 * Execute rules on a set of issues (usually after a crawl)
 */
export async function executeRules(
    projectId: string,
    sessionId: string,
    issues: any[] // issues from IssueCluster
): Promise<any[]> {
    const rules = await getRules(projectId);
    const enabledRules = rules.filter(r => r.enabled);
    if (enabledRules.length === 0) return [];

    const existingTasks = await getTasks(projectId);
    const createdTasks = [];

    for (const issue of issues) {
        for (const rule of enabledRules) {
            if (isMatch(rule, issue)) {
                // Check if task already exists for this issue
                const alreadyExists = existingTasks.find(t => t.linked_issue_id === issue.id);
                if (alreadyExists) continue;

                // Determine assignee
                const assignee = await determineAssignee(projectId, rule, issue);

                const task = await createTask(projectId, {
                    sessionId,
                    title: issue.title,
                    description: issue.description,
                    priority: (rule.priority_override as any) || issue.priority,
                    category: issue.category,
                    source: 'crawler',
                    linkedIssueId: issue.id,
                    affectedUrls: JSON.parse(issue.affected_urls_json || '[]'),
                    assigneeId: assignee?.id,
                    assigneeName: assignee?.name,
                    assigneeAvatar: assignee?.avatar_url,
                    createdBy: 'system'
                });
                createdTasks.push(task);
                break; // One rule per issue
            }
        }
    }

    return createdTasks;
}

function isMatch(rule: AssignmentRule, issue: any): boolean {
    const condition = JSON.parse(rule.trigger_condition_json);
    
    switch (rule.trigger_type) {
        case 'issue_severity':
            return issue.priority.toLowerCase() === condition.severity.toLowerCase();
        case 'issue_category':
            return issue.category.toLowerCase() === condition.category.toLowerCase();
        default:
            return false;
    }
}

async function determineAssignee(projectId: string, rule: AssignmentRule, issue: any) {
    if (rule.assignee_strategy === 'specific') {
        // We'd need to fetch the specific user details or just return the ID
        return { id: rule.assignee_id, name: null, avatar_url: null };
    }
    
    if (rule.assignee_strategy === 'category_owner') {
        const owners = await getCategoryOwners(projectId);
        // Simple logic: pick first owner for now, or match by name/skill if we had that
        return owners[0] || null;
    }

    if (rule.assignee_strategy === 'round_robin') {
        const members = await getCategoryOwners(projectId);
        if (members.length === 0) return null;
        // Deterministic round-robin based on issue ID hash
        const index = Math.abs(hashCode(issue.id)) % members.length;
        return members[index];
    }

    return null;
}

function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return hash;
}

// ─── Row mapper ─────────────────────────────────────────────

function mapRowToRule(row: any): AssignmentRule {
    return {
        id: String(row.id),
        project_id: String(row.project_id),
        rule_name: String(row.rule_name),
        trigger_type: row.trigger_type as TriggerType,
        trigger_condition_json: String(row.trigger_condition_json),
        action_type: row.action_type as AssignmentRule['action_type'],
        assignee_id: row.assignee_id ? String(row.assignee_id) : null,
        assignee_strategy: row.assignee_strategy as AssignmentStrategy,
        priority_override: row.priority_override ? String(row.priority_override) : null,
        enabled: Boolean(row.enabled),
        created_at: String(row.created_at)
    };
}
