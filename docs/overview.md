# Overview

Headlight is an all-in-one SEO + marketing platform. This monorepo houses every surface: the browser crawler engine, the React app, the marketing site, the Cloudflare Workers that glue them together, the shared packages that power compute, and the infra scripts that deploy it all.

## Directory map

See README.md for the top-level layout.

## Local development

    corepack enable
    pnpm install
    pnpm dev

## Common tasks

- Add a changeset: pnpm changeset
- Run a single workspace: pnpm -F @headlight/web dev
- Build everything: pnpm build
- Run tests: pnpm test

## Next steps

- Read architecture.md for the cross-package architecture.
- Read rollout.md for the release process and flag matrix.
