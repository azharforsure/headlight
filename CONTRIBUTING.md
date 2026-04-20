# Contributing

Thanks for helping build Headlight.

## Setup

    corepack enable
    pnpm install

## Branch naming

- Wave branch: wave-<N>/<slug> (e.g. wave-1/monorepo)
- Micro-branch: wave-<N>/<slug>/<micro> (e.g. wave-1/monorepo/02-config)

## Commit prefix

[wN.mM] short description — example: [w1.m2] add packages/config exports.

## PR checklist

- Behind u.flags.wave<N>.<slug> (default off in prod).
- Unit tests covering new code, >= 80% line coverage on shipped modules.
- CHANGELOG entry under Unreleased.
- Docs updated (wave doc under docs/engineering/waves/).
- Screenshots / Loom for UI changes.
- a11y and i18n / RTL pass for UI changes.

## Scripts

- pnpm dev — watch mode
- pnpm test — run every workspace's tests
- pnpm lint — lint every workspace
- pnpm typecheck — type-check every workspace
- pnpm format — format with Prettier

## Releasing

We use Changesets:

    pnpm changeset
    pnpm version-packages
    pnpm release

CI promotes automatically once canary telemetry holds for 24h — see docs/rollout.md.
