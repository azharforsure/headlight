# Headlight

All-in-one SEO + marketing platform with a browser-scale crawler, AI agents, and a full growth workbench — built to handle millions of pages on free infrastructure.

## Architecture

Monorepo managed with pnpm workspaces + Turborepo. Everything is TypeScript.

- apps/web — React app shell (workspace / business / project views + crawler route)
- apps/marketing — Public site, docs, changelog (Astro)
- apps/server — Node crawler engine (HF Spaces)
- apps/workers/* — Cloudflare Workers (bridge · crawl-queue · mcp-server · edge-fetch · scheduler)
- packages/types — Metric catalog, actions, modes, entities
- packages/db — Schema + migrations (Turso + D1 + Dexie parity)
- packages/storage — Multi-tier storage router
- packages/fingerprint · packages/metrics · packages/compute
- packages/crawl · packages/offload · packages/ai
- packages/actions · packages/agents · packages/pulse · packages/mcp
- packages/ui · packages/charts · packages/modes · packages/chrome · packages/inspector · packages/views
- packages/auth · packages/billing · packages/i18n · packages/flags · packages/telemetry · packages/share
- packages/config · packages/testing · packages/utils — shared tooling (Wave 1)

See docs/architecture.md for the full map.

## Requirements

- Node >= 20.11.0 (see .nvmrc)
- pnpm >= 9.12.0 (via corepack enable)

## Quick start

    corepack enable
    pnpm install
    pnpm build
    pnpm dev

## Scripts

- pnpm dev — every app/package in watch mode
- pnpm build — build every workspace
- pnpm lint — lint every workspace
- pnpm typecheck — type-check every workspace
- pnpm test — run every workspace's tests
- pnpm format — format with Prettier

## Contributing

See CONTRIBUTING.md and CODE_OF_CONDUCT.md.

## Security

Report vulnerabilities per SECURITY.md.

## License

See LICENSE.
