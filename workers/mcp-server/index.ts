/**
 * Headlight MCP Server
 * Exposes Headlight crawl data as tools for AI agents.
 */

interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
}

const TOOLS = [
  {
    name: 'get_crawl_summary',
    description: 'Get the latest crawl summary for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' }
      },
      required: ['projectId']
    }
  },
  {
    name: 'get_top_issues',
    description: 'Get highest priority issues for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        limit: { type: 'number', default: 10 }
      },
      required: ['projectId']
    }
  }
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === '/mcp/tools' && request.method === 'GET') {
      return new Response(JSON.stringify({ tools: TOOLS }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (pathname === '/mcp/call' && request.method === 'POST') {
      const { name, arguments: args } = await request.json() as any;
      
      // Basic router
      if (name === 'get_crawl_summary') {
        // Query Turso and return summary
        return new Response(JSON.stringify({ result: { score: 85, pages: 120 } }));
      }

      return new Response(JSON.stringify({ error: 'Tool not found' }), { status: 404 });
    }

    return new Response('Headlight MCP Server', { status: 200 });
  }
};
