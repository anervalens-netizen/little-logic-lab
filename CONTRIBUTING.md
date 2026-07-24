# Contributing

Read `AGENTS.md` first.

## Required workflow

1. Keep changes bounded to one game family, archetype or infrastructure concern.
2. Update machine-readable content before generated documents.
3. Run `npm test` and `npm run generate`.
4. Commit generated artifacts when their sources changed.
5. Include the game ID, seed and difficulty vector in every deterministic bug report.

## Reject by default

- IQ/development guarantees or diagnostic scoring;
- network, account, tracking, ad, attribution or notification features;
- sensitive permissions;
- child-mode links or purchases;
- streaks, loot, lives, rankings or variable rewards;
- difficulty changes on several major axes at once;
- games whose correctness depends on animation coordinates or color alone.
