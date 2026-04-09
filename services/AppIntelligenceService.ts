import { turso } from './turso';

const hashScore = (value: string, min: number, max: number) => {
    const hash = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return min + (hash % (max - min + 1));
};

export const generateContentPrediction = async (topic: string) => {
    const base = hashScore(topic, 58, 92);
    return {
        score: base,
        intent: base > 78 ? 'Commercial' : base > 68 ? 'Informational' : 'Transactional',
        volume: hashScore(topic + ':volume', 800, 12000),
        difficulty: hashScore(topic + ':difficulty', 22, 79),
        outline: [
            { h2: `What ${topic} actually solves`, subtopics: ['Core use cases', 'Who benefits most', 'Common mistakes'] },
            { h2: `How to evaluate ${topic}`, subtopics: ['Decision criteria', 'Budget tradeoffs', 'Implementation constraints'] },
            { h2: `Best practices for ${topic}`, subtopics: ['Quick wins', 'Long-term strategy', 'Measurement approach'] }
        ],
        recommendations: [
            'Target a sharper search intent in the title and intro.',
            'Add comparison-driven subheads and decision criteria.',
            'Strengthen proof points, examples, and implementation depth.'
        ]
    };
};

export const generateDashboardInsights = async (projectId: string) => {
    try {
        const client = turso();
        
        // Get latest crawl run for this project
        const runResult = await client.execute({
            sql: `SELECT * FROM crawl_runs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1`,
            args: [projectId]
        });
        
        if (runResult.rows.length === 0) {
            return {
                visibility: {
                    overallScore: 0,
                    trend: 'stable',
                    trendValue: 0
                },
                summary: null,
                insights: []
            };
        }
        
        const run = runResult.rows[0];
        const summary = JSON.parse(String(run.summary_json || '{}'));
        const thematicScores = JSON.parse(String(run.thematic_scores_json || '{}'));
        const issueOverview = JSON.parse(String(run.issue_overview_json || '{}'));
        
        // Get previous run for trend calculation
        const prevResult = await client.execute({
            sql: `SELECT summary_json FROM crawl_runs WHERE project_id = ? AND id != ? ORDER BY created_at DESC LIMIT 1`,
            args: [projectId, String(run.id)]
        });
        
        const prevSummary = prevResult.rows.length > 0 
            ? JSON.parse(String(prevResult.rows[0].summary_json)) 
            : null;
        
        const healthScore = summary.healthScore || summary.score || 0;
        const prevHealthScore = prevSummary ? (prevSummary.healthScore || prevSummary.score || 0) : healthScore;
        
        return {
            visibility: {
                overallScore: healthScore,
                trend: healthScore > prevHealthScore ? 'up' : healthScore < prevHealthScore ? 'down' : 'stable',
                trendValue: Math.abs(healthScore - prevHealthScore)
            },
            summary,
            thematicScores,
            issueOverview,
            insights: [
                {
                    title: 'Strengthen commercial landing pages',
                    detail: 'Your highest-opportunity pages are under-supported by internal links and intent-specific copy.'
                },
                {
                    title: 'Turn branded mentions into links',
                    detail: 'Recent references can be converted into authority if outreach is run while mentions are fresh.'
                },
                {
                    title: 'Recrawl recent losers first',
                    detail: 'Pages with rising impressions and falling CTR should be reworked before broad sitewide changes.'
                }
            ]
        };
    } catch (error) {
        console.error('Failed to generate dashboard insights:', error);
        return null;
    }
};
