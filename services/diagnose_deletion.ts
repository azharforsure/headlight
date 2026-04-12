/**
 * Diagnostic script to identify which table is causing the FOREIGN KEY constraint failure.
 * Run this with: npx ts-node services/diagnose_deletion.ts <projectId>
 */

import { turso, initializeDatabase } from './turso';

const projectId = process.argv[2];

if (!projectId) {
    console.error('Please provide a project ID.');
    process.exit(1);
}

const TABLE_LIST = [
    'crawl_subtasks',
    'webhook_deliveries',
    'crawl_page_insights',
    'crawl_issue_clusters',
    'trend_snapshots',
    'crawl_pages',
    'crawl_runs',
    'crawl_jobs',
    'crawl_status',
    'crawl_audit_presets',
    'page_snapshots',
    'project_members',
    'crawl_comments',
    'crawl_tasks',
    'activity_log',
    'assignment_rules',
    'notifications',
    'integration_connections',
    'shared_reports',
    'public_reports',
    'api_keys',
    'webhook_endpoints',
    'mcp_servers',
    'crawl_sessions',
    'projects'
];

async function diagnose() {
    await initializeDatabase();
    console.log(`\n--- Diagnosing deletion for project: ${projectId} ---\n`);

    for (const table of TABLE_LIST) {
        try {
            console.log(`Checking table: ${table}...`);
            // Check if table has a project_id or references projects
            const columnsResult = await turso().execute(`PRAGMA table_info(${table})`);
            const hasProjectId = columnsResult.rows.some(r => r.name === 'project_id');
            const hasId = columnsResult.rows.some(r => r.name === 'id');

            if (hasProjectId) {
                const count = await turso().execute({
                    sql: `SELECT COUNT(*) as count FROM ${table} WHERE project_id = ?`,
                    args: [projectId]
                });
                console.log(`  - Found ${count.rows[0].count} records.`);
                
                if (count.rows[0].count > 0) {
                    try {
                        await turso().execute({
                            sql: `DELETE FROM ${table} WHERE project_id = ?`,
                            args: [projectId]
                        });
                        console.log(`  - SUCCESS: Deleted records from ${table}.`);
                    } catch (e: any) {
                        console.error(`  - FAILED to delete from ${table}: ${e.message}`);
                    }
                }
            } else {
                console.log(`  - No project_id column found. Checking FK dependencies...`);
                // Check if it has FKs pointing to others
                const fks = await turso().execute(`PRAGMA foreign_key_list(${table})`);
                for (const fk of fks.rows) {
                    console.log(`  - Has FK: ${fk.from} -> ${fk.table}(${fk.to})`);
                }
            }
        } catch (e: any) {
            console.error(`Error checking table ${table}:`, e.message);
        }
    }

    console.log(`\nFinal attempt: Deleting from projects table...`);
    try {
        await turso().execute({
            sql: `DELETE FROM projects WHERE id = ?`,
            args: [projectId]
        });
        console.log(`SUCCESS: Project deleted!`);
    } catch (e: any) {
        console.error(`CRITICAL FAILURE: Projects table still locked: ${e.message}`);
        
        // Final attempt to find WHO is still pointing at it
        console.log(`Searching for tables referencing 'projects'...`);
        // This is hard in SQLite without master table access, but possible
    }
}

diagnose();
