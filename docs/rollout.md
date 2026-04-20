# Rollout & flags

Every wave ships behind u.flags.wave<N>.<slug>. Flags live in feature_flags (Turso), evaluated via useFlag() (client) / isEnabled() (server).

## Canary ladder

1. internal — 1% of internal workspaces.
2. alpha — 10% of opted-in workspaces.
3. beta — 50% rollout.
4. ga — 100%.

Promotion gate: crash-free rate unchanged and error budget intact for 24h.

## Rollback

Flip the flag off. Every wave preserves shims for 30 days after promotion.

## Wave matrix

| Wave | Flag | Status |
| --- | --- | --- |
| W1 · Monorepo scaffolding | u.flags.wave1 | in progress |
| W2 · Types | u.flags.wave2 | pending |
| W3 · DB schema | u.flags.wave3 | pending |
| W4 · Storage tiers | u.flags.wave4 | pending |
| W5 · Fingerprint | u.flags.wave5 | pending |
| W6 · Metric registry | u.flags.wave6 | pending |
| W7 · Compute | u.flags.wave7 | pending |
| W8 · Crawl engine + DO + Boost | u.flags.wave8 | pending |
| W9 · Integrations | u.flags.wave9 | pending |
| W10 · AI router | u.flags.wave10 | pending |
| W11 · Offload + scrape | u.flags.wave11 | pending |
| W12 · Modes + chrome | u.flags.wave12 | pending |
| W13 · Inspector + views | u.flags.wave13 | pending |
| W14 · Pulse | u.flags.wave14 | pending |
| W15 · Actions + forecast | u.flags.wave15 | pending |
| W16 · Agents | u.flags.wave16 | pending |
| W17 · MCP + BYO-cloud | u.flags.wave17 | pending |
| W18 · App hierarchy | u.flags.wave18 | pending |
| W19 · Public site + release | u.flags.wave19 | pending |
