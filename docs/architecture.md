# Architecture

Headlight is composed of four tiers:

1. Apps — what users see (apps/web, apps/marketing, apps/server, apps/workers/*).
2. Packages — shared domain and UI logic (packages/*).
3. Infra — deployment scripts and IaC hooks (infra/*).
4. Docs — specs, runbooks, ADRs (docs/*).

## Deployment matrix

| Surface | Location | Platform |
| --- | --- | --- |
| Web app | apps/web | Cloudflare Pages |
| Marketing | apps/marketing | Cloudflare Pages |
| Crawler engine | apps/server | HF Spaces |
| Ghost bridge | apps/workers/bridge | Cloudflare Workers |
| Crawl queue | apps/workers/crawl-queue | Cloudflare Workers (DO) |
| MCP server | apps/workers/mcp-server | Cloudflare Workers |
| Edge fetch | apps/workers/edge-fetch | Cloudflare Workers |
| Scheduler | apps/workers/scheduler | Cloudflare Workers cron |

## Data plane

Turso (primary) + D1 (replica) + Dexie (browser) + R2 (blobs) + user cloud (backup). See packages/storage and packages/db.

## Compute plane

Crawler (apps/server) + Durable Object queue (apps/workers/crawl-queue) + in-tab Boost workers (packages/crawl) + edge fan-out (apps/workers/edge-fetch).

## UI plane

Shell + chrome + modes + inspector + views + charts + pulse — all in packages/*, composed by apps/web.
